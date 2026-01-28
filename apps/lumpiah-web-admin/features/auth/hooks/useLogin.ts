import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/shared/lib/query-keys.factory';
import { cookieStorage } from '@/shared/lib/cookie-storage';
import { loginMutationOptions } from '../queries/auth.queries';
import { LoginResponse } from '../api/auth.types';

/**
 * Login Hook
 * Handles user login with automatic query invalidation and navigation
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    ...loginMutationOptions,
    onSuccess: (data: LoginResponse) => {
      // Store token in cookies
      cookieStorage.setToken(data.access_token);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });

      // Navigate to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // You can add toast notification here
    },
  });
}

/**
 * Alternative usage with custom callbacks
 */
export function useLoginWithCallbacks() {
  const queryClient = useQueryClient();

  return useMutation({
    ...loginMutationOptions,
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
