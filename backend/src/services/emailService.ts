import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@evofit.dev';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
    };

    // Add authentication if provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(config);
    
    logger.info('Email service initialized', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      hasAuth: !!config.auth,
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const mailOptions = {
        from: options.from || this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(email: string, token: string, userName?: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - EvoFit</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .security-note { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ EvoFit</h1>
            <h2>Welcome to your fitness journey!</h2>
          </div>
          <div class="content">
            <h3>Hi${userName ? ` ${userName}` : ''}!</h3>
            <p>Thank you for joining EvoFit! Please verify your email address to activate your account and start your fitness journey.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #f1f1f1; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${verificationUrl}</p>
            
            <div class="security-note">
              <strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't request this, please ignore this email.
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Create and track workout programs</li>
              <li>Monitor your fitness progress</li>
              <li>Connect with trainers or clients</li>
              <li>Access our comprehensive exercise library</li>
            </ul>
          </div>
          <div class="footer">
            <p>Questions? Contact us at <a href="mailto:support@evofit.app">support@evofit.app</a></p>
            <p>&copy; ${new Date().getFullYear()} EvoFit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your EvoFit account',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - EvoFit</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .security-note { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ EvoFit</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <h3>Hi${userName ? ` ${userName}` : ''}!</h3>
            <p>You've requested to reset your password for your EvoFit account. Click the button below to create a new password.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #f1f1f1; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${resetUrl}</p>
            
            <div class="security-note">
              <strong>Important:</strong> This reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>For your security:</p>
            <ul>
              <li>Never share this reset link with anyone</li>
              <li>Create a strong, unique password</li>
              <li>Consider enabling two-factor authentication</li>
            </ul>
          </div>
          <div class="footer">
            <p>Questions? Contact us at <a href="mailto:support@evofit.app">support@evofit.app</a></p>
            <p>&copy; ${new Date().getFullYear()} EvoFit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your EvoFit password',
      html,
    });
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, userName: string, userRole: 'trainer' | 'client'): Promise<void> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const roleSpecificContent = userRole === 'trainer' 
      ? `
        <h3>🎯 Ready to Train Clients?</h3>
        <p>As a trainer, you can:</p>
        <ul>
          <li>Create customized workout programs</li>
          <li>Manage client progress and measurements</li>
          <li>Track client goals and achievements</li>
          <li>Communicate with clients in real-time</li>
          <li>Access our extensive exercise library</li>
        </ul>
      `
      : `
        <h3>🚀 Ready to Transform Your Fitness?</h3>
        <p>As a client, you can:</p>
        <ul>
          <li>Follow personalized workout programs</li>
          <li>Track your progress and measurements</li>
          <li>Set and achieve fitness goals</li>
          <li>Connect with professional trainers</li>
          <li>Access workout demonstrations and tips</li>
        </ul>
      `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to EvoFit!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ EvoFit</h1>
            <h2>Welcome ${userName}!</h2>
          </div>
          <div class="content">
            <p>Congratulations! Your EvoFit account has been successfully activated. You're now ready to take your fitness journey to the next level.</p>
            
            ${roleSpecificContent}
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <h3>🎯 Next Steps:</h3>
            <ol>
              <li><strong>Complete your profile</strong> - Add your fitness goals and preferences</li>
              <li><strong>Explore the exercise library</strong> - Discover 1000+ exercises with demonstrations</li>
              <li><strong>Set up your first ${userRole === 'trainer' ? 'client program' : 'workout routine'}</strong></li>
              <li><strong>Join our community</strong> - Connect with other fitness enthusiasts</li>
            </ol>
            
            <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/help">Help Center</a> or contact our support team.</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at <a href="mailto:support@evofit.app">support@evofit.app</a></p>
            <p>&copy; ${new Date().getFullYear()} EvoFit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to EvoFit - Your fitness journey starts now!',
      html,
    });
  }

  /**
   * Send client invitation email
   */
  async sendClientInvitation(
    clientEmail: string,
    trainerName: string,
    trainerEmail: string,
    invitationToken: string
  ): Promise<void> {
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>You're invited to join EvoFit!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            background-color: #ffffff;
            margin: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 24px;
            color: #374151;
          }
          .message {
            font-size: 16px;
            margin-bottom: 32px;
            color: #6b7280;
            line-height: 1.7;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0 32px 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .features {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          .features h3 {
            color: #374151;
            margin-bottom: 16px;
            font-size: 18px;
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .feature-list li {
            padding: 8px 0;
            color: #6b7280;
            position: relative;
            padding-left: 24px;
          }
          .feature-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 8px 0;
            color: #9ca3af;
            font-size: 14px;
          }
          .link-fallback {
            margin-top: 20px;
            padding: 16px;
            background-color: #f3f4f6;
            border-radius: 6px;
            font-size: 14px;
            color: #6b7280;
            border-left: 4px solid #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ EvoFit</h1>
            <p>Personal Training Platform</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello! 👋
            </div>
            
            <div class="message">
              <strong>${trainerName}</strong> has invited you to join their training program on EvoFit, 
              the modern platform for personal trainers and their clients.
              <br><br>
              With EvoFit, you'll be able to:
            </div>

            <div class="features">
              <h3>What you can do with EvoFit:</h3>
              <ul class="feature-list">
                <li>Access personalized workout programs</li>
                <li>Track your progress and achievements</li>
                <li>Communicate directly with your trainer</li>
                <li>Log workouts and nutrition</li>
                <li>View detailed analytics and reports</li>
                <li>Schedule sessions and appointments</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${invitationUrl}" class="cta-button">
                Accept Invitation & Get Started
              </a>
            </div>

            <div class="link-fallback">
              <strong>Button not working?</strong> Copy and paste this link into your browser:
              <br>
              <span style="word-break: break-all; color: #374151;">${invitationUrl}</span>
            </div>

            <div class="message" style="margin-top: 32px; font-size: 14px;">
              This invitation was sent by ${trainerName} (${trainerEmail}). 
              If you believe this was sent in error, you can safely ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>EvoFit - Evolution in Fitness</strong></p>
            <p>Empowering trainers and transforming lives, one workout at a time.</p>
            <p style="margin-top: 16px; font-size: 12px;">
              This invitation will expire in 7 days for security purposes.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: clientEmail,
      subject: `You're invited to join ${trainerName}'s training program on EvoFit`,
      html,
    });
  }

  /**
   * Send security notification email
   */
  async sendSecurityNotification(
    email: string, 
    event: string, 
    details: { ipAddress?: string; userAgent?: string; timestamp?: Date }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Security Alert - EvoFit</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .security-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Security Alert</h1>
            <h2>EvoFit Account Activity</h2>
          </div>
          <div class="content">
            <p><strong>Security Event:</strong> ${event}</p>
            <p><strong>Time:</strong> ${details.timestamp?.toLocaleString() || new Date().toLocaleString()}</p>
            
            <div class="security-info">
              <h3>Event Details:</h3>
              ${details.ipAddress ? `<p><strong>IP Address:</strong> ${details.ipAddress}</p>` : ''}
              ${details.userAgent ? `<p><strong>Device:</strong> ${details.userAgent}</p>` : ''}
            </div>
            
            <p>If this was you, no action is needed. If you don't recognize this activity, please:</p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Enable two-factor authentication</li>
              <li>Contact our support team</li>
            </ul>
            
            <p><strong>Didn't perform this action?</strong> Secure your account immediately by changing your password and enabling two-factor authentication.</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at <a href="mailto:support@evofit.app">support@evofit.app</a></p>
            <p>&copy; ${new Date().getFullYear()} EvoFit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Security Alert: ${event}`,
      html,
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Strip HTML tags from text (fallback for plain text)
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export { EmailService };
export const emailService = new EmailService();
export default emailService;