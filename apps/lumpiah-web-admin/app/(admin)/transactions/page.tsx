"use client";

import { TransactionTable } from '@/features/transactions/components/transaction-table';

export default function TransactionsPage() {
    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Transaksi</h1>
                <p className="text-muted-foreground">
                    Pantau dan kelola seluruh transaksi penjualan dari semua cabang.
                </p>
            </div>

            <TransactionTable />
        </div>
    );
}
