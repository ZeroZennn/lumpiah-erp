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
import { useState } from "react";
import { Loader2, Download } from "lucide-react";

interface ExportTransactionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (filters: {
        startDate?: Date;
        endDate?: Date;
        branchId?: number;
        status?: string;
        isOfflineSynced?: string;
        search?: string;
    }) => void;
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
    const [status, setStatus] = useState<string>('all');
    const [isOfflineSynced, setIsOfflineSynced] = useState<string>('all');
    const [search, setSearch] = useState<string>('');

    const handleExport = () => {
        onExport({
            startDate: dateRange?.from,
            endDate: dateRange?.to || dateRange?.from,
            branchId: branchId !== 'all' ? Number(branchId) : undefined,
            status: status !== 'all' ? status : undefined,
            isOfflineSynced: isOfflineSynced !== 'all' ? isOfflineSynced : undefined,
            search: search || undefined
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Data Transaksi</DialogTitle>
                    <DialogDescription>
                        Filter data yang ingin di-export. Filter ini tidak mempengaruhi tampilan tabel utama.
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Cabang</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
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
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="PAID">PAID</SelectItem>
                                    <SelectItem value="VOID">VOID</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Sumber Data</Label>
                            <Select value={isOfflineSynced} onValueChange={setIsOfflineSynced}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Sumber" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Sumber</SelectItem>
                                    <SelectItem value="false">Online</SelectItem>
                                    <SelectItem value="true">Offline (Synced)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Placeholder for alignment or extra filter */}
                    </div>

                    <div className="grid gap-2">
                        <Label>Pencarian (Opsional)</Label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cari kasir atau ID transaksi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
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
                                Export XLSX
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
