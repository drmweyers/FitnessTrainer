/**
 * Register API Route
 *
 * POST /api/auth/register
 *
 * Registers a new user with email/password and returns JWT tokens
 * Platform-agnostic: Works on Vercel and Digital Ocean
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { tokenService } from '@/lib/services/tokenService';
import { handleApiError } from '@/lib/middleware/error-handler';
import { registerSchema } from '@/lib/types/auth';
import { logClientSignup } from '@/lib/services/activity.service';

/**
 * POST /api/auth/register
 *
 * Registers a new user and returns JWT access + refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting disabled for testing
    // const rateLimitResponse = await checkRateLimit(request, {
    //   limit: 3,
    //   window: 3600, // 1 hour
    // });
    // if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { email, password, role, trainerId } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email already registered',
          error: { code: 'EMAIL_EXISTS' },
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'client',
        isActive: true,
        isVerified: true, // Auto-verify for MVP (add email verification later)
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

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

    // Log signup activity (fire-and-forget)
    try {
      logClientSignup(user.id, user.email);
    } catch {}

    // Return success response with tokens and user data
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
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
      { status: 201 }
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
