import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { redis } from '../index';
import { logger } from '@/config/logger';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    const healthInfo = {
      success: true,
      message: 'EvoFit API is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        cache: 'connected',
        api: 'operational',
      },
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    res.status(200).json(healthInfo);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        cache: 'unknown',
        api: 'degraded',
      },
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'One or more services are not responding',
      },
    });
  }
});

// Detailed health check for monitoring
router.get('/detailed', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    cache: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    checks.database = true;

    // Redis health check
    const cacheStart = Date.now();
    await redis.ping();
    const cacheLatency = Date.now() - cacheStart;
    checks.cache = true;

    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      message: allHealthy ? 'All systems operational' : 'Some systems degraded',
      timestamp: checks.timestamp,
      checks: {
        database: {
          status: checks.database ? 'healthy' : 'unhealthy',
          latency: `${dbLatency}ms`,
        },
        cache: {
          status: checks.cache ? 'healthy' : 'unhealthy',
          latency: `${cacheLatency}ms`,
        },
      },
      system: {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
      },
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      timestamp: checks.timestamp,
      checks,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;