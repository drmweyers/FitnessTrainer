/**
 * @jest-environment node
 */

import {
  checkEnvironment,
  logEnvironmentCheck,
  getEnvironmentSummary,
} from '@/lib/utils/env-check';

describe('Environment Check Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('checkEnvironment', () => {
    it('should detect all required variables are present', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();

      expect(report.allRequired).toBe(true);
      expect(report.missing).toHaveLength(0);
      expect(report.empty).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();

      expect(report.allRequired).toBe(false);
      expect(report.missing).toContain('DATABASE_URL');
      expect(report.missing).toContain('JWT_SECRET');
      expect(report.missing).toHaveLength(2);
    });

    it('should detect empty required variables', () => {
      process.env.DATABASE_URL = '';
      process.env.JWT_SECRET = '   '; // Only whitespace
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();

      expect(report.allRequired).toBe(false);
      expect(report.empty).toContain('DATABASE_URL');
      expect(report.empty).toContain('JWT_SECRET');
      expect(report.empty).toHaveLength(2);
    });

    it('should categorize variables correctly', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
      process.env.MAILGUN_API_KEY = 'test-key';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';

      const report = checkEnvironment();

      const requiredVars = report.results.filter((r) => r.category === 'required');
      const optionalVars = report.results.filter((r) => r.category === 'optional');
      const infraVars = report.results.filter((r) => r.category === 'infrastructure');

      expect(requiredVars.length).toBeGreaterThan(0);
      expect(optionalVars.length).toBeGreaterThan(0);
      expect(infraVars.length).toBeGreaterThan(0);

      expect(requiredVars.find((r) => r.name === 'DATABASE_URL')?.present).toBe(true);
      expect(optionalVars.find((r) => r.name === 'MAILGUN_API_KEY')?.present).toBe(true);
      expect(infraVars.find((r) => r.name === 'UPSTASH_REDIS_REST_URL')?.present).toBe(true);
    });

    it('should handle completely empty environment', () => {
      process.env = {};

      const report = checkEnvironment();

      expect(report.allRequired).toBe(false);
      expect(report.missing.length).toBeGreaterThan(0);
    });
  });

  describe('logEnvironmentCheck', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log success when all required variables are present', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();
      logEnvironmentCheck(report);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('All required environment variables are set')
      );
    });

    it('should warn when required variables are missing', () => {
      delete process.env.DATABASE_URL;
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();
      logEnvironmentCheck(report);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables'),
        expect.stringContaining('DATABASE_URL')
      );
    });

    it('should warn when required variables are empty', () => {
      process.env.DATABASE_URL = '';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const report = checkEnvironment();
      logEnvironmentCheck(report);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Empty required environment variables'),
        expect.stringContaining('DATABASE_URL')
      );
    });

    it('should not throw errors', () => {
      process.env = {};
      const report = checkEnvironment();

      expect(() => logEnvironmentCheck(report)).not.toThrow();
    });
  });

  describe('getEnvironmentSummary', () => {
    it('should return summary with present/absent flags', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
      process.env.MAILGUN_API_KEY = 'test-key';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';

      const summary = getEnvironmentSummary();

      expect(summary.required.DATABASE_URL).toBe(true);
      expect(summary.required.JWT_SECRET).toBe(true);
      expect(summary.optional.MAILGUN_API_KEY).toBe(true);
      expect(summary.infrastructure.UPSTASH_REDIS_REST_URL).toBe(true);
    });

    it('should not include sensitive values', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
      process.env.JWT_SECRET = 'super-secret-key';

      const summary = getEnvironmentSummary();
      const summaryString = JSON.stringify(summary);

      // Should not contain actual values
      expect(summaryString).not.toContain('password');
      expect(summaryString).not.toContain('super-secret-key');

      // Should only contain booleans
      expect(summary.required.DATABASE_URL).toBe(true);
      expect(summary.required.JWT_SECRET).toBe(true);
    });

    it('should mark empty variables as false', () => {
      process.env.DATABASE_URL = '   '; // Empty/whitespace
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      const summary = getEnvironmentSummary();

      expect(summary.required.DATABASE_URL).toBe(false);
      expect(summary.required.JWT_SECRET).toBe(true);
    });

    it('should handle missing optional variables gracefully', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

      delete process.env.MAILGUN_API_KEY;
      delete process.env.UPSTASH_REDIS_REST_URL;

      const summary = getEnvironmentSummary();

      expect(summary.optional.MAILGUN_API_KEY).toBe(false);
      expect(summary.infrastructure.UPSTASH_REDIS_REST_URL).toBe(false);
    });
  });
});
