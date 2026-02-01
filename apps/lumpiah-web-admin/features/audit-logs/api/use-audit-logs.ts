import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/shared/lib/axios.config";
import { AuditLogResponse, AuditLogFilters } from "../audit-logs.types";

const fetchAuditLogs = async (filters: AuditLogFilters): Promise<AuditLogResponse> => {
  const params: any = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.userId && filters.userId !== "all") params.userId = filters.userId;
  if (filters.actionType && filters.actionType !== "all") params.actionType = filters.actionType;
  if (filters.targetTable && filters.targetTable !== "all") params.targetTable = filters.targetTable;
  if (filters.search) params.search = filters.search;

  const { data } = await axiosInstance.get<AuditLogResponse>("/audit-logs", { params });
  return data;
};

export const useAuditLogs = (filters: AuditLogFilters) => {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: (prev) => prev,
  });
};
