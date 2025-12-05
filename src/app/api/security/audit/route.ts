/**
 * Security Audit API Endpoint
 * 
 * Admin-only endpoint to run security audits
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { runSecurityAudit, formatAuditReport } from "@/lib/security-audit";
import { logSecurityEvent } from "@/lib/security-logger";

export async function GET(request: NextRequest) {
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
      path: "/api/security/audit",
      method: "GET",
    });
    
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  
  // Log admin access
  logSecurityEvent("SENSITIVE_DATA_ACCESS", {
    userId: session.user.id,
    resourceType: "security_audit",
    path: "/api/security/audit",
  });
  
  // Run security audit
  const report = runSecurityAudit();
  
  // Check if text format requested
  const format = request.nextUrl.searchParams.get("format");
  
  if (format === "text") {
    return new NextResponse(formatAuditReport(report), {
      headers: { "Content-Type": "text/plain" },
    });
  }
  
  return NextResponse.json(report);
}

