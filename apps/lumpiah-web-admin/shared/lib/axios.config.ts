import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { cookieStorage } from './cookie-storage';

// API Base URL from environment variables
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from cookies
    const token = cookieStorage.getToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Clear token
      cookieStorage.removeToken();
      
      // Redirect to login only if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }

    // Handle 500 - Server Error
    if (error.response?.status === 500) {
      console.error('Internal server error');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
