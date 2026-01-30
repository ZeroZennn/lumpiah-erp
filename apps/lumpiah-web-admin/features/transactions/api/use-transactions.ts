import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { Transaction, TransactionsResponse, TransactionFilters } from './transaction.types';
import { format } from 'date-fns';

export const useTransactions = (filters: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.isOfflineSynced !== undefined) params.isOfflineSynced = String(filters.isOfflineSynced);
      
      if (filters.startDate) params.startDate = format(filters.startDate, 'yyyy-MM-dd');
      if (filters.endDate) params.endDate = format(filters.endDate, 'yyyy-MM-dd');

      const response = await apiClient.get<TransactionsResponse>('/transactions', { params });
      return response as unknown as TransactionsResponse;
    },
  });
};

export const useTransactionSummary = (filters: TransactionFilters) => {
    return useQuery({
        queryKey: ['transactions-summary', filters],
        queryFn: async () => {
            const params: any = {};
            if (filters.branchId) params.branchId = filters.branchId;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.search) params.search = filters.search;
            if (filters.startDate) params.startDate = format(filters.startDate, 'yyyy-MM-dd');
            if (filters.endDate) params.endDate = format(filters.endDate, 'yyyy-MM-dd');

            const response = await apiClient.get('/transactions/summary', { params });
            return response as any; // Returns { totalRevenue, paidCount, totalVoid, voidAmount }
        }
    });
};

export const useTransaction = (id: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
       const response = await apiClient.get<Transaction>(`/transactions/${id}`);
       return response as unknown as Transaction;
    },
    enabled: enabled && !!id
  });
};

export const useVoidTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.post(`/transactions/${id}/void`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    },
  });
};

export const useRejectVoid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/transactions/${id}/reject-void`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    },
  });
};

export const useExportTransactions = () => {
    return useMutation({
        mutationFn: async (filters: TransactionFilters) => {
            const params: any = {};
            if (filters.branchId) params.branchId = filters.branchId;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.search) params.search = filters.search;
            if (filters.startDate) params.startDate = format(filters.startDate, 'yyyy-MM-dd');
            if (filters.endDate) params.endDate = format(filters.endDate, 'yyyy-MM-dd');

            // Ideally this returns a blob or triggers download
            const response = await apiClient.get('/transactions/export', { params, responseType: 'blob' });
            return response; 
        }
    });
};
