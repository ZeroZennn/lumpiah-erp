import { DataTable } from '@/shared/components/ui/data-table';
import { useProducts } from '../api/use-products';
import { useBranches } from '@/features/branches/api/use-branches';
import { ColumnDef } from '@tanstack/react-table';
import { ProductListItem } from '../api/products.types';
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/components/ui/button';
import { MoreHorizontal, Edit, DollarSign } from 'lucide-react';
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
import { useState } from 'react';
import { ProductForm } from './product-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { ProductPriceDialog } from './product-price-dialog';

export const ProductList = () => {
    const { data: products, isLoading } = useProducts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: branches } = useBranches() as any;
    const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
    const [priceUpdateProduct, setPriceUpdateProduct] = useState<ProductListItem | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');

    const filteredProducts = products?.filter((product) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return product.isActive;
        if (statusFilter === 'inactive') return !product.isActive;
        return true;
    });

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Branch Price" />,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: { row: any }) => {
                const prices: { branchId: number; price: number }[] = row.original.branchProductPrices || [];
                const branchId = parseInt(branchFilter);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                            <DropdownMenuItem onClick={() => setPriceUpdateProduct(product)}>
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
                searchKey="name"
                toolbarActions={
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {branches?.map((branch: any) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
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

            <Dialog open={!!priceUpdateProduct} onOpenChange={(open) => !open && setPriceUpdateProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Branch Prices</DialogTitle>
                        <DialogDescription>
                            Change the price for this product across different branches.
                        </DialogDescription>
                    </DialogHeader>
                    {priceUpdateProduct && (
                        <ProductPriceDialog
                            product={priceUpdateProduct}
                            onSuccess={() => setPriceUpdateProduct(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
