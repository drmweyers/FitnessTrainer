/**
 * Environment Variable Validation Utility
 *
 * Checks for required and optional environment variables
 * Never throws errors - only returns validation reports
 */

export interface EnvCheckResult {
  category: 'required' | 'optional' | 'infrastructure';
  name: string;
  present: boolean;
  isEmpty?: boolean;
}

export interface EnvReport {
  allRequired: boolean;
  missing: string[];
  empty: string[];
  results: EnvCheckResult[];
}

/**
 * Required environment variables (app won't function without these)
 */
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
] as const;

/**
 * Optional environment variables (app works without these, but features may be limited)
 */
const OPTIONAL_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * Infrastructure variables (for external services)
 */
const INFRASTRUCTURE_VARS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'REDIS_URL',
] as const;

/**
 * Check a single environment variable
 */
function checkVar(
  name: string,
  category: 'required' | 'optional' | 'infrastructure'
): EnvCheckResult {
  const value = process.env[name];
  const present = value !== undefined;
  const isEmpty = present && value.trim() === '';

  return {
    category,
    name,
    present,
    isEmpty,
  };
}

/**
 * Check all environment variables and return a comprehensive report
 *
 * @returns EnvReport with validation results
 */
export function checkEnvironment(): EnvReport {
  const results: EnvCheckResult[] = [];
  const missing: string[] = [];
  const empty: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const result = checkVar(varName, 'required');
    results.push(result);

    if (!result.present) {
      missing.push(varName);
    } else if (result.isEmpty) {
      empty.push(varName);
    }
  }

  // Check optional variables
  for (const varName of OPTIONAL_VARS) {
    const result = checkVar(varName, 'optional');
    results.push(result);
  }

  // Check infrastructure variables
  for (const varName of INFRASTRUCTURE_VARS) {
    const result = checkVar(varName, 'infrastructure');
    results.push(result);
  }

  const allRequired = missing.length === 0 && empty.length === 0;

  return {
    allRequired,
    missing,
    empty,
    results,
  };
}

/**
 * Log environment check results (non-throwing)
 *
 * @param report - The environment report to log
 */
export function logEnvironmentCheck(report: EnvReport): void {
  if (report.allRequired) {
    console.log('✅ All required environment variables are set');
  } else {
    if (report.missing.length > 0) {
      console.warn('⚠️  Missing required environment variables:', report.missing.join(', '));
    }
    if (report.empty.length > 0) {
      console.warn('⚠️  Empty required environment variables:', report.empty.join(', '));
    }
  }

  // Log optional variables status
  const optionalResults = report.results.filter((r) => r.category === 'optional');
  const missingOptional = optionalResults.filter((r) => !r.present);

  if (missingOptional.length > 0) {
    console.info(
      'ℹ️  Missing optional environment variables (some features may be limited):',
      missingOptional.map((r) => r.name).join(', ')
    );
  }

  // Log infrastructure status
  const infraResults = report.results.filter((r) => r.category === 'infrastructure');
  const presentInfra = infraResults.filter((r) => r.present);

  if (presentInfra.length > 0) {
    console.info(
      '🔧 Infrastructure services configured:',
      presentInfra.map((r) => r.name).join(', ')
    );
  }
}

/**
 * Get a summary object suitable for API responses (no sensitive values)
 */
export function getEnvironmentSummary(): {
  required: Record<string, boolean>;
  optional: Record<string, boolean>;
  infrastructure: Record<string, boolean>;
} {
  const report = checkEnvironment();

  return {
    required: Object.fromEntries(
      report.results
        .filter((r) => r.category === 'required')
        .map((r) => [r.name, r.present && !r.isEmpty])
    ),
    optional: Object.fromEntries(
      report.results.filter((r) => r.category === 'optional').map((r) => [r.name, r.present])
    ),
    infrastructure: Object.fromEntries(
      report.results.filter((r) => r.category === 'infrastructure').map((r) => [r.name, r.present])
    ),
  };
}
