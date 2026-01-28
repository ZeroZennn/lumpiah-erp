import { apiClient } from '@/shared/lib/api-client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from './auth.types';

/**
 * Auth API calls
 * Raw API methods without React Query hooks
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest) => {
    return apiClient.post<LoginResponse, LoginRequest>('/auth/login', credentials);
  },

  /**
   * Logout user
   */
  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    return apiClient.get<User>('/auth/me');
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest) => {
    return apiClient.post<User, RegisterRequest>('/auth/register', userData);
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    return apiClient.post<{ access_token: string }>('/auth/refresh');
  },
};

export default authApi;
