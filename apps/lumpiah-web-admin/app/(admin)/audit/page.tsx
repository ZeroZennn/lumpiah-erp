"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Database, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AuditLogFilters } from "@/features/audit-logs/components/audit-log-filters";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";
import { useAuditLogs } from "@/features/audit-logs/api/use-audit-logs";
import { useUsers } from "@/features/users/api/use-users";

function AuditLogContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Parse filters from URL
    const filters = useMemo(() => ({
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 10,
        search: searchParams.get("search") || undefined,
        actionType: searchParams.get("actionType") || undefined,
        userId: searchParams.get("userId") || undefined,
        targetTable: searchParams.get("targetTable") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
    }), [searchParams]);

    // Query Audit Logs
    const { data: auditData, isLoading } = useAuditLogs(filters);

    // Query Users for Filter
    const { data: usersData } = useUsers();

    const handleFilterChange = (key: string, value: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Reset to page 1 on filter change (except when changing page itself)
        if (key !== "page") {
            params.set("page", "1");
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">
                        Riwayat perubahan data sistem (System Audit Trail)
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <AuditLogFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        users={usersData || []}
                    />
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Daftar Aktivitas
                    </CardTitle>
                    <CardDescription>
                        Menampilkan {auditData?.total || 0} aktivitas tercatat
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditLogTable
                        data={auditData?.data || []}
                        isLoading={isLoading}
                        total={auditData?.total || 0}
                        page={filters.page}
                        pageSize={filters.limit}
                        onPageChange={(page) => handleFilterChange("page", page.toString())}
                        onPageSizeChange={(limit) => handleFilterChange("limit", limit.toString())}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuditLogPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <AuditLogContent />
        </Suspense>
    );
}
