"use client";

import { useEffect } from "react";

/**
 * Prevents Radix UI Select and DropdownMenu components from locking body scroll
 * These dropdowns with position="popper" don't need scroll lock,
 * and it causes layout shift issues (black bar appearing)
 */
export function PreventSelectScrollLock() {
  useEffect(() => {
    // Function to check if a Select or DropdownMenu is open
    const isDropdownOpen = () => {
      // Check for Radix UI Select content - it has role="listbox"
      const listbox = document.querySelector('[role="listbox"]');
      // Check for Radix UI DropdownMenu content - it has role="menu"
      const menu = document.querySelector('[role="menu"]');
      return !!(listbox || menu);
    };

    // Function to prevent scroll lock for Select and DropdownMenu components
    const preventScrollLock = () => {
      if (isDropdownOpen()) {
        const body = document.body;
        
        // Remove scroll lock attribute if present
        if (body.hasAttribute("data-scroll-locked")) {
          body.removeAttribute("data-scroll-locked");
        }
        
        // Remove overflow hidden and padding if they were set
        if (body.style.overflow === "hidden") {
          body.style.overflow = "";
        }
        if (body.style.paddingRight) {
          body.style.paddingRight = "";
        }
      }
    };

    // Watch for when Radix UI adds data-scroll-locked to body
    const observer = new MutationObserver(() => {
      preventScrollLock();
    });

    // Start observing body for attribute and style changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked", "style"],
    });

    // Also observe the document for new Select content being added
    const documentObserver = new MutationObserver(() => {
      preventScrollLock();
    });

    documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Run immediately and periodically to catch any changes
    preventScrollLock();
    const interval = setInterval(preventScrollLock, 50);

    return () => {
      observer.disconnect();
      documentObserver.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}

