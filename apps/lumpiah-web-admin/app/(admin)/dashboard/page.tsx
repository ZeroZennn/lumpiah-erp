"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {

    revenueData,
    branchStatuses,
    statCards,
    formatCurrency,
    monthlyComparison,
} from "@/features/dashboard/data/dashboard.dummy";
import { Badge } from "@/shared/components/ui/badge";

// Mini sparkline chart component
function MiniChart({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) {
    const chartData = data.map((value, index) => ({ value, index }));

    return (
        <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill="url(#miniGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Stat card component
function StatCard({ title, value, change, changeLabel, chartData }: {
    title: string;
    value: string;
    change: number;
    changeLabel: string;
    chartData: number[];
}) {
    const isPositive = change >= 0;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <div className="flex items-center gap-1 text-xs">
                            {isPositive ? (
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                                {isPositive ? "+" : ""}{change}%
                            </span>
                            <span className="text-muted-foreground">{changeLabel}</span>
                        </div>
                    </div>
                    <MiniChart
                        data={chartData}
                        color={isPositive ? "#10b981" : "#ef4444"}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// Main revenue chart
function RevenueChart() {
    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Tren Pendapatan</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Pendapatan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Transaksi</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="transactionsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value, name) => [
                                    name === 'revenue' ? formatCurrency(value as number) : value,
                                    name === 'revenue' ? 'Pendapatan' : 'Transaksi'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#revenueGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Branch status list
function BranchStatusList() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Status Cabang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {branchStatuses.map((branch) => (
                    <div
                        key={branch.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <div>
                                <p className="font-medium text-sm">{branch.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {branch.todayTransactions} transaksi
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(branch.todayRevenue)}</p>
                            <Badge variant={branch.isActive ? "default" : "secondary"} className="text-[10px]">
                                {branch.isActive ? "Buka" : "Tutup"}
                            </Badge>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// Growth comparison card
function GrowthCard() {
    const { currentMonth, lastMonth, growthPercentage } = monthlyComparison;
    const isPositive = growthPercentage >= 0;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Pertumbuhan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center">
                    <div className="relative h-32 w-32">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="3"
                                strokeDasharray={`${Math.min(growthPercentage, 100)}, 100`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <span className={`text-2xl font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{growthPercentage}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{currentMonth.label}</span>
                        <span className="font-medium">{formatCurrency(currentMonth.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{lastMonth.label}</span>
                        <span className="font-medium">{formatCurrency(lastMonth.revenue)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Selamat datang kembali!</h1>
                    <p className="text-muted-foreground">
                        Data menampilkan periode 29 Jan 2026
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card, index) => (
                    <StatCard key={index} {...card} />
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
                <RevenueChart />
                <BranchStatusList />
            </div>

            {/* Bottom Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
                <GrowthCard />
            </div>
        </div>
    );
}
