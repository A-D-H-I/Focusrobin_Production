import { NextRequest, NextResponse } from "next/server";

// Handle auth errors with a redirect to the login page with error details
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error") || "Unknown";
  
  // Log the error for debugging
  console.error("🔐 Auth Error:", error);
  
  // Use AUTH_URL from environment (set to ngrok URL), or fallback to host header
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  
  let baseUrl: string;
  if (authUrl) {
    baseUrl = authUrl;
  } else {
    // Fallback: Get the correct host from headers
    const host = request.headers.get("x-forwarded-host") || 
                 request.headers.get("host") || 
                 "localhost:9002";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    baseUrl = `${protocol}://${host}`;
  }
  
  // Build the login URL with the correct origin
  const loginUrl = `${baseUrl}/login?error=${encodeURIComponent(error)}`;
  
  console.log("🔐 Redirecting to:", loginUrl);
  
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
