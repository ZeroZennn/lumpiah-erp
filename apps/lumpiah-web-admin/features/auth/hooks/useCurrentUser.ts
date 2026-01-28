import { useQuery } from '@tanstack/react-query';
import { currentUserQueryOptions } from '../queries/auth.queries';

/**
 * Current User Hook
 * Fetches and caches the current authenticated user
 */
export function useCurrentUser() {
  return useQuery(currentUserQueryOptions);
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
