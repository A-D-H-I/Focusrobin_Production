import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// Initialize auth for middleware (Edge Runtime)
// This avoids importing Prisma keys or Node.js modules
const { auth } = NextAuth(authConfig);
import type { NextRequest } from "next/server";
import { generateCSRFToken } from "./lib/csrf";
import {
  defaultLocale,
  isLocale,
  isLocalizablePath,
  localizePath,
  matchAcceptLanguage,
  splitLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  PATHNAME_HEADER,
  type Locale,
} from "./i18n/config";

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
 * Skip in development mode for network access compatibility
 */
async function addSecurityHeaders(response: NextResponse, setCsrfCookie: boolean = false): Promise<NextResponse> {
  // Skip security headers in development for network access compatibility
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Set CSRF token cookie for forms (only on page requests)
  if (setCsrfCookie) {
    const csrfToken = await generateCSRFToken();
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
async function forbidden(request: NextRequest, message: string = "Forbidden"): Promise<NextResponse> {
  const response = NextResponse.json(
    { error: message, status: 403 },
    { status: 403 }
  );
  return await addSecurityHeaders(response);
}

/**
 * Create a redirect response with security headers
 */
async function secureRedirect(request: NextRequest, path: string): Promise<NextResponse> {
  // Use absolute URL for redirect
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = ""; // Clear any query params
  const response = NextResponse.redirect(url);
  return await addSecurityHeaders(response);
}

/**
 * Resolve the locale for this request.
 * - /lt/... and /ru/... are rewritten to the unprefixed route with x-locale set
 * - /en/... redirects to the unprefixed (default) URL
 * - unprefixed page requests redirect to the visitor's saved (or browser) language
 * Returns either a redirect, or a `next()` that continues the request with locale headers.
 */
function resolveLocale(request: NextRequest) {
  const { locale: urlLocale, pathname } = splitLocale(request.nextUrl.pathname);
  const localizable = isLocalizablePath(pathname);
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  const redirectTo = (target: string, locale: Locale) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  };

  if (urlLocale && (urlLocale === defaultLocale || !localizable)) {
    return { pathname, redirect: redirectTo(pathname, urlLocale) };
  }

  if (!urlLocale && localizable && request.method === "GET") {
    const preferred = isLocale(cookieLocale)
      ? cookieLocale
      : matchAcceptLanguage(request.headers.get("accept-language"));
    if (preferred && preferred !== defaultLocale) {
      return { pathname, redirect: redirectTo(localizePath(pathname, preferred), preferred) };
    }
  }

  const locale: Locale = urlLocale ?? defaultLocale;
  const next = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, locale);
    requestHeaders.set(PATHNAME_HEADER, pathname);
    let response: NextResponse;
    if (urlLocale) {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
    // Remember the language of a localized URL so unprefixed links stay in that language
    if (urlLocale && cookieLocale !== urlLocale) {
      response.cookies.set(LOCALE_COOKIE, urlLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  };

  return { pathname, redirect: null, next };
}

export async function middleware(request: NextRequest) {
  const localeRouting = resolveLocale(request);
  if (localeRouting.redirect) {
    return addSecurityHeaders(localeRouting.redirect);
  }
  const { pathname, next } = localeRouting;
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
    const response = next();
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

    const response = next();
    return await addSecurityHeaders(response);
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    const session = await auth();

    if (!session || !session.user) {
      return await forbidden(request, "Authentication required");
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return await forbidden(request, "Admin access required");
    }

    const response = next();
    return await addSecurityHeaders(response);
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
      return await secureRedirect(request, "/");
    }

    if (!session.user) {
      console.warn(`[Security] BLOCKED: No user in session for admin route: ${pathname}`);
      return await secureRedirect(request, "/");
    }

    // Check 2: Must have valid user ID
    const userId = (session.user as any)?.id;
    if (!userId || typeof userId !== "string") {
      console.warn(`[Security] BLOCKED: Invalid user ID for admin route: ${pathname}`);
      return await secureRedirect(request, "/");
    }

    // Check 3: Must have ADMIN role (strict comparison)
    // This is the critical check - only users with role === "ADMIN" can access
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      console.warn(
        `[Security] BLOCKED: Non-admin user attempted admin access: ${pathname}, userId: ${userId}, role: ${userRole || "undefined"}`
      );
      // Redirect non-admin users to home page
      return await secureRedirect(request, "/");
    }

    // Admin authenticated and authorized - allow access
    console.log(`[Security] ALLOWED: Admin access granted for ${pathname}, userId: ${userId}`);
    const response = next();
    return await addSecurityHeaders(response, true); // Set CSRF for admin pages
  }

  // === User Profile/Account and Checkout ===
  // These pages show their own sign-in screen to logged-out visitors (and their
  // server actions require a session), so they are not redirected here.
  if (pathname.startsWith("/account") || pathname.startsWith("/profile") || pathname.startsWith("/checkout")) {
    const response = next();
    return await addSecurityHeaders(response, true); // Set CSRF for user and checkout pages
  }

  // === Public routes - add security headers ===
  // Set CSRF cookie for non-API routes (pages)
  const isPageRequest = !pathname.startsWith("/api/");
  const response = next();
  return await addSecurityHeaders(response, isPageRequest);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (metadata routes)
     * - manifest files
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|webmanifest)$).*)",
  ],
};
