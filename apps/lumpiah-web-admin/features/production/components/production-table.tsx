'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { useSubmitRealization, ProductionPlan } from '../api/use-production';
import { useDssConfig } from '../api/use-dss';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Info, Save, CheckCircle, Loader2, Sparkles, Settings, FileWarning } from 'lucide-react';
import { DataTable } from '@/shared/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/shared/components/ui/select';
import { Search, X } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';


interface ProductionTableProps {
    plans: ProductionPlan[];
    isLoading: boolean;
    date: Date;
    onInitialize: () => void;
    branchId: number;
}

export function ProductionTable({ plans, isLoading, date, onInitialize, branchId }: ProductionTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { mutate: submitRealization, isPending } = useSubmitRealization();
    const [localPlans, setLocalPlans] = useState<ProductionPlan[]>(plans);
    const [prevPlans, setPrevPlans] = useState<ProductionPlan[]>(plans);

    if (plans !== prevPlans) {
        setLocalPlans(plans);
        setPrevPlans(plans);
    }

    const [savingId, setSavingId] = useState<number | null>(null);

    const { data: dssConfig, isLoading: dssLoading } = useDssConfig(branchId);

    // Helper to render structured DSS log for better hierarchy
    const renderDssTooltipContent = (log: string, recommendedQty: number) => {
        const isEmpty = !log || log === 'No data' || log.includes('Belum ada data');

        if (isEmpty) {
            return (
                <div className="bg-secondary/20 rounded-lg p-5 border border-dashed border-border flex flex-col items-center justify-center min-h-[100px] text-center">
                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                        Belum ada data penjualan yang cukup untuk perhitungan DSS otomatis.
                    </p>
                </div>
            );
        }

        // Data for rendering
        let d1 = "0", d2 = "0", d3 = "0", avg = "0", bufferPercent = "0", bufferAmt = "0";
         
        let isParsed = false;

        // Highly Robust Sequential Parsing
        const nums = log.match(/\d+(\.\d+)?/g) || [];

        // Pattern 1: [d1]x[w1] + [d2]x[w2] + [d3]x[w3] = [avg] ... [percent]%([amt])
        if (nums.length >= 7) {
            d1 = nums[0] ?? "0";
            d2 = nums[2] ?? "0";
            d3 = nums[4] ?? "0";
            avg = nums[6] ?? "0";
            isParsed = true;

            // Extra checks for buffer/safety stock in the latter part of the string
            const safetyPart = log.slice(log.lastIndexOf('='));
            const safetyNums = safetyPart.match(/\d+(\.\d+)?/g) || [];
            if (safetyNums.length >= 2) {
                // Usually [avg, percent, amt]
                bufferPercent = safetyNums[safetyNums.length - 2] ?? "0";
                bufferAmt = safetyNums[safetyNums.length - 1] ?? "0";
            } else {
                // Fallback to legacy safety stock regex
                const safetyMatch = log.match(/(\d+)\s*%\D*(\d+)/);
                if (safetyMatch) {
                    [, bufferPercent, bufferAmt] = safetyMatch;
                }
            }
        } else if (nums.length >= 4) {
            // Human-friendly fallback: [d1], [d2], [d3] ... [avg]
            d1 = nums[0] ?? "0";
            d2 = nums[1] ?? "0";
            d3 = nums[2] ?? "0";
            avg = nums[3] ?? "0";
            isParsed = true;
            const safetyMatch = log.match(/(\d+)\s*%\D*(\d+)/);
            if (safetyMatch) {
                [, bufferPercent, bufferAmt] = safetyMatch;
            }
        }


        return (
            <div className="space-y-4 py-1">
                <section>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-primary rounded-full" />
                        Riwayat Penjualan (Harian)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Kemarin', val: d1 },
                            { label: '2 Hr Lalu', val: d2 },
                            { label: '3 Hr Lalu', val: d3 }
                        ].map((item, i) => (
                            <div key={i} className="bg-secondary/50 border border-border rounded-lg p-2 flex flex-col items-center">
                                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{item.label}</span>
                                <span className="text-sm font-bold text-foreground">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-accent/30 rounded-lg p-3 border border-accent/50">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-primary rounded-full" />
                        Kalkulasi Target
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>Rata-rata:</span>
                            <span className="font-bold text-foreground">{avg} unit</span>
                        </div>
                        <div className="flex justify-between items-center text-primary-foreground/80">
                            <span>Stok Aman ({bufferPercent}%):</span>
                            <span className="font-bold">+{bufferAmt} unit</span>
                        </div>
                        <div className="pt-2 border-t border-accent/50 flex justify-between items-center text-primary-foreground mt-1">
                            <span className="font-bold uppercase text-[10px]">Total Target:</span>
                            <span className="text-lg font-black">{recommendedQty} <span className="text-[10px] font-normal uppercase">unit</span></span>
                        </div>
                    </div>
                </section>

                <p className="text-[10px] text-slate-400 italic leading-tight">
                    *Target dihitung otomatis untuk menjaga stok agar tidak habis.
                </p>
            </div>
        );
    };

    // --- Filter State (Synced with URL) ---
    const searchQuery = searchParams.get('q') || '';
    const selectedStatus = searchParams.get('status') || 'all';
    const selectedCategory = searchParams.get('category') || 'all';

    // Helper to update URL params
    const updateFilterParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    // Extract unique categories from actual data
    const categories = useMemo(() => {
        const cats = Array.from(new Set(localPlans.map(p => p.categoryName).filter(Boolean)));
        return cats.sort();
    }, [localPlans]);

    // Filtered Data
    const filteredPlans = useMemo(() => {
        return localPlans.filter(plan => {
            const matchesSearch = plan.productName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || plan.status === selectedStatus;
            const matchesCategory = selectedCategory === 'all' || plan.categoryName === selectedCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [localPlans, searchQuery, selectedStatus, selectedCategory]);

    const handleQtyChange = useCallback((planId: number, val: string) => {
        // Allow empty string for better typing experience, default to 0 for calculation
        const parsed = parseInt(val);
        const newQty = isNaN(parsed) ? 0 : parsed;

        setLocalPlans(prev => prev.map(p => {
            if (p.planId === planId) {
                return {
                    ...p,
                    actualQty: newQty, // Keep the value as number in state, but input might need handling
                    deviation: newQty - p.recommendedQty
                };
            }
            return p;
        }));
    }, []);

    const handleNoteChange = useCallback((planId: number, val: string) => {
        setLocalPlans(prev => prev.map(p => {
            if (p.planId === planId) {
                return { ...p, notes: val };
            }
            return p;
        }));
    }, []);

    const handleSave = useCallback((plan: ProductionPlan, isFinal: boolean) => {
        const status = isFinal ? 'COMPLETED' : 'IN_PROGRESS';
        if (isFinal) {
            if (!confirm('Apakah Anda yakin ingin menyelesaikan produksi ini? Data tidak dapat diubah setelah ini.')) return;
        }

        setSavingId(plan.planId); // Start loading

        submitRealization({
            planId: plan.planId,
            actualQty: plan.actualQty,
            notes: plan.notes,
            status
        }, {
            onSuccess: () => {
                toast.success(isFinal ? 'Produksi difinalisasi' : 'Draft disimpan');
                setSavingId(null); // Stop loading
                // Server refetch will trigger useEffect to sync state
            },
            onError: (err) => {
                toast.error('Gagal menyimpan: ' + (err as any).message);
                setSavingId(null); // Stop loading
            }
        });
    }, [submitRealization]);

    // --- Columns Definition ---
    const columns = useMemo<ColumnDef<ProductionPlan>[]>(() => [
        {
            accessorKey: "productName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Produk" />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <div className="font-medium text-slate-900 min-w-[200px]">{row.original.productName}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.original.categoryName}</div>
                </div>
            ),
        },
        {
            accessorKey: "recommendedQty",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Target (DSS)" className="justify-end" />,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex items-center justify-end gap-2 group/tooltip">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="w-[280px] p-4 bg-white border-slate-200 shadow-xl rounded-xl">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <div className="p-1.5 bg-primary/20 rounded-lg">
                                                <Info className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="font-bold text-sm text-foreground">Analisis Target DSS</p>
                                        </div>
                                        {renderDssTooltipContent(plan.calculationLog, plan.recommendedQty)}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="font-mono font-medium text-slate-700">{plan.recommendedQty}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "actualQty",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Realisasi" className="justify-end" />,
            cell: ({ row }) => {
                const plan = row.original;
                const original = plans?.find(p => p.planId === plan.planId);
                const isDirtyQty = original ? original.actualQty !== plan.actualQty : false;

                return (
                    <div className="flex justify-end pr-2">
                        <div className="relative w-24">
                            <Input
                                type="number"
                                value={plan.actualQty.toString()}
                                onChange={(e) => handleQtyChange(plan.planId, e.target.value)}
                                disabled={plan.status === 'COMPLETED' || savingId === plan.planId}
                                className={`
                                    h-8 font-mono text-sm transition-all text-right
                                    ${isDirtyQty
                                        ? 'border-amber-400 bg-amber-50 focus-visible:ring-amber-200'
                                        : 'border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-blue-500 shadow-none'
                                    }
                                `}
                            />
                            {isDirtyQty && (
                                <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-500 -mt-0.5 -mr-0.5" />
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "deviation",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Deviasi" className="justify-center" />,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex justify-center">
                        <div className={`
                            text-xs font-mono font-medium px-2 py-0.5 rounded
                            ${plan.deviation === 0
                                ? 'text-slate-500'
                                : plan.deviation > 0
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                            }
                        `}>
                            {plan.deviation > 0 ? '+' : ''}{plan.deviation}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "notes",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Catatan" />,
            cell: ({ row }) => {
                const plan = row.original;
                const original = plans?.find(p => p.planId === plan.planId);
                const isDirtyNote = original ? original.notes !== plan.notes : false;

                return (
                    <Input
                        value={plan.notes || ''}
                        onChange={(e) => handleNoteChange(plan.planId, e.target.value)}
                        disabled={plan.status === 'COMPLETED' || savingId === plan.planId}
                        placeholder={plan.status === 'COMPLETED' ? '' : 'Tambah catatan...'}
                        className={`
                            h-8 text-sm transition-all min-w-[150px]
                            ${isDirtyNote
                                ? 'border-amber-400 bg-amber-50 focus-visible:ring-amber-200'
                                : 'border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-blue-500 shadow-none'
                            }
                        `}
                    />
                );
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center" />,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex justify-center">
                        <Badge
                            variant={plan.status === 'COMPLETED' ? 'default' : 'secondary'}
                            className="h-5 text-[10px] uppercase font-bold"
                        >
                            {plan.status === 'COMPLETED' ? 'Final' :
                                plan.status === 'IN_PROGRESS' ? 'Draft' : 'Pending'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Aksi" className="justify-end" />,
            cell: ({ row }) => {
                const plan = row.original;
                const original = plans?.find(p => p.planId === plan.planId);
                const isDirty = (original && (original.actualQty !== plan.actualQty || original.notes !== plan.notes)) || false;

                if (plan.status === 'COMPLETED') {
                    return (
                        <div className="flex justify-end pr-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-1 pr-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSave(plan, false)}
                            disabled={savingId === plan.planId}
                            className={`h-8 w-8 ${isDirty ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400'}`}
                            title="Simpan Draft"
                        >
                            {savingId === plan.planId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleSave(plan, true)}
                            disabled={savingId === plan.planId}
                            title="Finalisasi"
                        >
                            {savingId === plan.planId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                    </div>
                );
            },
        },
    ], [handleQtyChange, handleNoteChange, handleSave, savingId, plans]);

    // Extract Snapshot info for the current view
    const dssSnapshot = useMemo(() => {
        if (!filteredPlans.length) return null;

        // Find first plan with a log
        const firstWithLog = filteredPlans.find(p => p.calculationLog && p.calculationLog !== 'No data' && p.calculationLog !== 'Belum ada data');
        if (!firstWithLog) return null;

        const log = firstWithLog.calculationLog;
        const nums = log.match(/\d+(\.\d+)?/g) || [];

        // Sequential check (w1 is usually the 2nd number)
        if (nums.length >= 7) {
            return {
                w1: nums[1] ?? "0",
                w2: nums[3] ?? "0",
                w3: nums[5] ?? "0",
                buffer: (log.match(/(\d+)\s*%/)?.[1]) ?? "0",
                createdAt: firstWithLog.createdAt
            };
        }
        return null;
    }, [filteredPlans]);

    const toolbarActions = (
        <div className="flex flex-col gap-4 w-full">
            {dssSnapshot && (
                <div className="flex items-center  justify-between px-5 py-2.5 bg-secondary rounded-xl text-sm backdrop-blur">
                    <div className="flex items-center gap-8">
                        {/* Title Section */}
                        <div className="flex items-center gap-3 pr-6 border-r border-border">
                            <div className="p-1.5 bg-primary rounded-lg shadow-sm">
                                <Info className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-foreground uppercase tracking-tight leading-none">DSS Logic Snapshot</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase mt-0.5">Historical Calculation Model</span>
                            </div>
                        </div>

                        {/* Parameters Section */}
                        <div className="flex items-center gap-10">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs leading-none">WMA Factors</span>
                                <div className="flex gap-2.5">
                                    {[dssSnapshot.w1, dssSnapshot.w2, dssSnapshot.w3].map((w, i) => (
                                        <div key={i} className="flex flex-col items-center min-w-[32px] bg-background border py-1 rounded shadow-xs relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-primary/20" />
                                            <span className="font-mono font-black text-foreground text-sm leading-none">{w}</span>
                                            <span className="text-xs text-muted-foreground font-bold uppercase mt-1">H-{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs leading-none">Safety Buffer</span>
                                <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded shadow-xs flex items-center gap-1">
                                    <span className="font-black font-mono text-base leading-none">{dssSnapshot.buffer}</span>
                                    <span className="text-sm font-bold opacity-60">%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs leading-none">Created At</span>
                                <div className="text-foreground font-bold flex items-center gap-1.5 pr-1">
                                    <span className="text-sm">{format(new Date(dssSnapshot.createdAt), 'dd MMM yyyy')}</span>
                                    <span className="text-xs text-muted-foreground/80 font-medium">{format(new Date(dssSnapshot.createdAt), 'HH:mm')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-[180px] text-right">
                        <p className="text-muted-foreground italic leading-tight text-xs">
                            *This snapshot represents the logic active when this production plan was first initialized.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => updateFilterParams({ q: e.target.value })}
                        className="pl-9 h-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateFilterParams({ q: '' })}
                            className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Select value={selectedStatus} onValueChange={(val) => updateFilterParams({ status: val })}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">Draft</SelectItem>
                        <SelectItem value="COMPLETED">Final</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={(val) => updateFilterParams({ category: val })}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const isFutureDate = isAfter(startOfDay(date), startOfDay(new Date()));

    if (!isLoading && plans.length === 0 && isFutureDate) {
        return (
            <div className="mt-6">
                <Card className="max-w-2xl mx-auto bg-transparent  border-dashed shadow-none">
                    <CardHeader className="text-center">

                        <CardTitle>Buat Rencana Produksi</CardTitle>
                        <CardDescription>
                            Rencana produksi untuk tanggal ini belum dibuat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center px-6 pb-6">
                        {dssLoading ? (
                            <div className="flex justify-center items-center h-24">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : dssConfig ? (
                            <div className="space-y-4 mb-6">
                                <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-bold text-sm">Konfigurasi DSS Saat Ini</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-500">WMA:</span>
                                            <span className="font-mono font-bold text-slate-700">
                                                {dssConfig.wmaWeights.join('-')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-500">Buffer:</span>
                                            <span className="font-mono font-bold text-blue-700">
                                                {dssConfig.safetyStockPercent}%
                                            </span>
                                        </div>
                                        <Button variant="outline" size="xs" asChild>
                                            <Link href="/production/config">
                                                Ubah
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-sm text-muted-foreground p-8 flex flex-col items-center gap-3">
                                <FileWarning className="h-7 w-7 text-amber-500" />
                                Gagal memuat konfigurasi DSS. Pastikan konfigurasi sudah diatur.
                            </div>
                        )}
                        <Button onClick={onInitialize} disabled={isLoading} size="lg" className="w-full">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Mulai Rencana Produksi
                        </Button>
                        <p className="text-xs text-muted-foreground italic px-4 mt-4">
                            Sistem akan membuat target kuantitas untuk semua produk aktif berdasarkan konfigurasi DSS.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <DataTable
            columns={columns}
            data={filteredPlans}
            isLoading={isLoading}
            toolbarActions={toolbarActions}
        />
    );
}
