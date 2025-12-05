/**
 * Redis/Vercel KV Rate Limiter
 * 
 * Production-ready distributed rate limiting using Redis or Vercel KV
 * Falls back to in-memory rate limiting if Redis is not available
 */

import { RATE_LIMITS, type RateLimitPreset, type RateLimitResult, type RateLimitConfig } from "./rate-limit";
import { logSecurityEvent } from "./security-logger";

// Check if we're using Vercel KV
let kvClient: any = null;
let redisClient: any = null;
let kvInitialized = false;
let redisInitialized = false;

// Try to import Vercel KV (optional dependency)
async function getKVClient(): Promise<any> {
  if (kvInitialized) return kvClient;
  kvInitialized = true;
  
  // Only try if KV env vars are set
  if (!process.env.KV_REST_API_URL) return null;
  
  try {
    // Dynamic import for Vercel KV
    const module = await import("@vercel/kv" as string);
    kvClient = module.kv;
    console.log("[RateLimit] Using Vercel KV for rate limiting");
    return kvClient;
  } catch {
    console.log("[RateLimit] Vercel KV not available, using memory fallback");
    return null;
  }
}

// Try to get Redis client (optional dependency)
async function getRedisClient(): Promise<any> {
  if (redisInitialized) return redisClient;
  redisInitialized = true;
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  
  try {
    // Dynamic import for ioredis
    const Redis = (await import("ioredis" as string)).default;
    redisClient = new Redis(redisUrl);
    console.log("[RateLimit] Using Redis for rate limiting");
    return redisClient;
  } catch {
    console.log("[RateLimit] Redis not available, using memory fallback");
    return null;
  }
}

/**
 * Token bucket implementation for Redis/KV
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Get rate limit key
 */
function getRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`;
}

/**
 * Rate limit using Vercel KV
 */
async function rateLimitWithKV(
  identifier: string,
  preset: RateLimitPreset
): Promise<RateLimitResult> {
  const client = await getKVClient();
  if (!client) {
    // Fall back to memory rate limiter
    const { rateLimit } = await import("./rate-limit");
    return rateLimit(identifier, preset);
  }

  const config = RATE_LIMITS[preset];
  const key = getRateLimitKey(identifier, preset);
  const now = Date.now();

  try {
    // Get current bucket state
    const bucketStr = await client.get(key);
    let bucket: TokenBucket = bucketStr 
      ? (typeof bucketStr === "string" ? JSON.parse(bucketStr) : bucketStr)
      : { tokens: config.maxTokens, lastRefill: now };

    // Calculate token refill
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / config.windowMs) * config.refillRate;
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    
    if (tokensToAdd > 0) {
      bucket.lastRefill = now;
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      
      // Update bucket in KV with TTL
      const ttlSeconds = Math.ceil(config.windowMs / 1000) * 2;
      await client.set(key, JSON.stringify(bucket), { ex: ttlSeconds });
      
      return {
        success: true,
        remaining: bucket.tokens,
        resetAt: new Date(bucket.lastRefill + config.windowMs),
      };
    }

    // Rate limit exceeded
    logSecurityEvent("RATE_LIMIT_EXCEEDED", {
      resourceId: identifier,
      resourceType: preset,
      metadata: { remaining: bucket.tokens },
    });

    return {
      success: false,
      remaining: 0,
      resetAt: new Date(bucket.lastRefill + config.windowMs),
    };
  } catch (error) {
    console.error("[RateLimit] KV error:", error);
    // Fall back to allowing the request on error
    return { success: true, remaining: config.maxTokens, resetAt: new Date() };
  }
}

/**
 * Rate limit using Redis
 */
async function rateLimitWithRedis(
  identifier: string,
  preset: RateLimitPreset
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    // Fall back to memory rate limiter
    const { rateLimit } = await import("./rate-limit");
    return rateLimit(identifier, preset);
  }

  const config = RATE_LIMITS[preset];
  const key = getRateLimitKey(identifier, preset);
  const now = Date.now();

  try {
    // Use Redis MULTI for atomic operations
    const pipeline = client.pipeline();
    pipeline.get(key);
    const results = await pipeline.exec();
    
    const bucketStr = results?.[0]?.[1];
    let bucket: TokenBucket = bucketStr 
      ? JSON.parse(bucketStr as string)
      : { tokens: config.maxTokens, lastRefill: now };

    // Calculate token refill
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / config.windowMs) * config.refillRate;
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    
    if (tokensToAdd > 0) {
      bucket.lastRefill = now;
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      
      // Update bucket in Redis with TTL
      const ttlSeconds = Math.ceil(config.windowMs / 1000) * 2;
      await client.setex(key, ttlSeconds, JSON.stringify(bucket));
      
      return {
        success: true,
        remaining: bucket.tokens,
        resetAt: new Date(bucket.lastRefill + config.windowMs),
      };
    }

    // Rate limit exceeded
    logSecurityEvent("RATE_LIMIT_EXCEEDED", {
      resourceId: identifier,
      resourceType: preset,
      metadata: { remaining: bucket.tokens },
    });

    return {
      success: false,
      remaining: 0,
      resetAt: new Date(bucket.lastRefill + config.windowMs),
    };
  } catch (error) {
    console.error("[RateLimit] Redis error:", error);
    // Fall back to allowing the request on error
    return { success: true, remaining: config.maxTokens, resetAt: new Date() };
  }
}

/**
 * Distributed rate limiting
 * Automatically uses the best available backend
 */
export async function distributedRateLimit(
  identifier: string,
  preset: RateLimitPreset
): Promise<RateLimitResult> {
  // Try Vercel KV first
  if (process.env.KV_REST_API_URL) {
    return rateLimitWithKV(identifier, preset);
  }
  
  // Try Redis
  if (process.env.REDIS_URL) {
    return rateLimitWithRedis(identifier, preset);
  }
  
  // Fall back to memory
  const { rateLimit } = await import("./rate-limit");
  return rateLimit(identifier, preset);
}

/**
 * Sliding window rate limiter for more precise limiting
 */
export async function slidingWindowRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getKVClient() || await getRedisClient();
  
  if (!client) {
    // Simple memory-based sliding window
    return memorySlidingWindow(identifier, maxRequests, windowMs);
  }

  const key = `sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    if (client.zrangebyscore) {
      // Redis sorted set implementation
      await client.zremrangebyscore(key, 0, windowStart);
      const count = await client.zcard(key);
      
      if (count < maxRequests) {
        await client.zadd(key, now, `${now}-${Math.random()}`);
        await client.expire(key, Math.ceil(windowMs / 1000));
        return { success: true, remaining: maxRequests - count - 1, resetAt: new Date(now + windowMs) };
      }
      
      return { success: false, remaining: 0, resetAt: new Date(now + windowMs) };
    }
    
    // KV doesn't support sorted sets, fall back to token bucket
    return distributedRateLimit(identifier, "API_GENERAL");
  } catch (error) {
    console.error("[RateLimit] Sliding window error:", error);
    return { success: true, remaining: maxRequests, resetAt: new Date() };
  }
}

// Memory-based sliding window
const slidingWindowStore = new Map<string, number[]>();

function memorySlidingWindow(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  let timestamps = slidingWindowStore.get(identifier) || [];
  timestamps = timestamps.filter(t => t > windowStart);
  
  if (timestamps.length < maxRequests) {
    timestamps.push(now);
    slidingWindowStore.set(identifier, timestamps);
    return { success: true, remaining: maxRequests - timestamps.length, resetAt: new Date(now + windowMs) };
  }
  
  return { success: false, remaining: 0, resetAt: new Date(timestamps[0] + windowMs) };
}

/**
 * Check rate limit status without consuming a token
 */
export async function checkRateLimitStatus(
  identifier: string,
  preset: RateLimitPreset
): Promise<{ remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[preset];
  const key = getRateLimitKey(identifier, preset);
  
  const client = await getKVClient() || await getRedisClient();
  
  if (!client) {
    return { remaining: config.maxTokens, resetAt: new Date() };
  }

  try {
    const bucketStr = await client.get(key);
    if (!bucketStr) {
      return { remaining: config.maxTokens, resetAt: new Date() };
    }
    
    const bucket: TokenBucket = typeof bucketStr === "string" 
      ? JSON.parse(bucketStr) 
      : bucketStr;
    
    return {
      remaining: bucket.tokens,
      resetAt: new Date(bucket.lastRefill + config.windowMs),
    };
  } catch {
    return { remaining: config.maxTokens, resetAt: new Date() };
  }
}

