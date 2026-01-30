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

export const useProductionPlans = (branchId: number, date: Date) => {
  return useQuery({
    queryKey: ['production-plans', branchId, format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Always fetch with init=false (or undefined) for standard viewing
      // The initialization is now handled by a separate mutation
      const response = await apiClient.get<ProductionPlan[]>(`/production/plans`, {
        params: { branchId, date: dateStr },
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

export const useInitializeProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, date }: { branchId: number, date: Date }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Explicitly call with init=true to trigger creation/calculation
      const response = await apiClient.get<ProductionPlan[]>(`/production/plans`, {
        params: { branchId, date: dateStr, init: true },
      });
      return response;
    },
    onSuccess: (_, variables) => {
       // Invalidate the specific query for this branch/date so it refetches immediately
       queryClient.invalidateQueries({ 
         queryKey: ['production-plans', variables.branchId, format(variables.date, 'yyyy-MM-dd')] 
       });
       // Also invalidate accuracy in case it's related
       queryClient.invalidateQueries({ 
         queryKey: ['production-accuracy', variables.branchId, format(variables.date, 'yyyy-MM-dd')] 
       });
    },
  });
};

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
