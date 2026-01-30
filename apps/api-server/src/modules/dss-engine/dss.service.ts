import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDssConfigDto } from './dto';

@Injectable()
export class DssService {
  private readonly logger = new Logger(DssService.name);

  constructor(private prisma: PrismaService) {}

  async getWeightConfig(branchId: number) {
    const config = await this.prisma.dssConfig.findFirst({
      where: { branchId },
    });

    if (!config) {
      // Return defaults if not found
      return {
        wmaWeights: [0.5, 0.3, 0.2], // Default weights for 3 periods
        safetyStockPercent: 10,
      };
    }

    return config;
  }

  async updateWeightConfig(branchId: number, dto: UpdateDssConfigDto) {
    // Upsert config
    const config = await this.prisma.dssConfig.findFirst({
      where: { branchId },
    });

    if (config) {
      return this.prisma.dssConfig.update({
        where: { id: config.id },
        data: {
          wmaWeights: dto.wmaWeights,
          safetyStockPercent: dto.safetyStockPercent,
          lastUpdated: new Date(),
        },
      });
    } else {
      return this.prisma.dssConfig.create({
        data: {
          branchId,
          wmaWeights: dto.wmaWeights,
          safetyStockPercent: dto.safetyStockPercent,
        },
      });
    }
  }

  /**
   * Calculates recommended quantity based on WMA and Safety Stock.
   * Returns { qty: number, log: string }
   */
  async calculateRecommendedQty(
    branchId: number,
    productId: number,
    targetDate: Date,
  ): Promise<{ qty: number; log: string }> {
    // 1. Get Config
    const config = await this.getWeightConfig(branchId);
    const weights = config.wmaWeights as number[]; // e.g., [0.5, 0.3, 0.2] (Most recent first)
    const safetyStockPercent = config.safetyStockPercent;

    // 2. Fetch Historical Sales
    const periodCount = weights.length;
    const startDate = new Date(targetDate);
    startDate.setUTCDate(startDate.getUTCDate() - periodCount);
    startDate.setUTCHours(0, 0, 0, 0);

    const historicalSales = await this.prisma.transactionItem.findMany({
      where: {
        productId,
        transaction: {
          branchId,
          status: 'PAID',
          transactionDate: {
            gte: startDate,
            lt: targetDate, // Up to the start of targetDate
          },
        },
      },
      include: {
        transaction: true,
      },
    });

    // Group by date (YYYY-MM-DD) in UTC
    const salesMap = new Map<string, number>();
    historicalSales.forEach((item) => {
      const d = item.transaction.transactionDate;
      const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + item.quantity);
    });

    // Align sales with weights: [Sales(D-1), Sales(D-2), ...]
    const salesHistory: number[] = [];
    for (let i = 1; i <= periodCount; i++) {
      const d = new Date(targetDate);
      d.setUTCDate(d.getUTCDate() - i);
      const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      salesHistory.push(salesMap.get(dateKey) || 0);
    }

    // 3. Calculate WMA
    let wmaTotal = 0;
    const weightLogParts: string[] = [];

    for (let i = 0; i < periodCount; i++) {
      const sales = salesHistory[i];
      const weight = weights[i];
      const val = sales * weight;
      wmaTotal += val;
      weightLogParts.push(`${sales}x${weight}`);
    }

    const wmaResult = Math.ceil(wmaTotal);

    // 4. Calculate Safety Stock
    const safetyStock = Math.ceil(wmaResult * (safetyStockPercent / 100));

    // 5. Final
    const finalQty = wmaResult + safetyStock;

    // 6. Generate Log
    const log = `WMA(${salesHistory[0] || 0}x${weights[0]}+${salesHistory[1] || 0}x${weights[1]}+${salesHistory[2] || 0}x${weights[2]} = ${wmaResult}) + Buffer ${safetyStockPercent}%(${safetyStock})`;

    return { qty: finalQty, log };
  }

  /**
   * Optimized Batch Calculation for multiple products.
   * Reddy for performance!
   */
  async calculateRecommendedQtyBatch(
    branchId: number,
    productIds: number[],
    targetDate: Date,
  ): Promise<Map<number, { qty: number; log: string }>> {
    const config = await this.getWeightConfig(branchId);
    const weights = config.wmaWeights as number[];
    const safetyStockPercent = config.safetyStockPercent;

    const periodCount = weights.length;
    const startDate = new Date(targetDate);
    startDate.setUTCDate(startDate.getUTCDate() - periodCount);
    startDate.setUTCHours(0, 0, 0, 0);

    // 1. Fetch ALL historical sales for ALL relevant products in one query
    const allSales = await this.prisma.transactionItem.findMany({
      where: {
        productId: { in: productIds },
        transaction: {
          branchId,
          status: 'PAID',
          transactionDate: {
            gte: startDate,
            lt: targetDate,
          },
        },
      },
      include: {
        transaction: true,
      },
    });

    // 2. Group by Product -> Date -> Quantity in UTC
    const productSalesMap = new Map<number, Map<string, number>>();
    allSales.forEach((item) => {
      let dateSales = productSalesMap.get(item.productId);
      if (!dateSales) {
        dateSales = new Map<string, number>();
        productSalesMap.set(item.productId, dateSales);
      }
      const d = item.transaction.transactionDate;
      const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      dateSales.set(dateKey, (dateSales.get(dateKey) || 0) + item.quantity);
    });

    // 3. Process each product
    const results = new Map<number, { qty: number; log: string }>();

    for (const productId of productIds) {
      const salesMap =
        productSalesMap.get(productId) || new Map<string, number>();
      const salesHistory: number[] = [];

      for (let i = 1; i <= periodCount; i++) {
        const d = new Date(targetDate);
        d.setUTCDate(d.getUTCDate() - i);
        const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        salesHistory.push(salesMap.get(dateKey) || 0);
      }

      // Calculate WMA
      let wmaTotal = 0;
      const weightLogParts: string[] = [];
      for (let i = 0; i < periodCount; i++) {
        const sales = salesHistory[i];
        const weight = weights[i];
        const val = sales * weight;
        wmaTotal += val;
        weightLogParts.push(`${sales}x${weight}`);
      }

      const wmaResult = Math.ceil(wmaTotal);
      const safetyStock = Math.ceil(wmaResult * (safetyStockPercent / 100));
      const finalQty = wmaResult + safetyStock;

      const log = `WMA(${salesHistory[0] || 0}x${weights[0]}+${salesHistory[1] || 0}x${weights[1]}+${salesHistory[2] || 0}x${weights[2]} = ${wmaResult}) + Buffer ${safetyStockPercent}%(${safetyStock})`;

      results.set(productId, { qty: finalQty, log });
    }

    return results;
  }
}
