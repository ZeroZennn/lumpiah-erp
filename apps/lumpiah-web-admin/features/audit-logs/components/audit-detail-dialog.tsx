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

interface AuditDetailDialogProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuditDetailDialog({ log, open, onOpenChange }: AuditDetailDialogProps) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
                        <div className="bg-red-50/50 p-4 border-r">
                            <p className="text-xs font-bold text-red-600 mb-2 uppercase">Old Value (Before)</p>
                            {log.oldValue ? (
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-red-900">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No previous data (New Record)</p>
                            )}
                        </div>
                        <div className="bg-green-50/50 p-4">
                            <p className="text-xs font-bold text-green-600 mb-2 uppercase">New Value (After)</p>
                            {log.newValue ? (
                                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-green-900">
                                    {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No new data (Deleted)</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
