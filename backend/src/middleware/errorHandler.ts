import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '@/config/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError | ZodError | Prisma.PrismaClientKnownRequestError | JsonWebTokenError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Log error for debugging
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Handle different error types
  if (error instanceof ZodError) {
    // Validation errors
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  } 
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Database errors
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
        // Extract field from meta if available
        const field = (error.meta as any)?.target?.[0] || 'field';
        details = { field, constraint: 'unique' };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        errorCode = 'FOREIGN_KEY_ERROR';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred';
        errorCode = 'DATABASE_ERROR';
    }
  }
  else if (error instanceof TokenExpiredError) {
    // JWT expired
    statusCode = 401;
    message = 'Token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }
  else if (error instanceof JsonWebTokenError) {
    // Invalid JWT
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }
  else if (error.statusCode) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.code || 'APPLICATION_ERROR';
  }

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && { details }),
      ...(isDevelopment && { 
        stack: error.stack,
        originalError: error.message 
      }),
    },
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (
  statusCode: number, 
  message: string, 
  code?: string
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
};

export default errorHandler;