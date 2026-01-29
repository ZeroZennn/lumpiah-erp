import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { useCreateProduct, useUpdateProduct } from '../api/use-products';
import { useCategories } from '../api/use-categories';
import { ProductListItem } from '../api/products.types';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { toast } from 'sonner';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.string().min(1, 'Category is required'),
    basePrice: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
    unit: z.string().optional(),
    isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: ProductListItem;
    onSuccess: () => void;
}

export const ProductForm = ({ product, onSuccess }: ProductFormProps) => {
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    const isEditing = !!product;

    const defaultValues: ProductFormValues = {
        name: product?.name || '',
        categoryId: product?.categoryId ? String(product.categoryId) : '',
        basePrice: product?.basePrice ? Number(product.basePrice) : 0,
        unit: product?.unit || 'pcs',
        isActive: product?.isActive ?? true,
    };

    const form = useForm<ProductFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues,
    });

    const onSubmit = async (values: ProductFormValues) => {
        const payload = {
            ...values,
            categoryId: parseInt(values.categoryId),
        };

        try {
            if (isEditing && product) {
                await updateProduct.mutateAsync({
                    id: product.id,
                    data: payload,
                });
                toast.success('Product updated successfully');
            } else {
                await createProduct.mutateAsync(payload);
                toast.success('Product created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save product');
        }
    };

    const isLoading = createProduct.isPending || updateProduct.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Product name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isLoadingCategories ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                                    ) : (
                                        categories?.map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base Price</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        value={field.value}
                                        onChange={e => {
                                            const val = e.target.valueAsNumber;
                                            field.onChange(isNaN(val) ? 0 : val);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                    <Input placeholder="pcs, kg, etc" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {isEditing && (
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Active
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end space-x-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
