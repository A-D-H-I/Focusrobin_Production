/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup
 * Fails fast if critical variables are missing
 */

import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  
  // Google OAuth (optional but recommended)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Rate limiting secret
  CSRF_SECRET: z.string().min(32).optional(),
  
  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  
  // AI (optional)
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

// Derived environment type
export type Env = z.infer<typeof envSchema>;

// Validation result
interface ValidationResult {
  success: boolean;
  env?: Env;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validate environment variables
 */
export function validateEnv(): ValidationResult {
  const warnings: string[] = [];
  
  // Check for production-specific requirements
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    if (!process.env.NEXTAUTH_URL) {
      warnings.push("NEXTAUTH_URL should be set in production");
    }
    if (!process.env.CSRF_SECRET) {
      warnings.push("CSRF_SECRET should be set in production (using NEXTAUTH_SECRET as fallback)");
    }
  }

  // Validate schema
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`
    );
    return { success: false, errors, warnings };
  }

  // Additional security checks
  if (result.data.NEXTAUTH_SECRET === "your-secret-key" || 
      result.data.NEXTAUTH_SECRET?.includes("change-me")) {
    return {
      success: false,
      errors: ["NEXTAUTH_SECRET appears to be a placeholder. Please set a secure random value."],
      warnings,
    };
  }

  return { success: true, env: result.data, warnings };
}

/**
 * Assert environment is valid (throws on error)
 * Call this at application startup
 */
export function assertEnvIsValid(): Env {
  const result = validateEnv();

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    result.errors?.forEach((err) => console.error(`  - ${err}`));
    throw new Error("Invalid environment configuration");
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn("⚠️ Environment warnings:");
    result.warnings.forEach((warn) => console.warn(`  - ${warn}`));
  }

  console.log("✅ Environment validation passed");
  return result.env!;
}

/**
 * Get validated environment (safe version)
 */
export function getEnv(): Partial<Env> {
  const result = validateEnv();
  return result.env || {};
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get security configuration summary (for logging)
 */
export function getSecurityConfigSummary(): Record<string, boolean | string> {
  return {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
    hasCSRFSecret: !!process.env.CSRF_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
  };
}

