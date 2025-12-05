/**
 * CSRF Token Component
 * 
 * Hidden input field for CSRF protection in forms
 */

"use client";

import { useCSRFToken } from "@/hooks/useCSRFToken";

interface CSRFTokenProps {
  name?: string;
}

/**
 * Hidden CSRF token input for forms
 * 
 * Usage:
 * <form>
 *   <CSRFToken />
 *   ... other inputs ...
 * </form>
 */
export function CSRFToken({ name = "csrfToken" }: CSRFTokenProps) {
  const csrfToken = useCSRFToken();

  if (!csrfToken) {
    return null;
  }

  return <input type="hidden" name={name} value={csrfToken} />;
}

export default CSRFToken;

