import { AxiosRequestConfig } from 'axios';
import axiosInstance from './axios.config';
import { ApiResponse } from '../types/api.types';

/**
 * Generic API client with type-safe methods
 */
export const apiClient = {
  /**
   * GET request
   * @param url - API endpoint
   * @param config - Additional axios config
   * @returns Promise with typed response
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  /**
   * POST request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Additional axios config
   * @returns Promise with typed response
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * PUT request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Additional axios config
   * @returns Promise with typed response
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Additional axios config
   * @returns Promise with typed response
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * DELETE request
   * @param url - API endpoint
   * @param config - Additional axios config
   * @returns Promise with typed response
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  },
};

export default apiClient;
