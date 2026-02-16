/**
 * Email Service - Mailgun HTTP API
 *
 * Uses Mailgun's REST API directly (no SDK needed).
 * Requires: MAILGUN_API_KEY, MAILGUN_DOMAIN env vars.
 */

const FROM_EMAIL = process.env.EMAIL_FROM || 'EvoFit <noreply@evofit.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY || '';
  const domain = process.env.MAILGUN_DOMAIN || '';
  return { apiKey, domain };
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const { apiKey, domain } = getMailgunConfig();

  if (!apiKey || !domain) {
    console.error('Mailgun not configured: MAILGUN_API_KEY or MAILGUN_DOMAIN missing');
    return { success: false, error: 'Email service not configured' };
  }

  const form = new URLSearchParams();
  form.append('from', FROM_EMAIL);
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', html);

  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Mailgun API error:', response.status, errorBody);
    return { success: false, error: `Mailgun error: ${response.status}` };
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<EmailResult> {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
    const greeting = name ? `Hi ${name}` : 'Hi';

    return await sendEmail(
      email,
      'Reset your EvoFit password',
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">EvoFit</h1>
          </div>
          <p style="font-size: 16px; color: #374151;">${greeting},</p>
          <p style="font-size: 16px; color: #374151;">
            We received a request to reset the password for your EvoFit account.
            Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            EvoFit - Your Fitness Training Platform
          </p>
        </div>
      `
    );
  } catch (err) {
    console.error('Email service error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<EmailResult> {
  try {
    const greeting = name ? `Welcome, ${name}!` : 'Welcome!';

    return await sendEmail(
      email,
      'Welcome to EvoFit!',
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">EvoFit</h1>
          </div>
          <h2 style="font-size: 20px; color: #111827;">${greeting}</h2>
          <p style="font-size: 16px; color: #374151;">
            Your EvoFit account is ready. Start building your fitness journey today.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            EvoFit - Your Fitness Training Platform
          </p>
        </div>
      `
    );
  } catch (err) {
    console.error('Email service error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<EmailResult> {
  try {
    const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`;
    const greeting = name ? `Hi ${name}` : 'Hi';

    return await sendEmail(
      email,
      'Verify your EvoFit email',
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">EvoFit</h1>
          </div>
          <p style="font-size: 16px; color: #374151;">${greeting},</p>
          <p style="font-size: 16px; color: #374151;">
            Please verify your email address to complete your EvoFit registration.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            EvoFit - Your Fitness Training Platform
          </p>
        </div>
      `
    );
  } catch (err) {
    console.error('Email service error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendClientInvitationEmail(
  email: string,
  trainerName: string,
  invitationLink: string,
  customMessage?: string
): Promise<EmailResult> {
  try {
    const messageSection = customMessage
      ? `<p style="font-size: 16px; color: #374151; font-style: italic; border-left: 3px solid #2563eb; padding-left: 12px; margin: 20px 0;">"${customMessage}"</p>`
      : '';

    return await sendEmail(
      email,
      `${trainerName} invited you to join EvoFit!`,
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">EvoFit</h1>
          </div>
          <h2 style="font-size: 20px; color: #111827;">You're Invited!</h2>
          <p style="font-size: 16px; color: #374151;">
            <strong>${trainerName}</strong> has invited you to join EvoFit, your personal fitness training platform.
          </p>
          ${messageSection}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            This invitation will expire in 30 days. If you didn't expect this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            EvoFit - Your Fitness Training Platform
          </p>
        </div>
      `
    );
  } catch (err) {
    console.error('Email service error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}
