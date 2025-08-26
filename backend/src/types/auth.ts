import { z } from 'zod';

// Password validation schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z\d]/, 'Password must contain at least one special character');

// Email validation schema
const emailSchema = z.string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['trainer', 'client'], {
    errorMap: () => ({ message: 'Role must be either trainer or client' })
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms of service'
  }),
  agreeToPrivacy: z.boolean().refine(val => val === true, {
    message: 'You must agree to the privacy policy'
  }),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Resend verification schema
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// 2FA setup schema
export const setupTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// 2FA verify schema
export const verifyTwoFactorSchema = z.object({
  token: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
  backupCode: z.string().optional(),
});

// 2FA disable schema
export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers')
    .optional(),
  backupCode: z.string().optional(),
});

// OAuth login schema
export const oauthLoginSchema = z.object({
  provider: z.enum(['google', 'apple'], {
    errorMap: () => ({ message: 'Provider must be either google or apple' })
  }),
  accessToken: z.string().min(1, 'Access token is required'),
  idToken: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// Logout schema
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  logoutFromAll: z.boolean().optional().default(false),
});

// Type exports
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequest = z.infer<typeof resendVerificationSchema>;
export type SetupTwoFactorRequest = z.infer<typeof setupTwoFactorSchema>;
export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorSchema>;
export type DisableTwoFactorRequest = z.infer<typeof disableTwoFactorSchema>;
export type OAuthLoginRequest = z.infer<typeof oauthLoginSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;

// API Response types
export interface AuthResponse {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role: 'trainer' | 'client' | 'admin';
      isVerified: boolean;
      createdAt: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface RefreshResponse {
  success: true;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface UserResponse {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role: 'trainer' | 'client' | 'admin';
      isActive: boolean;
      isVerified: boolean;
      createdAt: string;
      lastLoginAt: string | null;
    };
  };
}

export interface SessionsResponse {
  success: true;
  message: string;
  data: {
    sessions: Array<{
      id: string;
      deviceInfo: any;
      ipAddress: string | null;
      lastActivityAt: string;
      createdAt: string;
      expiresAt: string;
    }>;
  };
}