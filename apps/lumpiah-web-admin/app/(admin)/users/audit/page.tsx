"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Filter } from "lucide-react";
import { auditLogs, formatDateTime, getActionColor } from "@/features/users/data/user.dummy";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";

export default function AuditLogPage() {
    const [tableFilter, setTableFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");

    const tables = [...new Set(auditLogs.map((log) => log.tableName))];

    const filteredLogs = auditLogs.filter((log) => {
        const matchesTable = tableFilter === "all" || log.tableName === tableFilter;
        const matchesAction = actionFilter === "all" || log.action === actionFilter;
        return matchesTable && matchesAction;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">
                        Riwayat perubahan data sistem
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{auditLogs.length}</div>
                        <p className="text-xs text-muted-foreground">Total Log</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">
                            {auditLogs.filter((l) => l.action === "CREATE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">CREATE</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">
                            {auditLogs.filter((l) => l.action === "UPDATE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">UPDATE</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                            {auditLogs.filter((l) => l.action === "DELETE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">DELETE</p>
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
                        <Select value={tableFilter} onValueChange={setTableFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Semua Tabel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tabel</SelectItem>
                                {tables.map((table) => (
                                    <SelectItem key={table} value={table}>
                                        {table}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Semua Aksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Aksi</SelectItem>
                                <SelectItem value="CREATE">CREATE</SelectItem>
                                <SelectItem value="UPDATE">UPDATE</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Daftar Log
                    </CardTitle>
                    <CardDescription>
                        Setiap perubahan data dicatat untuk keamanan dan akuntabilitas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Tabel</TableHead>
                                <TableHead>Record ID</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Tidak ada log yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                            {formatDateTime(log.createdAt)}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.userName || "-"}</TableCell>
                                        <TableCell className="font-mono text-sm">{log.tableName}</TableCell>
                                        <TableCell className="font-mono text-sm">{log.recordId}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getActionColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Detail
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Detail Perubahan</DialogTitle>
                                                        <DialogDescription>
                                                            {log.tableName} #{log.recordId} oleh {log.userName}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-muted-foreground">Waktu</p>
                                                                <p className="font-medium">{formatDateTime(log.createdAt)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Aksi</p>
                                                                <Badge className={getActionColor(log.action)}>
                                                                    {log.action}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {log.oldData && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-2 text-red-600">
                                                                    Data Lama (Before)
                                                                </p>
                                                                <pre className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs overflow-auto">
                                                                    {JSON.stringify(log.oldData, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {log.newData && (
                                                            <div>
                                                                <p className="text-sm font-medium mb-2 text-emerald-600">
                                                                    Data Baru (After)
                                                                </p>
                                                                <pre className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs overflow-auto">
                                                                    {JSON.stringify(log.newData, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
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
