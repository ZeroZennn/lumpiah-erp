export interface DashboardFilter {
  branchId?: number | 'all';
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentMethodStat {
  method: string; // 'CASH' | 'QRIS'
  amount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  avgBasketSize: number;
  growthRate: number;
  paymentMethods: PaymentMethodStat[];
}

export interface RevenueTrend {
  date: string; // YYYY-MM-DD
  revenue: number;
  transactions: number;
}

export interface BranchPerformance {
  branchId: number;
  branchName: string;
  totalRevenue: number;
  transactionCount: number;
}

export interface OperationalStatus {
  branchId: number;
  branchName: string;
  isClosed: boolean;
  closingTime?: string; // ISO String
  voidRate: number; // Percentage
  hasFraudAlert: boolean;
}

export interface ProductionSummary {
  planId: number;
  branchName: string;
  productName: string;
  recommendedQty: number;
  actualQty: number;
  status: string; // 'Not Started' | 'In Progress' | 'Completed'
}
