import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  User,
  ApiError,
} from '../types/auth';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = this.getStoredTokens();
            if (tokens?.refreshToken) {
              const newTokens = await this.refreshToken(tokens.refreshToken);
              this.storeTokens(newTokens);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getStoredTokens() {
    const tokens = localStorage.getItem('taskiro_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  private storeTokens(tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem('taskiro_tokens', JSON.stringify(tokens));
  }

  private clearTokens() {
    localStorage.removeItem('taskiro_tokens');
    localStorage.removeItem('taskiro_user');
  }

  // Authentication API methods
  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        '/api/auth/register',
        credentials
      );

      // Store tokens and user data
      this.storeTokens(response.data.tokens);
      localStorage.setItem('taskiro_user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        '/api/auth/login',
        credentials
      );

      // Store tokens and user data
      this.storeTokens(response.data.tokens);
      localStorage.setItem('taskiro_user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        '/api/auth/refresh',
        { refreshToken }
      );
      return response.data.tokens;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.delete('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<{ user: User }> =
        await this.api.get('/api/auth/me');

      // Update stored user data
      localStorage.setItem('taskiro_user', JSON.stringify(response.data.user));

      return response.data.user;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // Utility methods
  getStoredUser(): User | null {
    const user = localStorage.getItem('taskiro_user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!tokens?.accessToken;
  }

  private handleApiError(error: any): ApiError {
    if (error.response?.data?.error) {
      return error.response.data;
    }

    // Network or other errors
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }
}

export const apiService = new ApiService();
