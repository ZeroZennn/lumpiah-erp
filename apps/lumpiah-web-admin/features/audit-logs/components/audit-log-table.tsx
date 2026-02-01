import { DataTable } from "@/shared/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AuditLog } from "../audit-logs.types";
import { format } from "date-fns";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Eye } from "lucide-react";
import { AuditDetailDialog } from "./audit-detail-dialog";
import { useState } from "react";

interface AuditLogTableProps {
    data: AuditLog[];
    isLoading: boolean;
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

export function AuditLogTable({ data, isLoading, total, page, pageSize, onPageChange, onPageSizeChange }: AuditLogTableProps) {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: "timestamp",
            header: "Timestamp",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <div className="font-medium text-xs">{format(new Date(row.original.timestamp), "dd/MM/yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(row.original.timestamp), "HH:mm:ss")}</div>
                </div>
            ),
        },
        {
            accessorKey: "user",
            header: "Actor",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-sm">{row.original.user.fullname}</div>
                    <div className="text-xs text-muted-foreground">{row.original.user.role.name}</div>
                </div>
            ),
        },
        {
            accessorKey: "actionType",
            header: "Action",
            cell: ({ row }) => {
                const type = row.original.actionType;
                let color = "default";
                if (type === "DELETE" || type === "VOID") color = "destructive";
                if (type === "UPDATE") color = "secondary"; // Or warning color if available
                if (type === "CREATE") color = "default"; // Green usually

                return <Badge variant={color as any}>{type}</Badge>;
            },
        },
        {
            accessorKey: "target",
            header: "Target Data",
            cell: ({ row }) => (
                <div className="font-mono text-xs">
                    <span className="font-bold">{row.original.targetTable}</span>
                    <br />
                    <span className="text-muted-foreground">#{row.original.targetId}</span>
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button variant="ghost" size="icon" onClick={() => setSelectedLog(row.original)}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                pagination={{
                    pageIndex: page - 1,
                    pageSize: pageSize,
                }}
                onPaginationChange={(p) => {
                    onPageChange(p.pageIndex + 1);
                    if (onPageSizeChange && p.pageSize !== pageSize) {
                        onPageSizeChange(p.pageSize);
                    }
                }}
                pageCount={Math.ceil(total / pageSize)}
            />
            <AuditDetailDialog
                log={selectedLog}
                open={!!selectedLog}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            />
        </>
    );
}
