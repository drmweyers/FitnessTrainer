/**
 * Prisma Client Singleton for Vercel Serverless
 *
 * This file configures Prisma to work efficiently with Vercel's serverless
 * environment by using a singleton pattern to prevent connection pool
 * exhaustion during cold starts.
 */

import { PrismaClient } from '@prisma/client';

// Extend globalThis to include prisma in development hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client singleton instance
 *
 * In development: Cached in globalThis to prevent multiple instances
 * In production: New instance per invocation (Vercel reuses containers)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

// Cache in development for hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
