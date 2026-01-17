import { logger } from '@/config/logger';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000ms) */
  baseDelay?: number;
  /** Whether to add jitter to prevent thundering herd (default: true) */
  useJitter?: number;
}

/**
 * Prisma error codes that are safe to retry
 * P1001: Can't reach database server
 * P1003: Connection timeout
 * P1006: Connection pool exhausted
 */
const RETRYABLE_ERROR_CODES = ['P1001', 'P1003', 'P1006'];

/**
 * Check if an error is retryable based on Prisma error codes
 */
function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return RETRYABLE_ERROR_CODES.includes(String(error.code));
  }
  return false;
}

/**
 * Wrapper function for database operations with automatic retry logic
 *
 * Implements exponential backoff with jitter to prevent overwhelming the
 * database during transient failures. This is especially useful for:
 * - Connection timeouts
 * - Database server restarts
 * - Temporary network issues
 * - Connection pool exhaustion
 *
 * @param operation - The async database operation to execute
 * @param options - Retry configuration options
 * @returns Promise<T> - The result of the operation
 * @throws The original error after all retry attempts are exhausted
 *
 * @example
 * ```typescript
 * const user = await withRetry(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    useJitter = 500
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        logger.error(
          `Database operation failed after ${maxRetries} attempts`,
          { error }
        );
        throw error;
      }

      // Only retry if it's a retryable error
      if (!isRetryableError(error)) {
        logger.warn('Database operation failed with non-retryable error', {
          error,
          attempt,
        });
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      // Exponential: baseDelay * 2^(attempt-1) = 1s, 2s, 4s
      // Jitter: Random value up to useJitter to prevent thundering herd
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * useJitter;
      const delay = exponentialDelay + jitter;

      logger.warn(
        `Database operation failed (attempt ${attempt}/${maxRetries}), ` +
          `retrying in ${Math.round(delay)}ms...`,
        { error, attempt, maxRetries, nextRetryIn: Math.round(delay) }
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Calculate delay with exponential backoff and jitter
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @param jitter - Maximum jitter in milliseconds
 * @returns Total delay in milliseconds
 */
export function calculateDelay(
  attempt: number,
  baseDelay: number,
  jitter: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const randomJitter = Math.random() * jitter;
  return exponentialDelay + randomJitter;
}

/**
 * Create a retry wrapper with predefined options
 *
 * Useful for creating specialized retry wrappers for different scenarios.
 *
 * @example
 * ```typescript
 * const quickRetry = createRetryWrapper({ maxRetries: 2, baseDelay: 500 });
 * const user = await quickRetry(() => prisma.user.findUnique(...));
 *
 * const longRetry = createRetryWrapper({ maxRetries: 5, baseDelay: 2000 });
 * const result = await longRetry(() => prisma.analytics.aggregate(...));
 * ```
 */
export function createRetryWrapper(options: RetryOptions) {
  return <T>(operation: () => Promise<T>) => withRetry(operation, options);
}
