# Feature-Based Architecture Documentation

## Overview

This Next.js application follows a **feature-based architecture** with **axios** for API calls and **TanStack Query** (React Query) for server state management. This architecture promotes scalability, maintainability, and code organization.

## Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **axios** - HTTP client
- **TanStack Query v5** - Server state management

---

## Project Structure

```
apps/lumpiah-web-admin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── layout.tsx                # Root layout with QueryProvider
│   └── page.tsx                  # Home page
│
├── features/                     # Feature modules (domain-driven)
│   └── auth/                     # Example: Auth feature
│       ├── api/                  # API calls
│       │   ├── auth.api.ts       # Raw API methods
│       │   └── auth.types.ts     # Feature-specific types
│       ├── hooks/                # React hooks (queries/mutations)
│       │   ├── useLogin.ts
│       │   ├── useLogout.ts
│       │   └── useCurrentUser.ts
│       ├── queries/              # Query configurations
│       │   └── auth.queries.ts   # Query/mutation factories
│       └── components/           # Feature-specific components
│           └── LoginForm.tsx
│
├── shared/                       # Shared utilities and components
│   ├── components/               # Shared UI components
│   ├── container/                # Provider components
│   │   └── query-provider.tsx   # TanStack Query provider
│   ├── hooks/                    # Shared hooks
│   │   ├── useInvalidateQueries.ts
│   │   └── useOptimisticUpdate.ts
│   ├── lib/                      # Core utilities
│   │   ├── axios.config.ts       # Axios instance & interceptors
│   │   ├── query-client.config.ts # Query client configuration
│   │   ├── api-client.ts         # Type-safe API wrapper
│   │   └── query-keys.factory.ts # Centralized query keys
│   └── types/                    # Shared TypeScript types
│       └── api.types.ts          # Common API types
│
└── components/                   # shadcn/ui components
    └── ui/                       # Auto-generated UI components
```

---

## Core Concepts

### 1. Feature-Based Structure

Each feature is self-contained with its own API calls, hooks, types, and components.

**Benefits:**
- Clear separation of concerns
- Easy to locate code
- Scales well with team size
- Facilitates code splitting

### 2. Separation of Layers

```
Component → Hook → Query/Mutation → API → axios
```

- **Components**: UI and user interaction
- **Hooks**: React Query integration
- **Queries**: Query/mutation configuration
- **API**: Raw API calls
- **axios**: HTTP client

### 3. Query Keys Factory

Centralized query keys prevent conflicts and make invalidation easier:

```typescript
// shared/lib/query-keys.factory.ts
export const queryKeys = {
  auth: {
    all: ['auth'],
    currentUser: ['auth', 'current-user'],
  },
};
```

---

## How to Create a New Feature

Follow these steps to create a new feature:

### Step 1: Create Feature Directory

```bash
mkdir -p features/products/{api,hooks,queries,components}
```

### Step 2: Define Types

Create `features/products/api/products.types.ts`:

```typescript
export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CreateProductRequest {
  name: string;
  price: number;
}
```

### Step 3: Create API Methods

Create `features/products/api/products.api.ts`:

```typescript
import { apiClient } from '@/shared/lib/api-client';
import { Product, CreateProductRequest } from './products.types';
import { PaginatedResponse } from '@/shared/types/api.types';

export const productsApi = {
  getAll: async () => {
    return apiClient.get<PaginatedResponse<Product>>('/products');
  },

  getById: async (id: string) => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  create: async (data: CreateProductRequest) => {
    return apiClient.post<Product, CreateProductRequest>('/products', data);
  },

  update: async (id: string, data: Partial<Product>) => {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/products/${id}`);
  },
};
```

### Step 4: Add Query Keys

Update `shared/lib/query-keys.factory.ts`:

```typescript
export const queryKeys = {
  // ... existing keys
  products: {
    all: ['products'] as const,
    lists: () => ['products', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['products', 'list', filters] as const,
    details: () => ['products', 'detail'] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
};
```

### Step 5: Create Query Configurations

Create `features/products/queries/products.queries.ts`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys.factory';
import { productsApi } from '../api/products.api';

export const productListQueryOptions = {
  queryKey: queryKeys.products.lists(),
  queryFn: async () => {
    const response = await productsApi.getAll();
    return response.data;
  },
};

export const createProductMutation = () => {
  return useMutation({
    mutationFn: productsApi.create,
  });
};
```

### Step 6: Create Hooks

Create `features/products/hooks/useProducts.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { productListQueryOptions } from '../queries/products.queries';

export function useProducts() {
  return useQuery(productListQueryOptions);
}
```

Create `features/products/hooks/useCreateProduct.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys.factory';
import { createProductMutation } from '../queries/products.queries';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createProductMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
```

### Step 7: Use in Components

```typescript
'use client';

import { useProducts } from '@/features/products/hooks/useProducts';
import { useCreateProduct } from '@/features/products/hooks/useCreateProduct';

export function ProductList() {
  const { data, isLoading } = useProducts();
  const createProduct = useCreateProduct();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Query Keys Organization

✅ **DO:**
```typescript
queryKeys.products.list({ status: 'active' })
```

❌ **DON'T:**
```typescript
['products', 'active'] // Hard to maintain
```

### 2. Error Handling

Handle errors at the hook level:

```typescript
export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onError: (error) => {
      toast.error('Login failed');
    },
  });
}
```

### 3. Optimistic Updates

Use for better UX:

```typescript
const updateProduct = useOptimisticUpdate({
  mutationFn: (product) => productsApi.update(product.id, product),
  queryKey: queryKeys.products.lists(),
  updater: (oldData, newProduct) => 
    oldData.map(p => p.id === newProduct.id ? newProduct : p),
});
```

### 4. Loading States

Handle loading states properly:

```typescript
const { data, isLoading, isFetching, error } = useProducts();

if (isLoading) return <Skeleton />;
if (error) return <Error error={error} />;
```

### 5. Pagination

Use query keys with parameters:

```typescript
const { data } = useQuery({
  queryKey: queryKeys.products.list({ page: 1, limit: 10 }),
  queryFn: () => productsApi.getAll({ page: 1, limit: 10 }),
});
```

---

## Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Query Client Defaults

Configured in `shared/lib/query-client.config.ts`:

- **staleTime**: 5 minutes
- **gcTime**: 10 minutes
- **retry**: 1 attempt
- **refetchOnWindowFocus**: Only in production

### Axios Interceptors

Configured in `shared/lib/axios.config.ts`:

- **Request**: Adds auth token, logs requests (dev)
- **Response**: Handles 401/403/500 errors, logs responses (dev)

---

## Development Tools

### React Query Devtools

Available in development mode (bottom-left corner):

- View all queries and their states
- Manually trigger refetch
- Inspect query data
- Debug cache

### Debugging

Enable logging in development:

```typescript
// Requests/responses logged in console
console.log('🚀 Request:', { method, url, data });
console.log('✅ Response:', { status, data });
```

---

## Examples

See the `features/auth` folder for a complete working example with:
- Login/Logout mutations
- Current user query
- Token management
- Error handling
- Navigation after auth

---

## Migration Guide

### From REST to this architecture:

1. Move API calls to `features/{feature}/api/{feature}.api.ts`
2. Define types in `features/{feature}/api/{feature}.types.ts`
3. Create hooks in `features/{feature}/hooks/`
4. Update components to use hooks instead of direct API calls
5. Remove old state management (useState, useEffect)

---

## Troubleshooting

### Query not refetching?

Check query keys match when invalidating:

```typescript
// Invalidate specific
queryClient.invalidateQueries({ queryKey: queryKeys.products.detail('123') });

// Invalidate all products
queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
```

### 401 Errors?

Check axios interceptor is adding token:

```typescript
// Should see Authorization header in Network tab
Authorization: Bearer <your-token>
```

### Stale data?

Adjust staleTime in query options:

```typescript
useQuery({
  ...queryOptions,
  staleTime: 0, // Always fresh
});
```

---

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [axios Documentation](https://axios-http.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
