'use client';

import { ProductList } from '@/features/products/components/product-list';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProductForm } from '@/features/products/components/product-form';
import Link from 'next/link';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

function Products() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const hasWriteAccess = user?.role.name === 'Admin' || user?.role.name === 'Owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/pricing">
              Pricing Strategy
            </Link>
          </Button>
          {hasWriteAccess && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <ProductList />

      {hasWriteAccess && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import { RoleGuard } from '@/features/auth/components/role-guard';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleGuard allowedRoles={['Admin', 'Owner']}>
        <Products />
      </RoleGuard>
    </Suspense>
  );
}
