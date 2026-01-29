/**
 * Product Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import { Category, Product, BranchProductPrice, PriceAuditLog } from "../api/products.types";

export const categories: Category[] = [
  { id: 1, name: "Lumpia" },
  { id: 2, name: "Minuman" },
  { id: 3, name: "Paket" },
  { id: 4, name: "Snack" },
];

export const products: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Lumpia Kecil",
    unit: "pcs",
    basePrice: 5000,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    category: { id: 1, name: "Lumpia" },
  },
  {
    id: 2,
    categoryId: 1,
    name: "Lumpia Besar",
    unit: "pcs",
    basePrice: 8000,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    category: { id: 1, name: "Lumpia" },
  },
  {
    id: 3,
    categoryId: 1,
    name: "Lumpia Spesial",
    unit: "pcs",
    basePrice: 12000,
    isActive: true,
    createdAt: "2024-02-01T09:00:00Z",
    category: { id: 1, name: "Lumpia" },
  },
  {
    id: 4,
    categoryId: 2,
    name: "Es Teh Manis",
    unit: "gelas",
    basePrice: 5000,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    category: { id: 2, name: "Minuman" },
  },
  {
    id: 5,
    categoryId: 2,
    name: "Es Jeruk",
    unit: "gelas",
    basePrice: 7000,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    category: { id: 2, name: "Minuman" },
  },
  {
    id: 6,
    categoryId: 3,
    name: "Paket Hemat A",
    unit: "paket",
    basePrice: 15000,
    isActive: true,
    createdAt: "2024-03-01T10:00:00Z",
    category: { id: 3, name: "Paket" },
  },
  {
    id: 7,
    categoryId: 3,
    name: "Paket Keluarga",
    unit: "paket",
    basePrice: 45000,
    isActive: true,
    createdAt: "2024-03-01T10:00:00Z",
    category: { id: 3, name: "Paket" },
  },
  {
    id: 8,
    categoryId: 4,
    name: "Kerupuk",
    unit: "bungkus",
    basePrice: 3000,
    isActive: false,
    createdAt: "2024-01-20T11:00:00Z",
    category: { id: 4, name: "Snack" },
  },
];

export const branchProductPrices: BranchProductPrice[] = [
  // Cabang Pusat uses base prices
  // Cabang Timur - slightly higher
  { id: 1, branchId: 2, productId: 1, price: 5500, branchName: "Cabang Timur" },
  { id: 2, branchId: 2, productId: 2, price: 8500, branchName: "Cabang Timur" },
  { id: 3, branchId: 2, productId: 3, price: 13000, branchName: "Cabang Timur" },
  // Cabang Barat - premium pricing
  { id: 4, branchId: 3, productId: 1, price: 6000, branchName: "Cabang Barat" },
  { id: 5, branchId: 3, productId: 2, price: 9000, branchName: "Cabang Barat" },
  { id: 6, branchId: 3, productId: 3, price: 14000, branchName: "Cabang Barat" },
  // Cabang Depok - promotional pricing
  { id: 7, branchId: 5, productId: 1, price: 4500, branchName: "Cabang Depok" },
  { id: 8, branchId: 5, productId: 6, price: 12000, branchName: "Cabang Depok" },
];

export const priceAuditLogs: PriceAuditLog[] = [
  {
    id: 1,
    productId: 1,
    productName: "Lumpia Kecil",
    branchId: null,
    branchName: null,
    oldPrice: 4500,
    newPrice: 5000,
    changedBy: "Admin",
    changedAt: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    productId: 2,
    productName: "Lumpia Besar",
    branchId: null,
    branchName: null,
    oldPrice: 7500,
    newPrice: 8000,
    changedBy: "Admin",
    changedAt: "2025-01-15T10:32:00Z",
  },
  {
    id: 3,
    productId: 1,
    productName: "Lumpia Kecil",
    branchId: 3,
    branchName: "Cabang Barat",
    oldPrice: 5500,
    newPrice: 6000,
    changedBy: "Owner",
    changedAt: "2025-01-20T14:00:00Z",
  },
  {
    id: 4,
    productId: 6,
    productName: "Paket Hemat A",
    branchId: 5,
    branchName: "Cabang Depok",
    oldPrice: 15000,
    newPrice: 12000,
    changedBy: "Admin",
    changedAt: "2025-01-25T09:00:00Z",
  },
];

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductPricesByProductId(productId: number): BranchProductPrice[] {
  return branchProductPrices.filter((p) => p.productId === productId);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}
