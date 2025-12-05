/**
 * IP Security - Blocking and Suspicious Activity Detection
 * 
 * Implements IP-based security measures including:
 * - IP blocking (temporary and permanent)
 * - Suspicious activity detection
 * - Brute force protection
 * - Geo-blocking (optional)
 */

import { logSecurityEvent } from "./security-logger";

// Types
interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date | null; // null = permanent
  attempts: number;
}

interface SuspiciousActivity {
  ip: string;
  events: {
    type: string;
    timestamp: Date;
    details: Record<string, unknown>;
  }[];
  score: number;
}

// In-memory stores (use Redis in production)
const blockedIPs = new Map<string, BlockedIP>();
const suspiciousActivity = new Map<string, SuspiciousActivity>();
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: Date }>();

// Configuration
const config = {
  // Brute force protection
  maxFailedLogins: 5,
  loginBlockDurationMs: 15 * 60 * 1000, // 15 minutes
  
  // Suspicious activity thresholds
  suspiciousThreshold: 50,
  criticalThreshold: 100,
  
  // Activity scores
  activityScores: {
    FAILED_LOGIN: 10,
    RATE_LIMIT_HIT: 5,
    INVALID_INPUT: 3,
    CSRF_FAILURE: 20,
    IDOR_ATTEMPT: 30,
    SQL_INJECTION_ATTEMPT: 100,
    XSS_ATTEMPT: 50,
  } as Record<string, number>,
  
  // Auto-block duration (ms)
  autoBlockDuration: 60 * 60 * 1000, // 1 hour
};

/**
 * Check if an IP is blocked
 */
export function isIPBlocked(ip: string): { blocked: boolean; reason?: string; expiresAt?: Date | null } {
  const blocked = blockedIPs.get(ip);
  
  if (!blocked) {
    return { blocked: false };
  }
  
  // Check if block has expired
  if (blocked.expiresAt && blocked.expiresAt < new Date()) {
    blockedIPs.delete(ip);
    return { blocked: false };
  }
  
  return {
    blocked: true,
    reason: blocked.reason,
    expiresAt: blocked.expiresAt,
  };
}

/**
 * Block an IP address
 */
export function blockIP(
  ip: string,
  reason: string,
  durationMs: number | null = config.autoBlockDuration
): void {
  const existing = blockedIPs.get(ip);
  
  blockedIPs.set(ip, {
    ip,
    reason,
    blockedAt: new Date(),
    expiresAt: durationMs ? new Date(Date.now() + durationMs) : null,
    attempts: (existing?.attempts || 0) + 1,
  });
  
  logSecurityEvent("IP_BLOCKED", {
    ip,
    reason,
    metadata: {
      durationMs,
      attempts: blockedIPs.get(ip)?.attempts,
    },
  });
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): boolean {
  const wasBlocked = blockedIPs.has(ip);
  blockedIPs.delete(ip);
  return wasBlocked;
}

/**
 * Get all blocked IPs (for admin dashboard)
 */
export function getBlockedIPs(): BlockedIP[] {
  // Clean up expired blocks
  const now = new Date();
  for (const [ip, block] of blockedIPs.entries()) {
    if (block.expiresAt && block.expiresAt < now) {
      blockedIPs.delete(ip);
    }
  }
  
  return Array.from(blockedIPs.values());
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(ip: string, userEmail?: string): {
  shouldBlock: boolean;
  attemptsRemaining: number;
} {
  const now = new Date();
  const attempts = failedLoginAttempts.get(ip);
  
  if (!attempts || (now.getTime() - attempts.firstAttempt.getTime()) > config.loginBlockDurationMs) {
    // Start fresh
    failedLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { shouldBlock: false, attemptsRemaining: config.maxFailedLogins - 1 };
  }
  
  attempts.count++;
  
  if (attempts.count >= config.maxFailedLogins) {
    blockIP(ip, "Too many failed login attempts", config.loginBlockDurationMs);
    failedLoginAttempts.delete(ip);
    
    logSecurityEvent("BRUTE_FORCE_DETECTED", {
      ip,
      userEmail,
      metadata: { attempts: attempts.count },
    });
    
    return { shouldBlock: true, attemptsRemaining: 0 };
  }
  
  return {
    shouldBlock: false,
    attemptsRemaining: config.maxFailedLogins - attempts.count,
  };
}

/**
 * Clear failed login attempts (on successful login)
 */
export function clearFailedLogins(ip: string): void {
  failedLoginAttempts.delete(ip);
}

/**
 * Record suspicious activity
 */
export function recordSuspiciousActivity(
  ip: string,
  activityType: string,
  details: Record<string, unknown> = {}
): { score: number; shouldBlock: boolean } {
  const activity = suspiciousActivity.get(ip) || {
    ip,
    events: [],
    score: 0,
  };
  
  // Add new event
  activity.events.push({
    type: activityType,
    timestamp: new Date(),
    details,
  });
  
  // Update score
  const scoreIncrease = config.activityScores[activityType] || 5;
  activity.score += scoreIncrease;
  
  // Keep only recent events (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  activity.events = activity.events.filter(e => e.timestamp > oneHourAgo);
  
  // Decay score based on time
  const oldestEvent = activity.events[0];
  if (oldestEvent) {
    const ageMinutes = (Date.now() - oldestEvent.timestamp.getTime()) / 60000;
    activity.score = Math.max(0, activity.score - Math.floor(ageMinutes / 10));
  }
  
  suspiciousActivity.set(ip, activity);
  
  // Check thresholds
  if (activity.score >= config.criticalThreshold) {
    blockIP(ip, "Critical suspicious activity threshold exceeded");
    
    logSecurityEvent("SUSPICIOUS_ACTIVITY", {
      ip,
      metadata: {
        score: activity.score,
        recentEvents: activity.events.slice(-5),
      },
    });
    
    return { score: activity.score, shouldBlock: true };
  }
  
  if (activity.score >= config.suspiciousThreshold) {
    logSecurityEvent("SUSPICIOUS_ACTIVITY", {
      ip,
      metadata: {
        score: activity.score,
        threshold: "warning",
      },
    });
  }
  
  return { score: activity.score, shouldBlock: false };
}

/**
 * Get suspicious activity for an IP
 */
export function getSuspiciousActivity(ip: string): SuspiciousActivity | null {
  return suspiciousActivity.get(ip) || null;
}

/**
 * Check for common attack patterns in input
 */
export function detectAttackPatterns(input: string): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  
  // SQL Injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /'.*(\bOR\b|\bAND\b).*'/i,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      patterns.push("SQL_INJECTION");
      break;
    }
  }
  
  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      patterns.push("XSS");
      break;
    }
  }
  
  // Path traversal
  if (/\.\.[\/\\]/.test(input)) {
    patterns.push("PATH_TRAVERSAL");
  }
  
  // Command injection
  const cmdPatterns = [
    /[;&|`$]/, // Shell metacharacters
    /\b(cat|ls|rm|mv|cp|wget|curl|bash|sh|cmd|powershell)\b/i,
  ];
  
  for (const pattern of cmdPatterns) {
    if (pattern.test(input)) {
      patterns.push("COMMAND_INJECTION");
      break;
    }
  }
  
  return {
    detected: patterns.length > 0,
    patterns,
  };
}

/**
 * Sanitize and validate IP address
 */
export function sanitizeIP(ip: string | null | undefined): string {
  if (!ip) return "unknown";
  
  // Handle x-forwarded-for (take first IP)
  const firstIP = ip.split(",")[0].trim();
  
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
  
  if (ipv4Regex.test(firstIP) || ipv6Regex.test(firstIP)) {
    return firstIP;
  }
  
  return "invalid";
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  // Check various headers in order of preference
  const headerNames = [
    "x-real-ip",
    "x-forwarded-for",
    "cf-connecting-ip", // Cloudflare
    "x-client-ip",
  ];
  
  for (const name of headerNames) {
    const value = headers.get(name);
    if (value) {
      return sanitizeIP(value);
    }
  }
  
  return "unknown";
}

/**
 * Security middleware check
 * Returns null if OK, or an error response if blocked
 */
export function securityCheck(ip: string): { allowed: boolean; reason?: string } {
  // Check if IP is blocked
  const blockStatus = isIPBlocked(ip);
  if (blockStatus.blocked) {
    return {
      allowed: false,
      reason: `IP blocked: ${blockStatus.reason}`,
    };
  }
  
  return { allowed: true };
}

