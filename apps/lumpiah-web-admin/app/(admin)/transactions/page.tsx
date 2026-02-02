"use client";

import { Suspense } from 'react';
import { TransactionTable } from '@/features/transactions/components/transaction-table';
import { useSearchParams } from 'next/navigation';
import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

function Transactions() {
    const searchParams = useSearchParams();

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');

    const formatFilterDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = parseISO(dateStr);
        return isValid(date) ? format(date, 'dd MMM yyyy', { locale: id }) : null;
    };

    const startDate = formatFilterDate(startDateStr);
    const endDate = formatFilterDate(endDateStr);

    let filterDesc = "Menampilkan seluruh transaksi";

    if (startDate && endDate) {
        if (startDate === endDate) {
            filterDesc = `Transaksi pada ${startDate}`;
        } else {
            filterDesc = `Transaksi dari ${startDate} s/d ${endDate}`;
        }
    } else {
        filterDesc = `Transaksi hari ini (${format(new Date(), 'dd MMM yyyy', { locale: id })})`;
    }

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Transaksi</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                    {filterDesc}
                </p>
            </div>

            <TransactionTable />
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Transactions />
        </Suspense>
    );
}
