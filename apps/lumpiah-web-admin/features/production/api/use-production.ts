import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { format } from 'date-fns';

export type ProductionPlan = {
  planId: number;
  productId: number;
  productName: string;
  categoryName: string;
  recommendedQty: number;
  calculationLog: string;
  actualQty: number;
  deviation: number;
  notes: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  createdAt: string;
};

export type AccuracyReportItem = {
    productName: string;
    target: number;
    production: number;
    sold: number;
    deviation: number;
    insight: string;
};

// --- QUERIES ---

export const useProductionPlans = (branchId: number, date: Date, init: boolean = false) => {
  return useQuery({
    queryKey: ['production-plans', branchId, format(date, 'yyyy-MM-dd'), init],
    queryFn: async () => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await apiClient.get<ProductionPlan[]>(`/production/plans`, {
        params: { branchId, date: dateStr, init },
      });
      return response as unknown as ProductionPlan[];
    },
    enabled: !!branchId && !!date,
  });
};

export const useProductionAccuracy = (branchId: number, date: Date) => {
    return useQuery({
        queryKey: ['production-accuracy', branchId, format(date, 'yyyy-MM-dd')],
        queryFn: async () => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await apiClient.get<AccuracyReportItem[]>(`/production/accuracy`, {
                params: { branchId, date: dateStr }
            });
            return response as unknown as AccuracyReportItem[];
        },
        enabled: !!branchId && !!date,
    });
};

// --- MUTATIONS ---

export const useSubmitRealization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      planId: number;
      actualQty: number;
      notes?: string;
      status: 'IN_PROGRESS' | 'COMPLETED';
    }) => {
      return apiClient.post('/production/realization', data);
    },
    onSuccess: () => {
        // Invalidate queries to refresh table
       queryClient.invalidateQueries({ queryKey: ['production-plans'] });
       queryClient.invalidateQueries({ queryKey: ['production-accuracy'] });
    },
  });
};
