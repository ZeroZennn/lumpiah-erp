
import { useState, useMemo } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { formatCurrency } from "@/shared/lib/format";
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Input } from "@/shared/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface VoidTransaction {
    transactionId: string;
    transactionDate: string;
    cashierName: string;
    totalAmount: number;
    voidReason: string | null;
}

interface AuditTrailTableProps {
    data: VoidTransaction[];
    totalVoidValue: number;
    isLoading: boolean;
}

export function AuditTrailTable({ data, totalVoidValue, isLoading }: AuditTrailTableProps) {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 }); // Default smaller page size for audit
    const [search, setSearch] = useState("");

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const term = search.toLowerCase();
            return (
                item.transactionId.toLowerCase().includes(term) ||
                item.cashierName.toLowerCase().includes(term) ||
                (item.voidReason || "").toLowerCase().includes(term)
            );
        });
    }, [data, search]);

    const columns: ColumnDef<VoidTransaction>[] = [
        {
            accessorKey: "transactionId",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID & Kasir" />,
            cell: ({ row }) => (
                <div>
                    <div className="font-bold text-slate-900 font-mono text-xs">{row.original.transactionId.split('-')[0]}</div>
                    <div className="text-[10px] text-muted-foreground">{row.original.cashierName} • {format(new Date(row.original.transactionDate), "HH:mm")}</div>
                </div>
            )
        },
        {
            accessorKey: "voidReason",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Alasan" />,
            cell: ({ row }) => <div className="text-xs italic text-slate-600">&quot;{row.original.voidReason || 'Tanpa alasan'}&quot;</div>
        },
        {
            accessorKey: "totalAmount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nominal" className="justify-end" />,
            cell: ({ row }) => <div className="text-right font-black text-red-600">{formatCurrency(row.original.totalAmount)}</div>
        }
    ];

    const toolbarActions = (
        <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Cari audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
            />
            {search && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearch('')}
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filteredData}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                toolbarActions={toolbarActions}
            />
            {/* Footer Summary Manual for Void */}
            <div className="flex justify-between items-center p-4 bg-red-50/50 border-t border-red-100 rounded-b-lg">
                <span className="font-bold text-red-700 text-xs text-right">POTENSI RUGI (VOID):</span>
                <span className="text-right font-black text-red-700">{formatCurrency(totalVoidValue || 0)}</span>
            </div>
        </div>
    );
}
