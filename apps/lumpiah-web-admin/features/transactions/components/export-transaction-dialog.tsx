import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Label } from "@/shared/components/ui/label";
import { DateRange } from "react-day-picker";
import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";

interface ExportTransactionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (filters: { startDate?: Date; endDate?: Date; branchId?: number }) => void;
    isExporting?: boolean;
    branches: any[];
    // Default values from current table view
    defaultDateRange?: DateRange;
    defaultBranchId?: number;
}

export function ExportTransactionDialog({
    isOpen,
    onClose,
    onExport,
    isExporting,
    branches,
    defaultDateRange,
    defaultBranchId
}: ExportTransactionDialogProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
    const [branchId, setBranchId] = useState<string>(defaultBranchId ? String(defaultBranchId) : 'all');


    // Effect removed: State reset is handled by remounting via key in parent component.

    const handleExport = () => {
        onExport({
            startDate: dateRange?.from,
            endDate: dateRange?.to || dateRange?.from,
            branchId: branchId !== 'all' ? Number(branchId) : undefined
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Data Transaksi</DialogTitle>
                    <DialogDescription>
                        Pilih rentang waktu dan cabang untuk data yang ingin di-export.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Rentang Waktu</Label>
                        <DateRangePicker
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="w-full"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Cabang</Label>
                        <Select
                            value={branchId}
                            onValueChange={setBranchId}
                        >
                            <SelectTrigger>
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
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isExporting}>
                        Batal
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting || !dateRange?.from}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
