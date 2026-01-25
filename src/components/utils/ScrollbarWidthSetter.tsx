"use client";

import { useEffect } from "react";

/**
 * Calculates and sets the scrollbar width as a CSS variable
 * This is used to compensate for layout shifts when body scroll is locked
 */
export function ScrollbarWidthSetter() {
  useEffect(() => {
    const calculateScrollbarWidth = () => {
      // Create a temporary div to measure scrollbar width
      const outer = document.createElement("div");
      outer.style.visibility = "hidden";
      outer.style.overflow = "scroll";
      outer.style.msOverflowStyle = "scrollbar"; // Needed for IE
      document.body.appendChild(outer);

      // Create inner div
      const inner = document.createElement("div");
      outer.appendChild(inner);

      // Calculate scrollbar width
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      // Clean up
      outer.parentNode?.removeChild(outer);

      // Set CSS variable on document root
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`
      );
    };

    // Calculate on mount
    calculateScrollbarWidth();

    // Recalculate on resize (scrollbar width can change on some systems)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateScrollbarWidth, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return null; // This component doesn't render anything
}

