"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import type { RxConfigData } from "./PrescriptionFlow";
// Note: Using local constants for lens rendering to decouple from pricing logic
import { Sun, Moon } from "lucide-react";

interface PrescriptionProductImageProps {
  imageUrl: string;
  alt: string;
  productName: string;
  rxConfig?: RxConfigData;
  lensBaseImageUrl?: string | null;
  lensMaskImageUrl?: string | null;
  lensBackgroundImageUrl?: string | null;
}

// Color definitions for lens tints
const TINT_COLORS: Record<string, { r: number; g: number; b: number }> = {
  brown: { r: 139, g: 90, b: 43 },
  grey: { r: 128, g: 128, b: 128 },
  gray: { r: 128, g: 128, b: 128 },
  green: { r: 34, g: 100, b: 34 },
};

// Shade to opacity mapping - higher shade = darker overlay
const shadeToOpacity = (shade: number): number => {
  // Map shade percentages to visual opacity
  // 15% shade -> ~0.15 opacity, 85% shade -> ~0.75 opacity
  return Math.min(0.85, shade / 100 * 0.9);
};

// Fixed gradient recipes (non-editable)
const GRADIENT_RECIPES: Record<string, { top: number; bottom: number }> = {
  grey: { top: 30, bottom: 0 },
  gray: { top: 30, bottom: 0 },
  brown: { top: 50, bottom: 0 },
  green: { top: 90, bottom: 15 },
};

// Photochromic outdoor darkening levels
const PHOTOCHROMIC_OUTDOOR: Record<string, number> = {
  grey: 75, // 70-85% range
  gray: 75,
  brown: 65, // 50-85% range
};

// Polarized base darkening
const POLARIZED_OPACITY = 0.35; // Subtle neutral darkening

/**
 * Lens Overlay Renderer
 * Renders appropriate lens overlay based on category and settings
 */
interface LensOverlayProps {
  lensCategory: string;
  tintType: string;
  tintColor: string;
  tintShadePercent?: number;
  photochromicOutdoor: boolean;
  maskUrl: string;
  maskStyles: React.CSSProperties;
}

function renderLensOverlay({
  lensCategory,
  tintType,
  tintColor,
  tintShadePercent,
  photochromicOutdoor,
  maskUrl,
  maskStyles,
}: LensOverlayProps): React.ReactNode {
  const colorKey = tintColor.toLowerCase().trim();
  const color = TINT_COLORS[colorKey] || TINT_COLORS.grey;

  // 1. CLEAR - No tint overlay, only reflections
  if (lensCategory === "CLEAR_OR_TINT" && tintType === "NONE") {
    return null; // No color overlay for clear
  }

  // 2. FULL TINT - Uniform tint based on shade
  if (lensCategory === "CLEAR_OR_TINT" && tintType === "FULL_CATALOG" && colorKey) {
    const shade = tintShadePercent || 50; // Default to middle shade
    const opacity = shadeToOpacity(shade);
    
    return (
      <div
        className="w-full h-full relative pointer-events-none"
        style={{
          gridArea: 'stack',
          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          opacity: opacity,
          ...maskStyles,
          mixBlendMode: "multiply",
        }}
      />
    );
  }

  // 3. GRADIENT - Fixed vertical gradient
  if (lensCategory === "CLEAR_OR_TINT" && tintType === "GRADIENT" && colorKey) {
    const recipe = GRADIENT_RECIPES[colorKey] || { top: 50, bottom: 0 };
    const topOpacity = recipe.top / 100;
    const bottomOpacity = recipe.bottom / 100;
    
    // Create smooth multi-stop gradient
    const gradient = `linear-gradient(to bottom,
      rgba(${color.r}, ${color.g}, ${color.b}, ${topOpacity}) 0%,
      rgba(${color.r}, ${color.g}, ${color.b}, ${topOpacity * 0.8}) 20%,
      rgba(${color.r}, ${color.g}, ${color.b}, ${topOpacity * 0.5}) 50%,
      rgba(${color.r}, ${color.g}, ${color.b}, ${topOpacity * 0.2 + bottomOpacity * 0.8}) 80%,
      rgba(${color.r}, ${color.g}, ${color.b}, ${bottomOpacity}) 100%
    )`;

    return (
      <div
        className="w-full h-full relative pointer-events-none"
        style={{
          gridArea: 'stack',
          background: gradient,
          ...maskStyles,
          mixBlendMode: "multiply",
        }}
      />
    );
  }

  // 4. PHOTOCHROMIC - Clear indoors, darkened outdoors
  if (lensCategory === "PHOTOCHROMIC_SOLIS" || lensCategory === "PHOTOCHROMIC_SOLIS_II") {
    if (!photochromicOutdoor) {
      return null; // Indoor = clear, no overlay
    }
    // Outdoor darkening
    const outdoorShade = PHOTOCHROMIC_OUTDOOR[colorKey] || 70;
    const opacity = outdoorShade / 100;
    
    return (
      <div
        className="w-full h-full relative pointer-events-none"
        style={{
          gridArea: 'stack',
          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          opacity: opacity,
          ...maskStyles,
          mixBlendMode: "multiply",
        }}
      />
    );
  }

  // 5. POLARIZED - Subtle neutral darkening
  if (lensCategory === "POLARIZED_NUPOLAR") {
    const polarizedColor = TINT_COLORS[colorKey] || TINT_COLORS.grey;
    
    return (
      <div
        className="w-full h-full relative pointer-events-none"
        style={{
          gridArea: 'stack',
          backgroundColor: `rgb(${polarizedColor.r}, ${polarizedColor.g}, ${polarizedColor.b})`,
          opacity: POLARIZED_OPACITY,
          ...maskStyles,
          mixBlendMode: "multiply",
        }}
      />
    );
  }

  return null;
}

/**
 * Real-time lens color preview using CSS Masking & Blending
 * Implements realistic lens effects for all lens types
 */
export default function PrescriptionProductImage({
  imageUrl,
  alt,
  productName,
  rxConfig,
  lensBaseImageUrl,
  lensMaskImageUrl,
  lensBackgroundImageUrl,
}: PrescriptionProductImageProps) {
  const [currentRxConfig, setCurrentRxConfig] = useState<RxConfigData | undefined>(rxConfig);
  const [photochromicOutdoor, setPhotochromicOutdoor] = useState(false);

  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent<RxConfigData>) => {
      setCurrentRxConfig(event.detail);
      // Reset outdoor toggle when switching away from photochromic
      if (event.detail.lensCategory !== "PHOTOCHROMIC_SOLIS") {
        setPhotochromicOutdoor(false);
      }
    };

    window.addEventListener('rx-config-updated', handleConfigUpdate as EventListener);
    return () => {
      window.removeEventListener('rx-config-updated', handleConfigUpdate as EventListener);
    };
  }, []);

  // Extract current settings - map new lens types to old categories for backward compatibility
  const lensType = currentRxConfig?.lensType || "CLEAR";
  const lensCategory = 
    lensType === "CLEAR" || lensType === "TINTED" 
      ? "CLEAR_OR_TINT"
      : lensType === "PHOTOCHROMIC_SOLIS"
      ? "PHOTOCHROMIC_SOLIS"
      : "POLARIZED_NUPOLAR";
  
  const tintType = 
    lensType === "TINTED" && currentRxConfig?.tintType === "FULL_TINT_CATALOG"
      ? "FULL_CATALOG"
      : lensType === "TINTED" && currentRxConfig?.tintType === "GRADIENT"
      ? "GRADIENT"
      : "NONE";
  
  const tintColor = 
    lensType === "TINTED" 
      ? (currentRxConfig?.tintColor || "")
      : lensType === "PHOTOCHROMIC_SOLIS"
      ? (currentRxConfig?.photochromicColor || "")
      : lensType === "POLARIZED_NUPOLAR"
      ? (currentRxConfig?.polarizedColor || "")
      : "";
  
  const tintShadePercent = currentRxConfig?.tintShadePercent;

  // Determine if we should show any tint overlay
  const isPhotochromic = lensType === "PHOTOCHROMIC_SOLIS";
  const isPolarized = lensType === "POLARIZED_NUPOLAR";
  const isClear = lensType === "CLEAR";
  const isTinted = lensType === "TINTED";
  const isFullTint = isTinted && tintType === "FULL_CATALOG";
  const isGradient = isTinted && tintType === "GRADIENT";

  // Calculate reflection opacity - reduce for darker tints
  const reflectionOpacity = useMemo(() => {
    if (isClear || (isPhotochromic && !photochromicOutdoor)) {
      return { primary: 0.08, secondary: 0.05 }; // Very subtle for clear
    }
    if (isFullTint) {
      const shade = tintShadePercent || 50;
      // Reduce reflections as tint gets darker
      const factor = 1 - (shade / 100 * 0.5);
      return { primary: 0.12 * factor, secondary: 0.06 * factor };
    }
    if (isGradient) {
      return { primary: 0.10, secondary: 0.05 };
    }
    if (isPhotochromic && photochromicOutdoor) {
      return { primary: 0.08, secondary: 0.04 };
    }
    if (isPolarized) {
      return { primary: 0.10, secondary: 0.05 };
    }
    return { primary: 0.08, secondary: 0.05 };
  }, [isClear, isFullTint, isGradient, isPhotochromic, isPolarized, photochromicOutdoor, tintShadePercent]);

  // Image URLs
  const baseImageUrl = lensBaseImageUrl || imageUrl;
  const hasMask = !!lensMaskImageUrl;
  const hasBackgroundImage = !!lensBackgroundImageUrl;

  // Common mask styles
  const maskStyles: React.CSSProperties = {
    maskImage: `url("${lensMaskImageUrl}")`,
    WebkitMaskImage: `url("${lensMaskImageUrl}")`,
    maskSize: "contain",
    maskPosition: "center center",
    maskRepeat: "no-repeat",
    maskMode: "luminance",
    // @ts-expect-error - WebKit prefix properties
    WebkitMaskSize: "contain",
    WebkitMaskPosition: "center center",
    WebkitMaskRepeat: "no-repeat",
  };

  return (
    <div className="relative w-full aspect-square lg:h-[400px] bg-muted rounded-lg overflow-hidden">
      {/* Photochromic Indoor/Outdoor Toggle */}
      {isPhotochromic && hasMask && lensType === "PHOTOCHROMIC_SOLIS" && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-md border">
          <button
            onClick={() => setPhotochromicOutdoor(false)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all text-sm ${
              !photochromicOutdoor 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Indoor
          </button>
          <button
            onClick={() => setPhotochromicOutdoor(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all text-sm ${
              photochromicOutdoor 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Outdoor
          </button>
        </div>
      )}

      <div 
        className="w-full h-full relative"
        style={{ display: 'grid', gridTemplateAreas: '"stack"' }}
      >
        {/* Background Image Layer - Visible through transparent lenses */}
        {hasBackgroundImage && hasMask && (
          <div 
            className="w-full h-full relative z-[0]"
            style={{ gridArea: 'stack' }}
          >
            <Image
              src={lensBackgroundImageUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{
                ...maskStyles,
                opacity: isClear ? 0.65 : 0.35, // Much more visible for clear lenses
              }}
            />
          </div>
        )}

        {/* Base Image Layer - The glasses frame with transparent lenses */}
        <div 
          className="w-full h-full relative z-[1]"
          style={{ gridArea: 'stack' }}
        >
          <Image
            src={baseImageUrl}
            alt={alt}
            fill
            className="object-contain p-4"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Lens Overlay Layers */}
        {hasMask && (
          <>
            {/* Tint/Color Overlay Layer */}
            <div className="contents" style={{ zIndex: 2 }}>
              {renderLensOverlay({
                lensCategory,
                tintType,
                tintColor,
                tintShadePercent,
                photochromicOutdoor,
                maskUrl: lensMaskImageUrl!,
                maskStyles,
              })}
            </div>

            {/* Subtle Inset Edge Definition - Always present */}
            <div
              className="w-full h-full relative z-[10] pointer-events-none"
              style={{
                gridArea: 'stack',
                boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.06)',
                background: `radial-gradient(ellipse 98% 98% at 50% 50%,
                  transparent 0%,
                  transparent 85%,
                  rgba(0, 0, 0, 0.04) 95%,
                  rgba(0, 0, 0, 0.06) 100%
                )`,
                ...maskStyles,
                mixBlendMode: "multiply",
              }}
            />

            {/* Primary Reflection - Large soft highlight near top-left */}
            <div
              className="w-full h-full relative z-[11] pointer-events-none"
              style={{
                gridArea: 'stack',
                background: `radial-gradient(ellipse 70% 50% at 25% 25%,
                  rgba(255, 255, 255, 1) 0%,
                  rgba(255, 255, 255, 0.6) 20%,
                  rgba(255, 255, 255, 0.2) 40%,
                  transparent 70%
                )`,
                opacity: reflectionOpacity.primary,
                filter: 'blur(2px)',
                ...maskStyles,
                mixBlendMode: "screen",
              }}
            />

            {/* Secondary Reflection - Smaller highlight */}
            <div
              className="w-full h-full relative z-[12] pointer-events-none"
              style={{
                gridArea: 'stack',
                background: `radial-gradient(ellipse 40% 30% at 70% 70%,
                  rgba(255, 255, 255, 1) 0%,
                  rgba(255, 255, 255, 0.4) 30%,
                  transparent 60%
                )`,
                opacity: reflectionOpacity.secondary,
                filter: 'blur(1px)',
                ...maskStyles,
                mixBlendMode: "screen",
              }}
            />

            {/* Curved Arc Reflection - Typical of curved lenses */}
            <div
              className="w-full h-full relative z-[13] pointer-events-none"
              style={{
                gridArea: 'stack',
                background: `radial-gradient(ellipse 150% 30% at 50% 15%,
                  rgba(255, 255, 255, 0.8) 0%,
                  rgba(255, 255, 255, 0.3) 20%,
                  transparent 40%
                )`,
                opacity: reflectionOpacity.secondary * 0.8,
                ...maskStyles,
                mixBlendMode: "screen",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

