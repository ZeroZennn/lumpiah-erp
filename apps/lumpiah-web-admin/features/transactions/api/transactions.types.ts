/**
 * Transaction Feature Types
 * Based on Prisma Transaction, TransactionItem models
 */

export interface TransactionItem {
  id: number;
  transactionId: string;
  productId: number;
  productName: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  branchId: number;
  branchName: string;
  userId: number;
  userName: string;
  transactionDate: string;
  status: "DRAFT" | "PAID" | "VOID";
  paymentMethod: "CASH" | "QRIS" | null;
  totalAmount: number;
  cashReceived: number | null;
  voidReason: string | null;
  items?: TransactionItem[];
}

export type TransactionStatus = "DRAFT" | "PAID" | "VOID";
export type PaymentMethod = "CASH" | "QRIS";
