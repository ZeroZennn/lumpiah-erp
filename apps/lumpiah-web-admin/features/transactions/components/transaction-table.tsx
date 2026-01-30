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
import { Eye, Download, Loader2, Search, X } from "lucide-react";
import { TransactionDetailDialog } from "./transaction-detail-sheet";
import { toast } from "sonner";
import { useExportTransactions, useTransactions } from "../api/use-transactions";
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
import { ExportTransactionDialog } from "./export-transaction-dialog";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
type TransactionTableProps = Record<string, never>;

export function TransactionTable({ }: TransactionTableProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
        isOfflineSynced,
        search: urlSearchQuery // Pass search param to hook
    };

    const summaryFilters = {
        startDate,
        endDate,
        branchId,
        isOfflineSynced,
        search: urlSearchQuery
    };

    const { data: transactionData, isLoading } = useTransactions(filters);
    const { data: summaryData } = useTransactionSummary(summaryFilters as any);
    const { data: branches } = useBranches();

    const data = transactionData?.data || [];

    const { mutate: exportData, isPending: isExporting } = useExportTransactions();

    const handleExport = useCallback((exportFilters: any) => {
        exportData(exportFilters, {
            onSuccess: (data) => {
                // Create download link
                const url = window.URL.createObjectURL(new Blob([data as any]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("Export berhasil!");
                setIsExportDialogOpen(false);
            },
            onError: () => {
                toast.error("Gagal export data");
            }
        });
    }, [exportData]);

    const columns: ColumnDef<Transaction>[] = useMemo(
        () => [
            {
                accessorKey: "transactionDate",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">
                                {format(new Date(row.original.transactionDate), "dd MMM yyyy")}
                            </span>
                            {row.original.isOfflineSynced && (
                                <WifiOff className="h-3 w-3 text-amber-500" />
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {format(new Date(row.original.transactionDate), "HH:mm")}
                        </span>
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
                    value={branchIdStr || 'all'}
                    onValueChange={(val) => updateParams({ branchId: val })}
                >
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white">
                        <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Cabang</SelectItem>
                        {branches?.map((branch: any) => (
                            <SelectItem key={String(branch.id)} value={String(branch.id)}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} className="bg-white ml-auto sm:ml-0">
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export
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
