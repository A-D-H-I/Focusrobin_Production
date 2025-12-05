/**
 * Security Health Check Endpoint
 * 
 * Public endpoint for monitoring systems (returns minimal info)
 */

import { NextResponse } from "next/server";
import { securityHealthCheck } from "@/lib/security-audit";

export async function GET() {
  const health = securityHealthCheck();
  
  // Return minimal info for public health checks
  return NextResponse.json({
    status: health.status,
    timestamp: new Date().toISOString(),
  });
}

