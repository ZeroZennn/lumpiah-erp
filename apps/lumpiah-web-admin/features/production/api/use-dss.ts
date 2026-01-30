import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
// Using inline types based on DTO
export type DssConfig = {
    wmaWeights: number[]; // [w1, w2, w3]
    safetyStockPercent: number; // 0-100
};

export const useDssConfig = (branchId?: number) => {
    return useQuery({
        queryKey: ['dss-config', branchId],
        queryFn: async () => {
            const response = await apiClient.get(`/dss/config`, { params: { branchId } });
            // Controller returns the config object directly (or we might need to cast)
            return response as unknown as DssConfig;
        },
        enabled: !!branchId,
    });
};

export const useUpdateDssConfig = (branchId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: DssConfig) => {
             // Assuming controller accepts UpdateDssConfigDto which matches DssConfig structure
            return await apiClient.put(`/dss/config`, data, { params: { branchId } }); 
        },
        onSuccess: () => {
            if (branchId) {
                queryClient.invalidateQueries({ queryKey: ['dss-config', branchId] });
            }
        }
    });
};
