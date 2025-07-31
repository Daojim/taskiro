import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/validation';
import ThemeToggle from '../ThemeToggle';
import type { LoginFormData } from '../../utils/validation';
import type { ApiError } from '../../types/auth';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError('');
      await login(data);
      navigate('/dashboard');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setApiError(apiError.error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle - positioned in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        <div className="card card-elevated animate-scale-in">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-display-2 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-bold mb-2">
                Taskiro
              </h2>
              <h3 className="text-heading-4 mb-2">Welcome back</h3>
              <p className="text-body">
                Or{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-150"
                >
                  create a new account
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {apiError && (
                <div className="bg-error-50 dark:bg-error-900-20 border border-error-200 dark:border-error-800 rounded-lg p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-error-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-body text-error-700 dark:text-error-200">
                      {apiError}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-error-600 dark:text-error-400 animate-slide-down">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="current-password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-error-600 dark:text-error-400 animate-slide-down">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn-primary w-full btn-lg"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner-sm mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
