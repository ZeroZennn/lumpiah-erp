/**
 * Branch Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import { Branch, BranchStats } from "../api/branches.types";

export const branches: Branch[] = [
  {
    id: 1,
    name: "Cabang Pusat",
    address: "Jl. Merdeka No. 123, Jakarta Pusat",
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    receiptFooter: "Terima kasih telah berbelanja di Lumpiah! 🥟",
  },
  {
    id: 2,
    name: "Cabang Timur",
    address: "Jl. Raya Bekasi No. 45, Bekasi",
    isActive: true,
    createdAt: "2024-03-20T10:30:00Z",
    receiptFooter: "Lumpiah Cabang Timur - Selalu fresh!",
  },
  {
    id: 3,
    name: "Cabang Barat",
    address: "Jl. Puri Indah No. 78, Jakarta Barat",
    isActive: true,
    createdAt: "2024-05-10T09:00:00Z",
    receiptFooter: "Promo Khusus Member 10% OFF!",
  },
  {
    id: 4,
    name: "Cabang Selatan",
    address: "Jl. Fatmawati No. 200, Jakarta Selatan",
    isActive: false,
    createdAt: "2024-07-01T11:00:00Z",
    receiptFooter: "Cabang Selatan - Sementara tutup untuk renovasi",
  },
  {
    id: 5,
    name: "Cabang Depok",
    address: "Jl. Margonda Raya No. 350, Depok",
    isActive: true,
    createdAt: "2025-01-05T08:00:00Z",
    receiptFooter: "Grand Opening! Diskon 20% all menu",
  },
];

export const branchStats: BranchStats[] = [
  {
    id: 1,
    name: "Cabang Pusat",
    todayTransactions: 82,
    todayRevenue: 2750000,
    employeeCount: 8,
  },
  {
    id: 2,
    name: "Cabang Timur",
    todayTransactions: 45,
    todayRevenue: 1450000,
    employeeCount: 5,
  },
  {
    id: 3,
    name: "Cabang Barat",
    todayTransactions: 20,
    todayRevenue: 650000,
    employeeCount: 4,
  },
  {
    id: 4,
    name: "Cabang Selatan",
    todayTransactions: 0,
    todayRevenue: 0,
    employeeCount: 3,
  },
  {
    id: 5,
    name: "Cabang Depok",
    todayTransactions: 35,
    todayRevenue: 1100000,
    employeeCount: 4,
  },
];

export function getBranchById(id: number): Branch | undefined {
  return branches.find((b) => b.id === id);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
