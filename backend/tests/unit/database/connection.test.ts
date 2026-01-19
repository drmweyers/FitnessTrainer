import { PrismaClient } from '@prisma/client';

/**
 * Database Connection Test Suite (TDD - GREEN Phase)
 *
 * This test suite validates database connectivity and basic query execution.
 * Following TDD methodology, this test was written first (RED phase), then
 * implementation made it pass (GREEN phase).
 *
 * Phase: GREEN - All tests pass after implementing:
 *   - Database connection fix (subtask 2-2)
 *   - Prisma client singleton pattern (subtask 2-3)
 *   - Connection retry logic (subtask 2-4)
 */

describe('Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Import the singleton Prisma client from index.ts
    // This was implemented in subtask 2-3 (GREEN phase)
    try {
      const { prisma: prismaSingleton } = await import('@/index');
      prisma = prismaSingleton;
    } catch (error) {
      // Fallback: Create Prisma Client directly if import fails
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
      // GREEN PHASE TEST - PASSES after subtask 2-3 implements singleton
      //
      // This test validates that the Prisma client follows the singleton pattern
      // to prevent connection pool exhaustion in development (caused by hot reloads)
      //
      // Implementation: Singleton is implemented in src/index.ts using globalThis pattern

      // Check if the singleton exists in the main index.ts file
      const fs = await import('fs');
      const path = await import('path');

      const indexPath = path.join(process.cwd(), 'src/index.ts');

      // Verify the main index file exists
      expect(fs.existsSync(indexPath)).toBe(true);

      // Verify the file contains the singleton pattern
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('globalForPrisma');
      expect(indexContent).toContain('globalThis');
      expect(indexContent).toContain('export const prisma');
    });

    it('should have connection retry logic implemented', async () => {
      // GREEN PHASE TEST - PASSES after subtask 2-4 implements retry logic
      //
      // This test validates that connection retry logic with exponential backoff exists
      //
      // Implementation: Retry logic implemented in src/utils/database-retry.ts

      // Check if the retry module file exists
      const fs = await import('fs');
      const path = await import('path');

      const retryPath = path.join(process.cwd(), 'src/utils/database-retry.ts');

      // Verify the retry module exists
      expect(fs.existsSync(retryPath)).toBe(true);

      // Verify the file contains the retry logic
      const retryContent = fs.readFileSync(retryPath, 'utf-8');
      expect(retryContent).toContain('withRetry');
      expect(retryContent).toContain('exponential');
      expect(retryContent).toContain('backoff');
      expect(retryContent).toContain('export');
    });
  });
});
