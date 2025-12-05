/**
 * Security Event Logger
 * 
 * Centralized security logging for audit trails and monitoring
 */

// Security event types
export type SecurityEventType =
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "AUTH_LOGOUT"
  | "ADMIN_ACCESS"
  | "ADMIN_DENIED"
  | "IDOR_ATTEMPT"
  | "RATE_LIMIT_EXCEEDED"
  | "RATE_LIMIT_WARNING"
  | "VALIDATION_FAILURE"
  | "CSRF_FAILURE"
  | "SUSPICIOUS_ACTIVITY"
  | "IP_BLOCKED"
  | "BRUTE_FORCE_DETECTED"
  | "SQL_INJECTION_ATTEMPT"
  | "XSS_ATTEMPT"
  | "UNAUTHORIZED_API_ACCESS"
  | "SENSITIVE_DATA_ACCESS"
  | "ACCOUNT_LOCKED"
  | "PASSWORD_RESET_REQUEST"
  | "PERMISSION_CHANGE"
  | "DATA_EXPORT"
  | "DATA_DELETION";

// Security event severity levels
export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Security event details
export interface SecurityEventDetails {
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  resourceId?: string;
  resourceType?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Security event record
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  details: SecurityEventDetails;
}

// In-memory event buffer for batching (in production, send to logging service)
const eventBuffer: SecurityEvent[] = [];
const MAX_BUFFER_SIZE = 1000;

// Event severity mapping
const SEVERITY_MAP: Record<SecurityEventType, SecuritySeverity> = {
  AUTH_SUCCESS: "LOW",
  AUTH_FAILURE: "MEDIUM",
  AUTH_LOGOUT: "LOW",
  ADMIN_ACCESS: "LOW",
  ADMIN_DENIED: "HIGH",
  IDOR_ATTEMPT: "HIGH",
  RATE_LIMIT_EXCEEDED: "MEDIUM",
  RATE_LIMIT_WARNING: "LOW",
  VALIDATION_FAILURE: "LOW",
  CSRF_FAILURE: "HIGH",
  SUSPICIOUS_ACTIVITY: "HIGH",
  IP_BLOCKED: "MEDIUM",
  BRUTE_FORCE_DETECTED: "CRITICAL",
  SQL_INJECTION_ATTEMPT: "CRITICAL",
  XSS_ATTEMPT: "HIGH",
  UNAUTHORIZED_API_ACCESS: "HIGH",
  SENSITIVE_DATA_ACCESS: "MEDIUM",
  ACCOUNT_LOCKED: "MEDIUM",
  PASSWORD_RESET_REQUEST: "LOW",
  PERMISSION_CHANGE: "MEDIUM",
  DATA_EXPORT: "MEDIUM",
  DATA_DELETION: "HIGH",
};

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sec_${timestamp}_${random}`;
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  details: SecurityEventDetails
): SecurityEvent {
  const event: SecurityEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type,
    severity: SEVERITY_MAP[type] || "MEDIUM",
    details,
  };

  // Console logging with color-coded severity
  const severityColors = {
    LOW: "\x1b[32m",      // Green
    MEDIUM: "\x1b[33m",   // Yellow
    HIGH: "\x1b[31m",     // Red
    CRITICAL: "\x1b[35m", // Magenta
  };
  const reset = "\x1b[0m";
  const color = severityColors[event.severity];

  console.log(
    `${color}[Security][${event.severity}]${reset} ${event.type} - ${JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      ...event.details,
    })}`
  );

  // Add to buffer
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift(); // Remove oldest event
  }

  // In production, you might want to:
  // - Send to external logging service (Datadog, Logtail, etc.)
  // - Store in database for audit trail
  // - Trigger alerts for CRITICAL events
  if (event.severity === "CRITICAL") {
    triggerSecurityAlert(event);
  }

  return event;
}

/**
 * Trigger security alert for critical events
 */
function triggerSecurityAlert(event: SecurityEvent): void {
  // In production, integrate with:
  // - PagerDuty
  // - Slack webhook
  // - Email notifications
  // - SMS alerts
  console.error(
    `🚨 CRITICAL SECURITY ALERT 🚨\n` +
    `Event: ${event.type}\n` +
    `Time: ${event.timestamp}\n` +
    `Details: ${JSON.stringify(event.details, null, 2)}`
  );
}

/**
 * Get recent security events (for admin dashboard)
 */
export function getRecentSecurityEvents(
  limit: number = 100,
  severity?: SecuritySeverity
): SecurityEvent[] {
  let events = [...eventBuffer].reverse();
  
  if (severity) {
    events = events.filter((e) => e.severity === severity);
  }
  
  return events.slice(0, limit);
}

/**
 * Get security event statistics
 */
export function getSecurityStats(): {
  total: number;
  bySeverity: Record<SecuritySeverity, number>;
  byType: Record<string, number>;
  last24Hours: number;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const stats = {
    total: eventBuffer.length,
    bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<SecuritySeverity, number>,
    byType: {} as Record<string, number>,
    last24Hours: 0,
  };

  for (const event of eventBuffer) {
    stats.bySeverity[event.severity]++;
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    
    if (new Date(event.timestamp).getTime() > dayAgo) {
      stats.last24Hours++;
    }
  }

  return stats;
}

/**
 * Clear event buffer (for testing)
 */
export function clearSecurityEvents(): void {
  eventBuffer.length = 0;
}

// Convenience logging functions
export const securityLog = {
  authSuccess: (details: SecurityEventDetails) => 
    logSecurityEvent("AUTH_SUCCESS", details),
  
  authFailure: (details: SecurityEventDetails) => 
    logSecurityEvent("AUTH_FAILURE", details),
  
  adminAccess: (details: SecurityEventDetails) => 
    logSecurityEvent("ADMIN_ACCESS", details),
  
  adminDenied: (details: SecurityEventDetails) => 
    logSecurityEvent("ADMIN_DENIED", details),
  
  idorAttempt: (details: SecurityEventDetails) => 
    logSecurityEvent("IDOR_ATTEMPT", details),
  
  rateLimitExceeded: (details: SecurityEventDetails) => 
    logSecurityEvent("RATE_LIMIT_EXCEEDED", details),
  
  csrfFailure: (details: SecurityEventDetails) => 
    logSecurityEvent("CSRF_FAILURE", details),
  
  suspiciousActivity: (details: SecurityEventDetails) => 
    logSecurityEvent("SUSPICIOUS_ACTIVITY", details),
  
  bruteForceDetected: (details: SecurityEventDetails) => 
    logSecurityEvent("BRUTE_FORCE_DETECTED", details),
};

