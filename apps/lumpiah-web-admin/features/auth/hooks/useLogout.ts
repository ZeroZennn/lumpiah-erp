import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { cookieStorage } from '@/shared/lib/cookie-storage';
import { createLogoutMutation } from '../queries/auth.queries';

/**
 * Logout Hook
 * Handles user logout with automatic query invalidation and navigation
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    ...createLogoutMutation(),
    onSuccess: () => {
      // Clear token from cookies
      cookieStorage.removeToken();

      // Clear all queries
      queryClient.clear();

      // Navigate to login
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      
      // Even if logout fails, clear local state and redirect
      cookieStorage.removeToken();
      queryClient.clear();
      router.push('/login');
    },
  });
}
