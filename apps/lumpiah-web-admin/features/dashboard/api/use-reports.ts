import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { 
  DashboardFilter, 
  DashboardStats, 
  RevenueTrend, 
  BranchPerformance, 
  OperationalStatus, 
  ProductionSummary 
} from './reports.types';

export const useDashboardStats = (filter: DashboardFilter) => {
  return useQuery({
    queryKey: ['dashboard-stats', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.branchId && filter.branchId !== 'all') {
        params.append('branchId', filter.branchId.toString());
      }
      if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter.endDate) params.append('endDate', filter.endDate.toISOString());

      const response = await apiClient.get<DashboardStats>(`/reports/stats?${params.toString()}`);
      return response as unknown as DashboardStats;
    },
  });
};

export const useRevenueTrend = (filter: DashboardFilter) => {
  return useQuery({
    queryKey: ['revenue-trend', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.branchId && filter.branchId !== 'all') {
        params.append('branchId', filter.branchId.toString());
      }
      if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter.endDate) params.append('endDate', filter.endDate.toISOString());

      const response = await apiClient.get<RevenueTrend[]>(`/reports/trends?${params.toString()}`);
      return response as unknown as RevenueTrend[];
    },
  });
};

export const useBranchPerformance = (filter: DashboardFilter) => {
  return useQuery({
    queryKey: ['branch-performance', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter.endDate) params.append('endDate', filter.endDate.toISOString());

      const response = await apiClient.get<BranchPerformance[]>(`/reports/branch-performance?${params.toString()}`);
      return response as unknown as BranchPerformance[];
    },
    enabled: filter.branchId === 'all', // Only fetch if viewing all branches
  });
};

export const useOperationalStatus = () => {
  return useQuery({
    queryKey: ['operational-status'],
    queryFn: async () => {
      const response = await apiClient.get<OperationalStatus[]>('/reports/operational-status');
      return response as unknown as OperationalStatus[];
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useProductionSummary = (branchId?: number | 'all') => {
  return useQuery({
    queryKey: ['production-summary', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId && branchId !== 'all') {
        params.append('branchId', branchId.toString());
      }
      
      const response = await apiClient.get<ProductionSummary[]>(`/reports/production-summary?${params.toString()}`);
      return response as unknown as ProductionSummary[];
    },
  });
};
