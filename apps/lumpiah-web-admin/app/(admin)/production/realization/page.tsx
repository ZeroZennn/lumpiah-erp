"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { productionPlansWithRealization } from "@/features/production/data/production.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { Textarea } from "@/shared/components/ui/textarea";
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

export default function RealizationPage() {
    const [selectedBranch, setSelectedBranch] = useState<string>("1");
    const [realizationData, setRealizationData] = useState<Record<number, { qty: string; notes: string }>>({});

    const activeBranches = branches.filter((b) => b.isActive);
    const plans = productionPlansWithRealization.filter(
        (p) => p.branchId === Number(selectedBranch) && !p.realization
    );

    const handleQtyChange = (planId: number, qty: string) => {
        setRealizationData((prev) => ({
            ...prev,
            [planId]: { ...prev[planId], qty, notes: prev[planId]?.notes || "" },
        }));
    };

    const handleNotesChange = (planId: number, notes: string) => {
        setRealizationData((prev) => ({
            ...prev,
            [planId]: { ...prev[planId], notes, qty: prev[planId]?.qty || "" },
        }));
    };

    const calculateDeviation = (planId: number, recommended: number): number | null => {
        const data = realizationData[planId];
        if (!data?.qty) return null;
        return Number(data.qty) - recommended;
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
                    <h1 className="text-2xl font-bold tracking-tight">Input Realisasi Produksi</h1>
                    <p className="text-muted-foreground">
                        Masukkan jumlah aktual produksi hari ini
                    </p>
                </div>
                <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Simpan Semua
                </Button>
            </div>

            {/* Branch Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Pilih Cabang</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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

            {/* Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Produk Menunggu Input</CardTitle>
                    <CardDescription>
                        Masukkan jumlah produksi aktual dan catatan (opsional)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {plans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                            <h3 className="text-lg font-semibold">Semua Sudah Diinput!</h3>
                            <p className="text-muted-foreground">
                                Tidak ada produk yang menunggu input realisasi untuk cabang ini
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-right">Rekomendasi</TableHead>
                                    <TableHead className="w-[150px]">Jumlah Aktual</TableHead>
                                    <TableHead className="text-center">Deviasi</TableHead>
                                    <TableHead className="w-[250px]">Catatan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => {
                                    const deviation = calculateDeviation(plan.id, plan.finalRecommendation);
                                    return (
                                        <TableRow key={plan.id}>
                                            <TableCell className="font-medium">{plan.productName}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {plan.finalRecommendation}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={realizationData[plan.id]?.qty || ""}
                                                    onChange={(e) => handleQtyChange(plan.id, e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {deviation !== null && (
                                                    <Badge variant={deviation >= 0 ? "default" : "secondary"}>
                                                        {deviation >= 0 ? "+" : ""}{deviation}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Textarea
                                                    placeholder="Catatan (opsional)"
                                                    rows={1}
                                                    className="min-h-[38px] resize-none"
                                                    value={realizationData[plan.id]?.notes || ""}
                                                    onChange={(e) => handleNotesChange(plan.id, e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Recently Completed */}
            <Card>
                <CardHeader>
                    <CardTitle>Baru Saja Diinput</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Rekomendasi</TableHead>
                                <TableHead className="text-right">Aktual</TableHead>
                                <TableHead className="text-center">Deviasi</TableHead>
                                <TableHead>Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productionPlansWithRealization
                                .filter((p) => p.branchId === Number(selectedBranch) && p.realization)
                                .map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.productName}</TableCell>
                                        <TableCell className="text-right">{plan.finalRecommendation}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {plan.realization?.actualQty}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    plan.realization!.deviation >= 0 ? "default" : "secondary"
                                                }
                                            >
                                                {plan.realization!.deviation >= 0 ? "+" : ""}
                                                {plan.realization!.deviation}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {plan.realization?.notes || "-"}
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
