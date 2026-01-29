/**
 * Production Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import {
  DssConfig,
  ProductionPlan,
  ProductionRealization,
  ProductionPlanWithRealization,
} from "../api/production.types";

export const dssConfigs: DssConfig[] = [
  {
    id: 1,
    branchId: 1,
    wmaWeights: [0.5, 0.3, 0.2],
    safetyStockPercent: 10,
    lastUpdated: "2025-01-20T10:00:00Z",
    branchName: "Cabang Pusat",
  },
  {
    id: 2,
    branchId: 2,
    wmaWeights: [0.6, 0.25, 0.15],
    safetyStockPercent: 15,
    lastUpdated: "2025-01-18T14:00:00Z",
    branchName: "Cabang Timur",
  },
  {
    id: 3,
    branchId: 3,
    wmaWeights: [0.5, 0.3, 0.2],
    safetyStockPercent: 10,
    lastUpdated: "2025-01-15T09:00:00Z",
    branchName: "Cabang Barat",
  },
  {
    id: 4,
    branchId: 5,
    wmaWeights: [0.7, 0.2, 0.1],
    safetyStockPercent: 20,
    lastUpdated: "2025-01-25T11:00:00Z",
    branchName: "Cabang Depok",
  },
];

// Today's production plans
export const productionPlans: ProductionPlan[] = [
  {
    id: 1,
    branchId: 1,
    productId: 1,
    planDate: "2025-01-29",
    recommendedQty: 150,
    safetyStock: 15,
    finalRecommendation: 165,
    calculationLog: "WMA: (120*0.5 + 100*0.3 + 80*0.2) = 106, Safety: 10% = 11",
    productName: "Lumpia Kecil",
    branchName: "Cabang Pusat",
  },
  {
    id: 2,
    branchId: 1,
    productId: 2,
    planDate: "2025-01-29",
    recommendedQty: 80,
    safetyStock: 8,
    finalRecommendation: 88,
    calculationLog: "WMA: (70*0.5 + 60*0.3 + 50*0.2) = 63, Safety: 10% = 6",
    productName: "Lumpia Besar",
    branchName: "Cabang Pusat",
  },
  {
    id: 3,
    branchId: 1,
    productId: 3,
    planDate: "2025-01-29",
    recommendedQty: 40,
    safetyStock: 4,
    finalRecommendation: 44,
    calculationLog: "WMA: (35*0.5 + 30*0.3 + 25*0.2) = 31.5, Safety: 10% = 3",
    productName: "Lumpia Spesial",
    branchName: "Cabang Pusat",
  },
  {
    id: 4,
    branchId: 2,
    productId: 1,
    planDate: "2025-01-29",
    recommendedQty: 100,
    safetyStock: 15,
    finalRecommendation: 115,
    calculationLog: "WMA: (90*0.6 + 70*0.25 + 60*0.15) = 80.5, Safety: 15% = 12",
    productName: "Lumpia Kecil",
    branchName: "Cabang Timur",
  },
  {
    id: 5,
    branchId: 2,
    productId: 2,
    planDate: "2025-01-29",
    recommendedQty: 50,
    safetyStock: 8,
    finalRecommendation: 58,
    calculationLog: "WMA: (45*0.6 + 40*0.25 + 35*0.15) = 42.25, Safety: 15% = 6",
    productName: "Lumpia Besar",
    branchName: "Cabang Timur",
  },
];

export const productionRealizations: ProductionRealization[] = [
  {
    id: 1,
    planId: 1,
    actualQty: 160,
    deviation: -5,
    notes: "Sedikit dibawah rekomendasi karena bahan terbatas",
    inputByUserId: 2,
    inputByName: "Budi",
    status: "COMPLETED",
    createdAt: "2025-01-29T06:30:00Z",
  },
  {
    id: 2,
    planId: 2,
    actualQty: 90,
    deviation: 2,
    notes: null,
    inputByUserId: 2,
    inputByName: "Budi",
    status: "COMPLETED",
    createdAt: "2025-01-29T06:35:00Z",
  },
];

// Combined data for display
export const productionPlansWithRealization: ProductionPlanWithRealization[] = productionPlans.map(
  (plan) => {
    const realization = productionRealizations.find((r) => r.planId === plan.id);
    // Simulated sold qty
    const soldQty = realization
      ? Math.floor(realization.actualQty * (0.7 + Math.random() * 0.25))
      : undefined;
    return {
      ...plan,
      realization,
      soldQty,
    };
  }
);

export function getDssConfigByBranchId(branchId: number): DssConfig | undefined {
  return dssConfigs.find((c) => c.branchId === branchId);
}

export function getProductionPlansByBranch(branchId: number): ProductionPlanWithRealization[] {
  return productionPlansWithRealization.filter((p) => p.branchId === branchId);
}
