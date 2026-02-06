/**
 * Forgot Password API Route
 *
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email to the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists (but don't reveal this to the client)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    // In production, send actual reset email here
    if (user) {
      // TODO: Generate reset token, store in DB, send email
      console.log(`Password reset requested for user ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent password reset instructions.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
