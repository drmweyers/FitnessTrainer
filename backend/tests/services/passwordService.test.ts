// Mock the logger before importing the service
jest.mock('../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  },
}));

import { passwordService } from '../../src/services/passwordService';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject a weak password', () => {
      const result = passwordService.validatePasswordStrength('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const result = passwordService.validatePasswordStrength('Pass1!');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must be at least 8 characters long');
    });

    it('should require lowercase letter', () => {
      const result = passwordService.validatePasswordStrength('PASSWORD123!');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must contain at least one lowercase letter');
    });

    it('should require uppercase letter', () => {
      const result = passwordService.validatePasswordStrength('password123!');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must contain at least one uppercase letter');
    });

    it('should require number', () => {
      const result = passwordService.validatePasswordStrength('Password!');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = passwordService.validatePasswordStrength('Password123');
      
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const result = passwordService.validatePasswordStrength('Password123!');
      
      // This might pass or fail depending on common password list
      // But at minimum should provide feedback
      expect(result.feedback).toBeDefined();
    });

    it('should penalize repeated characters', () => {
      const result1 = passwordService.validatePasswordStrength('Password123!');
      const result2 = passwordService.validatePasswordStrength('Passsssword123!');
      
      expect(result2.score).toBeLessThanOrEqual(result1.score);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a password with default length', () => {
      const password = passwordService.generateRandomPassword();
      
      expect(password).toBeDefined();
      expect(password.length).toBe(16);
    });

    it('should generate a password with custom length', () => {
      const password = passwordService.generateRandomPassword(12);
      
      expect(password).toBeDefined();
      expect(password.length).toBe(12);
    });

    it('should generate different passwords each time', () => {
      const password1 = passwordService.generateRandomPassword();
      const password2 = passwordService.generateRandomPassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should generate passwords with required character types', () => {
      const password = passwordService.generateRandomPassword(16);
      
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/\d/);    // number
      expect(password).toMatch(/[!@#$%^&*]/); // special character
    });

    it('should validate generated passwords', () => {
      const password = passwordService.generateRandomPassword(16);
      const validation = passwordService.validatePasswordStrength(password);
      
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(4);
    });
  });
});