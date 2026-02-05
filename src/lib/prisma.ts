/**
 * Prisma Client Singleton for Next.js
 *
 * Prevents multiple PrismaClient instances in development with hot reload.
 * Follows Next.js best practices for database connections.
 *
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
