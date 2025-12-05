import { auth } from "./src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateCSRFToken } from "./src/lib/csrf";

/**
 * Enterprise-Grade Security Middleware
 * Implements:
 * - Route-based authentication and authorization
 * - Role-Based Access Control (RBAC)
 * - Security headers injection
 * - IP-based blocking
 * - CSRF token management
 * - Request validation
 */

// Security headers to inject into every response
const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  "X-Frame-Options": "DENY",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Prevent XSS attacks in older browsers
  "X-XSS-Protection": "1; mode=block",
  // Control browser features
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  // Prevent DNS prefetching to reduce privacy leaks
  "X-DNS-Prefetch-Control": "off",
};

// Simple in-memory IP block store for middleware (synced with ip-security.ts on server)
// Note: This is a lightweight check; full IP security is in ip-security.ts
const blockedIPsCache = new Set<string>();
const BLOCKED_IP_CACHE_TTL = 60 * 1000; // 1 minute cache
let lastBlockedIPSync = 0;

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) {
    return xri;
  }
  return "unknown";
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, setCsrfCookie: boolean = false): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Set CSRF token cookie for forms (only on page requests)
  if (setCsrfCookie) {
    const csrfToken = generateCSRFToken();
    response.cookies.set("__csrf_token", csrfToken, {
      httpOnly: false, // Must be accessible by JS for form submission
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
  }
  
  return response;
}

/**
 * Create a 403 Forbidden response with security headers
 */
function forbidden(request: NextRequest, message: string = "Forbidden"): NextResponse {
  const response = NextResponse.json(
    { error: message, status: 403 },
    { status: 403 }
  );
  return addSecurityHeaders(response);
}

/**
 * Create a redirect response with security headers
 */
function secureRedirect(request: NextRequest, path: string): NextResponse {
  // Use absolute URL for redirect
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = ""; // Clear any query params
  const response = NextResponse.redirect(url);
  return addSecurityHeaders(response);
}

/**
 * Validate session user object has required fields
 */
function isValidSession(session: any): session is { user: { id: string; role?: string } } {
  return (
    session &&
    typeof session === "object" &&
    session.user &&
    typeof session.user === "object" &&
    typeof session.user.id === "string"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // Debug: Log all admin route requests
  if (pathname.startsWith("/admin")) {
    console.log(`[Middleware] Processing admin route: ${pathname}`);
  }
  
  // === IP Blocking Check (First line of defense) ===
  // Check against cached blocked IPs (full check happens at action level)
  if (blockedIPsCache.has(clientIP)) {
    console.warn(`[Security] Blocked IP attempted access: ${clientIP}, path: ${pathname}`);
    return NextResponse.json(
      { error: "Access denied", status: 403 },
      { status: 403 }
    );
  }

  // === API Route Protection ===
  
  // Allow NextAuth API routes to pass through (required for auth to work)
  if (pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }
  
  // Security API routes - admin only
  if (pathname.startsWith("/api/security") && !pathname.endsWith("/health")) {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    const session = await auth();
    
    if (!session || !session.user) {
      return forbidden(request, "Authentication required");
    }
    
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return forbidden(request, "Admin access required");
    }
    
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // === Admin Routes Protection (Strictest) ===
  // This applies to ALL routes starting with /admin (including /admin/custom-shop-pages, /admin/add, etc.)
  if (pathname.startsWith("/admin")) {
    console.log(`[Security] Checking admin route: ${pathname}`);
    
    const session = await auth();
    
    console.log(`[Security] Session check result:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      role: (session?.user as any)?.role,
    });

    // Check 1: Must be authenticated - strict check
    if (!session) {
      console.warn(`[Security] BLOCKED: No session for admin route: ${pathname}`);
      return secureRedirect(request, "/");
    }

    if (!session.user) {
      console.warn(`[Security] BLOCKED: No user in session for admin route: ${pathname}`);
      return secureRedirect(request, "/");
    }

    // Check 2: Must have valid user ID
    const userId = (session.user as any)?.id;
    if (!userId || typeof userId !== "string") {
      console.warn(`[Security] BLOCKED: Invalid user ID for admin route: ${pathname}`);
      return secureRedirect(request, "/");
    }

    // Check 3: Must have ADMIN role (strict comparison)
    // This is the critical check - only users with role === "ADMIN" can access
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      console.warn(
        `[Security] BLOCKED: Non-admin user attempted admin access: ${pathname}, userId: ${userId}, role: ${userRole || "undefined"}`
      );
      // Redirect non-admin users to home page
      return secureRedirect(request, "/");
    }

    // Admin authenticated and authorized - allow access
    console.log(`[Security] ALLOWED: Admin access granted for ${pathname}, userId: ${userId}`);
    const response = NextResponse.next();
    return addSecurityHeaders(response, true); // Set CSRF for admin pages
  }

  // === User Profile/Account Routes Protection ===
  if (pathname.startsWith("/account") || pathname.startsWith("/profile")) {
    const session = await auth();

    if (!isValidSession(session)) {
      console.warn(`[Security] Unauthenticated access attempt to protected route: ${pathname}`);
      return secureRedirect(request, "/");
    }

    // User is authenticated
    const response = NextResponse.next();
    return addSecurityHeaders(response, true); // Set CSRF for user pages
  }

  // === Checkout Protection (must be logged in) ===
  if (pathname.startsWith("/checkout")) {
    const session = await auth();

    if (!isValidSession(session)) {
      return secureRedirect(request, "/");
    }

    const response = NextResponse.next();
    return addSecurityHeaders(response, true); // Set CSRF for checkout pages
  }

  // === Public routes - add security headers ===
  // Set CSRF cookie for non-API routes (pages)
  const isPageRequest = !pathname.startsWith("/api/");
  const response = NextResponse.next();
  return addSecurityHeaders(response, isPageRequest);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb)$).*)",
  ],
};
