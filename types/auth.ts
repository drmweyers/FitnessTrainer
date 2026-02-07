// Authentication related types

export type UserRole = 'admin' | 'trainer' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User {
  // Additional fields that may be included in auth responses
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    device?: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    device?: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    device?: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    tokens: AuthTokens;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export interface LogoutRequest {
  refreshToken?: string;
  logoutFromAll?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
    };
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      isVerified: boolean;
    };
  };
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

// Error response type
export interface AuthError {
  success: false;
  message: string;
  error?: string;
  code?: string;
  statusCode?: number;
}

// Authentication state
export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: (options?: { logoutFromAll?: boolean }) => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<unknown>;
  resendVerification: (email: string) => Promise<void>;
  clearError: () => void;
}