import { passwordService } from './passwordService';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('PasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    process.env.BCRYPT_ROUNDS = '12';
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await passwordService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should use custom bcrypt rounds from environment', async () => {
      process.env.BCRYPT_ROUNDS = '14';
      const password = 'TestPassword123!';
      const hashedPassword = '$2a$14$hashedpasswordvalue';

      // Re-create service to pick up new env var
      const { passwordService: newPasswordService } = require('./passwordService');

      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      await newPasswordService.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 14);
    });

    it('should throw error when hashing fails', async () => {
      const password = 'TestPassword123!';

      mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(passwordService.hashPassword(password)).rejects.toThrow('Failed to hash password');
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await passwordService.hashPassword(password);

      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await passwordService.verifyPassword(password, hash);

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for incorrect password', async () => {
      const password = 'WrongPassword';
      const hash = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await passwordService.verifyPassword(password, hash);

      expect(result).toBe(false);
    });

    it('should throw error when verification fails', async () => {
      const password = 'TestPassword123!';
      const hash = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.compare.mockRejectedValue(new Error('Comparison failed'));

      await expect(passwordService.verifyPassword(password, hash)).rejects.toThrow('Failed to verify password');
    });
  });

  describe('validatePasswordStrength', () => {
    describe('valid passwords', () => {
      it('should validate strong password with all requirements', () => {
        const result = passwordService.validatePasswordStrength('StrongPass123!');

        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(4);
        expect(result.feedback).toHaveLength(0);
      });

      it('should validate password with 12+ characters favorably', () => {
        const result = passwordService.validatePasswordStrength('LongPassword123!');

        expect(result.score).toBe(6); // Maximum score
        expect(result.isValid).toBe(true);
      });
    });

    describe('length requirements', () => {
      it('should reject password shorter than 8 characters', () => {
        const result = passwordService.validatePasswordStrength('Short1!');

        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password must be at least 8 characters long');
      });

      it('should accept exactly 8 character password', () => {
        const result = passwordService.validatePasswordStrength('Pass12!@');

        expect(result.score).toBe(4);
        expect(result.feedback).not.toContain('Password must be at least 8 characters long');
      });

      it('should give bonus score for 12+ characters', () => {
        const shortResult = passwordService.validatePasswordStrength('Pass12!@');
        const longResult = passwordService.validatePasswordStrength('LongPassword123!');

        expect(longResult.score).toBeGreaterThan(shortResult.score);
      });
    });

    describe('complexity requirements', () => {
      it('should require lowercase letter', () => {
        const result = passwordService.validatePasswordStrength('UPPERCASE123!');

        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one lowercase letter');
      });

      it('should require uppercase letter', () => {
        const result = passwordService.validatePasswordStrength('lowercase123!');

        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one uppercase letter');
      });

      it('should require number', () => {
        const result = passwordService.validatePasswordStrength('NoNumbers!');

        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one number');
      });

      it('should require special character', () => {
        const result = passwordService.validatePasswordStrength('NoSpecial123');

        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one special character');
      });
    });

    describe('common password detection', () => {
      it('should penalize common passwords', () => {
        const result = passwordService.validatePasswordStrength('password');

        expect(result.feedback).toContain('Password is too common');
        expect(result.score).toBeLessThan(4);
      });

      it('should penalize common password variations', () => {
        const result = passwordService.validatePasswordStrength('Password123');

        expect(result.feedback).toContain('Password is too common');
      });

      it('should detect sequential patterns', () => {
        const result = passwordService.validatePasswordStrength('Abc123!@#');

        expect(result.warnings).toContain('Avoid repeated or sequential characters');
      });

      it('should detect repeated characters', () => {
        const result = passwordService.validatePasswordStrength('AAAaaa111!!!');

        expect(result.warnings).toContain('Avoid repeated or sequential characters');
      });
    });

    describe('warning vs feedback separation', () => {
      it('should separate warnings from feedback', () => {
        const result = passwordService.validatePasswordStrength('password123');

        expect(result.feedback.length).toBeGreaterThan(0);
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
      });

      it('should only add to feedback for missing requirements', () => {
        const result = passwordService.validatePasswordStrength('lowercase');

        expect(result.feedback).toContain('Password must contain at least one uppercase letter');
        expect(result.feedback).toContain('Password must contain at least one number');
        expect(result.feedback).toContain('Password must contain at least one special character');
      });

      it('should only add to warnings for informational items', () => {
        const result = passwordService.validatePasswordStrength('ValidPass123!');

        expect(result.feedback).toHaveLength(0);
        // If there are no requirements missing, warnings should be the only potential messages
        expect(result.warnings).toBeDefined();
      });

      it('should treat sequential characters as warning not blocking error', () => {
        const result = passwordService.validatePasswordStrength('Abcdefgh123!');

        // Password is valid (meets all requirements)
        expect(result.score).toBeGreaterThanOrEqual(4);
        // But has a warning about sequential characters
        expect(result.warnings).toContain('Avoid repeated or sequential characters');
      });

      it('should not include warnings in feedback array', () => {
        const result = passwordService.validatePasswordStrength('Valid123!AAA');

        // Repeated characters go to warnings, not feedback
        expect(result.feedback).not.toContain('Avoid repeated or sequential characters');
        expect(result.warnings).toContain('Avoid repeated or sequential characters');
      });
    });

    describe('scoring system', () => {
      it('should score 0 for empty password', () => {
        const result = passwordService.validatePasswordStrength('');

        expect(result.score).toBe(0);
        expect(result.isValid).toBe(false);
      });

      it('should score 1 for each requirement met', () => {
        const result = passwordService.validatePasswordStrength('Aa1!aaaa');

        // 8+ chars (1), lowercase (1), uppercase (1), number (1), special (1)
        expect(result.score).toBe(5);
      });

      it('should give maximum score of 6 for excellent password', () => {
        const result = passwordService.validatePasswordStrength('ExcellentPassword123!');

        expect(result.score).toBe(6);
      });
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password of default length 16', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toHaveLength(16);
    });

    it('should generate password of specified length', () => {
      const password = passwordService.generateRandomPassword(24);

      expect(password).toHaveLength(24);
    });

    it('should include lowercase letter', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toMatch(/[a-z]/);
    });

    it('should include uppercase letter', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toMatch(/[A-Z]/);
    });

    it('should include number', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toMatch(/\d/);
    });

    it('should include special character', () => {
      const password = passwordService.generateRandomPassword();

      expect(password).toMatch(/[!@#$%^&*]/);
    });

    it('should generate different passwords each time', () => {
      const password1 = passwordService.generateRandomPassword();
      const password2 = passwordService.generateRandomPassword();

      expect(password1).not.toBe(password2);
    });

    it('should handle minimum length', () => {
      const password = passwordService.generateRandomPassword(4);

      expect(password.length).toBeGreaterThanOrEqual(4);
    });

    it('should validate generated password', () => {
      const password = passwordService.generateRandomPassword();
      const validation = passwordService.validatePasswordStrength(password);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should return false when rounds match', () => {
      const hash = '$2a$12$abcdefghijklmnopqrstuvwxyz';
      mockedBcrypt.getRounds.mockReturnValue(12);

      const result = passwordService.needsRehash(hash);

      expect(result).toBe(false);
    });

    it('should return true when rounds do not match', () => {
      const hash = '$2a$10$abcdefghijklmnopqrstuvwxyz';
      mockedBcrypt.getRounds.mockReturnValue(10);

      const result = passwordService.needsRehash(hash);

      expect(result).toBe(true);
    });

    it('should return false on error getting rounds', () => {
      const hash = 'invalid-hash';
      mockedBcrypt.getRounds.mockImplementation(() => {
        throw new Error('Invalid hash');
      });

      const result = passwordService.needsRehash(hash);

      expect(result).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle unicode characters in password', async () => {
      const password = 'Pässwörd123!';
      const hashedPassword = '$2a$12$hashedpasswordvalue';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await passwordService.hashPassword(password);

      expect(result).toBe(hashedPassword);
    });

    it('should handle very long passwords', () => {
      const password = 'A'.repeat(100) + '1!a';

      const result = passwordService.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });

    it('should handle special characters properly', () => {
      const password = 'Test!@#$%^&*()123Abc';

      const result = passwordService.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => {
        passwordService.validatePasswordStrength(null as unknown as string);
      }).not.toThrow();

      expect(() => {
        passwordService.validatePasswordStrength(undefined as unknown as string);
      }).not.toThrow();
    });
  });
});
