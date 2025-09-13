import React, { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AuthContextType,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';
import { apiService } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = apiService.getStoredUser();
        const isAuthenticated = apiService.isAuthenticated();

        if (storedUser && isAuthenticated) {
          setUser(storedUser);

          // Verify token is still valid by fetching current user
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // Token invalid, clear auth state
            console.warn('Token validation failed:', error);
            await logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);

      setUser(response.user);
      setTokens(response.tokens);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(credentials);

      setUser(response.user);
      setTokens(response.tokens);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTokens(null);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      // This is handled automatically by the API service interceptor
      // But we can expose it for manual refresh if needed
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
