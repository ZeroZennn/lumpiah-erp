"use client";

import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Eye, MapPin, Users } from "lucide-react";
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
import { useBranches, useUpdateBranchStatus } from "@/features/branches/api/use-branches";
import { notify } from "@/shared/lib/notify";


export default function BranchesPage() {
    const { data: branchList, isLoading, isError } = useBranches();
    const updateStatusMutation = useUpdateBranchStatus();

    const handleToggleActive = (id: number, currentStatus: boolean) => {
        updateStatusMutation.mutate(
            { id, isActive: !currentStatus },
            {
                onSuccess: () => {
                    notify.success(`Cabang ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
                },
                onError: (error) => {
                    console.error("Failed to update status", error);
                    notify.error("Gagal mengubah status cabang");
                }
            }
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading branches...</div>;
    }

    if (isError) {
        return <div className="p-8 text-center text-red-500">Failed to load branches.</div>;
    }

    const branches = branchList || [];

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
                <Button className="gap-2" asChild>
                    <Link href="/branches/new">
                        <Plus className="h-4 w-4" />
                        Tambah Cabang
                    </Link>
                </Button>
            </div>

            {/* Stats Cards - Placeholder for now as API doesn't return stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{branches.length}</div>
                        <p className="text-xs text-muted-foreground">Total Cabang</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">
                            {branches.filter((b) => b.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Cabang Aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            {branches.filter((b) => !b.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Cabang Nonaktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            -
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
                            {branches.map((branch) => {
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
                                                {branch._count?.users ?? 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            -
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Switch
                                                    checked={branch.isActive}
                                                    onCheckedChange={() => handleToggleActive(branch.id, branch.isActive)}
                                                    disabled={updateStatusMutation.isPending}
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
