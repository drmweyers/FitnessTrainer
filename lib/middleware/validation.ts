/**
 * Validation Middleware (Platform-Agnostic)
 *
 * Request validation using Zod schemas
 * Works with Vercel API Routes and Express.js
 */

import { ZodSchema, ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { handleApiError } from './error-handler';

/**
 * Validation error response
 */
function createValidationError(errors: any[]) {
  return {
    success: false,
    message: 'Validation failed',
    error: {
      code: 'VALIDATION_ERROR',
      details: errors,
    },
  };
}

/**
 * Validate request body against Zod schema
 *
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validated data or error response
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(createValidationError(details), { status: 400 });
    }
    return handleApiError(error);
  }
}

/**
 * Validate query parameters against Zod schema
 *
 * @param searchParams - URLSearchParams from request
 * @param schema - Zod schema for validation
 * @returns Validated data or error response
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T | NextResponse {
  try {
    // Convert URLSearchParams to plain object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., ?tags=a&tags=b)
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(createValidationError(details), { status: 400 });
    }
    return handleApiError(error);
  }
}

/**
 * Validate route parameters against Zod schema
 *
 * @param params - Route parameters object
 * @param schema - Zod schema for validation
 * @returns Validated data or error response
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T | NextResponse {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(createValidationError(details), { status: 400 });
    }
    return handleApiError(error);
  }
}

/**
 * Validate multiple parts of the request
 *
 * @param request - Next.js request object
 * @param schemas - Object containing schemas for body, query, and params
 * @returns Object with validated data or error response
 */
export async function validate<TBody = any, TQuery = any, TParams = any>(
  request: Request & { nextUrl?: { searchParams: URLSearchParams } },
  schemas: {
    body?: ZodSchema<TBody>;
    query?: ZodSchema<TQuery>;
    params?: ZodSchema<TParams>;
  }
): Promise<
  | { body?: TBody; query?: TQuery; params?: TParams }
  | NextResponse
> {
  const result: any = {};

  // Validate body
  if (schemas.body) {
    const bodyResult = await validateBody(request, schemas.body);
    if (bodyResult instanceof NextResponse) return bodyResult;
    result.body = bodyResult;
  }

  // Validate query
  if (schemas.query && request.nextUrl) {
    const queryResult = validateQuery(
      request.nextUrl.searchParams,
      schemas.query
    );
    if (queryResult instanceof NextResponse) return queryResult;
    result.query = queryResult;
  }

  // Validate params (if available)
  if (schemas.params && (request as any).params) {
    const paramsResult = validateParams(
      (request as any).params,
      schemas.params
    );
    if (paramsResult instanceof NextResponse) return paramsResult;
    result.params = paramsResult;
  }

  return result;
}

/**
 * Custom validation function
 * Use for complex validation logic that Zod can't handle
 */
export function customValidation(
  condition: boolean,
  message: string,
  field?: string
): NextResponse | null {
  if (!condition) {
    const details = field
      ? [{ field, message }]
      : [{ message }];
    return NextResponse.json(createValidationError(details), { status: 400 });
  }
  return null;
}

export default validateBody;
