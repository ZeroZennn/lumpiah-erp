"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Building2, Search, Package } from "lucide-react";
import {
    products,
    categories,
    branchProductPrices,
    priceAuditLogs,
    formatCurrency,
} from "@/features/products/data/products.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
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

export default function PricingPage() {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(products[0]?.id || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const product = selectedProductId ? products.find((p) => p.id === selectedProductId) : null;
    const productPrices = selectedProductId
        ? branchProductPrices.filter((p) => p.productId === selectedProductId)
        : [];
    const auditLogs = selectedProductId
        ? priceAuditLogs.filter((l) => l.productId === selectedProductId)
        : [];

    const activeBranches = branches.filter((b) => b.isActive);

    // Filter products
    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || p.categoryId === Number(categoryFilter);
        return matchesSearch && matchesCategory && p.isActive;
    });

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
                <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                </Button>
            </div>

            {/* Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product List (Master) */}
                <Card className="lg:col-span-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Daftar Produk
                        </CardTitle>
                        <CardDescription>
                            {filteredProducts.length} produk ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Product List */}
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-1 pr-3">
                                {filteredProducts.map((p) => {
                                    const hasOverride = branchProductPrices.some((bp) => bp.productId === p.id);
                                    const isSelected = selectedProductId === p.id;

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
                                                        {categories.find((c) => c.id === p.categoryId)?.name}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-semibold text-sm">
                                                        {formatCurrency(p.basePrice)}
                                                    </p>
                                                    {hasOverride && (
                                                        <Badge variant="secondary" className="text-[10px] mt-1">
                                                            Override
                                                        </Badge>
                                                    )}
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
                                        {categories.find((c) => c.id === product.categoryId)?.name} • {product.unit}
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
                                                    defaultValue={product.basePrice}
                                                    className="text-lg font-semibold h-11"
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
                                                {activeBranches.map((branch) => {
                                                    const override = productPrices.find((p) => p.branchId === branch.id);
                                                    const diff = override ? override.price - product.basePrice : 0;

                                                    return (
                                                        <TableRow key={branch.id}>
                                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground">
                                                                {formatCurrency(product.basePrice)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="—"
                                                                    defaultValue={override?.price || ""}
                                                                    className="w-28 h-8 text-right ml-auto"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {override ? (
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
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Riwayat Perubahan Harga</CardTitle>
                                        <CardDescription>
                                            Log audit untuk {product.name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Cabang</TableHead>
                                                    <TableHead className="text-right">Lama</TableHead>
                                                    <TableHead className="text-right">Baru</TableHead>
                                                    <TableHead>Oleh</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {auditLogs.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                            Belum ada riwayat perubahan
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    auditLogs.map((log) => (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="text-sm">
                                                                {new Date(log.changedAt).toLocaleDateString("id-ID", {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {log.branchName || (
                                                                    <span className="text-muted-foreground">Dasar</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground">
                                                                {formatCurrency(log.oldPrice)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium">
                                                                {formatCurrency(log.newPrice)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {log.changedBy}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
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
