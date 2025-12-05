/**
 * CSRF Token Hook
 * 
 * Provides CSRF token for form submissions
 */

"use client";

import { useState, useEffect } from "react";

/**
 * Hook to get CSRF token from cookie
 */
export function useCSRFToken(): string | null {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from cookie
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const token = getCookie("__csrf_token");
    setCsrfToken(token);
  }, []);

  return csrfToken;
}

/**
 * Get CSRF token synchronously (for non-React contexts)
 */
export function getCSRFTokenSync(): string | null {
  if (typeof document === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; __csrf_token=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

/**
 * Add CSRF token to FormData
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = getCSRFTokenSync();
  if (token) {
    formData.set("csrfToken", token);
  }
  return formData;
}

/**
 * Add CSRF token to object
 */
export function addCSRFToObject<T extends Record<string, unknown>>(
  data: T
): T & { csrfToken: string | null } {
  return {
    ...data,
    csrfToken: getCSRFTokenSync(),
  };
}

