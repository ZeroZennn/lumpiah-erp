import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface ReportFilter {
  branchId?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(
    filter: ReportFilter,
    dateField: string = 'transactionDate',
  ) {
    const where: Prisma.TransactionWhereInput = {};

    if (filter.branchId) {
      where.branchId = filter.branchId;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter.startDate) dateFilter.gte = filter.startDate;
      if (filter.endDate) dateFilter.lte = filter.endDate;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (where as any)[dateField] = dateFilter;
    }

    return where;
  }

  async getDashboardStats(filter: ReportFilter) {
    // Default to today if no range specified
    const startDate =
      filter.startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const endDate =
      filter.endDate || new Date(new Date().setHours(23, 59, 59, 999));

    const where: Prisma.TransactionWhereInput = {
      branchId: filter.branchId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'PAID',
    };

    // 1. Total Revenue & Transactions
    const aggregations = await this.prisma.transaction.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = Number(aggregations._sum.totalAmount || 0);
    const totalTransactions = aggregations._count.id;
    const avgBasketSize =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // 2. Payment Method Split
    const paymentMethods = await this.prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: {
        totalAmount: true,
      },
    });

    // 3. Growth Calculation (vs Previous Period)
    // Simple logic: Compare with same duration before start date
    // Better: Yesterday
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - 1); // Exact logic depends on "Period". Assuming "Daily" comparison for now.

    // For specific "Growth Rate" requested in requirements (Day vs Day)
    // Let's assume the user wants "Vs Yesterday" if the filter is "Today".

    const prevWhere: Prisma.TransactionWhereInput = {
      ...where,
      transactionDate: {
        gte: prevStart,
        lte: new Date(
          prevStart.getTime() + (endDate.getTime() - startDate.getTime()),
        ),
      },
    };

    const prevAggregations = await this.prisma.transaction.aggregate({
      where: prevWhere,
      _sum: { totalAmount: true },
    });

    const prevRevenue = Number(prevAggregations._sum.totalAmount || 0);
    const growthRate =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalTransactions,
      avgBasketSize,
      growthRate,
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.paymentMethod,
        amount: Number(pm._sum.totalAmount || 0),
      })),
    };
  }

  async getRevenueTrend(filter: ReportFilter) {
    // Default 7 days if not specified
    const endDate = filter.endDate || new Date();
    const startDate =
      filter.startDate || new Date(new Date().setDate(endDate.getDate() - 7));

    // Fixed: Removed unused 'transactions' variable

    // Using Prisma Raw Query for Date Truncation (Postgres)
    const rawData = await this.prisma.$queryRaw<
      { date: Date; revenue: number; count: bigint }[]
    >`
        SELECT 
            DATE(transaction_date) as date,
            SUM(total_amount) as revenue,
            COUNT(id) as count
        FROM transactions
        WHERE 
            status = 'PAID'
            ${filter.branchId ? Prisma.sql`AND branch_id = ${filter.branchId}` : Prisma.empty}
            AND transaction_date >= ${startDate}
            AND transaction_date <= ${endDate}
        GROUP BY DATE(transaction_date)
        ORDER BY DATE(transaction_date) ASC
    `;

    // Map to simple objects, handling BigInt
    return rawData.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      revenue: Number(d.revenue),
      transactions: Number(d.count),
    }));
  }

  async getBranchPerformance(filter: ReportFilter) {
    const startDate =
      filter.startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const endDate =
      filter.endDate || new Date(new Date().setHours(23, 59, 59, 999));

    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const performance = await Promise.all(
      branches.map(async (branch) => {
        const aggr = await this.prisma.transaction.aggregate({
          where: {
            branchId: branch.id,
            status: 'PAID',
            transactionDate: { gte: startDate, lte: endDate },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        });

        return {
          branchId: branch.id,
          branchName: branch.name,
          totalRevenue: Number(aggr._sum.totalAmount || 0),
          transactionCount: aggr._count.id,
        };
      }),
    );

    return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getOperationalStatus(date: Date) {
    // Start/End of the requested date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      include: {
        dailyClosings: {
          where: {
            closingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    const statusList = await Promise.all(
      branches.map(async (branch) => {
        // Check Void Rate
        const txStats = await this.prisma.transaction.groupBy({
          by: ['status'],
          where: {
            branchId: branch.id,
            transactionDate: { gte: startOfDay, lte: endOfDay },
          },
          _count: { id: true },
        });

        const voidCount =
          txStats.find((s) => s.status === 'VOID')?._count.id || 0;
        const paidCount =
          txStats.find((s) => s.status === 'PAID')?._count.id || 0;
        const totalTx = voidCount + paidCount;
        const voidRate = totalTx > 0 ? (voidCount / totalTx) * 100 : 0;

        return {
          branchId: branch.id,
          branchName: branch.name,
          isClosed: branch.dailyClosings.length > 0, // considered closed if entry exists
          closingTime: branch.dailyClosings[0]?.createdAt || null,
          voidRate: Number(voidRate.toFixed(2)),
          hasFraudAlert: voidRate > 10,
        };
      }),
    );

    return statusList;
  }

  async getProductionSummary({
    branchId,
    date,
  }: {
    branchId?: number;
    date: Date;
  }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: Prisma.ProductionPlanWhereInput = {
      planDate: { gte: startOfDay, lte: endOfDay },
    };
    if (branchId) whereClause.branchId = branchId;

    const plans = await this.prisma.productionPlan.findMany({
      where: whereClause,
      include: {
        branch: true,
        product: true,
        realizations: true,
      },
    });

    return plans.map((plan) => {
      const realization = plan.realizations[0];
      let status = 'Not Started';
      if (realization) {
        status =
          realization.status === 'COMPLETED' ? 'Completed' : 'In Progress';
      }

      return {
        planId: plan.id,
        branchName: plan.branch.name,
        productName: plan.product.name,
        recommendedQty: plan.recommendedQty,
        actualQty: realization?.actualQty || 0,
        status,
      };
    });
  }
}
