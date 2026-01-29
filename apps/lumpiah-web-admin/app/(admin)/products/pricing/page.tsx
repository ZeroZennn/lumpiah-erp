"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Building2, Search, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/shared/lib/format";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { useProducts, useUpdateProductPrice, useProductHistory } from "@/features/products/api/use-products";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useCategories } from "@/features/products/api/use-categories";
import { useBranches } from "@/features/branches/api/use-branches";
import { toast } from "sonner";
import { ProductListItem } from "@/features/products/api/products.types";

interface PendingChange {
    branchId: number;
    productId: number;
    price: number;
}

export default function PricingPage() {
    const { data: productsData, isLoading: isLoadingProducts } = useProducts();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: branches, isLoading: isLoadingBranches } = useBranches() as any;
    const updateProductPrice = useUpdateProductPrice();

    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Set default selected product when data loads
    useEffect(() => {
        if (productsData && productsData.length > 0 && !selectedProductId) {
            setSelectedProductId(productsData[0].id);
        }
    }, [productsData, selectedProductId]);

    const product = selectedProductId ? productsData?.find((p) => p.id === selectedProductId) : null;

    // Explicitly define type for activeBranches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeBranches = branches?.filter((b: any) => b.isActive) || [];

    // Filter products
    const filteredProducts = productsData?.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || String(p.categoryId) === categoryFilter;
        return matchesSearch && matchesCategory && p.isActive;
    }) || [];

    const handlePriceChange = (branchId: number, newPrice: number) => {
        if (!selectedProductId) return;

        setPendingChanges(prev => {
            // Remove existing change for this branch/product if exists
            const filtered = prev.filter(c => !(c.branchId === branchId && c.productId === selectedProductId));
            return [...filtered, { branchId, productId: selectedProductId, price: newPrice }];
        });
    };

    const handleSaveChanges = async () => {
        if (pendingChanges.length === 0) return;

        setIsSaving(true);
        try {
            await Promise.all(pendingChanges.map(change =>
                updateProductPrice.mutateAsync({
                    id: change.productId,
                    data: {
                        branchId: change.branchId,
                        price: change.price,
                    }
                })
            ));

            toast.success(`Successfully updated ${pendingChanges.length} prices`);
            setPendingChanges([]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save some changes");
        } finally {
            setIsSaving(false);
        }
    };

    const getDisplayPrice = (p: ProductListItem, branchId: number) => {
        // Check pending changes first
        const pending = pendingChanges.find(c => c.productId === p.id && c.branchId === branchId);
        if (pending) return pending.price;

        // Then check existing overrides
        const override = p.branchProductPrices?.find(bp => bp.branchId === branchId);
        return override ? override.price : undefined;
    };

    if (isLoadingProducts || isLoadingCategories || isLoadingBranches) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Strategi Harga Multi-Cabang</h1>
                    <p className="text-muted-foreground">
                        Atur harga khusus per cabang untuk setiap produk
                    </p>
                </div>
                {pendingChanges.length > 0 && (
                    <Button className="gap-2" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Simpan ({pendingChanges.length}) Perubahan
                    </Button>
                )}
            </div>

            {/* Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product List (Master) */}
                <Card className="lg:col-span-4 h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Daftar Produk
                        </CardTitle>
                        <CardDescription>
                            {filteredProducts.length} produk ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 h-full flex flex-col">
                        {/* Search & Filter */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari produk..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[120px] h-9">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {categories?.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Product List */}
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-1 pr-3 pb-4">
                                {filteredProducts.map((p) => {
                                    const hasOverride = p.branchProductPrices && p.branchProductPrices.length > 0;
                                    const isSelected = selectedProductId === p.id;
                                    const hasPending = pendingChanges.some(c => c.productId === p.id);

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedProductId(p.id)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg border transition-all",
                                                "hover:bg-accent/50 hover:border-primary/30",
                                                isSelected
                                                    ? "bg-primary/10 border-primary shadow-sm"
                                                    : "bg-card border-transparent"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "font-medium text-sm truncate",
                                                        isSelected && "text-primary"
                                                    )}>
                                                        {p.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {p.category}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-semibold text-sm">
                                                        {formatCurrency(p.basePrice)}
                                                    </p>
                                                    <div className="flex justify-end gap-1 mt-1">
                                                        {hasOverride && (
                                                            <Badge variant="secondary" className="text-[10px] px-1 h-4">
                                                                Override
                                                            </Badge>
                                                        )}
                                                        {hasPending && (
                                                            <Badge className="text-[10px] px-1 h-4 bg-yellow-500 hover:bg-yellow-600">
                                                                Unsaved
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Tidak ada produk ditemukan
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Pricing Detail (Detail) */}
                <div className="lg:col-span-8">
                    {product ? (
                        <Tabs defaultValue="pricing" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">{product.name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {product.category} • {product.unit}
                                    </p>
                                </div>
                                <TabsList>
                                    <TabsTrigger value="pricing">Harga</TabsTrigger>
                                    <TabsTrigger value="audit">Riwayat</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="pricing" className="space-y-4 mt-4">
                                {/* Base Price */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Harga Dasar</CardTitle>
                                        <CardDescription>
                                            Harga default jika tidak ada override per cabang
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1.5 flex-1 max-w-xs">
                                                <Label className="text-xs">Harga Dasar</Label>
                                                <Input
                                                    type="number"
                                                    disabled
                                                    value={product.basePrice}
                                                    className="text-lg font-semibold h-11 bg-muted"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Satuan</Label>
                                                <p className="text-lg font-medium text-muted-foreground h-11 flex items-center">
                                                    per {product.unit}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Branch Prices */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Harga Per Cabang
                                        </CardTitle>
                                        <CardDescription>
                                            Override harga untuk cabang tertentu
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Cabang</TableHead>
                                                    <TableHead className="text-right">Harga Dasar</TableHead>
                                                    <TableHead className="text-right">Override</TableHead>
                                                    <TableHead className="text-right">Selisih</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {activeBranches.map((branch: any) => {
                                                    const displayPrice = getDisplayPrice(product, branch.id);
                                                    const isOverridden = displayPrice !== undefined;
                                                    const currentPrice = isOverridden ? displayPrice : product.basePrice;
                                                    const diff = currentPrice - product.basePrice;
                                                    const isPending = pendingChanges.some(c => c.productId === product.id && c.branchId === branch.id);

                                                    return (
                                                        <TableRow key={branch.id}>
                                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground">
                                                                {formatCurrency(product.basePrice)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {isPending && <span className="text-[10px] text-yellow-600 font-medium">Changed</span>}
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="—"
                                                                        value={displayPrice || ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.valueAsNumber;
                                                                            if (!isNaN(val)) {
                                                                                handlePriceChange(branch.id, val);
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "w-28 h-8 text-right ml-auto",
                                                                            isPending && "border-yellow-500 bg-yellow-50"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {isOverridden ? (
                                                                    <Badge variant={diff > 0 ? "default" : diff < 0 ? "secondary" : "outline"}>
                                                                        {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="audit" className="mt-4">
                                <Card>
                                    <CardContent className="p-0">
                                        <HistoryList productId={product.id} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <Card className="h-full flex items-center justify-center">
                            <CardContent className="py-12 text-center">
                                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Pilih produk dari daftar untuk mengatur harga
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function HistoryList({ productId }: { productId: number }) {
    const debouncedProductId = useDebounce(productId, 500);
    const { data: history, isLoading, isFetching } = useProductHistory(debouncedProductId);

    // Show loading if debounce is pending (ids don't match) or if query is loading
    const isDebouncing = productId !== debouncedProductId;
    const isBusy = isDebouncing || isLoading || isFetching;

    if (isBusy) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Memuat riwayat...</p>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Riwayat perubahan harga belum tersedia.</div>;
    }

    return (
        <div className="divide-y max-h-[400px] overflow-y-auto">
            {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div>
                        <p className="text-sm font-medium">{item.branchName}</p>
                        <p className="text-xs text-muted-foreground">
                            By {item.user} • {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
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
    );
}
