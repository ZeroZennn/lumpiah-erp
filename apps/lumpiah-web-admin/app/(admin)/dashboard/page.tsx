"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
    useDashboardStats,
    useRevenueTrend,
    useBranchPerformance,
    useOperationalStatus,
    useProductionSummary
} from "@/features/dashboard/api/use-reports";
import { DashboardFilter, RevenueTrend, BranchPerformance, OperationalStatus, ProductionSummary } from "@/features/dashboard/api/reports.types";
import { Branch } from "@/features/branches/api/branches.types";
import { useBranches } from "@/features/branches/api/use-branches";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCurrency } from "@/shared/lib/format";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

// Helper function for compact display (e.g. charts)
function formatCompactCurrency(value: number): string {
    if (value >= 1000000000) {
        return `Rp ${(value / 1000000000).toFixed(1)} M`;
    }
    if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(1)} Jt`;
    }
    if (value >= 1000) {
        return `Rp ${(value / 1000).toFixed(0)} Rb`;
    }
    return `Rp ${value}`;
}

// Stat card component
function StatCard({ title, value, change, changeLabel, isLoading }: {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-8 w-[120px]" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full opacity-20" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPositive = (change || 0) >= 0;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {change !== undefined && (
                            <div className="flex items-center gap-1 text-xs">
                                {isPositive ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                                    {isPositive ? "+" : ""}{change.toFixed(1)}%
                                </span>
                                <span className="text-muted-foreground">{changeLabel}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Main revenue chart
function RevenueChart({ data, isLoading }: { data: RevenueTrend[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                    <Skeleton className="h-5 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    const formatYAxis = (value: number) => {
        if (value === 0) return "0";
        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
        return `${value}`;
    };

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Tren Pendapatan & Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} stroke="var(--border)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                className="text-xs"
                                tick={{ fill: 'var(--muted-foreground)' }}
                                tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                className="text-xs"
                                tick={{ fill: 'var(--muted-foreground)' }}
                                tickFormatter={formatYAxis}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')}
                                formatter={(value: number | string | undefined, name: string | undefined) => [
                                    name === 'revenue' && typeof value === 'number'
                                        ? formatCurrency(value)
                                        : value,
                                    name === 'revenue' ? 'Pendapatan' : 'Transaksi'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Branch Comparison Chart (Admin Only)
function BranchPerformanceChart({ data, isLoading }: { data: BranchPerformance[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Komparasi Cabang</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="branchName" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                formatter={(value) => formatCurrency(value as number)}
                            />
                            <Bar dataKey="totalRevenue" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Operational Status Widget
function OperationalStatusWidget({ data, isLoading }: { data: OperationalStatus[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[200px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[80px]" />
                            </div>
                            <Skeleton className="h-6 w-[60px] rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Status Operasional (Hari Ini)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada data operasional.</p> :
                    data.map((branch) => (
                        <div key={branch.branchId} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-sm">{branch.branchName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {branch.hasFraudAlert && (
                                        <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Void Tinggi ({branch.voidRate}%)
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant={branch.isClosed ? "default" : "secondary"} className={branch.isClosed ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                    {branch.isClosed ? "CLOSED" : "OPEN"}
                                </Badge>
                                {branch.closingTime && <span className="text-[10px] text-muted-foreground">{new Date(branch.closingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                            </div>
                        </div>
                    ))}
            </CardContent>
        </Card>
    );
}

// Production Status Widget
function ProductionStatusWidget({ data, isLoading }: { data: ProductionSummary[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[150px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-4 w-[50px]" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Status Produksi (Hari Ini)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {data.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada rencana produksi hari ini.</p> :
                    data.map((item) => (
                        <div key={item.planId} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.branchName} - {item.productName}</span>
                                <span className="text-muted-foreground">{item.status}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${item.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min((item.actualQty / item.recommendedQty) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Target: {item.recommendedQty}</span>
                                <span>Aktual: {item.actualQty}</span>
                            </div>
                        </div>
                    ))}
            </CardContent>
        </Card>
    );
}


export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Initialize state from URL or defaults
    // Initialize state from URL or defaults
    const [selectedBranch, setSelectedBranch] = useState<number | 'all'>(() => {
        const branchParam = searchParams.get('branchId');
        return branchParam ? (branchParam === 'all' ? 'all' : Number(branchParam)) : 'all';
    });

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const startParam = searchParams.get('startDate');
        const endParam = searchParams.get('endDate');
        if (startParam && endParam) {
            return {
                from: new Date(startParam),
                to: new Date(endParam)
            };
        }
        return {
            from: subDays(new Date(), 30),
            to: new Date()
        };
    });

    // Update URL and State
    const updateFilters = (branch: number | 'all', dates: DateRange | undefined) => {
        setSelectedBranch(branch);
        setDateRange(dates);

        const params = new URLSearchParams(searchParams.toString());

        if (branch === 'all') params.delete('branchId');
        else params.set('branchId', branch.toString());

        if (dates?.from) params.set('startDate', dates.from.toISOString());
        else params.delete('startDate');

        if (dates?.to) params.set('endDate', dates.to.toISOString());
        else params.delete('endDate');

        router.replace(`${pathname}?${params.toString()}`);
    };

    const handlePresetChange = (days: number) => {
        const to = new Date();
        const from = subDays(to, days);
        updateFilters(selectedBranch, { from, to });
    };

    // Adjust End Date to cover full day (23:59:59) for API filter
    const apiDateRange = {
        from: dateRange?.from ? startOfDay(dateRange.from) : undefined,
        to: dateRange?.to ? endOfDay(dateRange.to) : undefined
    };

    const filter: DashboardFilter = {
        branchId: selectedBranch,
        startDate: apiDateRange.from,
        endDate: apiDateRange.to
    };

    const { data: stats, isLoading: isLoadingStats } = useDashboardStats(filter);
    const { data: trend, isLoading: isLoadingTrend } = useRevenueTrend(filter);
    const { data: branchPerf, isLoading: isLoadingPerf } = useBranchPerformance(filter);
    const { data: operational, isLoading: isLoadingOps } = useOperationalStatus();
    const { data: production, isLoading: isLoadingProd } = useProductionSummary(selectedBranch);

    const { data: branches } = useBranches();
    const activeBranches = branches?.filter((b: Branch) => b.isActive) || [];

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground">
                        Data periode {format(apiDateRange.from || new Date(), 'dd MMM yyyy')} - {format(apiDateRange.to || new Date(), 'dd MMM yyyy')}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedBranch.toString()}
                            onValueChange={(val) => updateFilters(val === 'all' ? 'all' : Number(val), dateRange)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {activeBranches.map((b: Branch) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DateRangePicker
                            date={dateRange}
                            onDateChange={(range) => updateFilters(selectedBranch, range)}
                            className="w-[240px]"
                        />
                    </div>
                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" onClick={() => handlePresetChange(0)}>Hari Ini</Button>
                        <Button variant="ghost" size="xs" onClick={() => handlePresetChange(7)}>7 Hari</Button>
                        <Button variant="ghost" size="xs" onClick={() => handlePresetChange(30)}>30 Hari</Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Pendapatan"
                    value={stats ? formatCompactCurrency(stats.totalRevenue) : "Rp 0"}
                    change={stats?.growthRate}
                    changeLabel="vs periode sebelumnya"
                    isLoading={isLoadingStats}
                />
                <StatCard
                    title="Jumlah Transaksi"
                    value={stats ? stats.totalTransactions.toString() : "0"}
                    isLoading={isLoadingStats}
                />
                <StatCard
                    title="Rata-rata Keranjang"
                    value={stats ? formatCurrency(stats.avgBasketSize) : "Rp 0"}
                    isLoading={isLoadingStats}
                />
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Proporsi Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoadingStats ? <Skeleton className="h-8 w-full" /> : (
                            <div className="flex items-baseline gap-2">
                                {stats?.paymentMethods.length ? stats.paymentMethods.map(pm => (
                                    <div key={pm.method} className="flex flex-col">
                                        <span className="text-lg font-bold">{((pm.amount / (stats.totalRevenue || 1)) * 100).toFixed(0)}%</span>
                                        <span className="text-xs text-muted-foreground">{pm.method}</span>
                                    </div>
                                )) : <p className="text-sm font-medium text-muted-foreground">Tidak ada data</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
                <RevenueChart data={trend || []} isLoading={isLoadingTrend} />
                {/* Only show Branch Comparison if "All Branches" is selected */}
                {selectedBranch === 'all' && (
                    <div className="lg:col-span-1">
                        <BranchPerformanceChart data={branchPerf || []} isLoading={isLoadingPerf} />
                    </div>
                )}
            </div>

            {/* Operational Panels */}
            <h2 className="text-lg font-bold mt-6">Panel Operasional & Produksi</h2>
            <div className="grid gap-4 lg:grid-cols-2">
                <OperationalStatusWidget data={operational || []} isLoading={isLoadingOps} />
                <ProductionStatusWidget data={production || []} isLoading={isLoadingProd} />
            </div>
        </div>
    );
}
