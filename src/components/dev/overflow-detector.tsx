"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Dev-only overflow detector
 * Logs elements that overflow the viewport horizontally
 * Only runs in development mode
 */
export function OverflowDetector() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const checkOverflow = () => {
      const viewportWidth = window.innerWidth;
      const allElements = document.querySelectorAll("*");

      const overflowingElements: Array<{
        element: Element;
        scrollWidth: number;
        clientWidth: number;
        overflow: number;
      }> = [];

      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;

          // Check if element overflows its container
          if (scrollWidth > clientWidth && clientWidth > 0) {
            // Check if this causes page-level overflow
            const rect = el.getBoundingClientRect();
            const rightEdge = rect.right;

            // If element extends beyond viewport, it's causing overflow
            if (rightEdge > viewportWidth) {
              overflowingElements.push({
                element: el,
                scrollWidth,
                clientWidth,
                overflow: scrollWidth - clientWidth,
              });
            }
          }
        }
      });

      // Log overflowing elements
      if (overflowingElements.length > 0) {
        console.group(`🔍 Overflow Detector - ${pathname}`);
        console.log(`Found ${overflowingElements.length} element(s) causing horizontal overflow:`);
        overflowingElements.forEach(({ element, scrollWidth, clientWidth, overflow }) => {
          const tagName = element.tagName;
          const className = element.className || "(no class)";
          const id = element.id || "(no id)";
          console.log(
            `  - ${tagName}${id !== "(no id)" ? `#${id}` : ""}${className !== "(no class)" ? `.${className.split(" ")[0]}` : ""}`,
            `\n    scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px, overflow: ${overflow}px`
          );
        });
        console.groupEnd();
      }
    };

    // Check on mount and route change
    const timeoutId = setTimeout(checkOverflow, 500);

    // Check on resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkOverflow, 300);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  return null; // This component doesn't render anything
}










