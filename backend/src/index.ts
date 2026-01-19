import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';

import { logger } from '@/config/logger';
import { corsOptions } from '@/config/cors';
import { rateLimitConfig } from '@/config/rateLimit';
import { withRetry } from '@/utils/database-retry';

// Routes
import authRoutes from '@/routes/auth';
import healthRoutes from '@/routes/health';
import exerciseRoutes from '@/routes/exercises';
import programRoutes from '@/routes/programs';
import analyticsRoutes from '@/routes/analytics';
import { clientRoutes } from '@/routes/clientRoutes';

// Middleware
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';

// ============================================================================
// Configuration
// ============================================================================

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================================
// Database: Prisma Client Singleton
// ============================================================================

/**
 * Initialize Prisma with singleton pattern to prevent multiple instances in development
 *
 * This prevents connection pool exhaustion caused by hot reloads in development.
 * Uses globalThis to persist the PrismaClient instance across module reloads.
 *
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// Cache: Redis Client
// ============================================================================

/**
 * Initialize Redis client for caching and session management
 *
 * Redis is used for:
 * - Session storage
 * - API response caching
 * - Rate limiting counters
 */
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}) as RedisClientType;

// ============================================================================
// Middleware Configuration
// ============================================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors(corsOptions));
app.use(rateLimitConfig);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/clients', clientRoutes);

// ============================================================================
// Error Handlers
// ============================================================================

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler (must be after error handler)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
    },
  });
});

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Connect to PostgreSQL database with retry logic
 *
 * Uses exponential backoff retry wrapper to handle transient failures.
 * This improves resilience during database restarts or temporary network issues.
 *
 * @throws Error if connection fails after max retries
 */
async function connectDatabase(): Promise<void> {
  await withRetry(
    async () => {
      await prisma.$connect();
      logger.info('✅ Connected to PostgreSQL database');
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      useJitter: 500,
    }
  );
}

/**
 * Connect to Redis cache with retry logic
 *
 * Uses exponential backoff retry wrapper to handle transient failures.
 * Redis is optional for basic operation but recommended for production.
 *
 * @throws Error if connection fails after max retries
 */
async function connectRedis(): Promise<void> {
  await withRetry(
    async () => {
      await redis.connect();
      logger.info('✅ Connected to Redis cache');
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      useJitter: 500,
    }
  );
}

/**
 * Disconnect all connections gracefully
 *
 * Called during shutdown to ensure clean connection closure.
 * Prevents connection leaks and ensures data consistency.
 */
async function disconnectAll(): Promise<void> {
  try {
    await prisma.$disconnect();
    await redis.disconnect();
    logger.info('✅ All connections closed');
  } catch (error) {
    logger.error('❌ Error during disconnection:', error);
    throw error;
  }
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the Express server
 *
 * Initializes database and Redis connections before listening for requests.
 * Uses retry logic for resilient connection establishment.
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database and Redis with retry logic
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 EvoFit Backend API running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================

/**
 * Handle SIGINT (Ctrl+C) for graceful shutdown
 */
process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  try {
    await disconnectAll();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

/**
 * Handle SIGTERM for graceful shutdown (e.g., Docker, Kubernetes)
 */
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down...');
  try {
    await disconnectAll();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

/**
 * Handle unhandled promise rejections
 * Prevents process from exiting silently with unhandled errors
 */
process.on('unhandledRejection', (err: Error) => {
  logger.error('🚨 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// ============================================================================
// Start Server
// ============================================================================

startServer();
