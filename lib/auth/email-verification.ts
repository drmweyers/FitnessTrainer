/**
 * Email Verification Helpers
 *
 * Stores verification tokens in Upstash Redis (24-hour TTL) instead of
 * the database, avoiding any Prisma schema migration.
 *
 * Redis key pattern: "email-verify:{token}" → userId
 */

import { redis } from '@/lib/db/redis';
import crypto from 'crypto';

/** 24-hour TTL for verification tokens (in seconds) */
const VERIFICATION_TTL_SECONDS = 24 * 60 * 60;

/**
 * Generate a secure random verification token, store it in Redis, and
 * return the token string.
 *
 * @param userId - The user ID to associate with the token.
 * @returns The 64-character hex verification token.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `email-verify:${token}`;
  await redis.set(key, userId, VERIFICATION_TTL_SECONDS);
  return token;
}

/**
 * Validate a verification token and return the associated userId.
 * The token is deleted from Redis on first use (one-time use).
 *
 * @param token - The token from the verification link.
 * @returns The userId when the token is valid, or `null` when invalid/expired.
 */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const key = `email-verify:${token}`;
  const userId = await redis.get(key);
  if (!userId) return null;

  // Delete immediately to enforce single-use semantics
  await redis.del(key);
  return userId;
}

/**
 * Send a verification email via the Mailgun HTTP API.
 *
 * @param to      - Recipient email address.
 * @param token   - The verification token.
 */
export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@evofit.io';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.evofit.io';

  // Silently skip in development when Mailgun is not configured
  if (!mailgunDomain || !mailgunApiKey) {
    console.warn('[email-verification] Mailgun not configured — skipping verification email');
    return;
  }

  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  const credentials = Buffer.from(`api:${mailgunApiKey}`).toString('base64');

  const formData = new URLSearchParams({
    from: emailFrom,
    to,
    subject: 'Verify your EvoFit account',
    text: `Welcome to EvoFit Trainer!\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.`,
    html: `
      <p>Welcome to <strong>EvoFit Trainer</strong>!</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          Verify Email Address
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    `.trim(),
  });

  const response = await fetch(
    `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[email-verification] Mailgun error ${response.status}: ${body}`);
    // Do not throw — registration should succeed even if email delivery fails.
    // The user can request a resend later.
  }
}
