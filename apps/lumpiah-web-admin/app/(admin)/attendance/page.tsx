"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Filter, FileBarChart } from "lucide-react";
import {
    attendanceRecords,
    formatTime,
    getStatusColor,
    getStatusLabel,
} from "@/features/attendance/data/attendance.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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

function AttendancePage() {
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const activeBranches = branches.filter((b) => b.isActive);

    const filteredRecords = attendanceRecords.filter((record) => {
        const matchesBranch = branchFilter === "all" || record.branchId === Number(branchFilter);
        const matchesStatus = statusFilter === "all" || record.status === statusFilter;
        return matchesBranch && matchesStatus;
    });

    // Calculate today's stats
    const presentCount = filteredRecords.filter((r) => r.status === "PRESENT").length;
    const lateCount = filteredRecords.filter((r) => r.status === "LATE").length;
    const absentCount = filteredRecords.filter((r) => r.status === "ABSENT").length;
    const leaveCount = filteredRecords.filter((r) => r.status === "LEAVE").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kehadiran Pegawai</h1>
                    <p className="text-muted-foreground">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/attendance/recap">
                        <FileBarChart className="mr-2 h-4 w-4" />
                        Rekap Bulanan
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-2xl font-bold">{presentCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Hadir Tepat Waktu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                            <span className="text-2xl font-bold">{lateCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Terlambat</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-2xl font-bold">{absentCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Tidak Hadir</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <span className="text-2xl font-bold">{leaveCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Cuti/Izin</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-4 w-4" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="PRESENT">Hadir</SelectItem>
                                <SelectItem value="LATE">Terlambat</SelectItem>
                                <SelectItem value="ABSENT">Tidak Hadir</SelectItem>
                                <SelectItem value="LEAVE">Cuti/Izin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kehadiran</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead className="text-center">Jam Masuk</TableHead>
                                <TableHead className="text-center">Jam Pulang</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Tidak ada data kehadiran
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.userName}</TableCell>
                                        <TableCell>{record.branchName}</TableCell>
                                        <TableCell className="text-center font-mono">
                                            {formatTime(record.clockIn)}
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {formatTime(record.clockOut)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getStatusColor(record.status)}>
                                                {getStatusLabel(record.status)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

import { Suspense } from "react";
import { RoleGuard } from "@/features/auth/components/role-guard";

export default function AttendancePageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RoleGuard allowedRoles={['Admin', 'Owner']}>
                <AttendancePage />
            </RoleGuard>
        </Suspense>
    );
}
