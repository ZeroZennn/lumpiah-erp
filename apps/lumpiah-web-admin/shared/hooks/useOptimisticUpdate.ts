import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

/**
 * Generic optimistic update hook
 * 
 * @example
 * const updateTodo = useOptimisticUpdate({
 *   mutationFn: (todo) => apiClient.put(`/todos/${todo.id}`, todo),
 *   queryKey: ['todos'],
 *   updater: (oldData, newTodo) => oldData.map(t => t.id === newTodo.id ? newTodo : t),
 * });
 */

interface OptimisticUpdateContext<TData> {
  previousData: TData | undefined;
}

interface OptimisticUpdateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: unknown[];
  updater: (oldData: TData, variables: TVariables) => TData;
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables, OptimisticUpdateContext<TData>>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSettled'
  >;
}

export function useOptimisticUpdate<TData, TVariables>({
  mutationFn,
  queryKey,
  updater,
  mutationOptions,
}: OptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, OptimisticUpdateContext<TData>>({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, updater(previousData, variables));
      }

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after success or error
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
