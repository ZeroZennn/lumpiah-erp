/**
 * User Feature Types
 * Based on Prisma User, Role, AuditLog models
 */

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface User {
  id: number;
  branchId: number | null;
  roleId: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  branchName?: string;
  roleName?: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  tableName: string;
  recordId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  branchId?: number;
  roleId: number;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  branchId?: number;
  roleId?: number;
  isActive?: boolean;
}

// Permission enum for role-based access
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  BRANCH_VIEW: "branch:view",
  BRANCH_MANAGE: "branch:manage",
  PRODUCT_VIEW: "product:view",
  PRODUCT_MANAGE: "product:manage",
  PRICE_MANAGE: "price:manage",
  PRODUCTION_VIEW: "production:view",
  PRODUCTION_MANAGE: "production:manage",
  TRANSACTION_VIEW: "transaction:view",
  TRANSACTION_VOID: "transaction:void",
  REPORT_VIEW: "report:view",
  ATTENDANCE_VIEW: "attendance:view",
  ATTENDANCE_MANAGE: "attendance:manage",
  USER_VIEW: "user:view",
  USER_MANAGE: "user:manage",
  AUDIT_VIEW: "audit:view",
} as const;
