/**
 * Common API Types
 * Shared types used across all API calls
 */

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Common pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// API Error response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

// Common filter params
export interface FilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: unknown;
}

// ID param type
export type IdParam = string | number;

// Query params type
export type QueryParams = Record<string, string | number | boolean | undefined>;
