import { injectable, inject } from 'inversify';
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';
import type { IStorageService } from '@/shared/infrastructure/storage/StorageService';
import type { ILogger } from '@/shared/utils/Logger';
import { AUTH_PATHS } from '@/modules/auth/ui/routes';
import type { ApiResponse } from '../models/api';

export interface IHttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  patch<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}

@injectable()
export class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;

  constructor(
    @inject(CORE_SYMBOLS.IConfig) private config: IConfig,
    @inject(CORE_SYMBOLS.IStorageService) private storageService: IStorageService,
    @inject(CORE_SYMBOLS.ILogger) private logger: ILogger
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.config.api.baseUrl,
      timeout: this.config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (value?: unknown) => void;
      reject: (reason?: unknown) => void;
    }> = [];

    const processQueue = (error: unknown, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Automatically inject auth token if available
        const token = this.getStoredToken();
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (this.config.features.debugMode) {
          this.logger.debug('HTTP Request:', config);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.features.debugMode) {
          this.logger.debug('HTTP Response:', response);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (this.config.features.debugMode) {
          this.logger.error('HTTP Error:', error);
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          const requestUrl = originalRequest.url || '';
          const isLoginEndpoint = requestUrl.includes('/admin/auth/login');
          const isRefreshEndpoint = requestUrl.includes('/auth/refresh');
          const isLogoutEndpoint = requestUrl.includes('/admin/auth/logout');

          // Don't try to refresh on login, refresh, or logout endpoints
          if (isLoginEndpoint || isRefreshEndpoint || isLogoutEndpoint) {
            if (!isLoginEndpoint) {
              this.removeAuthToken();
              setTimeout(() => {
                window.location.href = this.config.auth.loginPath;
              }, 300);
            }
            const errorData = error.response?.data as Record<string, unknown>;
            return Promise.reject(errorData.error || errorData);
          }

          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh endpoint
            const refreshResponse = await this.axiosInstance.post<{
              accessToken: string;
              refreshToken: string;
            }>('/api/v1/auth/refresh', {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

            // Store new tokens
            this.storageService.setItem(this.config.auth.tokenKey, accessToken);
            this.storageService.setItem(`${this.config.auth.tokenKey}_refresh`, newRefreshToken);

            // Update authorization header
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            // Process queued requests
            processQueue(null, accessToken);

            // Retry original request
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            processQueue(refreshError, null);
            this.removeAuthToken();
            setTimeout(() => {
              window.location.href = this.config.auth.loginPath;
            }, 300);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        const errorData = error.response?.data as Record<string, unknown>;
        return Promise.reject(errorData.error || errorData);
      }
    );
  }

  /**
   * Wrap backend response in ApiResponse format
   * Backend returns data directly, but frontend expects { success, data } format
   */
  private wrapResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<T>(url, config);
    this.logger.debug('HTTP GET Response:', response);

    // Backend returns data directly, wrap it in ApiResponse format
    return this.wrapResponse(response.data);
  }

  async post<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    this.logger.info('HTTP POST Response:', response);

    // Backend returns data directly, wrap it in ApiResponse format
    return this.wrapResponse(response.data);
  }

  async put<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    this.logger.info('HTTP PUT Response:', response);

    // Backend returns data directly, wrap it in ApiResponse format
    return this.wrapResponse(response.data);
  }

  async patch<T, D>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    this.logger.info('HTTP PATCH Response:', response);

    // Backend returns data directly, wrap it in ApiResponse format
    return this.wrapResponse(response.data);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    this.logger.info('HTTP DELETE Response:', response);

    // Backend returns data directly, wrap it in ApiResponse format
    return this.wrapResponse(response.data);
  }

  removeAuthToken(): void {
    this.storageService.removeItem(this.config.auth.tokenKey);
    this.storageService.removeSessionItem(this.config.auth.tokenKey);
    this.storageService.removeItem(this.config.auth.currentUserKey);
    this.storageService.removeSessionItem(this.config.auth.currentUserKey);
  }

  private getStoredToken(): string | null {
    return this.storageService.getItem(this.config.auth.tokenKey) ||
           this.storageService.getSessionItem(this.config.auth.tokenKey);
  }

  private getStoredRefreshToken(): string | null {
    const refreshTokenKey = `${this.config.auth.tokenKey}_refresh`;
    return this.storageService.getItem(refreshTokenKey) ||
           this.storageService.getSessionItem(refreshTokenKey);
  }
}
