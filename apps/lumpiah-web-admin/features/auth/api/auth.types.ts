/**
 * Auth Feature Types
 */

export interface Role {
  id: number;
  name: string;
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  isActive: boolean;
}

export interface User {
  id: number;
  email: string;
  fullname: string;
  phoneNumber: string;
  role: Role;
  branch?: Branch | null;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  roleId: number;
  branchId?: number;
}
