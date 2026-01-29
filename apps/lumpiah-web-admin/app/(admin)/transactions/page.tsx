"use client";

import { useState } from "react";
import { Search, Filter, Eye, AlertCircle } from "lucide-react";
import { transactions, formatCurrency, formatDateTime } from "@/features/transactions/data/transactions.dummy";
import { branches } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";

export default function TransactionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");

    const activeBranches = branches.filter((b) => b.isActive);

    const filteredTransactions = transactions.filter((trx) => {
        const matchesSearch =
            trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.userName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = branchFilter === "all" || trx.branchId === Number(branchFilter);
        const matchesStatus = statusFilter === "all" || trx.status === statusFilter;
        const matchesPayment = paymentFilter === "all" || trx.paymentMethod === paymentFilter;
        return matchesSearch && matchesBranch && matchesStatus && matchesPayment;
    });

    // Calculate totals (excluding VOID)
    const paidTransactions = filteredTransactions.filter((t) => t.status === "PAID");
    const totalRevenue = paidTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashRevenue = paidTransactions
        .filter((t) => t.paymentMethod === "CASH")
        .reduce((sum, t) => sum + t.totalAmount, 0);
    const qrisRevenue = paidTransactions
        .filter((t) => t.paymentMethod === "QRIS")
        .reduce((sum, t) => sum + t.totalAmount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
                    <p className="text-muted-foreground">
                        Data transaksi dari semua cabang
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{paidTransactions.length}</div>
                        <p className="text-xs text-muted-foreground">Total Transaksi (PAID)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(cashRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Tunai (Cash)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(qrisRevenue)}</div>
                        <p className="text-xs text-muted-foreground">QRIS</p>
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
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Cari ID atau kasir..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[180px]">
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
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="PAID">PAID</SelectItem>
                                <SelectItem value="VOID">VOID</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Pembayaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="QRIS">QRIS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Transaksi</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Kasir</TableHead>
                                <TableHead>Waktu</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-center">Pembayaran</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                        Tidak ada transaksi yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <TableRow key={trx.id} className={trx.status === "VOID" ? "bg-red-50" : ""}>
                                        <TableCell className="font-mono text-sm">{trx.id}</TableCell>
                                        <TableCell>{trx.branchName}</TableCell>
                                        <TableCell>{trx.userName}</TableCell>
                                        <TableCell className="text-sm">{formatDateTime(trx.transactionDate)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(trx.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {trx.paymentMethod && (
                                                <Badge variant={trx.paymentMethod === "CASH" ? "outline" : "secondary"}>
                                                    {trx.paymentMethod}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={trx.status === "PAID" ? "default" : "destructive"}>
                                                {trx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Detail Transaksi</DialogTitle>
                                                        <DialogDescription>{trx.id}</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-muted-foreground">Cabang</p>
                                                                <p className="font-medium">{trx.branchName}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Kasir</p>
                                                                <p className="font-medium">{trx.userName}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Waktu</p>
                                                                <p className="font-medium">{formatDateTime(trx.transactionDate)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Pembayaran</p>
                                                                <p className="font-medium">{trx.paymentMethod}</p>
                                                            </div>
                                                        </div>

                                                        {trx.items && trx.items.length > 0 && (
                                                            <>
                                                                <Separator />
                                                                <div>
                                                                    <p className="text-sm font-medium mb-2">Item</p>
                                                                    <div className="space-y-2 text-sm">
                                                                        {trx.items.map((item) => (
                                                                            <div key={item.id} className="flex justify-between">
                                                                                <span>
                                                                                    {item.productName} x{item.quantity}
                                                                                </span>
                                                                                <span>{formatCurrency(item.subtotal)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        <Separator />
                                                        <div className="flex justify-between font-bold">
                                                            <span>Total</span>
                                                            <span>{formatCurrency(trx.totalAmount)}</span>
                                                        </div>

                                                        {trx.status === "VOID" && trx.voidReason && (
                                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-red-700">
                                                                            Transaksi Dibatalkan
                                                                        </p>
                                                                        <p className="text-sm text-red-600 mt-1">
                                                                            {trx.voidReason}
                                                                        </p>
                                                                    </div>
                                                                </div>
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
