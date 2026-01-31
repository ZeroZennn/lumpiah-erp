import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Transaction } from '../api/transaction.types';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { WifiOff } from 'lucide-react';
import { useTransaction } from '../api/use-transactions';
import { Skeleton } from "@/shared/components/ui/skeleton";

interface TransactionDetailDialogProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
}

export function TransactionDetailDialog({ transaction, isOpen, onClose }: TransactionDetailDialogProps) {
    const { data: fullTransaction, isLoading } = useTransaction(transaction?.id || '', isOpen);

    // Merge basic info with full info if available (fallback to transaction which is non-null here)
    const displayTransaction = fullTransaction || transaction!;

    if (!transaction) return null; // Logic check: transaction prop is required for ID

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[400px] sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detail Transaksi</DialogTitle>
                    <DialogDescription>
                        ID: <span className="font-mono">{transaction.id.split('-')[0]}...</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Waktu</p>
                            <p className="font-medium">{format(new Date(displayTransaction.transactionDate), 'dd MMM yyyy, HH:mm')}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Cabang</p>
                            <p className="font-medium">{displayTransaction.branch?.name || transaction.branch?.name}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Kasir</p>
                            <p className="font-medium">{displayTransaction.user?.fullname || transaction.user?.fullname}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={displayTransaction.status === 'PAID' ? 'default' : displayTransaction.status === 'VOID' ? 'destructive' : 'outline'}>
                                    {displayTransaction.status}
                                </Badge>
                                {displayTransaction.isOfflineSynced && (
                                    <span className="text-xs text-amber-600 flex items-center gap-1 border border-amber-200 px-1.5 py-0.5 rounded-md bg-amber-50">
                                        Offline <WifiOff className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Items */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Rincian Belanja</h4>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayTransaction.transactionItems?.map((item: any) => (
                                    <div key={String(item.id)} className="flex justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{item.product?.name || 'Produk'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} x {Number(item.priceAtTransaction).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <p className="font-mono">{Number(item.subtotal).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
                                    </div>
                                ))}
                                {!displayTransaction.transactionItems?.length && (
                                    <p className="text-muted-foreground text-sm italic">Tidak ada item.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Payment Summary */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-bold text-base">
                            <span>Total Belanja</span>
                            <span>{Number(displayTransaction.totalAmount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Metode Bayar</span>
                            <span>{displayTransaction.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Cash Diterima</span>
                            <span>{Number(displayTransaction.cashReceived || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                        </div>
                        {displayTransaction.paymentMethod === 'CASH' && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Kembalian</span>
                                <span>{(Number(displayTransaction.cashReceived || 0) - Number(displayTransaction.totalAmount)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                            </div>
                        )}
                    </div>

                    {/* Void Info */}
                    {transaction.status === 'VOID' && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-sm">
                            <p className="font-bold text-red-700">VOIDED</p>
                            <p className="text-red-600">Alasan: {transaction.voidReason}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
