"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
    ColumnDef,
} from "@tanstack/react-table";
import { Transaction } from "../api/transaction.types";
import { format } from "date-fns";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from '@/shared/components/ui/data-table';
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Badge } from "@/shared/components/ui/badge";
import { Eye, Loader2, Search, X, FileSpreadsheet } from "lucide-react";
import { TransactionDetailDialog } from "./transaction-detail-sheet";
import { toast } from "sonner";
import { useTransactions } from "../api/use-transactions";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/shared/components/ui/select';
import { TransactionSummary } from "./transaction-summary";
import { useBranches } from "@/features/branches/api/use-branches";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useTransactionSummary } from "../api/use-transactions";
import { WifiOff } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { apiClient } from "@/shared/lib/api-client";
import * as XLSX from 'xlsx';
import { ExportTransactionDialog } from "./export-transaction-dialog";

type TransactionTableProps = Record<string, never>;

export function TransactionTable({ }: TransactionTableProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // URL Sync
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get filters from URL
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const branchIdStr = searchParams.get('branchId');
    const branchId = branchIdStr && branchIdStr !== 'all' ? Number(branchIdStr) : undefined;
    const isOfflineSyncedStr = searchParams.get('isOfflineSynced'); // 'true', 'false', or null
    const isOfflineSynced = isOfflineSyncedStr === 'true' ? true : isOfflineSyncedStr === 'false' ? false : undefined;
    const status = searchParams.get('status') || 'all';

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Helper to update URL (Stabilized)
    const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;

        Object.entries(updates).forEach(([key, value]) => {
            const current = params.get(key);
            if (value !== undefined && value !== 'all' && value !== '') {
                if (current !== String(value)) {
                    params.set(key, String(value));
                    hasChanges = true;
                }
            } else {
                if (params.has(key)) {
                    params.delete(key);
                    hasChanges = true;
                }
            }
        });

        // Reset page to 1 on filter change (if page is not explicitly being updated)
        if (!updates.page && params.has('page') && params.get('page') !== '1') {
            params.set('page', '1');
            hasChanges = true;
        }

        if (hasChanges) {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    // Search Debounce Implementation
    const urlSearchQuery = searchParams.get('q') || '';
    const [searchValue, setSearchValue] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchValue, 500);

    // Sync input with URL when URL changes externally
    useEffect(() => {
        setSearchValue(urlSearchQuery);
    }, [urlSearchQuery]);

    // Sync URL with debounced value
    useEffect(() => {
        if (debouncedSearch !== urlSearchQuery) {
            updateParams({ q: debouncedSearch });
        }
    }, [debouncedSearch, urlSearchQuery, updateParams]);


    const handleDateChange = useCallback((range: DateRange | undefined) => {
        if (range?.from) {
            updateParams({
                startDate: format(range.from, 'yyyy-MM-dd'),
                endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
            });
        } else {
            updateParams({
                startDate: undefined,
                endDate: undefined
            });
        }
    }, [updateParams]);

    // Construct DateRange object for the picker
    const dateRange: DateRange | undefined = startDate && endDate ? {
        from: startDate,
        to: endDate
    } : undefined;

    const filters = {
        page,
        limit,
        startDate,
        endDate,
        branchId,
        status,
        isOfflineSynced,
        search: urlSearchQuery
    };

    const summaryFilters = {
        startDate,
        endDate,
        branchId,
        status,
        isOfflineSynced,
        search: urlSearchQuery
    };

    const { data: user } = useCurrentUser();
    const isPegawai = user?.role.name === 'Pegawai';
    const userBranchId = user?.branch?.id;

    const { data: transactionData, isLoading } = useTransactions({
        ...filters,
        branchId: isPegawai ? userBranchId : filters.branchId
    });
    const { data: summaryData } = useTransactionSummary({
        ...summaryFilters,
        branchId: isPegawai ? userBranchId : summaryFilters.branchId
    } as any);
    const { data: branches } = useBranches();

    const data = transactionData?.data || [];

    const handleExport = async (exportFilters: { startDate?: Date; endDate?: Date; branchId?: number }) => {
        try {
            setIsExporting(true);

            // Build export params using logic identical to filters but without pagination
            const exportParams: any = {
                limit: 10000, // Fetch up to 10k rows
                page: 1,
            };

            if (exportFilters.branchId) exportParams.branchId = exportFilters.branchId;
            if (isPegawai) exportParams.branchId = userBranchId; // Enforce security

            if (filters.status && filters.status !== 'all') exportParams.status = filters.status;
            if (filters.search) exportParams.search = filters.search;
            if (filters.isOfflineSynced !== undefined) exportParams.isOfflineSynced = String(filters.isOfflineSynced);

            // Use the dates from the Dialog, not the URL
            if (exportFilters.startDate) exportParams.startDate = format(exportFilters.startDate, 'yyyy-MM-dd');
            // Ensure endDate covers the full day by appending time
            if (exportFilters.endDate) exportParams.endDate = format(exportFilters.endDate, 'yyyy-MM-dd') + 'T23:59:59';

            const response = await apiClient.get<any>('/transactions', { params: exportParams });
            // API Client returns the body directly. For /transactions, the body is { data: [...], meta: ... }
            // So response object IS the { data, meta } object.
            // valid data is in response.data
            const allTransactions: Transaction[] = response.data || [];

            if (allTransactions.length === 0) {
                toast.error("Tidak ada data untuk diexport");
                return;
            }

            // Create Excel
            const wb = XLSX.utils.book_new();

            const rows = allTransactions.map(t => ({
                "ID Transaksi": t.id,
                "Waktu": format(new Date(t.transactionDate), "yyyy-MM-dd HH:mm:ss"),
                "Cabang": t.branch.name,
                "Kasir": t.user.fullname,
                "Total Bayar": t.totalAmount,
                "Metode": t.paymentMethod,
                "Status": t.status,
                "Offline": t.isOfflineSynced ? "Yes" : "No"
            }));

            const ws = XLSX.utils.json_to_sheet(rows);

            // Auto-width columns
            const wscols = [
                { wch: 20 }, // ID
                { wch: 20 }, // Waktu
                { wch: 15 }, // Cabang
                { wch: 20 }, // Kasir
                { wch: 15 }, // Total
                { wch: 10 }, // Metode
                { wch: 10 }, // Status
                { wch: 10 }, // Offline
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
            XLSX.writeFile(wb, `Transaksi-${format(new Date(), "yyyy-MM-dd-HHmmss")}.xlsx`);

            toast.success(`Berhasil mengexport ${rows.length} data`);
            setIsExportDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Gagal export data");
        } finally {
            setIsExporting(false);
        }
    };

    const columns: ColumnDef<Transaction>[] = useMemo(
        () => [
            {
                accessorKey: "transactionDate",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                            {format(new Date(row.original.transactionDate), "dd MMM yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-mono">
                                {format(new Date(row.original.transactionDate), "HH:mm")}
                            </span>
                            {row.original.isOfflineSynced && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-amber-50 border-amber-200 text-amber-700 gap-1 font-bold uppercase tracking-wider">
                                    <WifiOff className="h-2.5 w-2.5" />
                                    Offline
                                </Badge>
                            )}
                        </div>
                    </div>
                )
            },
            {
                accessorKey: "branch.name",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Cabang" />,
                cell: ({ row }) => (
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {row.original.branch.name}
                    </div>
                )
            },
            {
                accessorKey: "user.fullname",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Kasir" />,
                cell: ({ row }) => (
                    <div className="text-sm font-medium">
                        {row.original.user.fullname}
                    </div>
                )
            },
            {
                accessorKey: "totalAmount",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end" />,
                cell: ({ row }) => (
                    <div className="text-right font-mono font-bold text-slate-700">
                        {/* Use formatCurrency from utils */}
                        {Number(row.original.totalAmount).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
                    </div>
                ),
            },
            {
                accessorKey: "paymentMethod",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" className="justify-center" />,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Badge variant="outline" className="text-[10px] h-5">
                            {row.original.paymentMethod}
                        </Badge>
                    </div>
                )
            },
            {
                accessorKey: "status",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center" />,
                cell: ({ row }) => {
                    const status = row.original.status;
                    let variant: "default" | "destructive" | "secondary" | "outline" =
                        "outline";
                    let label = status;

                    if (status === "PAID") {
                        variant = "default";
                        label = "PAID";
                    } else if (status === "VOID") {
                        variant = "destructive";
                        label = "VOID";
                    } else if (status === "PENDING_VOID") {
                        variant = "secondary";
                        label = "PENDING_VOID";
                    }

                    return (
                        <div className="flex justify-center">
                            <Badge
                                variant={variant}
                                className="h-5 text-[10px] uppercase font-bold"
                            >
                                {label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Aksi" className="justify-end" />,
                cell: ({ row }) => (
                    <div className="flex gap-1 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => {
                                setSelectedTransaction(row.original);
                                setIsDetailOpen(true);
                            }}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Detail
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const toolbarActions = (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari kasir..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9 h-9"
                />
                {searchValue && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchValue('')}
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <DateRangePicker
                date={dateRange}
                onDateChange={handleDateChange}
                className="w-full sm:w-auto"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                    value={isOfflineSyncedStr || 'all'}
                    onValueChange={(val) => updateParams({ isOfflineSynced: val })}
                >
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white">
                        <SelectValue placeholder="Sumber Data" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Sumber</SelectItem>
                        <SelectItem value="false">Online</SelectItem>
                        <SelectItem value="true">Offline (Synced)</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={status || 'all'}
                    onValueChange={(val) => updateParams({ status: val })}
                >
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="PAID">PAID</SelectItem>
                        <SelectItem value="VOID">VOID</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={isPegawai ? String(userBranchId) : (branchIdStr || 'all')}
                    onValueChange={(val) => !isPegawai && updateParams({ branchId: val })}
                    disabled={isPegawai}
                >
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white">
                        <SelectValue placeholder={isPegawai ? user?.branch?.name : "Semua Cabang"} />
                    </SelectTrigger>
                    <SelectContent>
                        {!isPegawai && <SelectItem value="all">Semua Cabang</SelectItem>}
                        {isPegawai ? (
                            <SelectItem value={String(userBranchId)}>{user?.branch?.name}</SelectItem>
                        ) : (
                            branches?.map((branch: any) => (
                                <SelectItem key={String(branch.id)} value={String(branch.id)}>
                                    {branch.name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} className="bg-white ml-auto sm:ml-0 gap-2">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                    Export XLSX
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <TransactionSummary
                totalRevenue={summaryData?.totalRevenue || 0}
                totalTransactions={summaryData?.paidCount || transactionData?.meta?.total || 0}
                totalVoid={summaryData?.totalVoid || 0}
                voidAmount={summaryData?.voidAmount || 0}
            />

            <div className="rounded-md bg-white">
                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={isLoading}
                    toolbarActions={toolbarActions}
                    pageCount={transactionData?.meta?.totalPages || 0}
                    manualPagination={true}
                    pagination={{
                        pageIndex: page - 1,
                        pageSize: limit,
                    }}
                    onPaginationChange={(newPagination) => {
                        updateParams({
                            page: newPagination.pageIndex + 1,
                            limit: newPagination.pageSize,
                        });
                    }}
                />
            </div>

            {/* Detail Modal */}
            <TransactionDetailDialog
                transaction={selectedTransaction}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />

            {/* Export Dialog */}
            <ExportTransactionDialog
                key={isExportDialogOpen ? "open" : "closed"}
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                onExport={handleExport}
                isExporting={isExporting}
                branches={branches || []}
                defaultDateRange={dateRange}
                defaultBranchId={branchId}
            />
        </div>
    );
}
