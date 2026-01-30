"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useBranches } from "@/features/branches/api/use-branches";
import { BranchTable } from "@/features/branches/components/branch-table";


export default function BranchesPage() {
    const { data: branchList, isLoading, isError } = useBranches();

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
                    <BranchTable data={branches as any} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>
    );
}
