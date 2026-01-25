/**
 * Authentication Types and Zod Schemas
 *
 * Platform-agnostic type definitions for authentication
 * Works with Vercel API Routes and Express.js
 */

import { z } from 'zod';

/**
 * User roles
 */
export const UserRoleEnum = z.enum(['trainer', 'client', 'admin']);
export type UserRole = z.infer<typeof UserRoleEnum>;

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Register request schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: UserRoleEnum,
  trainerId: z.string().optional(), // If registering as client
});

export type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

/**
 * Token response
 */
export interface TokenResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
      isVerified: boolean;
    };
  };
}

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

/**
 * JWT token payload
 */
export interface TokenPayload {
  sub: string; // user_id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti: string; // unique token id
}

/**
 * Session info
 */
export interface SessionInfo {
  id: string;
  deviceInfo?: {
    type: string;
    browser: string;
    os: string;
  };
  ipAddress?: string;
  lastActivityAt: Date;
  createdAt: Date;
  expiresAt: Date;
}
