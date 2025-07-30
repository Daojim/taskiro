import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ApiError,
} from '../types/auth';
import type {
  Task,
  Category,
  CreateTaskRequest,
  UpdateTaskRequest,
  ParseRequest,
  ParseResponse,
  DisambiguationResponse,
} from '../types/task';

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  private handleApiError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: ApiError } };
      if (axiosError.response?.data?.error) {
        return axiosError.response.data;
      }
    }

    // Network or other errors
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'An unexpected error occurred';

    return {
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Task API methods
  async getTasks(params?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    tasks: Task[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    try {
      const response = await this.api.get('/api/tasks', { params });
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async createTask(
    task: CreateTaskRequest
  ): Promise<{ message: string; task: Task }> {
    try {
      const response = await this.api.post('/api/tasks', task);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async updateTask(
    id: string,
    task: UpdateTaskRequest
  ): Promise<{ message: string; task: Task }> {
    try {
      const response = await this.api.put(`/api/tasks/${id}`, task);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async deleteTask(id: string): Promise<{ message: string; task: Task }> {
    try {
      const response = await this.api.delete(`/api/tasks/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async toggleTaskCompletion(
    id: string
  ): Promise<{ message: string; task: Task }> {
    try {
      const response = await this.api.post(`/api/tasks/${id}/complete`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async restoreTask(id: string): Promise<{ message: string; task: Task }> {
    try {
      const response = await this.api.post(`/api/tasks/${id}/restore`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  // Category API methods
  async getCategories(): Promise<{ categories: Category[] }> {
    try {
      const response = await this.api.get('/api/categories');
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async createCategory(category: {
    name: string;
    color?: string;
  }): Promise<{ message: string; category: Category }> {
    try {
      const response = await this.api.post('/api/categories', category);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  // Natural Language Processing API methods
  async parseNaturalLanguage(request: ParseRequest): Promise<ParseResponse> {
    try {
      const response = await this.api.post('/api/nlp/parse', request);
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async disambiguateDate(
    dateText: string,
    referenceDate?: string
  ): Promise<DisambiguationResponse> {
    try {
      const response = await this.api.post('/api/nlp/disambiguate', {
        dateText,
        referenceDate,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  async suggestCategory(text: string): Promise<{
    success: boolean;
    suggestion: {
      category?: string;
      matchedKeywords: string[];
      confidence: number;
    };
  }> {
    try {
      const response = await this.api.post('/api/nlp/suggest-category', {
        text,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }
}

export const apiService = new ApiService();
