import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/lib/api-client';
import { AttendanceRecapResponse, AttendanceDetailItem, UpdateAttendanceRequest } from './attendance.types';

export const useAttendanceRecap = (params: { startDate: string; endDate: string; branchId?: string; search?: string; page?: number; limit?: number }) => {
    return useQuery({
        queryKey: ['attendance-recap', params],
        queryFn: async () => {
             const queryParams = new URLSearchParams();
             queryParams.append('startDate', params.startDate);
             queryParams.append('endDate', params.endDate);
             if (params.branchId && params.branchId !== 'all') {
                queryParams.append('branchId', params.branchId);
             }
             if (params.search) {
                queryParams.append('search', params.search);
             }
             if (params.page) {
                queryParams.append('page', params.page.toString());
             }
             if (params.limit) {
                queryParams.append('limit', params.limit.toString());
             }

             const response = await apiClient.get<AttendanceRecapResponse>(`/attendance/recap?${queryParams.toString()}`);
             return response as unknown as AttendanceRecapResponse;
        }
    });
}

export const useAttendanceDetails = (userId: number | null, startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['attendance-details', userId, startDate, endDate],
        queryFn: async () => {
            if (!userId) return [];
            const response = await apiClient.get<AttendanceDetailItem[]>(`/attendance/details/${userId}?startDate=${startDate}&endDate=${endDate}`);
            return response as unknown as AttendanceDetailItem[];
        },
        enabled: !!userId
    });
}

export const useCorrectAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateAttendanceRequest }) => {
            return await apiClient.patch(`/attendance/${id}`, data);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['attendance-recap'] });
             queryClient.invalidateQueries({ queryKey: ['attendance-details'] });
        }
    });
}
