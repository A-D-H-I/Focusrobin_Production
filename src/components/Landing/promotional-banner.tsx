"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PromotionalBanner() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isVisible, setIsVisible] = useState(true);

  // Reset visibility when page changes
  useEffect(() => {
    // On other pages, always keep banner visible
    if (!isHomePage) {
      setIsVisible(true);
    }
  }, [isHomePage]);

  // Hide banner on scroll only on landing page (home page)
  useEffect(() => {
    // On other pages, always keep banner visible - no scroll listener needed
    if (!isHomePage) {
      return;
    }

    // Only on home page: hide banner when scrolling
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide banner when scrolled down more than 50px (only on home page)
      setIsVisible(scrollY < 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  // Use the same message as ScrollingBanner default
  const bannerText = "BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1";
  
  // Create a sequence where the message is repeated multiple times for seamless scrolling
  // Same logic as ScrollingBanner
  const textSequence: string[] = [];
  for (let i = 0; i < 15; i++) {
    textSequence.push(bannerText);
  }

  // On other pages, always show banner (no transform)
  // On home page, show/hide based on scroll
  const shouldShow = !isHomePage || isVisible;
  const shouldHide = isHomePage && !isVisible;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 w-full bg-brand-blue text-white py-3 sm:py-4 overflow-hidden z-[101] transition-transform duration-300 ${
        shouldHide ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 101
      }}
    >
      <div className="flex animate-scroll whitespace-nowrap">
        {/* First set of messages */}
        {textSequence.map((item, index) => (
          <span 
            key={`first-${index}`}
            className="text-sm sm:text-base font-bold uppercase tracking-wide inline-block mr-12"
          >
            {item}
          </span>
        ))}
        {/* Duplicate for seamless loop - same as ScrollingBanner */}
        {textSequence.map((item, index) => (
          <span 
            key={`second-${index}`}
            className="text-sm sm:text-base font-bold uppercase tracking-wide inline-block mr-12"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
