import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { useUpdateProductPrice, updatePriceSchema, UpdateProductPriceRequest } from '../api/use-products';
import { useBranches } from '@/features/branches/api/use-branches';
import { ProductListItem } from '../api/products.types';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useProductHistory } from '../api/use-products';
import { formatCurrency } from '@/shared/lib/format';
import { toast } from 'sonner';

const ProductPriceDialog = ({ product, onSuccess }: { product: ProductListItem; onSuccess: () => void }) => {
    console.log('ProductPriceDialog rendered. Product:', product);
    const updatePrice = useUpdateProductPrice();
    const { data: branches, isLoading: isLoadingBranches } = useBranches();

     
    const { data: history, isLoading: isLoadingHistory } = useProductHistory(product.id);

    const form = useForm<UpdateProductPriceRequest>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(updatePriceSchema) as any,
        defaultValues: {
            branchId: 1,
            price: product.price,
        },
    });

    const onSubmit = async (values: UpdateProductPriceRequest) => {
        try {
            await updatePrice.mutateAsync({
                id: product.id,
                data: values,
            });
            toast.success('Price updated successfully');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update price');
        }
    };

    const isLoading = updatePrice.isPending;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{product.name} <span className="text-xs text-red-500">(DEBUG MODE)</span></h2>
                    <p className="text-sm text-muted-foreground">{product.category} • {product.unit}</p>
                </div>
            </div>

            <Tabs defaultValue="price" className="w-full">
                <div className="flex justify-end mb-4">
                    <TabsList>
                        <TabsTrigger value="price">Harga</TabsTrigger>
                        <TabsTrigger value="history">Riwayat</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="price">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            defaultValue={String(field.value)}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a branch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {isLoadingBranches ? (
                                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                                                ) : (
                                                    branches?.map((branch) => (
                                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                                            {branch.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end space-x-2">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Branch Prices
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="history">
                    <div className="rounded-md border p-4 min-h-[200px] flex flex-col justify-center items-center text-center">
                        {isLoadingHistory ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : history && history.length > 0 ? (
                            <div className="w-full space-y-4">
                                {history.map((item) => (
                                    <div key={String(item.id)} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-left">
                                        <div>
                                            <p className="text-sm font-medium">{item.branchName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                By {item.user} • {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">
                                                {formatCurrency(item.price)}
                                            </p>
                                            {item.oldPrice && (
                                                <p className="text-xs text-muted-foreground line-through">
                                                    {formatCurrency(item.oldPrice)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Riwayat perubahan harga belum tersedia.
                            </p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export { ProductPriceDialog };
