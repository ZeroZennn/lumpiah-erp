"use client";

import { useState } from "react";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { branches } from "@/features/branches/data/branches.dummy";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

// Dummy comparison data
const comparisonData = [
    { date: "23 Jan", branchA: 2100000, branchB: 1500000 },
    { date: "24 Jan", branchA: 2800000, branchB: 1800000 },
    { date: "25 Jan", branchA: 2400000, branchB: 1650000 },
    { date: "26 Jan", branchA: 3200000, branchB: 2100000 },
    { date: "27 Jan", branchA: 2900000, branchB: 1900000 },
    { date: "28 Jan", branchA: 2750000, branchB: 1750000 },
    { date: "29 Jan", branchA: 2750000, branchB: 1450000 },
];

function formatCurrency(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} Jt`;
    }
    return `${(value / 1000).toFixed(0)} Rb`;
}

export default function ReportsPage() {
    const [branchA, setBranchA] = useState<string>("1");
    const [branchB, setBranchB] = useState<string>("2");

    const activeBranches = branches.filter((b) => b.isActive);
    const branchAName = activeBranches.find((b) => b.id === Number(branchA))?.name || "";
    const branchBName = activeBranches.find((b) => b.id === Number(branchB))?.name || "";

    // Calculate totals
    const totalA = comparisonData.reduce((sum, d) => sum + d.branchA, 0);
    const totalB = comparisonData.reduce((sum, d) => sum + d.branchB, 0);
    const difference = totalA - totalB;
    const percentageDiff = ((difference / totalB) * 100).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
                    <p className="text-muted-foreground">
                        Analisis dan perbandingan data
                    </p>
                </div>
            </div>

            <Tabs defaultValue="comparison" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="comparison">Komparasi Cabang</TabsTrigger>
                    <TabsTrigger value="accuracy">
                        <Link href="/reports/accuracy">Akurasi Produksi</Link>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-4">
                    {/* Branch Selectors */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileBarChart className="h-5 w-5" />
                                Pilih Cabang Untuk Dibandingkan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Cabang A</p>
                                    <Select value={branchA} onValueChange={setBranchA}>
                                        <SelectTrigger className="w-[200px]">
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
                                </div>
                                <div className="flex items-end pb-2 text-muted-foreground">vs</div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Cabang B</p>
                                    <Select value={branchB} onValueChange={setBranchB}>
                                        <SelectTrigger className="w-[200px]">
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
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">{branchAName}</p>
                                <div className="text-2xl font-bold text-primary">
                                    Rp {formatCurrency(totalA)}
                                </div>
                                <p className="text-xs text-muted-foreground">Total 7 hari</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">{branchBName}</p>
                                <div className="text-2xl font-bold text-blue-600">
                                    Rp {formatCurrency(totalB)}
                                </div>
                                <p className="text-xs text-muted-foreground">Total 7 hari</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Selisih</p>
                                <div className={`text-2xl font-bold ${difference >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {difference >= 0 ? "+" : ""}Rp {formatCurrency(Math.abs(difference))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {branchAName} {Number(percentageDiff) >= 0 ? "+" : ""}{percentageDiff}% vs {branchBName}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Comparison Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Perbandingan Pendapatan Harian</CardTitle>
                            <CardDescription>7 hari terakhir</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                            tickFormatter={(value) => formatCurrency(value)}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value) => [`Rp ${formatCurrency(value as number)}`, ""]}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="branchA"
                                            name={branchAName}
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="branchB"
                                            name={branchBName}
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
