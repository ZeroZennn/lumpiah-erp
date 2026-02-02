"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TrendingUp, TrendingDown, Package, Building2, Store, Clock, AlertTriangle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
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
            <Card className="col-span-1 h-[500px] flex flex-col shadow-sm">
                <CardHeader>
                    <Skeleton className="h-5 w-[200px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[120px]" />
                                    <Skeleton className="h-3 w-[80px]" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-[60px] rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 h-[500px] flex flex-col shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Store className="h-4 w-4 text-emerald-600" />
                    Status Operasional (Hari Ini)
                </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[430px]">
                <CardContent className="p-0 pb-12">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                            <Store className="h-12 w-12 opacity-15 mb-2" />
                            <p className="text-sm font-medium">Tidak ada data operasional.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {data.map((branch) => (
                                <div key={branch.branchId} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2.5 rounded-xl shadow-sm border",
                                            branch.isClosed
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                : "bg-slate-50 border-slate-100 text-slate-600"
                                        )}>
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-slate-900 leading-none">{branch.branchName}</p>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {branch.hasFraudAlert && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 h-4.5 bg-red-50 text-red-700 border-red-100 hover:bg-red-100 flex items-center gap-0.5 font-bold">
                                                        <AlertTriangle className="h-2.5 w-2.5" /> Void {branch.voidRate}%
                                                    </Badge>
                                                )}
                                                {!branch.isClosed && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium italic">
                                                        <Clock className="h-2.5 w-2.5" /> Menunggu closing...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge variant={branch.isClosed ? "default" : "secondary"}
                                            className={cn(
                                                "text-[10px] px-2 h-5 font-bold tracking-wider uppercase",
                                                branch.isClosed
                                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            )}>
                                            {branch.isClosed ? "CLOSED" : "OPEN"}
                                        </Badge>
                                        {branch.isClosed && branch.closingTime && (
                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" />
                                                {format(new Date(branch.closingTime), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}

// Production Status Widget
function ProductionStatusWidget({ data, isLoading }: { data: ProductionSummary[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card className="col-span-1 h-[500px] flex flex-col shadow-lg border-none">
                <CardHeader className="pb-4">
                    <Skeleton className="h-6 w-[180px]" />
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-11 w-11 rounded-xl" />
                            <div className="space-y-3 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const getProgress = (item: ProductionSummary) =>
        item.recommendedQty > 0 ? (item.actualQty / item.recommendedQty * 100) : (item.actualQty > 0 ? 100 : 0);

    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.branchName]) acc[item.branchName] = [];
        acc[item.branchName].push(item);
        return acc;
    }, {} as Record<string, ProductionSummary[]>);

    const branchNames = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));

    branchNames.forEach(branch => {
        groupedData[branch].sort((a, b) => {
            const diff = getProgress(b) - getProgress(a);
            if (diff !== 0) return diff;
            return a.productName.localeCompare(b.productName);
        });
    });

    const allItemsSorted = [...data].sort((a, b) => {
        const diff = getProgress(b) - getProgress(a);
        if (diff !== 0) return diff;
        return a.productName.localeCompare(b.productName);
    });

    return (
        <Card className="col-span-1 h-[500px] flex flex-col shadow-sm border-slate-200/60 overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-primary" />
                    <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                        Status Produksi
                    </CardTitle>
                </div>
                <div className="bg-slate-50 text-[10px] font-bold text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider border border-slate-100">
                    Hari Ini
                </div>
            </CardHeader>

            <div className="flex-1 flex flex-col min-h-0">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 bg-slate-50/30">
                        <div className="p-4 rounded-full bg-white shadow-sm mb-4">
                            <Package className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Belum ada aktivitas produksi</p>
                    </div>
                ) : (
                    <Tabs defaultValue="all" className="flex-1 flex flex-col">
                        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                            <TabsList className="bg-white/80 p-1 h-9 rounded-lg border border-slate-200/50 w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap">
                                <TabsTrigger value="all" className="flex-1 text-[11px] font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 rounded-md">
                                    SEMUA
                                </TabsTrigger>
                                {branchNames.map(branch => (
                                    <TabsTrigger
                                        key={branch}
                                        value={branch}
                                        className="flex-1 text-[11px] font-bold px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 rounded-md whitespace-nowrap"
                                    >
                                        {branch}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="all" className="flex-1 m-0 outline-none">
                            <ScrollArea className="h-[370px]">
                                <CardContent className="p-0 divide-y divide-slate-100 pb-12">
                                    {allItemsSorted.map((item) => {
                                        const progress = getProgress(item);
                                        const isCompleted = item.status === 'Completed';
                                        return (
                                            <div key={`all-${item.planId}`} className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all duration-200">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={cn(
                                                        "h-11 w-11 rounded-xl shadow-sm border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                                        isCompleted
                                                            ? "bg-emerald-50 border-emerald-100 text-emerald-500"
                                                            : "bg-amber-50 border-amber-100 text-amber-500"
                                                    )}>
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1 min-w-0 overflow-hidden">
                                                        <p className="text-[13px] font-bold text-slate-800 truncate leading-none">{item.productName}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                                                <Building2 className="h-2.5 w-2.5" /> {item.branchName}
                                                            </span>
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                                isCompleted ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                                            )}>
                                                                {item.status === 'In Progress' ? 'Proses' : isCompleted ? 'Selesai' : item.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 w-32 ml-4 shrink-0">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
                                                        <span className="text-[10px] text-slate-400 font-bold tracking-tight">{item.actualQty}/{item.recommendedQty}</span>
                                                    </div>

                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-px">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(0,0,0,0.05)]",
                                                                isCompleted ? "bg-emerald-500" : "bg-primary"
                                                            )}
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </ScrollArea>
                        </TabsContent>

                        {Object.entries(groupedData).map(([branchName, items]) => (
                            <TabsContent key={branchName} value={branchName} className="flex-1 m-0 outline-none">
                                <ScrollArea className="h-[370px]">
                                    <CardContent className="p-0 divide-y divide-slate-100 pb-12">
                                        {items.map((item) => {
                                            const progress = getProgress(item);
                                            const isCompleted = item.status === 'Completed';
                                            return (
                                                <div key={item.planId} className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all duration-200">
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "h-11 w-11 rounded-xl shadow-sm border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                                            isCompleted
                                                                ? "bg-emerald-50 border-emerald-100 text-emerald-500"
                                                                : "bg-amber-50 border-amber-100 text-amber-500"
                                                        )}>
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1 min-w-0 overflow-hidden">
                                                            <p className="text-[13px] font-bold text-slate-800 truncate leading-none">{item.productName}</p>
                                                            <span className={cn(
                                                                "inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1",
                                                                isCompleted ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                                            )}>
                                                                {item.status === 'In Progress' ? 'Proses' : isCompleted ? 'Selesai' : item.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 w-32 ml-4 shrink-0">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
                                                            <span className="text-[10px] text-slate-400 font-bold tracking-tight">{item.actualQty}/{item.recommendedQty}</span>
                                                        </div>

                                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-px">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(0,0,0,0.05)]",
                                                                    isCompleted ? "bg-emerald-500" : "bg-primary"
                                                                )}
                                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>
        </Card>
    );
}

function DashboardContent() {
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

function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-10 w-[400px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-[120px] w-full" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-[300px] col-span-2" />
                <Skeleton className="h-[300px]" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </Suspense>
    );
}
