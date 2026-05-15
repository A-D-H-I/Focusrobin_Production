import { type LensBundle, type TintColor, type PhotochromicColor } from "@/lib/lensPricing";
import { type FrameType } from "@/lib/pricing/rx167";

// Prescription data for vision correction (Database stored)
export type PrescriptionData = {
    od: {
        sph: string;
        cyl: string;
        axis: string;
        prismHorizontal?: string;
        prismHorizontalBase?: string;
        prismVertical?: string;
        prismVerticalBase?: string;
    };
    os: {
        sph: string;
        cyl: string;
        axis: string;
        prismHorizontal?: string;
        prismHorizontalBase?: string;
        prismVertical?: string;
        prismVerticalBase?: string;
    };
    pd: string; // Single PD value (used when hasTwoPDs is false)
    pdOd?: string; // Right eye PD (used when hasTwoPDs is true)
    pdOs?: string; // Left eye PD (used when hasTwoPDs is true)
    hasTwoPDs: boolean;
    hasPrism: boolean;
    prescriptionImageUrl?: string; // URL to uploaded prescription image (S3 link)
    // PDF upload fields
    prescriptionPdfUrl?: string; // URL to uploaded prescription PDF (S3 link)
    isPdfMode: boolean; // Whether prescription was uploaded as PDF
};

// Rx lens configuration data (Product specific)
export type RxConfigData = {
    lensBundle: LensBundle;
    // Sub-options
    tintColor?: TintColor;
    photochromicColor?: PhotochromicColor;
    frameType: FrameType;
    powerCategory?: 'NORMAL' | 'HIGH';
    lensThickness?: 'STANDARD' | 'THINNER';

    // Legacy fields kept for compatibility
    lensType?: string;
    lensIndex?: string;
    coating?: string;
    tintType?: string;
    tintShadePercent?: number;
    tintRecipe?: string;
    polarizedColor?: string;
};

// Combined data for storage/actions
export type FullPrescriptionData = PrescriptionData & {
    rxConfig?: RxConfigData; // Optional - lens config is product-specific
    rxPriceBreakdown?: {
        lensesPair: number;
        edgingFee: number;
        profit: number;
        rxRetailNet: number;
        totalNet: number;
    };
};
