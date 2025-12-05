/**
 * Authentication-related Server Actions
 */

"use server";

import { getCSRFToken } from "@/lib/csrf";

/**
 * Fetch CSRF token for client components
 * This is a server action that can be called from client components
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const token = await getCSRFToken();
    return token;
  } catch (error) {
    console.error("[Auth] Error fetching CSRF token:", error);
    return null;
  }
}

