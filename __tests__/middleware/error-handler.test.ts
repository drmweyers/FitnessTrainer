/**
 * Tests for lib/middleware/error-handler.ts
 * handleApiError(), ApiError class, Errors factory
 */

import { NextResponse } from 'next/server';
import { ZodError, ZodIssue } from 'zod';
import { Prisma } from '@prisma/client';
import { handleApiError, ApiError, Errors } from '@/lib/middleware/error-handler';

// Suppress console.error in tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('handleApiError', () => {
  it('handles ZodError with field details', async () => {
    const zodError = new ZodError([
      {
        code: 'too_small',
        minimum: 8,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Password too short',
        path: ['password'],
      } as ZodIssue,
    ]);

    const result = handleApiError(zodError);
    const body = await result.json();

    expect(result.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([
      { field: 'password', message: 'Password too short' },
    ]);
  });

  it('handles Prisma P2002 unique constraint violation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['email'] },
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(409);
    expect(body.code).toBe('DUPLICATE_RESOURCE');
    expect(body.error.details.field).toEqual(['email']);
  });

  it('handles Prisma P2025 record not found', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(404);
    expect(body.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('handles Prisma P2003 foreign key constraint', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '5.0.0',
      meta: { field_name: 'userId' },
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(400);
    expect(body.code).toBe('INVALID_REFERENCE');
  });

  it('handles Prisma P2014 required relation not found', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Required relation not found', {
      code: 'P2014',
      clientVersion: '5.0.0',
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(400);
    expect(body.code).toBe('MISSING_RELATION');
  });

  it('handles unknown Prisma error code as 500', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unknown error', {
      code: 'P9999',
      clientVersion: '5.0.0',
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body.code).toBe('DATABASE_ERROR');
  });

  it('handles PrismaClientValidationError', async () => {
    const error = new Prisma.PrismaClientValidationError('Invalid data', {
      clientVersion: '5.0.0',
    });

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(400);
    expect(body.code).toBe('INVALID_DATA');
  });

  it('handles PrismaClientInitializationError', async () => {
    const error = new Prisma.PrismaClientInitializationError('Cannot connect', '5.0.0');

    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(503);
    expect(body.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('handles TokenExpiredError', async () => {
    const error = { name: 'TokenExpiredError', message: 'jwt expired' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(401);
    expect(body.code).toBe('TOKEN_EXPIRED');
  });

  it('handles JsonWebTokenError', async () => {
    const error = { name: 'JsonWebTokenError', message: 'invalid token' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(401);
    expect(body.code).toBe('INVALID_TOKEN');
  });

  it('handles NotBeforeError', async () => {
    const error = { name: 'NotBeforeError', message: 'jwt not active' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(401);
    expect(body.code).toBe('TOKEN_NOT_ACTIVE');
  });

  it('handles custom error with statusCode', async () => {
    const error = { statusCode: 422, message: 'Bad input', code: 'MY_CODE', name: 'AppError' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(422);
    expect(body.message).toBe('Bad input');
    expect(body.code).toBe('MY_CODE');
  });

  it('handles custom error with statusCode but no code', async () => {
    const error = { statusCode: 400, message: 'Bad', name: 'Error' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.code).toBe('APPLICATION_ERROR');
  });

  it('handles error with status property', async () => {
    const error = { status: 502, message: 'Bad gateway', name: 'GatewayError' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(502);
    expect(body.code).toBe('HTTP_ERROR');
  });

  it('handles error with status but no message', async () => {
    const error = { status: 500, name: 'Error' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.message).toBe('Request failed');
  });

  it('handles generic error as 500', async () => {
    const error = new Error('Something broke');
    const result = handleApiError(error);
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('Internal server error');
  });

  it('includes stack in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Dev error');
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.error.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('omits stack in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Prod error');
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.error.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('uses error.name for the name field', async () => {
    const error = { name: 'CustomError', message: 'msg' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.name).toBe('CustomError');
  });

  it('defaults name to Error when not provided', async () => {
    const error = { message: 'no name' };
    const result = handleApiError(error);
    const body = await result.json();

    expect(body.name).toBe('Error');
  });
});

describe('ApiError class', () => {
  it('creates error with statusCode, code, and message', () => {
    const error = new ApiError(404, 'NOT_FOUND', 'Thing not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Thing not found');
    expect(error.name).toBe('ApiError');
  });
});

describe('Errors factory', () => {
  it('creates badRequest with defaults', () => {
    const error = Errors.badRequest();
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Bad request');
  });

  it('creates badRequest with custom message', () => {
    const error = Errors.badRequest('Missing field');
    expect(error.message).toBe('Missing field');
  });

  it('creates unauthorized with defaults', () => {
    const error = Errors.unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('creates forbidden with defaults', () => {
    const error = Errors.forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('creates notFound with resource name', () => {
    const error = Errors.notFound('User');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('User not found');
  });

  it('creates notFound with default resource', () => {
    const error = Errors.notFound();
    expect(error.message).toBe('Resource not found');
  });

  it('creates conflict with defaults', () => {
    const error = Errors.conflict();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('creates unprocessable with defaults', () => {
    const error = Errors.unprocessable();
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('creates tooManyRequests with defaults', () => {
    const error = Errors.tooManyRequests();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('creates internal with defaults', () => {
    const error = Errors.internal();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  it('creates serviceUnavailable with defaults', () => {
    const error = Errors.serviceUnavailable();
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
