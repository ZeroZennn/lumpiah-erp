export interface TransactionItem {
  id: number;
  transactionId: string;
  productId: number;
  quantity: number;
  priceAtTransaction: string; // Decimal string
  subtotal: string; // Decimal string
  product: {
    id: number;
    name: string;
    unit: string;
  };
}

export interface Transaction {
  id: string;
  branchId: number;
  userId: number;
  transactionDate: string;
  status: 'PAID' | 'VOID' | 'PENDING_VOID';
  paymentMethod: 'CASH' | 'QRIS' | null;
  totalAmount: string;
  cashReceived: string | null;
  voidReason: string | null;
  isOfflineSynced: boolean;
  user: {
    fullname: string;
  };
  branch: {
    name: string;
  };
  transactionItems?: TransactionItem[];
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransactionFilters {
  branchId?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  search?: string;
  isOfflineSynced?: boolean;
  page: number;
  limit: number;
}
