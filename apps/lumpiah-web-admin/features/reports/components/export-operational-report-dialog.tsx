
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
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Label } from "@/shared/components/ui/label";
import { useState } from "react";
import { Loader2, Download } from "lucide-react";

interface ExportOperationalReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (filters: { date: Date; branchId?: string }) => void;
    isExporting?: boolean;
    branches: any[];
    // Default values
    defaultDate?: Date;
    defaultBranchId?: string;
}

export function ExportOperationalReportDialog({
    isOpen,
    onClose,
    onExport,
    isExporting,
    branches,
    defaultDate,
    defaultBranchId
}: ExportOperationalReportDialogProps) {
    const [date, setDate] = useState<Date | undefined>(defaultDate || new Date());
    const [branchId, setBranchId] = useState<string>(defaultBranchId || 'all');

    const handleExport = () => {
        if (!date) return;

        onExport({
            date: date,
            branchId: branchId !== 'all' ? branchId : undefined
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Laporan Operasional</DialogTitle>
                    <DialogDescription>
                        Pilih tanggal dan cabang untuk laporan yang ingin di-export.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Tanggal Laporan</Label>
                        <div className="w-full">
                            <DatePicker
                                date={date}
                                onDateChange={setDate}
                                className="w-full"
                            />
                        </div>
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
                    <Button onClick={handleExport} disabled={isExporting || !date}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export XLSX
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
