// Authentication API client

import { apiClient, ApiClientError } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserResponse,
  LogoutRequest,
  LogoutResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  AuthError,
} from '@/types/auth';

// Custom error class for authentication errors
export class AuthApiError extends ApiClientError {
  constructor(
    message: string,
    statusCode: number,
    code?: string,
    originalResponse?: any
  ) {
    super(message, statusCode, code, originalResponse);
    this.name = 'AuthApiError';
  }
}

// Transform API client errors to auth-specific errors
function handleAuthError(error: any): never {
  if (error instanceof ApiClientError) {
    throw new AuthApiError(error.message, error.statusCode, error.code, error.originalResponse);
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new AuthApiError('Network error: Unable to connect to server', 0, 'NETWORK_ERROR');
  }
  
  throw new AuthApiError(
    error instanceof Error ? error.message : 'Unknown error occurred',
    0,
    'UNKNOWN_ERROR'
  );
}

// Authentication API methods
export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      return await apiClient.post<LoginResponse>('/auth/login', {
        ...credentials,
        deviceInfo: credentials.deviceInfo || {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          platform: typeof window !== 'undefined' ? window.navigator.platform : undefined,
        },
      }, { skipAuth: true, skipRefresh: true });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      return await apiClient.post<RegisterResponse>('/auth/register', {
        ...data,
        deviceInfo: data.deviceInfo || {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          platform: typeof window !== 'undefined' ? window.navigator.platform : undefined,
        },
      }, { skipAuth: true, skipRefresh: true });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      return await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        ...data,
        deviceInfo: data.deviceInfo || {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          platform: typeof window !== 'undefined' ? window.navigator.platform : undefined,
        },
      }, { skipAuth: true, skipRefresh: true });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    try {
      return await apiClient.get<UserResponse>('/auth/me');
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Logout user
   */
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    try {
      return await apiClient.post<LogoutResponse>('/auth/logout', data);
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Send forgot password email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      return await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data, { 
        skipAuth: true, 
        skipRefresh: true 
      });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      return await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data, { 
        skipAuth: true, 
        skipRefresh: true 
      });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      return await apiClient.put<ChangePasswordResponse>('/auth/change-password', data);
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Verify email address
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    try {
      return await apiClient.post<VerifyEmailResponse>('/auth/verify-email', data, { 
        skipAuth: true, 
        skipRefresh: true 
      });
    } catch (error) {
      handleAuthError(error);
    }
  },

  /**
   * Resend email verification
   */
  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    try {
      return await apiClient.post<ResendVerificationResponse>('/auth/resend-verification', data, { 
        skipAuth: true, 
        skipRefresh: true 
      });
    } catch (error) {
      handleAuthError(error);
    }
  },
};

// Token management utilities
export const tokenUtils = {
  /**
   * Get tokens from localStorage
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }
    
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  },

  /**
   * Set tokens in localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  /**
   * Remove tokens from localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if access token is expired (basic check)
   * Note: This is a simple check, server-side validation is authoritative
   */
  isTokenExpired(token: string): boolean {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): number | null {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  },
};

export default authApi;