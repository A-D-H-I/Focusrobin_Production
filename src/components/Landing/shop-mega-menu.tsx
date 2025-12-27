"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAvailableFrameColors, type AvailableColor } from "@/app/actions/getAvailableColors";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  isScrolled?: boolean;
}

// Map shape names to icons
function getShapeIcon(shapeName: string): string {
  const normalized = shapeName.toLowerCase().trim();
  const iconMap: Record<string, string> = {
    "cat eye": "cat-eye",
    "cat-eye": "cat-eye",
    "rectangle": "rectangle",
    "square": "square",
    "butterfly": "butterfly",
    "round": "round",
    "geometric": "geometric",
    "aviator": "aviator",
    "browline": "browline",
    "oval": "oval",
  };
  return iconMap[normalized] || "round"; // Default to round if not found
}

export default function ShopMegaMenu(props: ShopMegaMenuProps) {
  const { isOpen, onClose, className, isScrolled = false } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [availableColors, setAvailableColors] = useState<AvailableColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [availableShapes, setAvailableShapes] = useState<AvailableGlassShape[]>([]);
  const [isLoadingShapes, setIsLoadingShapes] = useState(true);

  useEffect(function fetchColors() {
    if (isOpen && availableColors.length === 0) {
      setIsLoadingColors(true);
      getAvailableFrameColors()
        .then(function(colors) {
          setAvailableColors(colors);
          setIsLoadingColors(false);
        })
        .catch(function(error) {
          console.error("Error fetching available colors:", error);
          setIsLoadingColors(false);
        });
    }
  }, [isOpen, availableColors.length]);

  useEffect(function fetchShapes() {
    if (isOpen && availableShapes.length === 0) {
      setIsLoadingShapes(true);
      getAvailableGlassShapes()
        .then(function(shapes) {
          setAvailableShapes(shapes);
          setIsLoadingShapes(false);
        })
        .catch(function(error) {
          console.error("Error fetching available shapes:", error);
          setIsLoadingShapes(false);
        });
    }
  }, [isOpen, availableShapes.length]);

  useEffect(function handleClickOutside() {
    function handler(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on a link or inside a link
      if (target && (target.tagName === 'A' || target.closest('a'))) {
        // Let the link's onClick handler manage closing the menu
        return;
      }
      
      // Only close if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      // Use click event (not capture phase) to allow link clicks to process first
      document.addEventListener("click", handler);
      document.addEventListener("touchstart", handler);
    }
    return function() {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen, onClose]);

  function handleMouseLeave() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(function() {
      onClose();
    }, 300);
  }

  function handleMouseEnter() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(function cleanup() {
    return function() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Prevent body scroll when menu is open
  useEffect(function preventScroll() {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return function() {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 sm:mt-4 z-[110] w-[min(calc(100vw-2rem),90vw)] max-w-5xl">
      <div
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-full h-4 z-[109]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <div
        ref={menuRef}
        className={cn(
          "w-full bg-white shadow-2xl rounded-lg border border-gray-200",
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8",
          "max-h-[80vh] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          className
        )}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4">Shop</h3>
          <div className="space-y-2 sm:space-y-3">
            <Link href="/shop" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              All Sunglasses
            </Link>
            <Link href="/shop/women" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              Women&apos;s Sunglasses
            </Link>
            <Link href="/shop/men" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              Men&apos;s Sunglasses
            </Link>
            <Link href="/shop/kids" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              Kids Sunglasses
            </Link>
            <Link href="/shop?filter=bestsellers" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              Best Sellers
            </Link>
            <Link href="/shop?filter=new-arrivals" className="block text-black hover:text-primary transition-colors text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              New Arrivals
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4">Shop by Frame Color</h3>
          {isLoadingColors ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map(function(i) {
                return <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 bg-gray-200 animate-pulse" />;
              })}
            </div>
          ) : availableColors.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">No colors available</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableColors.map(function(color, index) {
                const colorHex = color.colorHex.startsWith("#") ? color.colorHex : "#" + color.colorHex;
                const isWhite = colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "#fff";
                return (
                  <Link
                    key={color.colorHex + "-" + index}
                    href={"/shop?color=" + encodeURIComponent(colorHex)}
                    className="group relative flex justify-center"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    title={color.colorName}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all hover:scale-110 hover:border-primary",
                        isWhite ? "bg-white border-gray-400" : "border-gray-300"
                      )}
                      style={{ backgroundColor: colorHex }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4">Shop by Shape</h3>
          {isLoadingShapes ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map(function(i) {
                return <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded-lg animate-pulse" />;
              })}
            </div>
          ) : availableShapes.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">No shapes available</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableShapes.map(function(shapeData, index) {
                const shapeIcon = getShapeIcon(shapeData.shape);
                return (
                  <Link
                    key={shapeData.shape + "-" + index}
                    href={"/shop?shape=" + encodeURIComponent(shapeData.shape.toLowerCase().replace(/\s+/g, "-"))}
                    className="group flex flex-col items-center p-2 sm:p-3 bg-[#F5F5DC] rounded-lg hover:bg-[#E8E8D0] transition-colors"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                  >
                    <div className="w-10 h-6 sm:w-12 sm:h-8 mb-1 sm:mb-2 flex items-center justify-center">
                      {shapeIcon === "cat-eye" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <path d="M2 8 Q6 2, 12 8 Q18 14, 22 8" stroke="black" strokeWidth="1.5" fill="none" />
                          <path d="M6 8 L12 4 L18 8" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "rectangle" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <rect x="4" y="4" width="16" height="8" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "square" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <rect x="6" y="2" width="12" height="12" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "butterfly" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <path d="M2 8 Q8 2, 12 8 Q16 14, 22 8" stroke="black" strokeWidth="1.5" fill="none" />
                          <path d="M8 6 Q12 8, 16 6" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "round" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <circle cx="12" cy="8" r="6" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "geometric" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <polygon points="12,2 20,6 20,14 12,18 4,14 4,6" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "aviator" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <ellipse cx="8" cy="8" rx="6" ry="4" stroke="black" strokeWidth="1.5" fill="none" />
                          <ellipse cx="16" cy="8" rx="6" ry="4" stroke="black" strokeWidth="1.5" fill="none" />
                          <line x1="14" y1="8" x2="10" y2="8" stroke="black" strokeWidth="1.5" />
                        </svg>
                      )}
                      {shapeIcon === "browline" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <path d="M4 6 L8 4 L12 6 L16 4 L20 6" stroke="black" strokeWidth="2" fill="none" />
                          <path d="M4 10 L8 12 L12 10 L16 12 L20 10" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                      {shapeIcon === "oval" && (
                        <svg viewBox="0 0 24 16" className="w-full h-full">
                          <ellipse cx="12" cy="8" rx="8" ry="5" stroke="black" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-black text-center leading-tight">{shapeData.shape}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
