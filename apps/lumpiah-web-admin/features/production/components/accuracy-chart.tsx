'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { AccuracyReportItem } from '../api/use-production';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

interface AccuracyChartProps {
    data: AccuracyReportItem[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Evaluasi Akurasi (Grafik)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="productName" />
                            <YAxis />
                            <RechartsTooltip content={(props: any) => <CustomTooltip {...props} />} />
                            <Legend />
                            <Bar dataKey="target" name="Target (DSS)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="production" name="Produksi" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="sold" name="Terjual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Evaluasi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Target</TableHead>
                                <TableHead className="text-right">Produksi</TableHead>
                                <TableHead className="text-right">Terjual</TableHead>
                                <TableHead className="text-center">Deviasi</TableHead>
                                <TableHead>Insight</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item: AccuracyReportItem, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right font-mono">{item.target}</TableCell>
                                    <TableCell className="text-right font-mono">{item.production}</TableCell>
                                    <TableCell className="text-right font-mono">{item.sold}</TableCell>
                                    <TableCell className="text-center">
                                        <div className={`font-mono font-bold ${item.deviation === 0 ? 'text-slate-400' : item.deviation > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            {item.deviation > 0 ? '+' : ''}{item.deviation}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={cn(
                                            "border-none shadow-none font-bold text-[10px] uppercase px-2",
                                            (item as AccuracyReportItem).insight === 'Balanced' ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                                                (item as AccuracyReportItem).insight.includes('Waste') ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                                    "bg-rose-100 text-rose-800 hover:bg-rose-100"
                                        )}>
                                            {item.insight === 'Balanced' ? 'Sesuai' :
                                                item.insight === 'Potential Waste' ? 'Kelebihan' :
                                                    'Stok Kurang'}
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

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg space-y-3">
                <p className="font-bold text-slate-900 border-b pb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
                                <span className="text-xs text-slate-600">{entry.name}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-800">{entry.value} unit</span>
                        </div>
                    ))}
                </div>
                <div className="pt-2 border-t mt-2">
                    <p className="text-[10px] text-muted-foreground italic">
                        * Data per tanggal yang dipilih (Harian)
                    </p>
                </div>
            </div>
        );
    }
    return null;
}
