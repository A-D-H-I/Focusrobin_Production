/**
 * Blocked IPs Management API
 * 
 * Admin-only endpoint for managing IP blocks
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBlockedIPs, blockIP, unblockIP } from "@/lib/ip-security";
import { logSecurityEvent } from "@/lib/security-logger";

// GET - List blocked IPs
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  const blockedIPs = getBlockedIPs();
  return NextResponse.json({ blockedIPs });
}

// POST - Block an IP
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { ip, reason, durationMs } = body;
    
    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ error: "IP is required" }, { status: 400 });
    }
    
    blockIP(ip, reason || "Manual admin block", durationMs || null);
    
    logSecurityEvent("PERMISSION_CHANGE", {
      userId: session.user.id,
      resourceType: "ip_block",
      resourceId: ip,
      metadata: { action: "block", reason, durationMs },
    });
    
    return NextResponse.json({ success: true, message: `IP ${ip} blocked` });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE - Unblock an IP
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  try {
    const { ip } = await request.json();
    
    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ error: "IP is required" }, { status: 400 });
    }
    
    const wasBlocked = unblockIP(ip);
    
    logSecurityEvent("PERMISSION_CHANGE", {
      userId: session.user.id,
      resourceType: "ip_block",
      resourceId: ip,
      metadata: { action: "unblock" },
    });
    
    return NextResponse.json({
      success: true,
      message: wasBlocked ? `IP ${ip} unblocked` : `IP ${ip} was not blocked`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

