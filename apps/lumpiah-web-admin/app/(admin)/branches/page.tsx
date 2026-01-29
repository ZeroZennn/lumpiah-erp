"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Eye, MapPin, Users } from "lucide-react";
import { branches, branchStats } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

function formatCurrency(value: number): string {
    if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(1)} Jt`;
    }
    if (value >= 1000) {
        return `Rp ${(value / 1000).toFixed(0)} Rb`;
    }
    return `Rp ${value}`;
}

export default function BranchesPage() {
    const [branchList, setBranchList] = useState(branches);

    const handleToggleActive = (id: number) => {
        setBranchList((prev) =>
            prev.map((branch) =>
                branch.id === id ? { ...branch, isActive: !branch.isActive } : branch
            )
        );
    };

    const stats = branchStats;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Cabang</h1>
                    <p className="text-muted-foreground">
                        Kelola cabang dan konfigurasi struk
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Cabang
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{branchList.length}</div>
                        <p className="text-xs text-muted-foreground">Total Cabang</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">
                            {branchList.filter((b) => b.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Cabang Aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            {branchList.filter((b) => !b.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Cabang Nonaktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {stats.reduce((sum, s) => sum + s.employeeCount, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Pegawai</p>
                    </CardContent>
                </Card>
            </div>

            {/* Branch Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Cabang</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Cabang</TableHead>
                                <TableHead>Alamat</TableHead>
                                <TableHead className="text-center">Pegawai</TableHead>
                                <TableHead className="text-right">Pendapatan Hari Ini</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branchList.map((branch) => {
                                const stat = stats.find((s) => s.id === branch.id);
                                return (
                                    <TableRow key={branch.id}>
                                        <TableCell>
                                            <div className="font-medium">{branch.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {branch.address || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                {stat?.employeeCount || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(stat?.todayRevenue || 0)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Switch
                                                    checked={branch.isActive}
                                                    onCheckedChange={() => handleToggleActive(branch.id)}
                                                />
                                                <Badge
                                                    variant={branch.isActive ? "default" : "secondary"}
                                                >
                                                    {branch.isActive ? "Aktif" : "Nonaktif"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/branches/${branch.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Lihat Detail
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/branches/${branch.id}?edit=true`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Cabang
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
