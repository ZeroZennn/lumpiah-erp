"use client";

import { useState } from "react";
import Link from "next/link";
import { Factory, Settings, Building2, Download } from "lucide-react";
import { productionPlansWithRealization } from "@/features/production/data/production.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
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
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { ProductionAnalytics } from "@/features/production/components/production-analytics";

import { DataTable } from "@/shared/components/ui/data-table";
import { columns } from "@/features/production/components/columns";

export default function ProductionPage() {
    const [selectedBranch, setSelectedBranch] = useState<string>("1");
    // const [searchQuery, setSearchQuery] = useState(""); // Managed by DataTable
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    // const [currentPage, setCurrentPage] = useState(1); // Managed by DataTable
    // const [rowsPerPage, setRowsPerPage] = useState(10); // Managed by DataTable

    const activeBranches = branches.filter((b) => b.isActive);
    const plans = productionPlansWithRealization.filter(
        (p) => p.branchId === Number(selectedBranch)
    );


    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Produksi & Perencanaan</h1>
                    <p className="text-muted-foreground">
                        Kelola rencana produksi harian dan monitoring realisasi
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[200px] h-9">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {activeBranches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <TabsTrigger value="analytics">Analytics & Recap</TabsTrigger>
                </TabsList>

                {/* OPERATIONAL TAB */}
                <TabsContent value="operational" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                            <div className="flex gap-2 ml-auto">
                                <Button variant="secondary">
                                    <span className="mr-2">Export</span>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Table */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Factory className="h-4 w-4" />
                                    Daftar Rencana Produksi
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={plans} searchKey="productName" searchPlaceholder="Cari produk..." />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ANALYTICS TAB */}
                <TabsContent value="analytics">
                    <ProductionAnalytics plans={plans} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
