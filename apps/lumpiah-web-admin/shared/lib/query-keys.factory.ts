/**
 * Query Keys Factory
 * 
 * Centralized query keys management for consistency and type safety.
 * Prevents key conflicts and makes invalidation easier.
 * 
 * Usage:
 * - In queries: queryKey: queryKeys.auth.currentUser
 * - In mutations: queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
 */

export const queryKeys = {
  // Auth queries
  auth: {
    all: ['auth'] as const,
    currentUser: ['auth', 'current-user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },

  // User queries
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['users', 'list', filters] as const,
    details: () => ['users', 'detail'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },

  // Branch queries
  branches: {
    all: ['branches'] as const,
    lists: () => ['branches', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['branches', 'list', filters] as const,
    details: () => ['branches', 'detail'] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
  },

  // Product queries
  products: {
    all: ['products'] as const,
    lists: () => ['products', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['products', 'list', filters] as const,
    details: () => ['products', 'detail'] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    categories: ['products', 'categories'] as const,
  },

  // Transaction queries
  transactions: {
    all: ['transactions'] as const,
    lists: () => ['transactions', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    details: () => ['transactions', 'detail'] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
  },

  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    stats: (branchId?: string) => ['dashboard', 'stats', branchId] as const,
    sales: (period: string) => ['dashboard', 'sales', period] as const,
  },
} as const;

export default queryKeys;
