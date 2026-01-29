/**
 * Production Feature Types
 * Based on Prisma DssConfig, ProductionPlan, ProductionRealization models
 */

export interface DssConfig {
  id: number;
  branchId: number;
  wmaWeights: number[];
  safetyStockPercent: number;
  lastUpdated: string;
  branchName?: string;
}

export interface ProductionPlan {
  id: number;
  branchId: number;
  productId: number;
  planDate: string;
  recommendedQty: number;
  safetyStock: number;
  finalRecommendation: number;
  calculationLog: string | null;
  productName?: string;
  branchName?: string;
}

export interface ProductionRealization {
  id: number;
  planId: number;
  actualQty: number;
  deviation: number;
  notes: string | null;
  inputByUserId: number;
  inputByName?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
}

export interface ProductionPlanWithRealization extends ProductionPlan {
  realization?: ProductionRealization;
  soldQty?: number;
}
