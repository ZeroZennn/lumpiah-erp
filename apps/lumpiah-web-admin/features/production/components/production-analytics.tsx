"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ProductionPlanWithRealization } from "../api/production.types"
import { formatCurrency } from "@/features/products/data/products.dummy"

interface ProductionAnalyticsProps {
    plans: ProductionPlanWithRealization[]
}

export function ProductionAnalytics({ plans }: ProductionAnalyticsProps) {
    // Calculate stats
    const totalPlanned = plans.reduce((acc, curr) => acc + curr.finalRecommendation, 0)
    const totalRealized = plans.reduce((acc, curr) => acc + (curr.realization?.actualQty || 0), 0)
    const realizationRate = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0

    // Mock daily trend data (since we only have today's dummy data)
    const dailyData = [
        { date: "Senin", planned: 450, realized: 440 },
        { date: "Selasa", planned: 380, realized: 390 },
        { date: "Rabu", planned: 520, realized: 510 },
        { date: "Kamis", planned: 480, realized: 465 },
        { date: "Jumat", planned: 600, realized: 580 },
        { date: "Sabtu", planned: 750, realized: 740 },
        { date: "Minggu", planned: 800, realized: 790 },
    ]

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rencana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPlanned.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unit produk dijadwalkan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Realisasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRealized.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unit produk diproduksi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Akurasi Produksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            realizationRate >= 95 ? "text-emerald-500" : "text-amber-500"
                        )}>
                            {realizationRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Dari target perencanaan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimasi Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRealized * 15000)}</div>
                        <p className="text-xs text-muted-foreground">Asumsi rata-rata harga</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Tren Produksi Harian</CardTitle>
                        <CardDescription>
                            Perbandingan rencana vs realisasi 7 hari terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Bar dataKey="planned" name="Rencana" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realized" name="Realisasi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Performa Cabang</CardTitle>
                        <CardDescription>
                            Tingkat keberhasilan produksi per hari
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs" />
                                <YAxis className="text-xs" domain={[0, 1000]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="realized" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Helper for cn (needed since it's used in the component)
import { cn } from "@/shared/lib/utils"
