/**
 * Enterprise-Grade Rate Limiting
 * Token Bucket implementation for preventing brute-force attacks and spam
 * 
 * Uses in-memory Map for VPS deployments (for Vercel, use Vercel KV instead)
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const ENTRY_TTL = 60 * 60 * 1000; // 1 hour TTL

let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  const expiredTime = now - ENTRY_TTL;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastRefill < expiredTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limit Configuration Presets
 */
export const RATE_LIMITS = {
  // Login: 5 attempts per minute
  AUTH_LOGIN: {
    maxTokens: 5,
    refillRate: 5, // tokens per minute
    windowMs: 60 * 1000,
  },
  // Chat messages: 10 per minute
  CHAT_MESSAGE: {
    maxTokens: 10,
    refillRate: 10,
    windowMs: 60 * 1000,
  },
  // Contact form: 3 submissions per 10 minutes
  CONTACT_FORM: {
    maxTokens: 3,
    refillRate: 3,
    windowMs: 10 * 60 * 1000,
  },
  // API general: 60 requests per minute
  API_GENERAL: {
    maxTokens: 60,
    refillRate: 60,
    windowMs: 60 * 1000,
  },
  // Cart operations: 30 per minute
  CART_OPERATIONS: {
    maxTokens: 30,
    refillRate: 30,
    windowMs: 60 * 1000,
  },
  // Order creation: 5 per hour
  ORDER_CREATE: {
    maxTokens: 5,
    refillRate: 5,
    windowMs: 60 * 60 * 1000,
  },
  // Review submission: 10 per hour
  REVIEW_SUBMIT: {
    maxTokens: 10,
    refillRate: 10,
    windowMs: 60 * 60 * 1000,
  },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMITS;

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (IP, userId, email, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Periodically cleanup old entries
  cleanupOldEntries();
  
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First request - initialize with full tokens
    entry = {
      tokens: config.maxTokens - 1, // Consume one token
      lastRefill: now,
    };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      remaining: entry.tokens,
      resetAt: new Date(now + config.windowMs),
    };
  }
  
  // Calculate time elapsed and tokens to refill
  const elapsed = now - entry.lastRefill;
  const tokensToRefill = Math.floor((elapsed / config.windowMs) * config.refillRate);
  
  // Refill tokens (cap at max)
  entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToRefill);
  entry.lastRefill = now;
  
  // Check if we have tokens available
  if (entry.tokens <= 0) {
    // Calculate when the next token will be available
    const nextRefillIn = Math.ceil(config.windowMs / config.refillRate);
    
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(now + nextRefillIn),
      retryAfter: Math.ceil(nextRefillIn / 1000), // In seconds
    };
  }
  
  // Consume a token
  entry.tokens -= 1;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: entry.tokens,
    resetAt: new Date(now + config.windowMs),
  };
}

/**
 * Rate limit check using preset configurations
 */
export function rateLimit(
  identifier: string,
  preset: RateLimitPreset
): RateLimitResult {
  const config = RATE_LIMITS[preset];
  return checkRateLimit(identifier, config);
}

/**
 * Generate identifier from request (for API routes)
 * Combines IP and optional user ID for better tracking
 */
export function getIdentifier(
  ip: string | null,
  userId?: string | null,
  prefix?: string
): string {
  const baseId = userId || ip || "anonymous";
  return prefix ? `${prefix}:${baseId}` : baseId;
}

/**
 * Create rate-limited response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
  
  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Server action rate limit wrapper
 * Returns error object if rate limited
 */
export async function withRateLimit<T>(
  identifier: string,
  preset: RateLimitPreset,
  action: () => Promise<T>
): Promise<T | { error: string; retryAfter?: number }> {
  const result = rateLimit(identifier, preset);
  
  if (!result.success) {
    console.warn(
      `[RateLimit] Blocked ${preset} for ${identifier}. Retry after ${result.retryAfter}s`
    );
    return {
      error: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    };
  }
  
  return action();
}

/**
 * Reset rate limit for a specific identifier (for admin use)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit stats (for debugging/monitoring)
 */
export function getRateLimitStats(): { totalEntries: number; identifiers: string[] } {
  return {
    totalEntries: rateLimitStore.size,
    identifiers: Array.from(rateLimitStore.keys()),
  };
}

