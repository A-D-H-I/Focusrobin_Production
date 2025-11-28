import { auth } from "./src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes to pass through without authentication checks
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const session = await auth();
    
    if (!session?.user) {
      // Not logged in - redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check if user is ADMIN
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      // Not an admin - redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect user profile routes
  if (pathname.startsWith("/account") || pathname.startsWith("/profile")) {
    const session = await auth();
    
    if (!session?.user) {
      // Not logged in - redirect to home (or login page)
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/profile/:path*",
  ],
};

