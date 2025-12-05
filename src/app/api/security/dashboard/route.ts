/**
 * Security Dashboard API Endpoint
 * 
 * Admin-only endpoint for security monitoring
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSecurityDashboard } from "@/lib/security-audit";
import { logSecurityEvent } from "@/lib/security-logger";

export async function GET() {
  // Verify admin authentication
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  
  if ((session.user as any).role !== "ADMIN") {
    logSecurityEvent("ADMIN_DENIED", {
      userId: session.user.id,
      path: "/api/security/dashboard",
      method: "GET",
    });
    
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  
  // Get security dashboard data
  const dashboard = getSecurityDashboard();
  
  return NextResponse.json(dashboard);
}

