"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { branches } from "@/features/branches/data/branches.dummy";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
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

// Dummy accuracy data
const accuracyData = [
    {
        productId: 1,
        productName: "Lumpia Kecil",
        recommended: 165,
        produced: 160,
        sold: 145,
        productionDeviation: -5,
        salesDeviation: -15,
        accuracy: 87.8,
    },
    {
        productId: 2,
        productName: "Lumpia Besar",
        recommended: 88,
        produced: 90,
        sold: 82,
        productionDeviation: 2,
        salesDeviation: -8,
        accuracy: 91.1,
    },
    {
        productId: 3,
        productName: "Lumpia Spesial",
        recommended: 44,
        produced: 44,
        sold: 42,
        productionDeviation: 0,
        salesDeviation: -2,
        accuracy: 95.4,
    },
    {
        productId: 4,
        productName: "Es Teh Manis",
        recommended: 120,
        produced: 125,
        sold: 118,
        productionDeviation: 5,
        salesDeviation: -7,
        accuracy: 94.4,
    },
    {
        productId: 5,
        productName: "Es Jeruk",
        recommended: 60,
        produced: 55,
        sold: 52,
        productionDeviation: -5,
        salesDeviation: -3,
        accuracy: 94.5,
    },
];

export default function AccuracyReportPage() {
    const activeBranches = branches.filter((b) => b.isActive);

    // Calculate averages
    const avgAccuracy = (accuracyData.reduce((sum, d) => sum + d.accuracy, 0) / accuracyData.length).toFixed(1);
    const totalRecommended = accuracyData.reduce((sum, d) => sum + d.recommended, 0);
    const totalProduced = accuracyData.reduce((sum, d) => sum + d.produced, 0);
    const totalSold = accuracyData.reduce((sum, d) => sum + d.sold, 0);
    const waste = totalProduced - totalSold;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/reports">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Laporan Akurasi Produksi</h1>
                    <p className="text-muted-foreground">
                        Perbandingan: Rekomendasi vs Produksi Aktual vs Penjualan
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <Select defaultValue="1">
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeBranches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select defaultValue="today">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Periode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="week">7 Hari Terakhir</SelectItem>
                                <SelectItem value="month">30 Hari Terakhir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-primary">{avgAccuracy}%</div>
                        <p className="text-sm text-muted-foreground">Rata-rata Akurasi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{totalRecommended}</div>
                        <p className="text-sm text-muted-foreground">Total Rekomendasi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{totalProduced}</div>
                        <p className="text-sm text-muted-foreground">Total Diproduksi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">{waste}</div>
                        <p className="text-sm text-muted-foreground">Sisa / Waste</p>
                    </CardContent>
                </Card>
            </div>

            {/* Accuracy Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Per Produk</CardTitle>
                    <CardDescription>
                        Analisis akurasi rekomendasi DSS terhadap produksi dan penjualan aktual
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Rekomendasi</TableHead>
                                <TableHead className="text-right">Produksi</TableHead>
                                <TableHead className="text-center">Dev. Produksi</TableHead>
                                <TableHead className="text-right">Terjual</TableHead>
                                <TableHead className="text-center">Dev. Penjualan</TableHead>
                                <TableHead className="text-center">Akurasi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accuracyData.map((item) => (
                                <TableRow key={item.productId}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.recommended}</TableCell>
                                    <TableCell className="text-right font-medium">{item.produced}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {item.productionDeviation > 0 ? (
                                                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                                            ) : item.productionDeviation < 0 ? (
                                                <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                                            ) : (
                                                <Minus className="h-3.5 w-3.5 text-gray-400" />
                                            )}
                                            <span
                                                className={
                                                    item.productionDeviation > 0
                                                        ? "text-amber-600"
                                                        : item.productionDeviation < 0
                                                            ? "text-blue-600"
                                                            : "text-gray-500"
                                                }
                                            >
                                                {item.productionDeviation > 0 ? "+" : ""}
                                                {item.productionDeviation}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{item.sold}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-red-600">{item.salesDeviation}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                item.accuracy >= 95
                                                    ? "default"
                                                    : item.accuracy >= 90
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                            className={
                                                item.accuracy >= 95
                                                    ? "bg-emerald-500"
                                                    : item.accuracy >= 90
                                                        ? ""
                                                        : "border-amber-500 text-amber-600"
                                            }
                                        >
                                            {item.accuracy}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
