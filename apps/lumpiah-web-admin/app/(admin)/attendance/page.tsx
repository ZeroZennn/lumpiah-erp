"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ArrowLeft, BarChart3, Search, Download, Eye, AlertCircle, Loader2, WifiOff } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { useAttendanceRecap, useAttendanceDetails, useCorrectAttendance } from "@/features/attendance/api/use-attendance";
import { AttendanceRecapItem, AttendanceDetailItem, UpdateAttendanceRequest } from "@/features/attendance/api/attendance.types";
import { useBranches } from "@/features/branches/api/use-branches";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDebounce } from "@/shared/hooks/use-debounce";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { DataTable } from '@/shared/components/ui/data-table';
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DateRange } from "react-day-picker";
import { cn } from "@/shared/lib/utils";

// --- Main Page Component ---

export default function AttendanceRecapPage() {
    // URL Sync
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Sheet State
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Get filters from URL
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const branchId = searchParams.get('branchId') || 'all';

    // Date handling
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const defaultStart = startOfMonth(new Date());
    const defaultEnd = endOfMonth(new Date());

    const startDateStr = startDateParam || format(defaultStart, 'yyyy-MM-dd');
    const endDateStr = endDateParam || format(defaultEnd, 'yyyy-MM-dd');

    // Search Debounce
    const urlSearchQuery = searchParams.get('search') || '';
    const [searchValue, setSearchValue] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchValue, 500);

    // Helper to update URL
    const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== 'all') {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        });

        // Reset page to 1 on filter change
        if (!updates.page && params.has('page') && params.get('page') !== '1') {
            params.set('page', '1');
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    // Effect for Search
    if (debouncedSearch !== urlSearchQuery) {
        updateParams({ search: debouncedSearch });
    }

    const handleDateChange = useCallback((range: DateRange | undefined) => {
        if (range?.from) {
            updateParams({
                startDate: format(range.from, 'yyyy-MM-dd'),
                endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
            });
        }
    }, [updateParams]);

    // Queries
    const { data: branchesData } = useBranches();
    const activeBranches = branchesData?.filter(b => b.isActive) || [];

    const { data, isLoading } = useAttendanceRecap({
        startDate: startDateStr,
        endDate: endDateStr,
        branchId: branchId !== 'all' ? branchId : undefined,
        search: urlSearchQuery,
        page,
        limit
    });

    const { summary, recap: recapList, meta } = data || {};

    const handleDetailClick = (userId: number) => {
        setSelectedUserId(userId);
        setSheetOpen(true);
    };

    const handleExport = () => {
        if (!recapList?.length) return;

        const currentBranchName = branchId === 'all'
            ? "Semua Cabang"
            : activeBranches.find(b => String(b.id) === branchId)?.name || "Cabang Tidak Diketahui";

        const wb = XLSX.utils.book_new();

        const exportData = [
            ["Laporan Rekapitulasi Absensi"],
            ["Periode", `${format(new Date(startDateStr), "dd MMM yyyy")} - ${format(new Date(endDateStr), "dd MMM yyyy")}`],
            ["Filter Cabang", currentBranchName],
            [],
            ["Ringkasan"],
            ["Total Hari Kerja", summary?.totalDays || 0],
            ["Total Jam Kerja", summary?.totalHours || 0],
            ["Pegawai Tanpa Checkout", summary?.missingCheckout || 0],
            [],
            ["Detail Pegawai"],
            ["Nama Pegawai", "Cabang", "Total Hari", "Total Jam", "Rata-rata/Hari", "Insiden Lupa Checkout"],
            ...recapList.map(r => [
                r.userName,
                r.branchName,
                r.totalDays,
                parseFloat(r.totalHours), // Keep as number
                parseFloat(r.averageHours), // Keep as number
                r.missingCheckout
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(exportData);

        // Styling Columns
        const wscols = [
            { wch: 25 }, // Nama
            { wch: 20 }, // Cabang
            { wch: 15 }, // Total Hari
            { wch: 15 }, // Total Jam
            { wch: 20 }, // Rata-rata
            { wch: 25 }, // Insiden
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
        XLSX.writeFile(wb, `Rekap_Absensi_${startDateStr}_${endDateStr}.xlsx`);
        toast.success("Laporan berhasil diunduh");
    };

    // Columns Definition
    const columns: ColumnDef<AttendanceRecapItem>[] = useMemo(
        () => [
            {
                accessorKey: "userName",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pegawai" />,
                cell: ({ row }) => <span className="font-medium">{row.original.userName}</span>
            },
            {
                accessorKey: "branchName",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Cabang" />,
            },
            {
                accessorKey: "totalDays",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Total Kehadiran" className="justify-center" />,
                cell: ({ row }) => <div className="text-center">{row.original.totalDays} Hari</div>
            },
            {
                accessorKey: "totalHours",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Total Durasi (Jam)" className="justify-center" />,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Badge variant="secondary" className="font-mono text-base">
                            {row.original.totalHours}
                        </Badge>
                    </div>
                )
            },
            {
                accessorKey: "averageHours",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Rata-rata/Hari" className="justify-center" />,
                cell: ({ row }) => (
                    <div className="text-center">
                        <span className={cn(
                            "font-bold",
                            parseFloat(row.original.averageHours) < 7 ? "text-amber-600" : "text-emerald-600"
                        )}>
                            {row.original.averageHours}
                        </span> Jam
                    </div>
                )
            },
            {
                id: "actions",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Aksi" className="justify-end" />,
                cell: ({ row }) => (
                    <div className="text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDetailClick(row.original.userId)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }
        ],
        []
    );

    const dateRangeObject: DateRange | undefined = {
        from: new Date(startDateStr),
        to: new Date(endDateStr)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rekapitulasi Absensi</h1>
                    <p className="text-muted-foreground">
                        Evaluasi kinerja dan durasi kerja per periode.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExport} disabled={!recapList?.length} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel (.csv)
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hari Kerja</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalDays || 0}</div>
                        <p className="text-xs text-muted-foreground">Akumulasi seluruh pegawai</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jam Kerja</CardTitle>
                        <div className="h-4 w-4 text-emerald-500 font-bold">Hrs</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalHours || "0.0"}</div>
                        <p className="text-xs text-muted-foreground">Durasi produktif (Jam)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pegawai Tanpa Checkout</CardTitle>
                        <AlertCircle className={cn("h-4 w-4", (summary?.missingCheckout || 0) > 0 ? "text-red-500" : "text-muted-foreground")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", (summary?.missingCheckout || 0) > 0 && "text-red-600")}>
                            {summary?.missingCheckout || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Insiden lupa absen pulang</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with DataTable */}

            <div className="rounded-md bg-white p-4 shadow-sm border">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Periode Tanggal</span>
                        <DateRangePicker
                            date={dateRangeObject}
                            onDateChange={handleDateChange}
                        />
                    </div>
                    <div className="space-y-2 w-full md:w-[200px]">
                        <span className="text-sm font-medium">Filter Cabang</span>
                        <Select value={branchId} onValueChange={(val) => updateParams({ branchId: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {activeBranches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <span className="text-sm font-medium">Cari Pegawai</span>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nama pegawai..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={recapList || []}
                    isLoading={isLoading}
                    pageCount={meta?.totalPages || 1}
                    manualPagination={true}
                    pagination={{
                        pageIndex: page - 1,
                        pageSize: limit
                    }}
                    onPaginationChange={(upd) => {
                        updateParams({
                            page: upd.pageIndex + 1,
                            limit: upd.pageSize
                        })
                    }}
                />
            </div>

            {/* Detail Dialog */}
            <AttendanceDetailDialog
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                userId={selectedUserId}
                startDate={startDateStr}
                endDate={endDateStr}
            />
        </div>
    );
}

// --- Detail Dialog Component ---

function AttendanceDetailDialog({
    open,
    onOpenChange,
    userId,
    startDate,
    endDate
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: number | null;
    startDate: string;
    endDate: string;
}) {
    const { data: details, isLoading } = useAttendanceDetails(userId, startDate, endDate);
    const [editingItem, setEditingItem] = useState<AttendanceDetailItem | null>(null);
    const { data: user } = useCurrentUser();
    const isOwner = user?.role?.name === 'Owner';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="mb-6">
                    <DialogTitle>Detail Absensi Harian</DialogTitle>
                    <DialogDescription>
                        Rincian kehadiran pegawai pada periode terpilih.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Masuk (In)</TableHead>
                                    <TableHead>Keluar (Out)</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
                                ) : (!details || details.length === 0) ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4">Belum ada data absensi.</TableCell></TableRow>
                                ) : (
                                    details.map((item) => (
                                        <TableRow key={item.id} className={!item.clockOut ? "bg-red-50 hover:bg-red-100" : ""}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(item.date), "dd MMM yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(item.clockIn), "HH:mm")}
                                            </TableCell>
                                            <TableCell className={!item.clockOut ? "text-red-500 font-bold" : ""}>
                                                {item.clockOut ? format(new Date(item.clockOut), "HH:mm") : "Belum Absen"}
                                            </TableCell>
                                            <TableCell>{item.durationString}</TableCell>
                                            <TableCell className="text-right">
                                                {!isOwner && (
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {editingItem && (
                    <CorrectionDialog
                        item={editingItem}
                        open={!!editingItem}
                        onClose={() => setEditingItem(null)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

// --- Correction Dialog Component ---

function CorrectionDialog({
    item,
    open,
    onClose
}: {
    item: AttendanceDetailItem;
    open: boolean;
    onClose: () => void; // Parent handles setting item to null
}) {
    const formatDateForInput = (isoDate: string | null) => {
        if (!isoDate) return "";
        // Convert to local datetime-local format (yyyy-MM-ddTHH:mm)
        return format(new Date(isoDate), "yyyy-MM-dd'T'HH:mm");
    };

    const [clockIn, setClockIn] = useState(formatDateForInput(item.clockIn));
    const [clockOut, setClockOut] = useState(formatDateForInput(item.clockOut));
    const [reason, setReason] = useState("");

    const { mutate: updateAttendance, isPending } = useCorrectAttendance();

    const handleSubmit = () => {
        if (!reason) {
            alert("Harap isi alasan perubahan (Catatan Koreksi)!");
            return;
        }

        const payload: UpdateAttendanceRequest = {
            correctionNote: reason,
        };
        // Only include if changed/filled
        if (clockIn) payload.clockIn = new Date(clockIn).toISOString();
        if (clockOut) payload.clockOut = new Date(clockOut).toISOString();

        updateAttendance(
            { id: item.id, data: payload },
            {
                onSuccess: () => {
                    // Simple success feedback
                    onClose();
                },
                onError: (error) => {
                    alert("Gagal melakukan koreksi: " + error.message);
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Koreksi Absensi</DialogTitle>
                    <DialogDescription>
                        Ubah data jam masuk/keluar pegawai. Wajib sertakan alasan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="clockIn">Waktu Masuk (Clock In)</Label>
                        <Input
                            id="clockIn"
                            type="datetime-local"
                            value={clockIn}
                            onChange={(e) => setClockIn(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clockOut">Waktu Keluar (Clock Out)</Label>
                        <Input
                            id="clockOut"
                            type="datetime-local"
                            value={clockOut}
                            onChange={(e) => setClockOut(e.target.value)}
                            className={!item.clockOut && !clockOut ? "border-red-500 bg-red-50" : ""}
                        />
                        {!item.clockOut && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Data sebelumnya kosong. Harap diisi.
                            </span>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Alasan Perubahan <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Contoh: Pegawai lupa tap pulang..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
