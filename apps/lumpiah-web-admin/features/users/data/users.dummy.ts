/**
 * User Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import { Role, User, AuditLog, PERMISSIONS } from "../api/users.types";

export const roles: Role[] = [
  {
    id: 1,
    name: "Superadmin",
    permissions: Object.values(PERMISSIONS),
  },
  {
    id: 2,
    name: "Owner",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.BRANCH_VIEW,
      PERMISSIONS.BRANCH_MANAGE,
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.PRODUCT_MANAGE,
      PERMISSIONS.PRICE_MANAGE,
      PERMISSIONS.PRODUCTION_VIEW,
      PERMISSIONS.PRODUCTION_MANAGE,
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.TRANSACTION_VOID,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.ATTENDANCE_VIEW,
      PERMISSIONS.ATTENDANCE_MANAGE,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_MANAGE,
    ],
  },
  {
    id: 3,
    name: "Supervisor",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.PRODUCTION_VIEW,
      PERMISSIONS.PRODUCTION_MANAGE,
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.ATTENDANCE_VIEW,
    ],
  },
  {
    id: 4,
    name: "Kasir",
    permissions: [
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.PRODUCTION_VIEW,
    ],
  },
];

export const users: User[] = [
  {
    id: 1,
    branchId: null,
    roleId: 1,
    email: "admin@lumpiah.com",
    name: "Administrator",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: "2025-01-29T08:00:00Z",
    branchName: undefined,
    roleName: "Superadmin",
  },
  {
    id: 2,
    branchId: 1,
    roleId: 2,
    email: "owner@lumpiah.com",
    name: "Ahmad Pemilik",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    lastLogin: "2025-01-29T07:30:00Z",
    branchName: "Cabang Pusat",
    roleName: "Owner",
  },
  {
    id: 3,
    branchId: 1,
    roleId: 3,
    email: "supervisor.pusat@lumpiah.com",
    name: "Budi Sudrajat",
    isActive: true,
    createdAt: "2024-02-01T10:00:00Z",
    lastLogin: "2025-01-29T06:45:00Z",
    branchName: "Cabang Pusat",
    roleName: "Supervisor",
  },
  {
    id: 4,
    branchId: 1,
    roleId: 4,
    email: "sari.kasir@lumpiah.com",
    name: "Sari Wulandari",
    isActive: true,
    createdAt: "2024-03-01T08:00:00Z",
    lastLogin: "2025-01-29T07:55:00Z",
    branchName: "Cabang Pusat",
    roleName: "Kasir",
  },
  {
    id: 5,
    branchId: 2,
    roleId: 3,
    email: "supervisor.timur@lumpiah.com",
    name: "Andi Pratama",
    isActive: true,
    createdAt: "2024-04-01T09:00:00Z",
    lastLogin: "2025-01-29T07:45:00Z",
    branchName: "Cabang Timur",
    roleName: "Supervisor",
  },
  {
    id: 6,
    branchId: 2,
    roleId: 4,
    email: "dewi.kasir@lumpiah.com",
    name: "Dewi Anggraini",
    isActive: false,
    createdAt: "2024-05-01T10:00:00Z",
    lastLogin: "2025-01-15T16:00:00Z",
    branchName: "Cabang Timur",
    roleName: "Kasir",
  },
  {
    id: 7,
    branchId: 3,
    roleId: 3,
    email: "supervisor.barat@lumpiah.com",
    name: "Rudi Hermawan",
    isActive: true,
    createdAt: "2024-06-01T08:00:00Z",
    lastLogin: "2025-01-28T17:00:00Z",
    branchName: "Cabang Barat",
    roleName: "Supervisor",
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    userName: "Administrator",
    tableName: "products",
    recordId: "1",
    action: "UPDATE",
    oldData: { basePrice: 4500 },
    newData: { basePrice: 5000 },
    createdAt: "2025-01-29T10:30:00Z",
  },
  {
    id: 2,
    userId: 2,
    userName: "Ahmad Pemilik",
    tableName: "branches",
    recordId: "5",
    action: "CREATE",
    oldData: null,
    newData: { name: "Cabang Depok", address: "Jl. Margonda Raya No. 350" },
    createdAt: "2025-01-25T09:00:00Z",
  },
  {
    id: 3,
    userId: 1,
    userName: "Administrator",
    tableName: "users",
    recordId: "6",
    action: "UPDATE",
    oldData: { isActive: true },
    newData: { isActive: false },
    createdAt: "2025-01-20T14:15:00Z",
  },
  {
    id: 4,
    userId: 2,
    userName: "Ahmad Pemilik",
    tableName: "branch_product_prices",
    recordId: "7",
    action: "CREATE",
    oldData: null,
    newData: { branchId: 5, productId: 1, price: 4500 },
    createdAt: "2025-01-25T11:00:00Z",
  },
  {
    id: 5,
    userId: 3,
    userName: "Budi Sudrajat",
    tableName: "transactions",
    recordId: "TRX-001-290126-003",
    action: "UPDATE",
    oldData: { status: "PAID" },
    newData: { status: "VOID", voidReason: "Pelanggan membatalkan pesanan" },
    createdAt: "2025-01-29T10:50:00Z",
  },
];

export function getRoleById(id: number): Role | undefined {
  return roles.find((r) => r.id === id);
}

export function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
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

export function getActionColor(action: string): string {
  switch (action) {
    case "CREATE":
      return "bg-emerald-500";
    case "UPDATE":
      return "bg-amber-500";
    case "DELETE":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}
