import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Generic validation middleware using Zod schemas
 */
export const validate = (schemas: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schemas.body) {
        const validatedBody = schemas.body.parse(req.body);
        req.body = validatedBody;
      }

      // Validate query parameters
      if (schemas.query) {
        const validatedQuery = schemas.query.parse(req.query);
        req.query = validatedQuery;
      }

      // Validate route parameters
      if (schemas.params) {
        const validatedParams = schemas.params.parse(req.params);
        req.params = validatedParams;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // ZodError will be handled by the global error handler
        return next(error);
      }
      
      // Unexpected validation error
      return next(createError(400, 'Validation failed', 'VALIDATION_ERROR'));
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: ZodSchema) => validate({ body: schema });

/**
 * Validate query parameters only
 */
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });

/**
 * Validate route parameters only
 */
export const validateParams = (schema: ZodSchema) => validate({ params: schema });

/**
 * Custom validation helper for complex scenarios
 */
export const customValidation = (
  validationFn: (req: Request) => Promise<void> | void
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await validationFn(req);
      next();
    } catch (error: any) {
      if (error.statusCode) {
        return next(error);
      }
      return next(createError(400, error.message || 'Validation failed', 'VALIDATION_ERROR'));
    }
  };
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  customValidation,
};