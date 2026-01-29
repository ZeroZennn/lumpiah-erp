"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Info } from "lucide-react";
import { dssConfigs } from "@/features/production/data/production.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip";

export default function DssConfigPage() {
    const [selectedBranch, setSelectedBranch] = useState<string>("1");

    const activeBranches = branches.filter((b) => b.isActive);
    const config = dssConfigs.find((c) => c.branchId === Number(selectedBranch));

    const [weights, setWeights] = useState({
        h1: config?.wmaWeights[0] || 0.5,
        h2: config?.wmaWeights[1] || 0.3,
        h3: config?.wmaWeights[2] || 0.2,
    });
    const [safetyStock, setSafetyStock] = useState(config?.safetyStockPercent || 10);

    const totalWeight = weights.h1 + weights.h2 + weights.h3;
    const isValidWeight = Math.abs(totalWeight - 1) < 0.01;

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        const newConfig = dssConfigs.find((c) => c.branchId === Number(value));
        if (newConfig) {
            setWeights({
                h1: newConfig.wmaWeights[0],
                h2: newConfig.wmaWeights[1],
                h3: newConfig.wmaWeights[2],
            });
            setSafetyStock(newConfig.safetyStockPercent);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/production">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Konfigurasi DSS</h1>
                    <p className="text-muted-foreground">
                        Atur parameter sistem pendukung keputusan (WMA)
                    </p>
                </div>
                <Button className="gap-2" disabled={!isValidWeight}>
                    <Save className="h-4 w-4" />
                    Simpan Konfigurasi
                </Button>
            </div>

            {/* Branch Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Pilih Cabang</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBranch} onValueChange={handleBranchChange}>
                        <SelectTrigger className="w-full max-w-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {activeBranches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <TooltipProvider>
                {/* WMA Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Bobot WMA (Weighted Moving Average)
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>
                                        WMA menghitung rata-rata berbobot dari penjualan beberapa hari terakhir.
                                        Bobot H-1 berarti kemarin, H-2 berarti 2 hari lalu, dst.
                                        Total bobot harus = 1.0
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </CardTitle>
                        <CardDescription>
                            Sesuaikan sensitivitas prediksi dengan mengubah bobot per hari
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="h1" className="flex items-center gap-2">
                                    Bobot H-1 (Kemarin)
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Bobot untuk data penjualan kemarin</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Input
                                    id="h1"
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    max="1"
                                    value={weights.h1}
                                    onChange={(e) =>
                                        setWeights((prev) => ({ ...prev, h1: Number(e.target.value) }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="h2" className="flex items-center gap-2">
                                    Bobot H-2 (2 Hari Lalu)
                                </Label>
                                <Input
                                    id="h2"
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    max="1"
                                    value={weights.h2}
                                    onChange={(e) =>
                                        setWeights((prev) => ({ ...prev, h2: Number(e.target.value) }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="h3" className="flex items-center gap-2">
                                    Bobot H-3 (3 Hari Lalu)
                                </Label>
                                <Input
                                    id="h3"
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    max="1"
                                    value={weights.h3}
                                    onChange={(e) =>
                                        setWeights((prev) => ({ ...prev, h3: Number(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>

                        <div
                            className={`p-4 rounded-lg border ${isValidWeight
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Total Bobot:</span>
                                <span
                                    className={`text-lg font-bold ${isValidWeight ? "text-emerald-600" : "text-red-600"
                                        }`}
                                >
                                    {totalWeight.toFixed(2)}
                                </span>
                            </div>
                            {!isValidWeight && (
                                <p className="text-sm text-red-600 mt-1">
                                    Total bobot harus sama dengan 1.0
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Safety Stock Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Safety Stock (Buffer)
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>
                                        Persentase tambahan di atas hasil prediksi WMA untuk mengantisipasi
                                        lonjakan permintaan yang tidak terduga.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </CardTitle>
                        <CardDescription>
                            Persentase buffer untuk mengantisipasi permintaan tidak terduga
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-w-xs">
                            <div className="space-y-2">
                                <Label htmlFor="safetyStock">Safety Stock (%)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="safetyStock"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={safetyStock}
                                        onChange={(e) => setSafetyStock(Number(e.target.value))}
                                        className="w-24"
                                    />
                                    <span className="text-muted-foreground">%</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-sm">
                                    <strong>Contoh:</strong> Jika hasil WMA = 100 unit dan Safety Stock = {safetyStock}%,
                                    maka rekomendasi final = {100 + Math.round(100 * safetyStock / 100)} unit
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formula Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rumus Perhitungan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                            <p className="mb-2">WMA = (Sales_H1 × W1) + (Sales_H2 × W2) + (Sales_H3 × W3)</p>
                            <p>Rekomendasi Final = WMA + (WMA × Safety Stock %)</p>
                        </div>

                        <Separator />

                        <div className="text-sm text-muted-foreground">
                            <p className="mb-2"><strong>Contoh Perhitungan:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Penjualan H-1: 120 pcs</li>
                                <li>Penjualan H-2: 100 pcs</li>
                                <li>Penjualan H-3: 80 pcs</li>
                                <li>Bobot: {weights.h1} / {weights.h2} / {weights.h3}</li>
                            </ul>
                            <p className="mt-2">
                                WMA = (120 × {weights.h1}) + (100 × {weights.h2}) + (80 × {weights.h3}) = {(120 * weights.h1 + 100 * weights.h2 + 80 * weights.h3).toFixed(0)} pcs
                            </p>
                            <p>
                                Final = {(120 * weights.h1 + 100 * weights.h2 + 80 * weights.h3).toFixed(0)} + ({safetyStock}%) = {Math.round((120 * weights.h1 + 100 * weights.h2 + 80 * weights.h3) * (1 + safetyStock / 100))} pcs
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </TooltipProvider>
        </div>
    );
}
