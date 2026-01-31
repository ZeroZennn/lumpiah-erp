"use client";

import { useCallback, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import {
    TrendingUp,
    Store,
    AlertCircle,
    FileSpreadsheet,
    Loader2
} from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { apiClient } from "@/shared/lib/api-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useOperationalReport } from "@/features/reports/api/use-operational-report";
import { useBranches } from "@/features/branches/api/use-branches";
import { Branch } from "@/features/branches/api/branches.types";

import { formatCurrency } from "@/shared/lib/format";
import { OperationalReportResponse } from "@/features/reports/api/use-operational-report";

// Import new table components
import { ItemBreakdownTable } from "@/features/reports/components/item-breakdown-table";
import { AuditTrailTable } from "@/features/reports/components/audit-trail-table";
import { EodControlTable } from "@/features/reports/components/eod-control-table";
import { ExportOperationalReportDialog } from "@/features/reports/components/export-operational-report-dialog";

// Retain the component logic but renamed
function OperationalReportContent() {
    // URL Sync
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Export State
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Get filters from URL
    const branchId = searchParams.get('branchId') || "all";
    const dateParam = searchParams.get('date');
    const selectedDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();

    const updateParams = useCallback((updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const { data: branches } = useBranches();
    const activeBranches = branches?.filter((b: Branch) => b.isActive) || [];

    const { data: report, isLoading } = useOperationalReport({
        branchId: branchId === "all" ? undefined : branchId,
        date: format(selectedDate, "yyyy-MM-dd"),
    });

    const handleExport = async (exportFilters: { date: Date; branchId?: string }) => {
        try {
            setIsExporting(true);
            const exportDateStr = format(exportFilters.date, "yyyy-MM-dd");

            // Fetch data for the specific export request to ensure accuracy and independence from current view
            const response = await apiClient.get<OperationalReportResponse>("/reports/operational", {
                params: {
                    date: exportDateStr,
                    branchId: exportFilters.branchId
                }
            });

            const exportData = response as unknown as OperationalReportResponse;
            if (!exportData) {
                throw new Error("No data received");
            }

            // Create workbook
            const wb = XLSX.utils.book_new();

            // 1. Summary Sheet
            const summaryData = [
                ["Laporan Operasional", format(exportFilters.date, "PPP")],
                ["Cabang", exportFilters.branchId ? activeBranches.find(b => String(b.id) === exportFilters.branchId)?.name : "Semua Cabang"],
                [],
                ["Metrik", "Nilai"],
                ["Total Omzet Bersih", exportData.summary.netRevenue],
                ["Jumlah Transaksi", exportData.summary.transactionCount],
                ["Rata-rata Keranjang", exportData.summary.avgBasket],
                ["Total Cash (System)", exportData.summary.totalCashSystem],
                ["Total QRIS (System)", exportData.summary.totalQrisSystem]
            ];
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

            // 2. EOD Control Sheet
            const eodData = [
                ["Cabang", "Status", "Waktu Closing", "Selisih Cash", "Selisih QRIS", "Catatan"],
                ...exportData.eodControl.map(item => [
                    item.branchName,
                    item.status,
                    item.closingTime ? format(new Date(item.closingTime), "HH:mm") : "-",
                    item.cashVariance,
                    item.qrisVariance,
                    item.closingNote || "-"
                ])
            ];
            const wsEod = XLSX.utils.aoa_to_sheet(eodData);
            XLSX.utils.book_append_sheet(wb, wsEod, "Tutup Kas");

            // 3. Item Breakdown Sheet
            const itemData = [
                ["Produk", "Kategori", "Qty Terjual", "Total Nilai"],
                ...exportData.itemBreakdown.map(item => [
                    item.productName,
                    item.categoryName,
                    item.qtySold,
                    item.totalValue
                ])
            ];
            const wsItems = XLSX.utils.aoa_to_sheet(itemData);
            XLSX.utils.book_append_sheet(wb, wsItems, "Detail Produk");

            // 4. Audit Trail Sheet
            const auditData = [
                ["ID Transaksi", "Waktu", "Kasir", "Nominal", "Alasan Void"],
                ...exportData.auditTrail.voidTransactions.map(item => [
                    item.transactionId,
                    format(new Date(item.transactionDate), "HH:mm"),
                    item.cashierName,
                    item.totalAmount,
                    item.voidReason || "-"
                ])
            ];
            const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
            XLSX.utils.book_append_sheet(wb, wsAudit, "Audit Void");

            // Save
            XLSX.writeFile(wb, `Laporan-Operasional-${format(exportFilters.date, "yyyy-MM-dd")}.xlsx`);
            toast.success("Laporan berhasil di-export");
            setIsExportDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Gagal meng-export laporan");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header with styled Toolbar-like controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Operasional</h1>
                        <p className="text-muted-foreground">Evaluasi harian dan kontrol kas masuk.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-1">
                    <DatePicker
                        date={selectedDate}
                        onDateChange={(d) => d && updateParams({ date: format(d, 'yyyy-MM-dd') })}
                        className="w-full sm:w-auto bg-white"
                    />

                    <Select value={branchId} onValueChange={(val) => updateParams({ branchId: val })}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9 bg-white">
                            <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Cabang</SelectItem>
                            {activeBranches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExportDialogOpen(true)}
                        disabled={isExporting}
                        className="bg-white ml-auto gap-2 h-9"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                        Export XLSX
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="operational" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="operational">Laporan Operasional</TabsTrigger>
                    <TabsTrigger value="comparison" asChild>
                        <Link href="/reports">Komparasi Cabang</Link>
                    </TabsTrigger>
                    <TabsTrigger value="accuracy" asChild>
                        <Link href="/reports/accuracy">Akurasi Produksi</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className="bg-white shadow-sm border-none">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Omzet Bersih</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoading ? <Skeleton className="h-7 w-24" /> : (
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report?.summary.netRevenue || 0)}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Status PAID (Excl. VOID)</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Jumlah Struk</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoading ? <Skeleton className="h-7 w-24" /> : (
                            <p className="text-xl font-black text-slate-900">{report?.summary.transactionCount} Tx</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Transaksi Terbayar</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg. Basket</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoading ? <Skeleton className="h-7 w-24" /> : (
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report?.summary.avgBasket || 0)}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Nilai Rata-rata/Struk</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none border-l-4 border-l-amber-500">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cash in Hand</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoading ? <Skeleton className="h-7 w-24" /> : (
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report?.summary.totalCashSystem || 0)}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Total Metode CASH</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none border-l-4 border-l-blue-500">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">QRIS Settlement</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {isLoading ? <Skeleton className="h-7 w-24" /> : (
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report?.summary.totalQrisSystem || 0)}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Total Metode QRIS</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tables Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* EOD Control Table */}
                <Card className="bg-white shadow-sm border-none">
                    <CardHeader className="pb-3 border-b border-slate-50">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" /> Status Tutup Kas
                        </CardTitle>
                        <CardDescription>Pemantauan selisih kas per cabang.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <EodControlTable
                            data={report?.eodControl || []}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>

                {/* Audit Trail Table */}
                <Card className="bg-white shadow-sm border-none">
                    <CardHeader className="pb-3 border-b border-slate-50">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" /> Pembatalan & Anomali (Audit)
                        </CardTitle>
                        <CardDescription>Deteksi kecurangan dan alasan pembatalan.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <AuditTrailTable
                            data={report?.auditTrail.voidTransactions || []}
                            totalVoidValue={report?.auditTrail.totalVoidValue || 0}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>

                {/* Item Breakdown Table */}
                <Card className="bg-white shadow-sm border-none lg:col-span-2">
                    <CardHeader className="pb-3 border-b border-slate-50">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" /> Detail Penjualan Produk (Item Breakdown)
                        </CardTitle>
                        <CardDescription>Analisis produk terlaris untuk kontrol stok.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ItemBreakdownTable
                            data={report?.itemBreakdown || []}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Export Dialog */}
            <ExportOperationalReportDialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                onExport={handleExport}
                isExporting={isExporting}
                branches={activeBranches}
                defaultDate={selectedDate}
                defaultBranchId={branchId}
            />
        </div>
    );
}

export default function OperationalReport() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OperationalReportContent />
        </Suspense>
    );
}
