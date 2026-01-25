"use client";

import { useState, useEffect, useRef } from "react";
import type { RxConfigData } from "@/app/shop/[slug]/prescription/PrescriptionFlow";

/**
 * Hook to fetch prescription lens image based on MOST RECENTLY CHANGED configuration
 * 
 * The key insight: We track what changed LAST and prioritize showing that image.
 * This way, if user clicks "1.56", we show 1.56 image even if "Clear" is also selected.
 */
export function usePrescriptionLensImage(
  rxConfig?: RxConfigData,
  isOutdoor: boolean = false,
  currentStep?: number
) {
  const [lensImage, setLensImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track previous values to detect what changed
  const prevConfigRef = useRef<RxConfigData | undefined>(undefined);

  useEffect(() => {
    if (!rxConfig) {
      console.log('[usePrescriptionLensImage] No rxConfig, skipping fetch');
      setLensImage(null);
      return;
    }

    const fetchLensImage = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        const prevConfig = prevConfigRef.current;

        // Detect what changed by comparing with previous config
        let whatChanged: 'lensIndex' | 'lensType' | 'coating' | 'tintType' | 'photochromicColor' | 'polarizedColor' | null = null;

        if (prevConfig) {
          if (prevConfig.lensIndex !== rxConfig.lensIndex) whatChanged = 'lensIndex';
          else if (prevConfig.lensType !== rxConfig.lensType) whatChanged = 'lensType';
          else if (prevConfig.coating !== rxConfig.coating) whatChanged = 'coating';
          else if (prevConfig.photochromicColor !== rxConfig.photochromicColor) whatChanged = 'photochromicColor';
          else if (prevConfig.polarizedColor !== rxConfig.polarizedColor) whatChanged = 'polarizedColor';
          else if (prevConfig.tintType !== rxConfig.tintType) whatChanged = 'tintType';
        }

        console.log('[usePrescriptionLensImage] What changed:', whatChanged, 'Step:', currentStep);

        // PRIORITY: Show image based on what user JUST clicked/changed
        
        // If lensIndex just changed, ONLY show lens index image
        if (whatChanged === 'lensIndex' && rxConfig.lensIndex) {
          params.append('lensIndex', rxConfig.lensIndex);
          console.log('[usePrescriptionLensImage] Showing lens index image for:', rxConfig.lensIndex);
        }
        // If coating just changed, ONLY show coating image
        else if (whatChanged === 'coating' && rxConfig.coating) {
          params.append('coating', rxConfig.coating);
          console.log('[usePrescriptionLensImage] Showing coating image for:', rxConfig.coating);
        }
        // If lens type changed, show lens type image
        else if (whatChanged === 'lensType' && rxConfig.lensType) {
          params.append('lensType', rxConfig.lensType);
          if (rxConfig.lensType === 'PHOTOCHROMIC_SOLIS' && rxConfig.photochromicColor) {
            params.append('photochromicColor', rxConfig.photochromicColor);
          } else if (rxConfig.lensType === 'POLARIZED_NUPOLAR' && rxConfig.polarizedColor) {
            params.append('polarizedColor', rxConfig.polarizedColor);
          }
          console.log('[usePrescriptionLensImage] Showing lens type image for:', rxConfig.lensType);
        }
        // If photochromic/polarized color changed
        else if (whatChanged === 'photochromicColor' && rxConfig.lensType === 'PHOTOCHROMIC_SOLIS') {
          params.append('lensType', rxConfig.lensType);
          params.append('photochromicColor', rxConfig.photochromicColor || '');
          console.log('[usePrescriptionLensImage] Showing photochromic color:', rxConfig.photochromicColor);
        }
        else if (whatChanged === 'polarizedColor' && rxConfig.lensType === 'POLARIZED_NUPOLAR') {
          params.append('lensType', rxConfig.lensType);
          params.append('polarizedColor', rxConfig.polarizedColor || '');
          console.log('[usePrescriptionLensImage] Showing polarized color:', rxConfig.polarizedColor);
        }
        // If tint type/color changed
        else if (whatChanged === 'tintType' && rxConfig.lensType === 'TINTED') {
          params.append('lensType', 'TINTED');
          if (rxConfig.tintType) params.append('tintType', rxConfig.tintType);
          if (rxConfig.tintColor) params.append('tintColor', rxConfig.tintColor);
          if (rxConfig.tintShadePercent) params.append('tintShadePercent', String(rxConfig.tintShadePercent));
          console.log('[usePrescriptionLensImage] Showing tinted image');
        }
        // DEFAULT: Use step-based logic (when nothing changed, e.g., first load or step navigation)
        else {
          // Step 4 = Coating selection
          if (currentStep === 4 && rxConfig.coating) {
            params.append('coating', rxConfig.coating);
            console.log('[usePrescriptionLensImage] Step 4: Showing coating image');
          }
          // Step 3 or default = Show lens type or index
          else if (rxConfig.lensType) {
            params.append('lensType', rxConfig.lensType);
            if (rxConfig.lensType === 'PHOTOCHROMIC_SOLIS' && rxConfig.photochromicColor) {
              params.append('photochromicColor', rxConfig.photochromicColor);
            } else if (rxConfig.lensType === 'POLARIZED_NUPOLAR' && rxConfig.polarizedColor) {
              params.append('polarizedColor', rxConfig.polarizedColor);
            }
            console.log('[usePrescriptionLensImage] Default: Showing lens type image');
          }
          else if (rxConfig.lensIndex) {
            params.append('lensIndex', rxConfig.lensIndex);
            console.log('[usePrescriptionLensImage] Default: Showing lens index image');
          }
        }

        params.append('isOutdoor', String(isOutdoor));

        console.log(`[usePrescriptionLensImage] Fetching with params:`, params.toString());

        const response = await fetch(`/api/prescription-lens-image?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setLensImage(data.imageUrl || null);
          console.log(`[usePrescriptionLensImage] Got image:`, data.imageUrl || 'none');
        } else {
          setLensImage(null);
        }

        // Update previous config for next comparison
        prevConfigRef.current = { ...rxConfig };
      } catch (error) {
        console.error('Error fetching prescription lens image:', error);
        setLensImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLensImage();
  }, [
    rxConfig?.lensType,
    rxConfig?.lensIndex,
    rxConfig?.coating,
    rxConfig?.tintType,
    rxConfig?.tintColor,
    rxConfig?.tintShadePercent,
    rxConfig?.tintRecipe,
    rxConfig?.photochromicColor,
    rxConfig?.polarizedColor,
    currentStep,
    isOutdoor,
  ]);

  return { lensImage, isLoading };
}

