import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent');
  
  // Log the incoming request
  logger.info(`${method} ${url}`, {
    method,
    url,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response details
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? 'error'
                   : statusCode >= 400 ? 'warn'
                   : 'info';

    logger.log(logLevel, `${method} ${url} ${statusCode}`, {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      responseTime: duration,
    });

    // Call the original end method and return its result
    return originalEnd(chunk, encoding, callback);
  } as any;

  next();
};

export default requestLogger;