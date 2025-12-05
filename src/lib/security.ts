/**
 * Enterprise-Grade Security Utilities for Server Actions
 * Implements the "Zero Trust" model for all server-side operations
 */

import 'server-only';
import { auth } from "@/auth";
import { z } from "zod";
import { 
  logSecurityEvent as logEvent,
  securityLog,
  type SecurityEventDetails 
} from "./security-logger";
import { 
  recordSuspiciousActivity, 
  recordFailedLogin, 
  clearFailedLogins,
  detectAttackPatterns 
} from "./ip-security";

// ============================================================================
// TYPES
// ============================================================================

export interface SecureSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: "USER" | "ADMIN";
    image?: string | null;
  };
}

export interface AuthResult {
  session: SecureSession;
}

export interface AdminAuthResult extends AuthResult {
  session: SecureSession & { user: { role: "ADMIN" } };
}

// ============================================================================
// AUTHENTICATION GUARDS
// ============================================================================

/**
 * Require authenticated user - throws if not authenticated
 * Use at the top of every server action that requires a logged-in user
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required");
  }

  const userId = (session.user as any)?.id;
  const userEmail = session.user.email;
  const userRole = (session.user as any)?.role || "USER";

  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized: Invalid session");
  }

  return {
    session: {
      user: {
        id: userId,
        email: userEmail || "",
        name: session.user.name,
        role: userRole,
        image: session.user.image,
      },
    },
  };
}

/**
 * Require admin role - throws if not admin
 * Use for all admin-only server actions
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { session } = await requireAuth();

  if (session.user.role !== "ADMIN") {
    // Log security event for audit
    securityLog.adminDenied({
      userId: session.user.id,
      userEmail: session.user.email,
      reason: `User role is ${session.user.role}, ADMIN required`,
    });
    throw new Error("Forbidden: Admin access required");
  }

  return { session: session as AdminAuthResult["session"] };
}

/**
 * Optional auth - returns session if available, null otherwise
 * Use for actions that work differently for logged-in vs anonymous users
 */
export async function optionalAuth(): Promise<AuthResult | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate input against a Zod schema
 * Returns validated data or throws with user-friendly error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    const field = firstError?.path?.join(".") || "input";
    const message = firstError?.message || "Validation failed";
    throw new Error(`Invalid ${field}: ${message}`);
  }

  return result.data;
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError?.message || "Validation failed",
  };
}

// ============================================================================
// IDOR PROTECTION
// ============================================================================

/**
 * Verify resource ownership - prevents IDOR attacks
 * Always use this when accessing user-specific resources
 */
export function verifyOwnership(
  resourceUserId: string | null | undefined,
  sessionUserId: string,
  resourceName: string = "resource"
): void {
  if (!resourceUserId) {
    throw new Error(`${resourceName} not found`);
  }

  if (resourceUserId !== sessionUserId) {
    // Log potential IDOR attempt
    securityLog.idorAttempt({
      userId: sessionUserId,
      resourceId: resourceUserId,
      resourceType: resourceName,
      reason: `User ${sessionUserId} tried to access ${resourceName} owned by ${resourceUserId}`,
    });
    throw new Error(`${resourceName} not found`);
  }
}

/**
 * Build ownership filter for Prisma queries
 * Always include this in WHERE clauses for user data
 */
export function ownershipFilter(sessionUserId: string): { userId: string } {
  return { userId: sessionUserId };
}

// ============================================================================
// SERVER ACTION WRAPPER
// ============================================================================

type ActionResult<T> = T | { error: string };

/**
 * Wrap server action with standard error handling
 * Catches errors and returns user-friendly error objects
 */
export async function safeAction<T>(
  action: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (error) {
    // Log the actual error for debugging
    console.error("[ServerAction] Error:", error);

    // Return user-friendly error
    if (error instanceof Error) {
      // Don't expose internal errors
      if (
        error.message.includes("Prisma") ||
        error.message.includes("database") ||
        error.message.includes("SQL")
      ) {
        return { error: "An unexpected error occurred. Please try again." };
      }
      return { error: error.message };
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Create a protected server action with auth + validation + error handling
 */
export function createProtectedAction<TInput, TOutput>(options: {
  schema?: z.ZodSchema<TInput>;
  requireAdmin?: boolean;
  handler: (input: TInput, session: SecureSession) => Promise<TOutput>;
}): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput) => {
    return safeAction(async () => {
      // 1. Authenticate
      const auth = options.requireAdmin
        ? await requireAdmin()
        : await requireAuth();

      // 2. Validate input (if schema provided)
      const validatedInput = options.schema
        ? validateInput(options.schema, input)
        : input;

      // 3. Execute handler
      return options.handler(validatedInput, auth.session);
    });
  };
}

// ============================================================================
// SECURITY LOGGING (Re-exported from security-logger)
// ============================================================================

/**
 * Log security-relevant events
 * @deprecated Use securityLog from security-logger.ts for better typing
 */
export { logEvent as logSecurityEvent, securityLog };

/**
 * Record authentication failure (triggers brute force protection)
 */
export function recordAuthFailure(ip: string, email?: string): void {
  const result = recordFailedLogin(ip, email);
  securityLog.authFailure({ 
    ip, 
    userEmail: email,
    metadata: { attemptsRemaining: result.attemptsRemaining }
  });
}

/**
 * Clear authentication failures on successful login
 */
export function onAuthSuccess(ip: string, userId: string): void {
  clearFailedLogins(ip);
  securityLog.authSuccess({ ip, userId });
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize string for safe database storage
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Sanitize HTML content (basic XSS prevention)
 * For rich text, use a proper sanitizer like DOMPurify on the client
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ============================================================================
// ATTACK DETECTION
// ============================================================================

/**
 * Scan input for attack patterns and log suspicious activity
 */
export function scanForAttacks(
  input: string | Record<string, unknown>,
  ip?: string,
  userId?: string
): { safe: boolean; patterns: string[] } {
  const stringToScan = typeof input === "string" 
    ? input 
    : JSON.stringify(input);
  
  const result = detectAttackPatterns(stringToScan);
  
  if (result.detected && ip) {
    // Record suspicious activity
    for (const pattern of result.patterns) {
      recordSuspiciousActivity(ip, `${pattern}_ATTEMPT`, { 
        userId, 
        inputSample: stringToScan.substring(0, 100) 
      });
    }
    
    // Log security event
    if (result.patterns.includes("SQL_INJECTION")) {
      logEvent("SQL_INJECTION_ATTEMPT", { ip, userId });
    }
    if (result.patterns.includes("XSS")) {
      logEvent("XSS_ATTEMPT", { ip, userId });
    }
  }
  
  return { safe: !result.detected, patterns: result.patterns };
}

/**
 * Validate and scan input for attacks
 */
export function secureValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  ip?: string,
  userId?: string
): T {
  // First, scan for attack patterns
  const scanResult = scanForAttacks(data as string | Record<string, unknown>, ip, userId);
  
  if (!scanResult.safe) {
    throw new Error("Invalid input detected");
  }
  
  // Then validate with Zod
  return validateInput(schema, data);
}

// ============================================================================
// CSRF VERIFICATION
// ============================================================================

export { verifyCSRFToken, withCSRFProtection } from "./csrf";

