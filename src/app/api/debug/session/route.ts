/**
 * Debug endpoint to check current session
 * Remove this file in production!
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({
    hasSession: !!session,
    hasUser: !!session?.user,
    user: session?.user ? {
      id: (session.user as any)?.id || "NO_ID",
      email: session.user.email || "NO_EMAIL",
      name: session.user.name || "NO_NAME",
      role: (session.user as any)?.role || "NO_ROLE",
    } : null,
    rawSession: session,
  });
}

