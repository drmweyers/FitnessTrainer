import { PrismaClient } from '@prisma/client';

/**
 * Database Connection Test Suite (TDD - RED Phase)
 *
 * This test suite validates database connectivity and basic query execution.
 * Following TDD methodology, this test is written first to document expected behavior.
 *
 * Phase: RED - Test should fail initially, then implementation makes it pass
 */

describe('Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Try to import the singleton Prisma client
    // This will fail until subtask 2-3 implements the singleton pattern
    try {
      // @ts-ignore - lib/prisma.ts doesn't exist yet
      const { prisma: prismaSingleton } = await import('../src/lib/prisma');
      prisma = prismaSingleton;
    } catch (error) {
      // Fallback: Create Prisma Client directly
      // This allows the test to run but shows the singleton is missing
      prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
  });

  afterAll(async () => {
    // Clean up connection
    await prisma.$disconnect();
  });

  describe('Connection Health', () => {
    it('should successfully connect to PostgreSQL database', async () => {
      // This test validates that Prisma can establish a connection
      // Expected: Connection succeeds without errors
      // TODO: Add retry logic wrapper in implementation phase

      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should execute a simple query to verify connection', async () => {
      // This test validates that we can execute queries
      // Expected: Query returns result without errors

      const result = await prisma.$queryRaw`SELECT 1 as result`;

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result && Array.isArray(result) && result.length > 0) {
        expect(result[0]).toHaveProperty('result');
      }
    });

    it('should have the database URL configured correctly', () => {
      // This test validates environment configuration
      // Expected: DATABASE_URL is set and follows correct format

      const databaseUrl = process.env.DATABASE_URL;

      expect(databaseUrl).toBeDefined();
      expect(typeof databaseUrl).toBe('string');

      // Validate PostgreSQL connection string format
      expect(databaseUrl).toMatch(/^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/.+$/);

      // Verify it's pointing to the correct database
      expect(databaseUrl).toContain('evofit_db');
    });
  });

  describe('Schema Validation', () => {
    it('should have users table accessible', async () => {
      // This test validates that the users table exists and is queryable
      // Expected: Table can be queried (even if empty)

      const userCount = await prisma.user.count();

      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    it('should have exercises table accessible', async () => {
      // This test validates that the exercises table exists and is queryable
      // Expected: Table can be queried (even if empty)

      const exerciseCount = await prisma.exercise.count();

      expect(typeof exerciseCount).toBe('number');
      expect(exerciseCount).toBeGreaterThanOrEqual(0);
    });

    it('should query user table structure', async () => {
      // This test validates the user table has expected columns
      // Expected: Can query users and access basic fields

      const users = await prisma.user.findMany({
        take: 1,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Connection Resilience', () => {
    it('should handle connection gracefully with proper error handling', async () => {
      // This test validates that connection errors are handled properly
      // TODO: Implement retry logic with exponential backoff in phase 2-4

      // Try to disconnect and reconnect
      await prisma.$disconnect();

      // Connection should succeed
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should support multiple sequential queries without connection issues', async () => {
      // This test validates connection stability across multiple queries
      // Expected: All queries succeed

      const queries = [
        prisma.user.count(),
        prisma.exercise.count(),
        prisma.$queryRaw`SELECT NOW()`,
      ];

      const results = await Promise.all(queries);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Prisma Client Configuration', () => {
    it('should use correct PostgreSQL provider', () => {
      // This test validates Prisma configuration
      // Expected: Using PostgreSQL as the database provider

      // Note: This is a compile-time check, but we validate the config
      const databaseUrl = process.env.DATABASE_URL;
      expect(databaseUrl?.startsWith('postgresql://')).toBe(true);
    });

    it('should have logging enabled for errors and warnings', () => {
      // This test validates that logging is configured
      // Expected: Error and warning logs are enabled
      // TODO: Implement singleton pattern with proper logging in phase 2-3

      // For now, we just verify the client was created successfully
      expect(prisma).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
      expect(typeof prisma.$queryRaw).toBe('function');
    });

    it('should use singleton pattern to prevent multiple PrismaClient instances', async () => {
      // RED PHASE TEST - This should FAIL until subtask 2-3 implements singleton
      //
      // This test validates that the Prisma client follows the singleton pattern
      // to prevent connection pool exhaustion in development (caused by hot reloads)
      //
      // Expected FAIL: lib/prisma.ts doesn't exist yet or doesn't export singleton
      // Will PASS in GREEN phase (subtask 2-5) after singleton implementation

      // Check if the singleton module file exists
      const fs = await import('fs');
      const path = await import('path');

      const prismaLibPath = path.join(process.cwd(), 'src/lib/prisma.ts');

      // This will FAIL until lib/prisma.ts is created in subtask 2-3
      expect(fs.existsSync(prismaLibPath)).toBe(true);

      // Try to import and verify the singleton
      // @ts-ignore - Module doesn't exist yet (RED phase)
      const prismaModule = await import('../src/lib/prisma');

      expect(prismaModule).toBeDefined();
      expect(prismaModule.prisma).toBeInstanceOf(PrismaClient);
    });

    it('should have connection retry logic implemented', async () => {
      // RED PHASE TEST - This should FAIL until subtask 2-4 implements retry logic
      //
      // This test validates that connection retry logic with exponential backoff exists
      //
      // Expected FAIL: utils/database-retry.ts doesn't exist yet
      // Will PASS in GREEN phase (subtask 2-5) after retry implementation

      // Check if the retry module file exists
      const fs = await import('fs');
      const path = await import('path');

      const retryPath = path.join(process.cwd(), 'src/utils/database-retry.ts');

      // This will FAIL until utils/database-retry.ts is created in subtask 2-4
      expect(fs.existsSync(retryPath)).toBe(true);

      // Try to import and verify the retry function
      // @ts-ignore - Module doesn't exist yet (RED phase)
      const retryModule = await import('../src/utils/database-retry');

      expect(retryModule).toBeDefined();
      expect(retryModule.withRetry).toBeDefined();
      expect(typeof retryModule.withRetry).toBe('function');
    });
  });
});
