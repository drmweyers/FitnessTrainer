/**
 * Login API Route
 *
 * POST /api/auth/login
 *
 * Authenticates user with email/password and returns JWT tokens
 * Platform-agnostic: Works on Vercel and Digital Ocean
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { tokenService } from '@/lib/services/tokenService';
import { handleApiError } from '@/lib/middleware/error-handler';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

/**
 * Login request schema
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/login
 *
 * Authenticates user and returns JWT access + refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (5 attempts per 15 minutes per IP + email)
    const rateLimitResponse = await checkRateLimit(request, {
      limit: 5,
      window: 900, // 15 minutes
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const { email, password, rememberMe } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    // Check if user exists
    if (!user || user.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          error: { code: 'INVALID_CREDENTIALS' },
        },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated',
          error: { code: 'ACCOUNT_DEACTIVATED' },
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          error: { code: 'INVALID_CREDENTIALS' },
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as 'trainer' | 'client' | 'admin',
    });

    // Get device info for session tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      undefined;

    const deviceInfo = {
      type: detectDeviceType(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
    };

    // Generate refresh token
    const refreshToken = await tokenService.generateRefreshToken({
      userId: user.id,
      deviceInfo,
      ipAddress,
    });

    // Return success response with tokens and user data
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      },
      {
        status: 200,
        headers: {
          // Set token expiry based on rememberMe
          'Cache-Control': rememberMe ? 'private, max-age=604800' : 'private, max-age=3600',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Helper: Detect device type from user agent
 */
function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return 'mobile';
  }
  if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Helper: Detect browser from user agent
 */
function detectBrowser(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';

  return 'Unknown';
}

/**
 * Helper: Detect OS from user agent
 */
function detectOS(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';

  return 'Unknown';
}
