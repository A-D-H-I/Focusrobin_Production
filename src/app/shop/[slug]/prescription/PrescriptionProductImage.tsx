"use client";

import Image from "next/image";
import type { RxConfigData } from "./PrescriptionFlow";

interface PrescriptionProductImageProps {
  imageUrl: string;
  alt: string;
  productName: string;
  rxConfig?: RxConfigData;
  lensBaseImageUrl?: string | null;
  lensMaskImageUrl?: string | null;
  lensBackgroundImageUrl?: string | null;
  currentStep?: number;
}

/**
 * Simplified Product Image
 * Renders only the primary product image (imageUrl).
 * No dynamic lens overlays or background image switching.
 */
export default function PrescriptionProductImage({
  imageUrl,
  alt,
  productName,
  rxConfig,
  lensBaseImageUrl,
  lensMaskImageUrl,
  lensBackgroundImageUrl,
  currentStep,
}: PrescriptionProductImageProps) {

  return (
    <div className="relative w-full aspect-square lg:h-[400px] bg-muted rounded-lg overflow-hidden">
      <div className="w-full h-full relative">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-contain p-4"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}
