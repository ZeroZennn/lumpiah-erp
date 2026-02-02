/**
 * Product Feature Types
 * Based on Prisma Product, Category, BranchProductPrice models
 */

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  unit: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  category?: Category;
}

export interface ProductListItem {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  unit: string;
  price: number;
  basePrice: number;
  branchProductPrices: BranchProductPrice[];
  isActive: boolean;
}

export interface BranchProductPrice {
  id: number;
  branchId: number;
  productId: number;
  price: number;
  branchName?: string;
}

export interface PriceAuditLog {
  id: number;
  productId: number;
  productName: string;
  branchId: number | null;
  branchName: string | null;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

export interface ProductHistoryItem {
    id: string;
    user: string;
    timestamp: string;
    branchName: string;
    price: number;
    oldPrice?: number;
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  unit?: string;
  basePrice: number;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  categoryId?: number;
  unit?: string;
  basePrice?: number;
  isActive?: boolean;
}
