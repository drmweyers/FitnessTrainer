import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import { logger } from '@/config/logger';
import { corsOptions } from '@/config/cors';
import { rateLimitConfig } from '@/config/rateLimit';

// Routes
import authRoutes from '@/routes/auth';
import healthRoutes from '@/routes/health';
import exerciseRoutes from '@/routes/exercises';
import programRoutes from '@/routes/programs';
import analyticsRoutes from '@/routes/analytics';
console.log('Loading routes...');
// import workingProfileRoutes from '@/routes/workingProfileRoutes';
import { clientRoutes } from '@/routes/clientRoutes';
console.log('Routes loaded.');
// import profileRoutes from '@/routes/profileRoutes';

// Middleware
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Prisma
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize Redis
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Global middleware
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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/analytics', analyticsRoutes);
// app.use('/api/profile', workingProfileRoutes);
app.use('/api/clients', clientRoutes);
// TODO: Re-enable full profile routes after fixing import issues
// app.use('/api/profile', profileRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
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

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL database');

    // Connect to Redis
    await redis.connect();
    logger.info('✅ Connected to Redis cache');

    // Start server
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

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    await redis.disconnect();
    logger.info('✅ Connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down...');
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('🚨 Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();