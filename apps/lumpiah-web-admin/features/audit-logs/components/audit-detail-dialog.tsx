import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { AuditLog } from "../audit-logs.types";
import { format } from "date-fns";
import { cn } from "@/shared/lib/utils";

interface AuditDetailDialogProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuditDetailDialog({ log, open, onOpenChange }: AuditDetailDialogProps) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit Log Detail</DialogTitle>
                    <DialogDescription>
                        Activity recorded on {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Actor</p>
                        <p className="font-medium">{log.user.fullname} <span className="text-xs text-muted-foreground">({log.user.role.name})</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Action Type</p>
                        <Badge variant={log.actionType === "DELETE" || log.actionType === "VOID" ? "destructive" : "default"}>
                            {log.actionType}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="font-mono text-sm">{log.targetTable} #{log.targetId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{log.ipAddress || "N/A"}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="font-semibold">Changes Diff</h3>
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-muted-foreground w-1/3">Field</th>
                                    <th className="px-4 py-2 font-medium text-red-600 w-1/3">Before</th>
                                    <th className="px-4 py-2 font-medium text-green-600 w-1/3">After</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(() => {
                                    const oldVal = (log.oldValue as Record<string, any>) || {};
                                    const newVal = (log.newValue as Record<string, any>) || {};

                                    // Get all unique keys
                                    const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));

                                    // Filter out internal keys usually not relevant for users
                                    const filteredKeys = allKeys.filter(k =>
                                        !['updatedAt', 'userId', 'authorId'].includes(k)
                                    );

                                    if (filteredKeys.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                                    No changes detected or data is empty.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return filteredKeys.map(key => {
                                        const v1 = oldVal[key];
                                        const v2 = newVal[key];
                                        const isChanged = JSON.stringify(v1) !== JSON.stringify(v2);

                                        // Format helper
                                        const formatVal = (v: any) => {
                                            if (v === null || v === undefined) return <span className="text-muted-foreground italic">null</span>;
                                            if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                                            if (typeof v === 'number') {
                                                // Guess currency if key contains price/cost/total
                                                if (/price|cost|total|amount/i.test(key)) {
                                                    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(v);
                                                }
                                                return v.toLocaleString('id-ID');
                                            }
                                            // Date detection (ISO string)
                                            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
                                                try {
                                                    return format(new Date(v), "dd MMM yyyy HH:mm");
                                                } catch { return v; }
                                            }
                                            if (typeof v === 'object') return JSON.stringify(v);
                                            return String(v);
                                        };

                                        return (
                                            <tr key={key} className={isChanged ? "bg-yellow-50/30" : ""}>
                                                <td className="px-4 py-2 font-medium capitalize text-muted-foreground">
                                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                                </td>
                                                <td className={cn("px-4 py-2 font-mono text-xs break-all", isChanged && "bg-red-50/50")}>
                                                    {formatVal(v1)}
                                                </td>
                                                <td className={cn("px-4 py-2 font-mono text-xs break-all", isChanged && "bg-green-50/50")}>
                                                    {formatVal(v2)}
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
