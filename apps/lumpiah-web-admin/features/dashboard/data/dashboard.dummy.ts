/**
 * Dashboard Dummy Data
 * Based on Prisma schema - ready for API integration
 */

export interface DailyStats {
  totalTransactions: number;
  totalRevenue: number;
  cashRevenue: number;
  qrisRevenue: number;
  growthRate: number; // percentage vs last period
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  transactions: number;
}

export interface BranchStatus {
  id: number;
  name: string;
  isActive: boolean;
  todayTransactions: number;
  todayRevenue: number;
}

export interface StatCardData {
  title: string;
  value: string;
  change: number; // percentage
  changeLabel: string;
  chartData: number[];
}

// Dummy daily stats
export const dailyStats: DailyStats = {
  totalTransactions: 147,
  totalRevenue: 4850000,
  cashRevenue: 3250000,
  qrisRevenue: 1600000,
  growthRate: 12.5,
};

// Dummy revenue trend (7 days)
export const revenueData: RevenueDataPoint[] = [
  { date: "23 Jan", revenue: 3200000, transactions: 98 },
  { date: "24 Jan", revenue: 4100000, transactions: 125 },
  { date: "25 Jan", revenue: 3800000, transactions: 112 },
  { date: "26 Jan", revenue: 5200000, transactions: 156 },
  { date: "27 Jan", revenue: 4700000, transactions: 142 },
  { date: "28 Jan", revenue: 4500000, transactions: 138 },
  { date: "29 Jan", revenue: 4850000, transactions: 147 },
];

// Dummy branch statuses
export const branchStatuses: BranchStatus[] = [
  {
    id: 1,
    name: "Cabang Pusat",
    isActive: true,
    todayTransactions: 82,
    todayRevenue: 2750000,
  },
  {
    id: 2,
    name: "Cabang Timur",
    isActive: true,
    todayTransactions: 45,
    todayRevenue: 1450000,
  },
  {
    id: 3,
    name: "Cabang Barat",
    isActive: true,
    todayTransactions: 20,
    todayRevenue: 650000,
  },
  {
    id: 4,
    name: "Cabang Selatan",
    isActive: false,
    todayTransactions: 0,
    todayRevenue: 0,
  },
];

// Stat cards data with mini charts
export const statCards: StatCardData[] = [
  {
    title: "Total Pendapatan",
    value: "Rp 4.85 Jt",
    change: 12.5,
    changeLabel: "vs kemarin",
    chartData: [32, 41, 38, 52, 47, 45, 48],
  },
  {
    title: "Transaksi",
    value: "147",
    change: 8.2,
    changeLabel: "vs kemarin",
    chartData: [98, 125, 112, 156, 142, 138, 147],
  },
  {
    title: "Cash / QRIS",
    value: "67% / 33%",
    change: -2.3,
    changeLabel: "cash ratio",
    chartData: [70, 68, 72, 65, 69, 66, 67],
  },
];

// Format currency helper
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)} Jt`;
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)} Rb`;
  }
  return `Rp ${value}`;
}

// Monthly comparison data
export const monthlyComparison = {
  currentMonth: {
    label: "Januari 2026",
    revenue: 142500000,
    transactions: 4250,
  },
  lastMonth: {
    label: "Desember 2025",
    revenue: 126700000,
    transactions: 3890,
  },
  growthPercentage: 12.5,
};
