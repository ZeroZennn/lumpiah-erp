
import { useState } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/lib/format";
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";

interface EodControlItem {
    branchId: number;
    branchName: string;
    status: string;
    closingTime: Date | string | null;
    totalCashSystem: number;
    totalCashActual: number;
    cashVariance: number;
    totalQrisSystem: number;
    totalQrisActual: number;
    qrisVariance: number;
    closingNote: string | null;
}

interface EodControlTableProps {
    data: EodControlItem[];
    isLoading: boolean;
}

export function EodControlTable({ data, isLoading }: EodControlTableProps) {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

    const columns: ColumnDef<EodControlItem>[] = [
        {
            accessorKey: "branchName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cabang" />,
            cell: ({ row }) => (
                <div>
                    <div className="font-bold text-slate-900">{row.original.branchName}</div>
                    <div className="text-[10px] text-muted-foreground">
                        {row.original.closingTime
                            ? `Closed at ${format(new Date(row.original.closingTime), "HH:mm")}`
                            : "Belum tutup buku"}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center" />,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase border-0",
                        row.original.status === "CLOSED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                    )}>
                        {row.original.status}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "cashVariance",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Selisih Cash" className="justify-end" />,
            cell: ({ row }) => (
                <div className={cn(
                    "text-right font-black font-mono",
                    row.original.cashVariance < 0 ? "text-red-600" : "text-emerald-600",
                    row.original.cashVariance === 0 && "text-slate-400"
                )}>
                    {row.original.cashVariance !== 0 ? formatCurrency(row.original.cashVariance) : "-"}
                </div>
            )
        },
        {
            accessorKey: "qrisVariance",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Selisih QRIS" className="justify-end" />,
            cell: ({ row }) => (
                <div className={cn(
                    "text-right font-black font-mono",
                    row.original.qrisVariance < 0 ? "text-red-600" : "text-emerald-600",
                    row.original.qrisVariance === 0 && "text-slate-400"
                )}>
                    {row.original.qrisVariance !== 0 ? formatCurrency(row.original.qrisVariance) : "-"}
                </div>
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            searchKey="branchName"
            searchPlaceholder="Cari cabang..."
        />
    );
}
