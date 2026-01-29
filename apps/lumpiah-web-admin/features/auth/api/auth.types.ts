/**
 * Auth Feature Types
 */

export interface User {
  id: number;
  email: string;
  fullname: string;
  phoneNumber: string;
  role: string;
  branchId: number | null;
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
