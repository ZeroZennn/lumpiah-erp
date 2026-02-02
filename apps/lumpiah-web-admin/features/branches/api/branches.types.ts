/**
 * Branch Feature Types
 * Based on Prisma Branch model
 */

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  receiptFooter?: string;
  _count?: {
    users: number;
  };
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  receiptFooter?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  isActive?: boolean;
  receiptFooter?: string;
}

export interface BranchStats {
  id: number;
  name: string;
  todayTransactions: number;
  todayRevenue: number;
  employeeCount: number;
}
