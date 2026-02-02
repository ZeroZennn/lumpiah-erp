import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateProductRequest, ProductListItem, UpdateProductRequest, ProductHistoryItem } from './products.types';
import { z } from 'zod';
import apiClient from '@/shared/lib/api-client';

// Schema for updating price
export const updatePriceSchema = z.object({
  branchId: z.number().min(1, 'Branch is required'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
});

export type UpdateProductPriceRequest = z.infer<typeof updatePriceSchema>;

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<ProductListItem[]>('/products');
      return response as unknown as ProductListItem[];
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      const response = await apiClient.post('/products', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductRequest }) => {
      const response = await apiClient.put(`/products/${id}`, data);
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<ProductListItem[]>(['products']);

      // Optimistically update to the new value
      queryClient.setQueryData<ProductListItem[]>(['products'], (old) => {
        return old?.map((product) =>
          product.id === id
            ? { ...product, ...data }
            : product
        ) ?? [];
      });

      // Return a context object with the snapshotted value
      return { previousProducts };
    },
    onError: (_err, _newProduct, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductPriceRequest }) => {
      const response = await apiClient.put(`/products/${id}/price`, data);
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches for products and specific product history
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['product-history', id] });

      // Snapshot previous values
      const previousProducts = queryClient.getQueryData<ProductListItem[]>(['products']);

      // Optimistically update the product list with the new price
      // Note: updating "price" or "basePrice" depending on what "price" maps to in the list. 
      // Based on types, ProductListItem has "price" and "basePrice". 
      // UpdateProductPriceRequest has "price". 
      // We'll update "price" in the list item.
      queryClient.setQueryData<ProductListItem[]>(['products'], (old) => {
        return old?.map((product) =>
            product.id === id
                ? { ...product, price: data.price }
                : product
        ) ?? [];
      });

      return { previousProducts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-history', variables.id] });
    },
  });
};

export const useProductHistory = (productId: number, options?: { enabled?: boolean }) => {
    console.log('useProductHistory hook called with ID:', productId, 'Enabled:', options?.enabled);
    return useQuery({
        queryKey: ['product-history', productId],
        queryFn: async () => {
            console.log('Fetching history for product:', productId);
            const response = await apiClient.get<ProductHistoryItem[]>(`/products/${productId}/price-history`);
            // Backend returns raw array, and apiClient returns the body.
            // We cast to unknown then array because TypeScript expects ApiResponse structure
            return response as unknown as ProductHistoryItem[];
        },
        enabled: options?.enabled,
        refetchOnWindowFocus: false
    });
};
