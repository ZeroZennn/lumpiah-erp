import { DataTable } from '@/shared/components/ui/data-table';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useProducts } from '../api/use-products';
import { useCategories } from '../api/use-categories';
import { useBranches } from '@/features/branches/api/use-branches';
import { ColumnDef } from '@tanstack/react-table';
import { ProductListItem } from '../api/products.types';
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/components/ui/button';
import { MoreHorizontal, Edit, DollarSign, Search, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { Input } from '@/shared/components/ui/input';
import { ProductForm } from './product-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const ProductList = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: products, isLoading } = useProducts();
    const { data: categories } = useCategories();
     
    const { data: branches } = useBranches() as any;
    const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);

    // --- Filter State (Synced with URL) ---
    const statusFilter = searchParams.get('status') || 'all';
    const categoryFilter = searchParams.get('category') || 'all';
    const branchFilter = searchParams.get('branch') || 'all';

    // Helper to update URL params
    const updateFilterParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;

        Object.entries(updates).forEach(([key, value]) => {
            const current = params.get(key);
            if (value && value !== 'all') {
                if (current !== value) {
                    params.set(key, value);
                    hasChanges = true;
                }
            } else {
                if (params.has(key)) {
                    params.delete(key);
                    hasChanges = true;
                }
            }
        });

        // Reset page to 1 on filter change
        if (!updates.page && params.has('page') && params.get('page') !== '1') {
            params.set('page', '1');
            hasChanges = true;
        }

        if (hasChanges) {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    // Search Debounce Implementation
    const urlSearchQuery = searchParams.get('q') || '';
    const [searchValue, setSearchValue] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchValue, 500);

    // Sync input with URL when URL changes externally
    useEffect(() => {
        setSearchValue(urlSearchQuery);
    }, [urlSearchQuery]);

    // Sync URL with debounced value
    useEffect(() => {
        // Only update if value actually changed to prevent loops
        if (debouncedSearch !== urlSearchQuery) {
            updateFilterParams({ q: debouncedSearch });
        }
    }, [debouncedSearch, urlSearchQuery, updateFilterParams]);

    const filteredProducts = useMemo(() => {
        return products?.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(urlSearchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && product.isActive) ||
                (statusFilter === 'inactive' && !product.isActive);

            const matchesCategory = categoryFilter === 'all' ||
                String(product.categoryId) === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [products, urlSearchQuery, statusFilter, categoryFilter]);

    const columns: ColumnDef<ProductListItem>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        },
        {
            accessorKey: 'category',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        },
        {
            accessorKey: 'basePrice',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Base Price" />,
            cell: ({ row }) => {
                return <div className="font-medium">{formatCurrency(row.getValue('basePrice'))}</div>;
            },
        },
        // Only show Branch Price column if a specific branch is selected
        ...(branchFilter !== 'all' ? [{
            id: 'branchPrice',
             
            header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Branch Price" />,
             
            cell: ({ row }: { row: any }) => {
                const prices: { branchId: number; price: number }[] = row.original.branchProductPrices || [];
                const branchId = parseInt(branchFilter);
                 
                const override = prices.find((p: any) => p.branchId === branchId);

                if (override) {
                    return <div className="font-medium text-blue-600">{formatCurrency(override.price)}</div>;
                }
                return <span className="text-muted-foreground text-xs italic">Uses Base</span>;
            },
        }] : []),
        {
            accessorKey: 'unit',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Unit" />,
        },
        {
            accessorKey: 'isActive',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const isActive = row.getValue('isActive') as boolean;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="ml-2">Edit Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/products/pricing?productId=${product.id}`)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                <span className="ml-2">Update Branch Prices</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredProducts || []}
                isLoading={isLoading}
                toolbarActions={
                    <div className="flex gap-2">
                        <div className="relative w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari produk..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-9 h-9"
                            />
                            {searchValue && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchValue('')}
                                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <Select value={statusFilter} onValueChange={(val) => updateFilterParams({ status: val })}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={(val) => updateFilterParams({ category: val })}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories?.map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={branchFilter} onValueChange={(val) => updateFilterParams({ branch: val })}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                { }
                                {branches?.map((branch: any) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
                pagination={{
                    pageIndex: parseInt(searchParams.get('page') || '1') - 1,
                    pageSize: parseInt(searchParams.get('limit') || '10'),
                }}
                onPaginationChange={(newPagination) => {
                    updateFilterParams({
                        page: String(newPagination.pageIndex + 1),
                        limit: String(newPagination.pageSize)
                    });
                }}
            />

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    {editingProduct && (
                        <ProductForm
                            product={editingProduct}
                            onSuccess={() => setEditingProduct(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
