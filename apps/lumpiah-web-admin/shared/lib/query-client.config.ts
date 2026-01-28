import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default options for all queries and mutations
const queryConfig: DefaultOptions = {
  queries: {
    // Time before data is considered stale (5 minutes)
    staleTime: 5 * 60 * 1000,
    
    // Time before inactive queries are garbage collected (10 minutes)
    gcTime: 10 * 60 * 1000,
    
    // Retry failed requests
    retry: 1,
    
    // Retry delay
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus (disable in development for better DX)
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Refetch on mount
    refetchOnMount: true,
  },
  mutations: {
    // Retry failed mutations
    retry: 1,
    
    // Retry delay for mutations
    retryDelay: 1000,
  },
};

// Create a query client instance
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Helper function to create a new query client (useful for SSR)
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}
