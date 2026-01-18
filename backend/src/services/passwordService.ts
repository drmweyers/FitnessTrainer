import bcrypt from 'bcryptjs';
import { logger } from '@/config/logger';

class PasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      logger.debug('Password hashed successfully');
      return hash;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      logger.debug('Password verification completed', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Password verification failed:', error);
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Check if a password meets strength requirements
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
    warnings: string[];
  } {
    const feedback: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Complexity checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    if (/[^a-zA-Z\d]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common password checks
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      score = Math.max(0, score - 2);
      feedback.push('Password is too common');
    }

    // Sequential or repeated characters (informational warning, not a hard failure)
    if (/(.)\1{2,}/.test(password) || /012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase())) {
      score = Math.max(0, score - 1);
      warnings.push('Avoid repeated or sequential characters');
    }

    // Password is valid if it meets minimum score requirement and has no mandatory feedback
    return {
      isValid: score >= 4 && feedback.length === 0,
      score,
      feedback,
      warnings,
    };
  }

  /**
   * Generate a random password
   */
  generateRandomPassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required category
    const categories = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*'
    ];
    
    // Add one character from each category
    for (const category of categories) {
      const randomIndex = Math.floor(Math.random() * category.length);
      password += category[randomIndex];
    }
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Check if password needs to be rehashed (if bcrypt rounds changed)
   */
  needsRehash(hash: string): boolean {
    try {
      const rounds = bcrypt.getRounds(hash);
      return rounds !== this.saltRounds;
    } catch (error) {
      logger.warn('Failed to check hash rounds:', error);
      return false;
    }
  }
}

export const passwordService = new PasswordService();
export default passwordService;