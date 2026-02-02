import { useQuery } from '@tanstack/react-query';
import { Category } from './products.types';
import apiClient from '@/shared/lib/api-client';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories');
      return response as unknown as Category[];
    },
  });
};
