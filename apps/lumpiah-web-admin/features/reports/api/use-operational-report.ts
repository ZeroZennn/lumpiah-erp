import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";

export interface OperationalReportResponse {
  summary: {
    netRevenue: number;
    transactionCount: number;
    avgBasket: number;
    totalCashSystem: number;
    totalQrisSystem: number;
  };
  eodControl: Array<{
    branchId: number;
    branchName: string;
    status: 'OPEN' | 'CLOSED';
    closingTime: string | null;
    totalCashSystem: number;
    totalCashActual: number;
    cashVariance: number;
    totalQrisSystem: number;
    totalQrisActual: number;
    qrisVariance: number;
    closingNote: string | null;
  }>;
  itemBreakdown: Array<{
    productId: number;
    productName: string;
    categoryName: string;
    qtySold: number;
    totalValue: number;
  }>;
  auditTrail: {
    voidTransactions: Array<{
      transactionId: string;
      transactionDate: string;
      cashierName: string;
      totalAmount: number;
      voidReason: string | null;
    }>;
    totalVoidValue: number;
  };
}

export const reportKeys = {
  all: ["reports"] as const,
  operational: (filter: { branchId?: string; date: string }) =>
    [...reportKeys.all, "operational", filter] as const,
};

export function useOperationalReport(filter: { branchId?: string; date: string }) {
  return useQuery({
    queryKey: reportKeys.operational(filter),
    queryFn: async () => {
      const response = await apiClient.get<OperationalReportResponse>(
        "/reports/operational",
        { params: filter }
      );
      return response as unknown as OperationalReportResponse;
    },
    enabled: !!filter.date,
  });
}
