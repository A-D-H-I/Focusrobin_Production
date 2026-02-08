"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { CheckCircle2, Edit, ShoppingCart, FileText, Download } from "lucide-react";
import PrescriptionProductImage from "../PrescriptionProductImage";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import { getUserPrescription } from "@/app/actions/prescription";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  LENS_BUNDLE_LABELS,
  getBundlePrice,
} from "@/lib/lensPricing";
import {
  FRAME_TYPE_LABELS,
  FIXED_PROFIT,
} from "@/lib/pricing/rx167";
import { detectFrameType } from "@/lib/pricing/detectFrameType";
import type { FullPrescriptionData, RxConfigData } from "@/types/prescription";

interface PrescriptionConfirmationContentProps {
  product: Product;
  productSlug: string;
}

export default function PrescriptionConfirmationContent({ product, productSlug }: PrescriptionConfirmationContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { formatPrice, parseEurPrice } = usePrice();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [prescriptionData, setPrescriptionData] = useState<FullPrescriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const framePrice = parseEurPrice(product.price);

  // Calculate price breakdown - must be before early returns (Rules of Hooks)
  const priceBreakdown = useMemo(() => {
    // Can't calculate if prescriptionData is not loaded yet
    if (!prescriptionData?.rxConfig) return null;

    const rxConfig = prescriptionData.rxConfig;

    // If we have price breakdown from loaded data, use it
    if (prescriptionData.rxPriceBreakdown) {
      return prescriptionData.rxPriceBreakdown;
    }

    // Otherwise, calculate it from rxConfig (Fallback)
    const bundlePrice = getBundlePrice(rxConfig.lensBundle);

    // Calculate totals
    const rxRetailNet = bundlePrice;
    const totalNet = framePrice + rxRetailNet;

    return {
      lensesPair: bundlePrice,
      edgingFee: 0,
      profit: 0, // Bundled price logic
      rxRetailNet,
      totalNet,
    };
  }, [prescriptionData, framePrice]);

  useEffect(() => {
    const loadPrescriptionData = async () => {
      setIsLoading(true);
      try {
        let loadedData: FullPrescriptionData | null = null;

        // First, try to load from sessionStorage (product-specific, most recent)
        if (typeof window !== 'undefined') {
          const sessionKey = `prescription_${productSlug}`;
          const sessionStored = sessionStorage.getItem(sessionKey);
          if (sessionStored) {
            try {
              loadedData = JSON.parse(sessionStored) as FullPrescriptionData;
              console.log('[PrescriptionConfirmation] Loaded from sessionStorage');
            } catch (error) {
              console.error('Error parsing prescription data from sessionStorage:', error);
            }
          }
        }

        // If not found in sessionStorage, try database or localStorage
        if (!loadedData) {
          if (session?.user) {
            // Load from database (shared prescription per user)
            const result = await getUserPrescription(productSlug);
            if (result && 'prescription' in result && result.prescription) {
              loadedData = result.prescription;
              // Load product-specific rxConfig from localStorage
              if (typeof window !== 'undefined') {
                const productRxConfigKey = `rxConfig_${productSlug}`;
                const storedRxConfig = localStorage.getItem(productRxConfigKey);
                if (storedRxConfig) {
                  try {
                    const parsedRxConfig = JSON.parse(storedRxConfig);
                    loadedData.rxConfig = parsedRxConfig;
                  } catch (error) {
                    console.error('Error parsing rxConfig from localStorage:', error);
                  }
                }
              }
            }
          } else {
            // Guest user - load from localStorage
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('prescription_shared');
              if (stored) {
                try {
                  const parsed = JSON.parse(stored) as FullPrescriptionData;
                  loadedData = parsed;
                  // Load product-specific rxConfig
                  const productRxConfigKey = `rxConfig_${productSlug}`;
                  const storedRxConfig = localStorage.getItem(productRxConfigKey);
                  if (storedRxConfig) {
                    try {
                      const parsedRxConfig = JSON.parse(storedRxConfig);
                      loadedData.rxConfig = parsedRxConfig;
                    } catch (error) {
                      console.error('Error parsing rxConfig from localStorage:', error);
                    }
                  }
                } catch (error) {
                  console.error('Error parsing prescription data:', error);
                }
              }
            }
          }
        }

        // If still no rxConfig, try loading from localStorage (product-specific)
        if (loadedData && !loadedData.rxConfig && typeof window !== 'undefined') {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          const storedRxConfig = localStorage.getItem(productRxConfigKey);
          if (storedRxConfig) {
            try {
              const parsedRxConfig = JSON.parse(storedRxConfig) as RxConfigData;
              // Auto-detect frame type from product
              const detectedFrameType = detectFrameType(product);
              loadedData = {
                ...loadedData,
                rxConfig: {
                  ...parsedRxConfig,
                  frameType: detectedFrameType,
                },
              };
              console.log('[PrescriptionConfirmation] Loaded rxConfig from localStorage');
            } catch (error) {
              console.error('Error parsing rxConfig from localStorage:', error);
            }
          }
        }

        // If still no rxConfig, default to Basic
        if (loadedData && !loadedData.rxConfig) {
          const detectedFrameType = detectFrameType(product);
          loadedData = {
            ...loadedData,
            rxConfig: {
              lensBundle: "BASIC",
              frameType: detectedFrameType,
            },
          };
          console.log('[PrescriptionConfirmation] Using default rxConfig (no saved config found)');
        }

        if (!loadedData) {
          // No prescription data, redirect to product page
          router.push(`/shop/${productSlug}`);
          return;
        }

        setPrescriptionData(loadedData);
      } catch (error) {
        console.error('Error loading prescription data:', error);
        router.push(`/shop/${productSlug}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrescriptionData();
  }, [productSlug, router, session, product]);

  const handleEdit = () => {
    router.push(`/shop/${productSlug}/prescription?step=1`);
  };

  const handleContinue = () => {
    router.push(`/shop/${productSlug}`);
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (!prescriptionData) {
    return null;
  }

  const selectedVariant = product.variants[0];
  const productImage = selectedVariant?.thumbnail || selectedVariant?.images[0] || '';
  const normalizedImage = productImage ? normalizeImageUrl(productImage) : '';
  const rxConfig = prescriptionData.rxConfig;

  // Check if prescription has prism values
  const hasPrism = prescriptionData.hasPrism ||
    (prescriptionData.od.prismHorizontal && prescriptionData.od.prismHorizontal !== "0.00") ||
    (prescriptionData.od.prismVertical && prescriptionData.od.prismVertical !== "0.00") ||
    (prescriptionData.os.prismHorizontal && prescriptionData.os.prismHorizontal !== "0.00") ||
    (prescriptionData.os.prismVertical && prescriptionData.os.prismVertical !== "0.00");

  const handleAddToCart = async () => {
    if (!prescriptionData || !selectedVariant) {
      console.error('Missing prescriptionData or selectedVariant:', { prescriptionData, selectedVariant });
      toast({
        title: "Error",
        description: "Missing prescription or product data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      const cartPrescriptionData = {
        rxValues: {
          odSph: prescriptionData.od.sph,
          odCyl: prescriptionData.od.cyl,
          odAxis: prescriptionData.od.axis,
          osSph: prescriptionData.os.sph,
          osCyl: prescriptionData.os.cyl,
          osAxis: prescriptionData.os.axis,
          pd: prescriptionData.pd,
          pdOd: prescriptionData.pdOd,
          pdOs: prescriptionData.pdOs,
          hasTwoPDs: prescriptionData.hasTwoPDs,
          hasPrism: hasPrism,
          odPrismHorizontal: prescriptionData.od.prismHorizontal,
          odPrismHorizontalBase: prescriptionData.od.prismHorizontalBase,
          odPrismVertical: prescriptionData.od.prismVertical,
          odPrismVerticalBase: prescriptionData.od.prismVerticalBase,
          osPrismHorizontal: prescriptionData.os.prismHorizontal,
          osPrismHorizontalBase: prescriptionData.os.prismHorizontalBase,
          osPrismVertical: prescriptionData.os.prismVertical,
          osPrismVerticalBase: prescriptionData.os.prismVerticalBase,
          prescriptionImageUrl: prescriptionData.prescriptionImageUrl,
          prescriptionPdfUrl: prescriptionData.prescriptionPdfUrl,
          isPdfMode: prescriptionData.isPdfMode || false,
        },
        rxConfig: rxConfig,
        rxPriceBreakdown: priceBreakdown || undefined,
      };

      await addToCart(product, selectedVariant, 1, cartPrescriptionData);

      toast({
        title: "Added to cart",
        description: `${product.name} with prescription has been added to your cart.`,
      });

      if (typeof window !== 'undefined' && prescriptionData?.rxConfig) {
        const sessionKey = `prescription_${productSlug}`;
        const fullData: FullPrescriptionData = {
          ...prescriptionData,
          rxConfig: prescriptionData.rxConfig,
          rxPriceBreakdown: priceBreakdown || undefined,
        };
        sessionStorage.setItem(sessionKey, JSON.stringify(fullData));
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/cart';
      }
    } catch (error) {
      console.error('[CONFIRMATION] Error adding to cart:', error);
      setIsAddingToCart(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Product Display */}
      <div className="lg:sticky lg:top-8 lg:h-fit flex flex-col">
        <PrescriptionProductImage
          imageUrl={normalizedImage}
          alt={product.name}
          productName={product.name}
          rxConfig={rxConfig}
        />

        <div className="space-y-4 mt-6">
          <h2 className="text-2xl font-headline">{product.name}</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame:</span>
              <span className="font-medium">{selectedVariant?.name || 'Default'}</span>
            </div>
            {rxConfig && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens Package:</span>
                  <span className="font-medium">{LENS_BUNDLE_LABELS[rxConfig.lensBundle]}</span>
                </div>
                {rxConfig.photochromicColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{rxConfig.photochromicColor}</span>
                  </div>
                )}
                {rxConfig.tintColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tint Color:</span>
                    <span className="font-medium">{rxConfig.tintColor}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {priceBreakdown && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frame:</span>
                <span>{formatPrice(framePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rx Lenses:</span>
                <span>+{formatPrice(priceBreakdown.rxRetailNet)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(priceBreakdown.totalNet)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Prescription Confirmation */}
      <div className="w-full">
        <div className="bg-card border rounded-lg p-6 space-y-6">
          {/* Success Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-2xl font-headline">Order Ready!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your prescription and lens configuration has been saved
              </p>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prescription Details</h3>

            {prescriptionData.isPdfMode && prescriptionData.prescriptionPdfUrl ? (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800 dark:text-blue-200">Prescription PDF Uploaded</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Document will be sent to lens manufacturer
                    </p>
                  </div>
                </div>
                <a
                  href={prescriptionData.prescriptionPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-3"
                >
                  <Download className="h-4 w-4" />
                  View uploaded prescription
                </a>
              </div>
            ) : (
              <div className="border rounded-lg bg-muted/30">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium">Eye</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">SPH</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">CYL</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">AXIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">OD (Right)</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.sph}</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.cyl}</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.axis}</td>
                    </tr>
                    <tr>
                      <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">OS (Left)</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.sph}</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.cyl}</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.axis}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-3 sm:p-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">PD (Pupillary Distance)</span>
                    <span className="text-xs sm:text-sm font-medium break-words">
                      {prescriptionData.hasTwoPDs ? (
                        <>
                          OD: {prescriptionData.pdOd || "N/A"} mm | OS: {prescriptionData.pdOs || "N/A"} mm
                        </>
                      ) : (
                        <>{prescriptionData.pd} mm</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lens Configuration */}
          {rxConfig && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lens Configuration</h3>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lens Package:</span>
                  <span className="font-medium">{LENS_BUNDLE_LABELS[rxConfig.lensBundle]}</span>
                </div>
                {rxConfig.photochromicColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Photochromic Color:</span>
                    <span className="font-medium">{rxConfig.photochromicColor}</span>
                  </div>
                )}
                {rxConfig.tintColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tint Color:</span>
                    <span className="font-medium">{rxConfig.tintColor}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frame Type:</span>
                  <span className="font-medium">{FRAME_TYPE_LABELS[rxConfig.frameType]}</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Price Breakdown</h3>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Frame</span>
                  <span>{formatPrice(framePrice)}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Prescription Lenses</p>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Lenses (pair)</span>
                    <span>{formatPrice(priceBreakdown.lensesPair)}</span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between text-sm">
                  <span>Rx Add-on</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.rxRetailNet)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(priceBreakdown.totalNet)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !selectedVariant}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAddingToCart ? "Adding to Cart..." : "Add to Cart with Prescription"}
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="w-full h-12"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleContinue}
              className="w-full h-12"
            >
              Return to Product
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
