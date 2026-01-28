import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to invalidate queries by pattern
 * Useful for invalidating multiple related queries at once
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidate = (queryKey: unknown[]) => {
    return queryClient.invalidateQueries({ queryKey });
  };

  const invalidateAll = () => {
    return queryClient.invalidateQueries();
  };

  return {
    invalidate,
    invalidateAll,
  };
}
