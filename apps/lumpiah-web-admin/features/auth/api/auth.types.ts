/**
 * Auth Feature Types
 */

export interface User {
  id: number;
  username: string;
  roleId: number;
  branchId: number | null;
  isActive: boolean;
  createdAt: string;
  role: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  roleId: number;
  branchId?: number;
}
