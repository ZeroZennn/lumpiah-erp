import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys.factory';
import { cookieStorage } from '@/shared/lib/cookie-storage';
import { authApi } from '../api/auth.api';
import { LoginRequest, LoginResponse, User } from '../api/auth.types';

/**
 * Auth Queries Configuration
 * Query and mutation factories for auth operations
 */

/**
 * Query options for current user
 */
export const currentUserQueryOptions = {
  queryKey: queryKeys.auth.currentUser,
  queryFn: async () => {
    const response = await authApi.getCurrentUser();
    return response.data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: false, // Don't retry on 401
} satisfies UseQueryOptions<User>;

/**
 * Login mutation factory
 */
export const createLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      return response.data;
    },
    onSuccess: (data: LoginResponse) => {
      // Store token in cookies
      cookieStorage.setToken(data.access_token);
    },
  });
};

/**
 * Logout mutation factory
 */
export const createLogoutMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await authApi.logout();
      return response.data;
    },
    onSuccess: () => {
      // Clear token from cookies
      cookieStorage.removeToken();
    },
  });
};
