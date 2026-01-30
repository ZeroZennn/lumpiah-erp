import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar } from '@/shared/components/ui/calendar';
import { cn } from '@/shared/lib/utils';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { useBranches } from '@/features/branches/api/use-branches';

interface TransactionFiltersProps {
    branchId: number | undefined;
    setBranchId: (val: number | undefined) => void;
    startDate: Date | undefined;
    setStartDate: (val: Date | undefined) => void;
    endDate: Date | undefined;
    setEndDate: (val: Date | undefined) => void;
    status: string;
    setStatus: (val: string) => void;
    search: string;
    setSearch: (val: string) => void;
}

export function TransactionFilters({
    branchId, setBranchId,
    startDate, setStartDate,
    endDate, setEndDate,
    status, setStatus,
    search, setSearch
}: TransactionFiltersProps) {
    const { data: branches } = useBranches();

    return (
        <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Branch Filter */}
                <Select
                    value={branchId ? String(branchId) : "all"}
                    onValueChange={(val) => setBranchId(val === "all" ? undefined : Number(val))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Cabang</SelectItem>
                        {branches?.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date Range Start */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Tanggal Mulai</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Date Range End */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Tanggal Selesai</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Status Filter */}
                <Select
                    value={status || "all"}
                    onValueChange={(val) => setStatus(val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="VOID">Void</SelectItem>
                        <SelectItem value="PENDING_VOID">Pending Void</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari No. ID Transaksi atau Nama Kasir..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
                {search && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                        onClick={() => setSearch('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
