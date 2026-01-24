/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Implements Double Submit Cookie pattern for additional CSRF protection
 * beyond what NextAuth provides for auth routes.
 */

import 'server-only';
import { cookies } from "next/headers";

const CSRF_TOKEN_NAME = "__csrf_token";
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate random bytes using Web Crypto API (works in both Node.js and Edge Runtime)
 */
async function generateRandomBytes(length: number): Promise<string> {
  const array = new Uint8Array(length);
  // Always use Web Crypto API if available (works in both Node.js and Edge Runtime)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues) {
    (globalThis as any).crypto.getRandomValues(array);
  } else {
    // Fallback: Only use Node.js crypto if Web Crypto is not available
    // This file is marked 'server-only' so it will only run in Node.js
    try {
      const nodeCrypto = require("crypto");
      const nodeBytes = nodeCrypto.randomBytes(length);
      array.set(nodeBytes);
    } catch {
      throw new Error('Crypto API not available');
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create HMAC signature using Web Crypto API (works in both Node.js and Edge Runtime)
 */
async function createHMAC(data: string, secret: string): Promise<string> {
  // Always prefer Web Crypto API (Edge Runtime compatible)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await (globalThis as any).crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await (globalThis as any).crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for Node.js environments only
    // This file is marked 'server-only' so it will only run in Node.js
    try {
      const nodeCrypto = require("crypto");
      const hmac = nodeCrypto.createHmac("sha256", secret);
      hmac.update(data);
      return hmac.digest("hex");
    } catch {
      throw new Error('Crypto API not available');
    }
  }
}

/**
 * Generate a cryptographically secure CSRF token
 * Works in both Node.js and Edge Runtime
 */
export async function generateCSRFToken(): Promise<string> {
  const timestamp = Date.now();
  const randomPart = await generateRandomBytes(CSRF_TOKEN_LENGTH);
  const data = `${randomPart}:${timestamp}`;
  
  // Sign the token with HMAC
  const signature = await createHMAC(data, CSRF_SECRET);
  
  return `${data}:${signature}`;
}

/**
 * Validate a CSRF token
 * Works in both Node.js and Edge Runtime
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(":");
  if (parts.length !== 3) {
    return false;
  }

  const [randomPart, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // Check if token has expired
  if (isNaN(timestamp) || Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
    return false;
  }

  // Verify signature
  const data = `${randomPart}:${timestamp}`;
  const expectedSignature = await createHMAC(data, CSRF_SECRET);

  // Constant-time comparison to prevent timing attacks
  if (providedSignature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedSignature.length; i++) {
    result |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get or create CSRF token from cookies (for server components)
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (existingToken && await validateCSRFToken(existingToken)) {
    return existingToken;
  }

  // Generate new token
  const newToken = await generateCSRFToken();
  
  // Note: Setting cookies in server components requires a response
  // This token should be set via middleware or API route
  return newToken;
}

/**
 * Verify CSRF token from request
 * Use this in server actions for sensitive operations
 */
export async function verifyCSRFToken(providedToken: string): Promise<boolean> {
  if (!(await validateCSRFToken(providedToken))) {
    console.warn("[Security][CSRF] Invalid CSRF token provided");
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!cookieToken) {
    console.warn("[Security][CSRF] No CSRF cookie found");
    return false;
  }

  // Compare tokens (both should be valid and match)
  if (providedToken !== cookieToken) {
    console.warn("[Security][CSRF] CSRF token mismatch");
    return false;
  }

  return true;
}

/**
 * CSRF protection for server actions
 * Wraps an action with CSRF verification
 */
export function withCSRFProtection<T extends (...args: any[]) => Promise<any>>(
  action: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | { error: string }> {
  return async (...args: Parameters<T>) => {
    // Extract CSRF token from the first argument if it's FormData
    const firstArg = args[0];
    let csrfToken: string | null = null;

    if (firstArg instanceof FormData) {
      csrfToken = firstArg.get("csrfToken") as string;
    } else if (typeof firstArg === "object" && firstArg !== null) {
      csrfToken = (firstArg as any).csrfToken;
    }

    if (!csrfToken) {
      return { error: "CSRF token is required" };
    }

    const isValid = await verifyCSRFToken(csrfToken);
    if (!isValid) {
      return { error: "Invalid or expired CSRF token" };
    }

    return action(...args);
  };
}

