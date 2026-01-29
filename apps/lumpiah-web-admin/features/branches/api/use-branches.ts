import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import { Branch, CreateBranchRequest, UpdateBranchRequest } from "./branches.types";

export const branchKeys = {
  all: ["branches"] as const,
  lists: () => [...branchKeys.all, "list"] as const,
  detail: (id: number) => [...branchKeys.all, "detail", id] as const,
};

// --- Queries ---

export function useBranches() {
  return useQuery({
    queryKey: branchKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<Branch[]>("/branches");
      return response as unknown as Branch[];
    },
  });
}

export function useBranch(id: number) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Branch>(`/branches/${id}`);
      return response as unknown as Branch;
    },
    enabled: !!id,
  });
}

// --- Mutations ---

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBranchRequest) => {
      const response = await apiClient.post<Branch>("/branches", data);
      return response as unknown as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBranchRequest }) => {
      const response = await apiClient.put<Branch>(`/branches/${id}`, data);
      return response as unknown as Branch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(data.id) });
    },
  });
}

export function useUpdateBranchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiClient.patch<Branch>(`/branches/${id}/status`, { isActive });
      return response as unknown as Branch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(data.id) });
    },
  });
}
