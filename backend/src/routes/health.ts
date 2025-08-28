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
    exerciseLibrary: false,
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

    // Exercise Library health check (critical for Epic 004)
    // TODO: Enable when Exercise model is implemented
    const exerciseStart = Date.now();
    let totalExercises = 0;
    let activeExercises = 0;
    let bodyParts: any[] = [];
    let exerciseLatency = 0;
    
    try {
      // Check if Exercise model exists by trying to query it
      [totalExercises, activeExercises, bodyParts] = await Promise.all([
        prisma.exercise.count(),
        prisma.exercise.count({ where: { isActive: true } }),
        prisma.exercise.findMany({
          select: { bodyPart: true },
          distinct: ['bodyPart']
        })
      ]);
      exerciseLatency = Date.now() - exerciseStart;
      checks.exerciseLibrary = totalExercises > 0;
    } catch (error) {
      // Exercise table doesn't exist yet (Epic 004 not implemented)
      exerciseLatency = Date.now() - exerciseStart;
      checks.exerciseLibrary = false;
      logger.info('Exercise library not yet implemented - skipping exercise health check');
    }

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
        exerciseLibrary: {
          status: checks.exerciseLibrary ? 'healthy' : 'unhealthy',
          latency: `${exerciseLatency}ms`,
          details: {
            totalExercises,
            activeExercises,
            bodyPartsCount: bodyParts.length,
            dataQuality: totalExercises >= 1000 ? 'good' : 'needs_attention'
          }
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