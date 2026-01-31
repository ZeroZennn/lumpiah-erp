"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useBranches } from "@/features/branches/api/use-branches";
import { Branch } from "@/features/branches/api/branches.types";
import { useProductionSummary } from "@/features/dashboard/api/use-reports";

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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";


export default function AccuracyReportPage() {
    const { data: branches } = useBranches();
    const activeBranches = branches?.filter((b: Branch) => b.isActive) || [];

    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const { data: productionData, isLoading } = useProductionSummary(
        selectedBranch === "all" ? "all" : Number(selectedBranch)
    );

    // Process and Aggregate data
    const aggregatedMap = new Map<string, any>();

    (productionData || []).forEach(item => {
        const key = `${item.branchName}-${item.productName}`;
        if (!aggregatedMap.has(key)) {
            aggregatedMap.set(key, { ...item });
        } else {
            const existing = aggregatedMap.get(key);
            existing.recommendedQty += item.recommendedQty;
            existing.actualQty += item.actualQty;
            // Keep other metadata from the first entry found
        }
    });

    const processedData = Array.from(aggregatedMap.values()).map(item => {
        const productionDeviation = item.actualQty - item.recommendedQty;

        const accuracy = item.recommendedQty > 0
            ? Math.min(100, Math.max(0, (1 - Math.abs(productionDeviation) / item.recommendedQty) * 100))
            : 0;

        return {
            ...item,
            productionDeviation,
            accuracy: accuracy.toFixed(1)
        };
    });

    // Calculate averages & totals
    const totalRecommended = processedData.reduce((sum, d) => sum + d.recommendedQty, 0);
    const totalProduced = processedData.reduce((sum, d) => sum + d.actualQty, 0);
    const avgAccuracy = processedData.length > 0
        ? (processedData.reduce((sum, d) => sum + Number(d.accuracy), 0) / processedData.length).toFixed(1)
        : "0.0";

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
                        Evaluasi kepatuhan produksi terhadap rekomendasi sistem (DSS)
                    </p>
                </div>
            </div>

            <Tabs defaultValue="accuracy" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="operational" asChild>
                        <Link href="/reports/operational">Laporan Operasional</Link>
                    </TabsTrigger>
                    <TabsTrigger value="comparison" asChild>
                        <Link href="/reports">Komparasi Cabang</Link>
                    </TabsTrigger>
                    <TabsTrigger value="accuracy">Akurasi Produksi</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {activeBranches.map((b: Branch) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-primary">{isLoading ? "..." : avgAccuracy}%</div>
                        <p className="text-sm text-muted-foreground">Rata-rata Kepatuhan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{isLoading ? "..." : totalRecommended}</div>
                        <p className="text-sm text-muted-foreground">Total Rekomendasi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{isLoading ? "..." : totalProduced}</div>
                        <p className="text-sm text-muted-foreground">Total Diproduksi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Accuracy Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Per Produk</CardTitle>
                    <CardDescription>
                        Selisih antara rekomendasi sistem dan realisasi produksi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead className="text-right">Rekomendasi</TableHead>
                                <TableHead className="text-right">Produksi</TableHead>
                                <TableHead className="text-center">Deviasi</TableHead>
                                <TableHead className="text-center">Akurasi (Score)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading data...</TableCell>
                                </TableRow>
                            ) : processedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada data produksi untuk periode ini.</TableCell>
                                </TableRow>
                            ) : processedData.map((item) => (
                                <TableRow key={item.planId}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.branchName}</TableCell>
                                    <TableCell className="text-right">{item.recommendedQty}</TableCell>
                                    <TableCell className="text-right font-medium">{item.actualQty}</TableCell>
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
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                Number(item.accuracy) >= 95
                                                    ? "default"
                                                    : Number(item.accuracy) >= 80
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                            className={
                                                Number(item.accuracy) >= 95
                                                    ? "bg-emerald-500"
                                                    : Number(item.accuracy) >= 80
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
