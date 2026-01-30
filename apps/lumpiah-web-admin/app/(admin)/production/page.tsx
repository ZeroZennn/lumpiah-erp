"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Factory, Settings, Building2, RefreshCcw } from "lucide-react";


import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { cn } from "@/shared/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useBranches } from "@/features/branches/api/use-branches";

import { ProductionTable } from "@/features/production/components/production-table";
import { AccuracyChart } from "@/features/production/components/accuracy-chart";
import { ProductionGuide } from "@/features/production/components/production-guide";
import { useProductionPlans, useProductionAccuracy } from "@/features/production/api/use-production";

function Production() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { data: branches, isLoading: branchesLoading } = useBranches();

    // Initialize from URL or default
    const urlBranch = searchParams.get("branchId");
    const urlDateString = searchParams.get("date");
    const parsedUrlDate = urlDateString ? parseISO(urlDateString) : null;

    const [selectedBranch, setSelectedBranch] = useState<string>(urlBranch || "");
    const [date, setDate] = useState<Date>(
        parsedUrlDate && isValid(parsedUrlDate) ? parsedUrlDate : new Date()
    );
    const [init, setInit] = useState(false);

    const branchId = parseInt(selectedBranch) || 0;

    // Helper to update URL
    const updateUrl = useCallback((newBranchId: string, newDate: Date) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newBranchId) params.set("branchId", newBranchId);
        params.set("date", format(newDate, "yyyy-MM-dd"));
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    // Set default branch if missing in URL and state
    useEffect(() => {
        if (branches && branches.length > 0 && !selectedBranch) {
            const firstBranchId = String(branches[0].id);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedBranch(firstBranchId);
            updateUrl(firstBranchId, date);
        }
    }, [branches, selectedBranch, date, updateUrl]);

    const handleBranchChange = (newBranchId: string) => {
        setSelectedBranch(newBranchId);
        updateUrl(newBranchId, date);
    };

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
        setInit(false); // Reset init on date change
        updateUrl(selectedBranch, newDate);
    };

    // Fetch Real Data
    const {
        data: plans,
        isLoading: plansLoading,
        isFetching,
        refetch: refetchPlans
    } = useProductionPlans(branchId, date, init);

    useEffect(() => {
        if (init && !isFetching) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInit(false);
        }
    }, [init, isFetching]);

    const initializePlans = () => {
        setInit(true);
    };

    const {
        data: accuracyData,
        isLoading: accuracyLoading,
        refetch: refetchAccuracy
    } = useProductionAccuracy(branchId, date);

    const handleRefresh = () => {
        refetchPlans();
        refetchAccuracy();
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Produksi & Perencanaan</h1>
                    <p className="text-muted-foreground">
                        Kelola rencana produksi harian dan monitoring realisasi (DSS Enabled)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedBranch}
                        onValueChange={handleBranchChange}
                        disabled={branchesLoading}
                    >
                        <SelectTrigger className="w-[200px] h-9">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches?.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date Picker (Single Date) */}
                    <div className="w-[240px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-9",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && handleDateChange(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button variant="outline" size="sm" className="h-9" onClick={handleRefresh}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>

                    <ProductionGuide />

                    <Button variant="outline" size="sm" className="h-9" asChild>
                        <Link href="/production/config">
                            <Settings className="mr-2 h-4 w-4" />
                            Konfigurasi DSS
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="operational" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="operational">Operasional Harian</TabsTrigger>
                    <TabsTrigger value="analytics">Laporan Akurasi</TabsTrigger>
                </TabsList>

                {/* OPERATIONAL TAB */}
                <TabsContent value="operational" className="space-y-4">
                    {/* Main Table */}
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Factory className="h-4 w-4" />
                                Daftar Rencana Produksi - {format(date, "dd MMMM yyyy")}
                            </CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Total SKU: {plans?.length || 0}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ProductionTable
                            plans={plans || []}
                            isLoading={plansLoading || (init && isFetching)}
                            date={date}
                            onInitialize={initializePlans}
                            branchId={branchId}
                        />
                    </CardContent>
                </TabsContent>

                {/* ANALYTICS TAB */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Laporan Akurasi & Evaluasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {accuracyLoading ? (
                                <div className="h-64 flex items-center justify-center">Loading Data...</div>
                            ) : (
                                <AccuracyChart data={accuracyData || []} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}


export default function ProductionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Production />
        </Suspense>
    );
}
