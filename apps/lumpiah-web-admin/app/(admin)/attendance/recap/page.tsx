"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import {
    attendanceSummary,
} from "@/features/attendance/data/attendance.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";

export default function AttendanceRecapPage() {
    const [branchFilter, setBranchFilter] = useState<string>("all");

    const activeBranches = branches.filter((b) => b.isActive);

    const filteredSummary = attendanceSummary.filter((record) => {
        if (branchFilter === "all") return true;
        return record.branchName === activeBranches.find((b) => b.id === Number(branchFilter))?.name;
    });

    // Calculate overall stats
    const totalPresent = filteredSummary.reduce((sum, r) => sum + r.present, 0);
    const totalLate = filteredSummary.reduce((sum, r) => sum + r.late, 0);
    const totalAbsent = filteredSummary.reduce((sum, r) => sum + r.absent, 0);
    const totalLeave = filteredSummary.reduce((sum, r) => sum + r.leave, 0);
    const avgRate = (filteredSummary.reduce((sum, r) => sum + r.attendanceRate, 0) / filteredSummary.length || 0).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/attendance">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Rekap Kehadiran Bulanan</h1>
                    <p className="text-muted-foreground">
                        Januari 2025
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-primary">{avgRate}%</div>
                        <p className="text-xs text-muted-foreground">Rata-rata Kehadiran</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-2xl font-bold">{totalPresent}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Hadir</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                            <span className="text-2xl font-bold">{totalLate}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Terlambat</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-2xl font-bold">{totalAbsent}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Tidak Hadir</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <span className="text-2xl font-bold">{totalLeave}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Cuti/Izin</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="pt-6">
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="w-[200px]">
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
                </CardContent>
            </Card>

            {/* Recap Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Rekap Per Pegawai
                    </CardTitle>
                    <CardDescription>
                        Status kehadiran selama 23 hari kerja bulan ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead className="text-center">Hadir</TableHead>
                                <TableHead className="text-center">Terlambat</TableHead>
                                <TableHead className="text-center">Tidak Hadir</TableHead>
                                <TableHead className="text-center">Cuti</TableHead>
                                <TableHead className="text-center">Tingkat Kehadiran</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSummary.map((record) => (
                                <TableRow key={record.userId}>
                                    <TableCell className="font-medium">{record.userName}</TableCell>
                                    <TableCell>{record.branchName}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                            {record.present}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                            {record.late}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            {record.absent}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {record.leave}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={
                                                record.attendanceRate >= 95
                                                    ? "bg-emerald-500"
                                                    : record.attendanceRate >= 85
                                                        ? "bg-amber-500"
                                                        : "bg-red-500"
                                            }
                                        >
                                            {record.attendanceRate}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
