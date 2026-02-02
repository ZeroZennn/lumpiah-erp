import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DssService } from '../dss-engine/dss.service';
import { SubmitRealizationDto } from './dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ProductionPlanWithDetails = Prisma.ProductionPlanGetPayload<{
  include: {
    product: { include: { category: true } };
    realizations: { orderBy: { createdAt: 'desc' } };
  };
}>;

interface ReportItem {
  productName: string;
  target: number;
  production: number;
  sold: number;
}

export interface MappedPlan {
  planId: number;
  productId: number;
  productName: string;
  categoryName: string;
  recommendedQty: number;
  calculationLog: string | null;
  actualQty: number;
  deviation: number;
  notes: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  createdAt: Date;
}

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    private prisma: PrismaService,
    private dssService: DssService,
  ) {}

  /**
   * Get or Create Plans (Idempotent for past/today, manual for future)
   */
  async getPlans(
    branchId: number,
    dateStr: string,
    init: boolean = false,
  ): Promise<MappedPlan[]> {
    // 1. Parse date as UTC 00:00:00 (Start of Day)
    const [year, month, day] = dateStr.split('-').map(Number);
    const planDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Check if it's a future date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const isFuture = planDate > today;

    // 2. Get all active products
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    // 3. Fetch existing plans
    const existingPlans = await this.prisma.productionPlan.findMany({
      where: {
        branchId,
        planDate: { gte: planDate, lte: endOfDay },
      },
      include: {
        product: { include: { category: true } },
        realizations: true,
      },
    });

    // 4. Identify missing products
    const existingProductIds = new Set(existingPlans.map((p) => p.productId));
    const missingProducts = products.filter(
      (p) => !existingProductIds.has(p.id),
    );

    // 5. Generate missing plans using DSS (Batch Mode + createMany)
    // Behavior:
    // - If Past/Today: Always auto-generate if missing (Idempotent)
    // - If Future: Only generate if init === true
    if (missingProducts.length > 0 && (!isFuture || init)) {
      const missingProductIds = missingProducts.map((p) => p.id);
      const dssResults = await this.dssService.calculateRecommendedQtyBatch(
        branchId,
        missingProductIds,
        planDate,
      );

      try {
        await this.prisma.$transaction(
          async (tx) => {
            // Double check inside transaction if race condition occurred
            const recentPlans = await tx.productionPlan.findMany({
              where: {
                branchId,
                planDate: { gte: planDate, lte: endOfDay },
                productId: { in: missingProductIds },
              },
              select: { productId: true },
            });
            const recentIds = new Set(recentPlans.map((rp) => rp.productId));
            const trulyMissing = missingProducts.filter(
              (p) => !recentIds.has(p.id),
            );

            if (trulyMissing.length === 0) return;

            const plansToCreate = trulyMissing.map((product) => {
              const dssResult = dssResults.get(product.id);
              return {
                branchId,
                productId: product.id,
                planDate, // Store as UTC 00:00:00
                recommendedQty: dssResult?.qty || 0,
                calculationLog: dssResult?.log || 'No data',
              };
            });

            await tx.productionPlan.createMany({ data: plansToCreate });

            const createdPlans = await tx.productionPlan.findMany({
              where: {
                branchId,
                planDate: { gte: planDate, lte: endOfDay },
                productId: { in: trulyMissing.map((p) => p.id) },
              },
              select: { id: true, recommendedQty: true },
            });

            const realizationsToCreate = createdPlans.map((plan) => ({
              planId: plan.id,
              actualQty: 0,
              deviation: -plan.recommendedQty,
              status: 'IN_PROGRESS',
              inputByUserId: 1,
            }));

            await tx.productionRealization.createMany({
              data: realizationsToCreate,
            });
          },
          { maxWait: 10000, timeout: 30000 },
        );
      } catch (e) {
        this.logger.error(
          'Failed to create plans in bulk: ' + (e as Error).message,
        );
      }
    }

    // 6. Final re-fetch and CODE-LEVEL DEDUPLICATION
    const allPlansRaw: ProductionPlanWithDetails[] =
      await this.prisma.productionPlan.findMany({
        where: {
          branchId,
          planDate: { gte: planDate, lte: endOfDay },
        },
        include: {
          product: { include: { category: true } },
          realizations: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { product: { name: 'asc' } },
      });

    // Dedup: Pick the plan with the most 'advanced' status for each product
    const dedupMap = new Map<number, ProductionPlanWithDetails>();
    allPlansRaw.forEach((plan) => {
      const existing = dedupMap.get(plan.productId);
      const currentStatus = plan.realizations[0]?.status || 'PENDING';

      if (!existing) {
        dedupMap.set(plan.productId, plan);
      } else {
        const existingStatus = existing.realizations[0]?.status || 'PENDING';
        // Status priority: COMPLETED (highest) > IN_PROGRESS > PENDING
        const priority = { COMPLETED: 3, IN_PROGRESS: 2, PENDING: 1 };
        if (priority[currentStatus] > priority[existingStatus]) {
          dedupMap.set(plan.productId, plan);
        }
      }
    });

    return this.mapPlansToResponse(Array.from(dedupMap.values()));
  }

  /**
   * Submit Realization: Draft or Complete
   * Enforces Status Locking
   */
  async submitRealization(userId: number, dto: SubmitRealizationDto) {
    // 1. Get current realization to check status
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: dto.planId },
      include: { realizations: true },
    });

    if (!plan) throw new BadRequestException('Plan not found');

    const realization = plan.realizations[0]; // Assuming 1:1 relationship
    if (!realization) {
      // Should have been created in getPlans, but distinct possibility of missing if logic changed
      throw new BadRequestException('Realization record missing');
    }

    // 2. LOCK CHECK
    if (realization.status === 'COMPLETED') {
      throw new ForbiddenException('Cannot edit a finalized production plan.');
    }

    // 3. Calculate Deviation
    const deviation = dto.actualQty - plan.recommendedQty;

    // 4. Update
    return this.prisma.productionRealization.update({
      where: { id: realization.id },
      data: {
        actualQty: dto.actualQty,
        deviation,
        notes: dto.notes,
        status: dto.status,
        inputByUserId: userId,
      },
    });
  }

  /**
   * Accuracy Report
   */
  async getAccuracyReport(branchId: number, dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const isFuture = startOfDay > new Date();

    // 1. Get Plans in range (Robust against minor shifts)
    const plans = await this.prisma.productionPlan.findMany({
      where: {
        branchId,
        planDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        product: true,
        realizations: true,
      },
    });

    // 2. Get Sales in range
    const soldItems = isFuture
      ? []
      : await this.prisma.transactionItem.groupBy({
          by: ['productId'],
          where: {
            transaction: {
              branchId,
              status: 'PAID',
              transactionDate: { gte: startOfDay, lte: endOfDay },
            },
          },
          _sum: {
            quantity: true,
          },
        });

    const soldMap = new Map<number, number>();
    soldItems.forEach((item) => {
      soldMap.set(item.productId, item._sum.quantity || 0);
    });

    // 3. Aggregate by Product (Deduplicate results)
    const reportMap = new Map<number, ReportItem>();

    plans.forEach((p) => {
      const existing = reportMap.get(p.productId);
      const realiz = p.realizations[0]; // Assuming 1 rel per plan
      const actualQty = realiz ? realiz.actualQty : 0;
      const soldQty = soldMap.get(p.productId) || 0;

      if (existing) {
        // Aggregate if duplicate exists
        existing.target += p.recommendedQty;
        existing.production += actualQty;
      } else {
        reportMap.set(p.productId, {
          productName: p.product.name,
          target: p.recommendedQty,
          production: actualQty,
          sold: soldQty,
        });
      }
    });

    // 4. Transform to final format
    return Array.from(reportMap.values()).map((item) => {
      const deviation = item.production - item.target;
      let insight = 'Balanced';
      if (item.production > item.sold) insight = 'Potential Waste';
      if (item.production < item.sold)
        insight = 'High Demand / Lost Sales Risk';

      return {
        ...item,
        deviation,
        insight,
      };
    });
  }

  private mapPlansToResponse(plans: ProductionPlanWithDetails[]): MappedPlan[] {
    return plans.map((p) => {
      const r = p.realizations[0];
      return {
        planId: p.id,
        productId: p.productId,
        productName: p.product.name,
        categoryName: p.product.category?.name || 'Uncategorized',
        recommendedQty: p.recommendedQty,
        calculationLog: p.calculationLog,
        actualQty: r?.actualQty ?? 0,
        deviation: r?.deviation ?? 0,
        notes: r?.notes ?? '',
        status: (r?.status ?? 'PENDING') as
          | 'IN_PROGRESS'
          | 'COMPLETED'
          | 'PENDING',
        createdAt: p.createdAt,
      };
    });
  }
}
