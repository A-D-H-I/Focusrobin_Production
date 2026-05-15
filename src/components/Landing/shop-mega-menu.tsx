"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getAvailableFrameColors, type AvailableColor } from "@/app/actions/getAvailableColors";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { getAvailableColorFamilies } from "@/app/actions/getAvailableColorFamilies";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";
import TranslatableText from "@/components/ui/TranslatableText";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  isScrolled?: boolean;
  type: 'sunglasses' | 'eyeglasses';
  initialColors?: AvailableColor[];
  initialShapes?: AvailableGlassShape[];
  initialBrands?: AvailableBrand[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
    "oval-shape": "oval",
    "oval shape": "oval",
  };
  return iconMap[normalized] || "round"; // Default to round if not found
}

export default function ShopMegaMenu(props: ShopMegaMenuProps) {
  const { isOpen, onClose, className, type, isScrolled = false, initialColors, initialShapes, initialBrands, onMouseEnter, onMouseLeave } = props;
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const [availableShapes, setAvailableShapes] = useState<AvailableGlassShape[]>(initialShapes || []);
  const [isLoadingShapes, setIsLoadingShapes] = useState(!initialShapes);
  const [availableColors, setAvailableColors] = useState<AvailableColor[]>(initialColors || []);
  const [isLoadingColors, setIsLoadingColors] = useState(!initialColors);
  const [availableBrands, setAvailableBrands] = useState<AvailableBrand[]>(initialBrands || []);
  const [isLoadingBrands, setIsLoadingBrands] = useState(!initialBrands);
  const [colorPalette, setColorPalette] = useState<Record<string, string>>({});

  useEffect(() => {
    getAvailableColorFamilies().then(setColorPalette);
  }, []);

  const baseUrl = type === 'eyeglasses' ? '/shop/prescription-glasses' : '/shop';
  const title = type === 'eyeglasses' ? 'Eyeglasses' : 'Sunglasses';

  // Navigation handler - set flag to prevent mouseLeave from interfering
  const handleNavigate = useCallback((href: string) => {
    isNavigatingRef.current = true;
    router.push(href);
  }, [router]);

  useEffect(() => {
    if (initialColors) {
      setAvailableColors(initialColors);
      setIsLoadingColors(false);
    }
  }, [initialColors]);

  useEffect(() => {
    if (initialShapes) {
      setAvailableShapes(initialShapes);
      setIsLoadingShapes(false);
    }
  }, [initialShapes]);

  useEffect(() => {
    if (initialBrands) {
      setAvailableBrands(initialBrands);
      setIsLoadingBrands(false);
    }
  }, [initialBrands]);

  useEffect(function fetchColors() {
    if (initialColors) return;

    if (isOpen && availableColors.length === 0) {
      setIsLoadingColors(true);
      getAvailableFrameColors(type)
        .then(function (colors) {
          setAvailableColors(colors);
          setIsLoadingColors(false);
        })
        .catch(function (error) {
          console.error("Error fetching available colors:", error);
          setIsLoadingColors(false);
        });
    }
  }, [isOpen, availableColors.length, type, initialColors]);

  useEffect(function fetchShapes() {
    if (initialShapes) return;

    if (isOpen && availableShapes.length === 0) {
      setIsLoadingShapes(true);
      getAvailableGlassShapes(type)
        .then(function (shapes) {
          setAvailableShapes(shapes);
          setIsLoadingShapes(false);
        })
        .catch(function (error) {
          console.error("Error fetching available shapes:", error);
          setIsLoadingShapes(false);
        });
    }
  }, [isOpen, availableShapes.length, type, initialShapes]);

  useEffect(function fetchBrands() {
    if (initialBrands) return;

    if (isOpen && availableBrands.length === 0) {
      setIsLoadingBrands(true);
      getAvailableBrands(type)
        .then(function (brands) {
          setAvailableBrands(brands);
          setIsLoadingBrands(false);
        })
        .catch(function (error) {
          console.error("Error fetching available brands:", error);
          setIsLoadingBrands(false);
        });
    }
  }, [isOpen, availableBrands.length, type, initialBrands]);

  function handleMouseLeave() {
    // Don't trigger close if we're navigating
    if (isNavigatingRef.current) {
      return;
    }
    if (onMouseLeave) {
      onMouseLeave();
    }
  }

  function handleMouseEnter() {
    // Reset navigating flag when mouse enters
    isNavigatingRef.current = false;
    if (onMouseEnter) {
      onMouseEnter();
    }
  }

  useEffect(function cleanup() {
    return function () {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Note: We don't prevent body scroll for hover menus as they don't need it
  // and it causes layout shift issues with the scrollbar compensation

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute left-0 top-full mt-2 sm:mt-4 z-[110] w-full flex justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={menuRef}
        className={cn(
          "w-full bg-white shadow-2xl rounded-xl border border-gray-100",
          "flex gap-0 p-0 overflow-hidden",
          "max-h-[80vh]",
          className
        )}
      >
        {/* Left: Nav Links — slim column */}
        <div className="flex-shrink-0 w-44 lg:w-52 bg-gray-50 border-r border-gray-100 p-5 lg:p-6 space-y-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            <TranslatableText text={title} />
          </h3>
          {[
            { href: baseUrl, label: `All ${title}` },
            { href: `${baseUrl}/women`, label: `Women's` },
            { href: `${baseUrl}/men`, label: `Men's` },
            { href: `${baseUrl}/kids`, label: `Kids` },
            { href: `${baseUrl}/unisex`, label: `Unisex` },
            { href: `${baseUrl}?filter=bestsellers`, label: `Best Sellers` },
            { href: `${baseUrl}/new-arrivals`, label: `New Arrivals` },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors font-medium group"
            >
              <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-teal-400 transition-colors flex-shrink-0" />
              <TranslatableText text={label} />
            </Link>
          ))}
        </div>

        {/* Right: Brands — fills all remaining space */}
        <div className="flex-1 p-5 lg:p-6 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            <TranslatableText text="Shop by Brand" />
          </h3>

          {isLoadingBrands ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : availableBrands.length === 0 ? (
            <p className="text-sm text-gray-400"><TranslatableText text="No brands available" /></p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {availableBrands.map((brandData, index) => {
                const hasImage = brandData.imageUrl && brandData.imageUrl.trim() !== '';
                return (
                  <Link
                    key={brandData.brand + "-" + index}
                    href={`${baseUrl}?filter=${encodeURIComponent(brandData.brand)}`}
                    onClick={onClose}
                    className="group flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-lg transition-all duration-150 cursor-pointer min-w-0"
                    title={brandData.brand}
                  >
                    {/* Logo or initials circle */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-white border border-gray-200 group-hover:border-teal-200 flex items-center justify-center overflow-hidden transition-colors">
                      {hasImage ? (
                        <div className="relative w-full h-full p-0.5">
                          <Image
                            src={normalizeImageUrl(brandData.imageUrl!)}
                            alt={brandData.brand}
                            fill
                            className="object-contain p-0.5"
                            sizes="28px"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-teal-600 transition-colors">
                          {brandData.brand.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Brand name */}
                    <span className="text-xs font-medium text-gray-700 group-hover:text-teal-700 transition-colors truncate leading-tight">
                      <TranslatableText text={brandData.brand} />
                    </span>
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

