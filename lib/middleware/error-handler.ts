/**
 * Error Handler Middleware (Platform-Agnostic)
 *
 * Centralized error handling for API routes
 * Works with Vercel API Routes and Express.js
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * API Error response structure
 */
export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  code: string;
  name: string;
  error: {
    code: string;
    details?: any;
    stack?: string; // Only in development
  };
}

/**
 * Handle API errors and format response
 *
 * Catches and formats:
 * - Zod validation errors
 * - Prisma database errors
 * - JWT authentication errors
 * - Custom application errors
 *
 * @param error - Caught error object
 * @returns Formatted NextResponse
 */
export function handleApiError(error: any): NextResponse {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Log error for debugging
  console.error('API Error:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }

  // Prisma database errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
        details = {
          field: error.meta?.target,
          constraint: error.meta?.constraint,
        };
        break;

      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'RESOURCE_NOT_FOUND';
        break;

      case 'P2003':
        // Foreign key constraint failed
        statusCode = 400;
        message = 'Invalid reference to related resource';
        errorCode = 'INVALID_REFERENCE';
        details = {
          field: error.meta?.field_name,
        };
        break;

      case 'P2014':
        // Required related record not found
        statusCode = 400;
        message = 'Required related record not found';
        errorCode = 'MISSING_RELATION';
        break;

      default:
        statusCode = 500;
        message = 'Database error';
        errorCode = 'DATABASE_ERROR';
        break;
    }
  }

  // Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    errorCode = 'INVALID_DATA';
  }

  // Prisma initialization errors
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
    errorCode = 'DATABASE_UNAVAILABLE';
  }

  // JWT errors
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (error.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token not yet valid';
    errorCode = 'TOKEN_NOT_ACTIVE';
  }

  // Custom application errors with status code
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.code || 'APPLICATION_ERROR';
  }

  // Generic errors with HTTP status code
  else if (error.status) {
    statusCode = error.status;
    message = error.message || 'Request failed';
    errorCode = error.code || 'HTTP_ERROR';
  }

  // Build error response
  const errorResponse: ApiError = {
    success: false,
    message,
    statusCode,
    code: errorCode,
    name: error.name || 'Error',
    error: {
      code: errorCode,
      ...(details && { details }),
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Create a custom API error
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common error constructors
 */
export const Errors = {
  badRequest: (message: string = 'Bad request') =>
    new ApiError(400, 'BAD_REQUEST', message),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, 'UNAUTHORIZED', message),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, 'FORBIDDEN', message),

  notFound: (resource: string = 'Resource') =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),

  conflict: (message: string = 'Resource already exists') =>
    new ApiError(409, 'CONFLICT', message),

  unprocessable: (message: string = 'Invalid data') =>
    new ApiError(422, 'UNPROCESSABLE_ENTITY', message),

  tooManyRequests: (message: string = 'Too many requests') =>
    new ApiError(429, 'TOO_MANY_REQUESTS', message),

  internal: (message: string = 'Internal server error') =>
    new ApiError(500, 'INTERNAL_ERROR', message),

  serviceUnavailable: (message: string = 'Service unavailable') =>
    new ApiError(503, 'SERVICE_UNAVAILABLE', message),
};

export default handleApiError;
