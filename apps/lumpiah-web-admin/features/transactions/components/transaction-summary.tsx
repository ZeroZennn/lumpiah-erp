import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { CreditCard, ShoppingBag, AlertCircle, Banknote } from "lucide-react";
import { formatCurrency } from "@/shared/lib/utils";

interface TransactionSummaryProps {
    totalRevenue: number;
    totalTransactions: number;
    totalVoid: number;
    voidAmount: number;
}

export function TransactionSummary({
    totalRevenue,
    totalTransactions,
    totalVoid,
    voidAmount
}: TransactionSummaryProps) {

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                    <Banknote className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                        Omset kotor hari ini
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTransactions}</div>
                    <p className="text-xs text-muted-foreground">
                        Transaksi berhasil (PAID)
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transaksi Void</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalVoid}</div>
                    <p className="text-xs text-muted-foreground">
                        Transaksi dibatalkan
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nilai Void</CardTitle>
                    <CreditCard className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(voidAmount)}</div>
                    <p className="text-xs text-muted-foreground">
                        Potensi omset hilang
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
