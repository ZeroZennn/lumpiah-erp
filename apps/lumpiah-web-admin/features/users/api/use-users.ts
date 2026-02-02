import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import { User, Role, CreateUserRequest, UpdateUserRequest } from "./users.types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  byBranch: (branchId: number) => [...userKeys.all, "branch", branchId] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
  roles: () => ["roles"] as const,
};

// --- Queries ---

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>("/users");
      return response as unknown as User[];
    },
  });
}

export function useUsersByBranch(branchId: number) {
  return useQuery({
    queryKey: userKeys.byBranch(branchId),
    queryFn: async () => {
      const response = await apiClient.get<User[]>(`/users/branch/${branchId}`);
      return response as unknown as User[];
    },
    enabled: !!branchId,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: async () => {
      const response = await apiClient.get<Role[]>("/system/roles");
      return response as unknown as Role[];
    },
  });
}

// --- Mutations ---

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await apiClient.post<User>("/users", data);
      return response as unknown as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (data.branchId) {
        queryClient.invalidateQueries({ queryKey: userKeys.byBranch(data.branchId) });
      }
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
      const response = await apiClient.put<User>(`/users/${id}`, data);
      return response as unknown as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      if (data.branchId) {
        queryClient.invalidateQueries({ queryKey: userKeys.byBranch(data.branchId) });
      }
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
