/**
 * Transaction Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import { Transaction } from "../api/transactions.types";

export const transactions: Transaction[] = [
  {
    id: "TRX-001-290126-001",
    branchId: 1,
    branchName: "Cabang Pusat",
    userId: 3,
    userName: "Budi Kasir",
    transactionDate: "2025-01-29T08:15:00Z",
    status: "PAID",
    paymentMethod: "CASH",
    totalAmount: 25000,
    cashReceived: 30000,
    voidReason: null,
    items: [
      { id: 1, transactionId: "TRX-001-290126-001", productId: 1, productName: "Lumpia Kecil", quantity: 3, priceAtTransaction: 5000, subtotal: 15000 },
      { id: 2, transactionId: "TRX-001-290126-001", productId: 4, productName: "Es Teh Manis", quantity: 2, priceAtTransaction: 5000, subtotal: 10000 },
    ],
  },
  {
    id: "TRX-001-290126-002",
    branchId: 1,
    branchName: "Cabang Pusat",
    userId: 3,
    userName: "Budi Kasir",
    transactionDate: "2025-01-29T09:30:00Z",
    status: "PAID",
    paymentMethod: "QRIS",
    totalAmount: 45000,
    cashReceived: null,
    voidReason: null,
    items: [
      { id: 3, transactionId: "TRX-001-290126-002", productId: 7, productName: "Paket Keluarga", quantity: 1, priceAtTransaction: 45000, subtotal: 45000 },
    ],
  },
  {
    id: "TRX-001-290126-003",
    branchId: 1,
    branchName: "Cabang Pusat",
    userId: 3,
    userName: "Budi Kasir",
    transactionDate: "2025-01-29T10:45:00Z",
    status: "VOID",
    paymentMethod: "CASH",
    totalAmount: 16000,
    cashReceived: 20000,
    voidReason: "Pelanggan membatalkan pesanan sebelum diambil",
    items: [
      { id: 4, transactionId: "TRX-001-290126-003", productId: 2, productName: "Lumpia Besar", quantity: 2, priceAtTransaction: 8000, subtotal: 16000 },
    ],
  },
  {
    id: "TRX-002-290126-001",
    branchId: 2,
    branchName: "Cabang Timur",
    userId: 5,
    userName: "Sari Kasir",
    transactionDate: "2025-01-29T08:00:00Z",
    status: "PAID",
    paymentMethod: "CASH",
    totalAmount: 33000,
    cashReceived: 50000,
    voidReason: null,
    items: [
      { id: 5, transactionId: "TRX-002-290126-001", productId: 1, productName: "Lumpia Kecil", quantity: 4, priceAtTransaction: 5500, subtotal: 22000 },
      { id: 6, transactionId: "TRX-002-290126-001", productId: 5, productName: "Es Jeruk", quantity: 1, priceAtTransaction: 7000, subtotal: 7000 },
    ],
  },
  {
    id: "TRX-002-290126-002",
    branchId: 2,
    branchName: "Cabang Timur",
    userId: 5,
    userName: "Sari Kasir",
    transactionDate: "2025-01-29T11:20:00Z",
    status: "PAID",
    paymentMethod: "QRIS",
    totalAmount: 60000,
    cashReceived: null,
    voidReason: null,
  },
  {
    id: "TRX-003-290126-001",
    branchId: 3,
    branchName: "Cabang Barat",
    userId: 7,
    userName: "Andi Kasir",
    transactionDate: "2025-01-29T09:00:00Z",
    status: "PAID",
    paymentMethod: "CASH",
    totalAmount: 28000,
    cashReceived: 30000,
    voidReason: null,
  },
  {
    id: "TRX-005-290126-001",
    branchId: 5,
    branchName: "Cabang Depok",
    userId: 9,
    userName: "Dewi Kasir",
    transactionDate: "2025-01-29T08:30:00Z",
    status: "PAID",
    paymentMethod: "QRIS",
    totalAmount: 24000,
    cashReceived: null,
    voidReason: null,
  },
  {
    id: "TRX-005-290126-002",
    branchId: 5,
    branchName: "Cabang Depok",
    userId: 9,
    userName: "Dewi Kasir",
    transactionDate: "2025-01-29T12:00:00Z",
    status: "PAID",
    paymentMethod: "CASH",
    totalAmount: 35000,
    cashReceived: 50000,
    voidReason: null,
  },
];

export function getTransactionById(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
