"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { RxPriceResult } from "@/lib/pricing/rx167";
import type { PrescriptionData, RxConfigData } from "@/types/prescription";

import { BUNDLE_PRICES } from "@/lib/lensPricing";

interface PrescriptionPriceContextType {
  rxPriceResult: RxPriceResult | null;
  framePrice: number;
  formatPrice: ((price: number) => string) | null;
  prescriptionData: PrescriptionData | null;
  rxConfig: RxConfigData | null;
  currentStep: number;
  bundlePrices: Record<string, number>;
  setPriceData: (data: {
    rxPriceResult: RxPriceResult | null;
    framePrice: number;
    formatPrice: (price: number) => string;
    prescriptionData?: PrescriptionData;
    rxConfig?: RxConfigData;
    currentStep?: number;
  }) => void;
}

const PrescriptionPriceContext = createContext<PrescriptionPriceContextType | undefined>(undefined);

export function PrescriptionPriceProvider({ children, initialBundlePrices }: { children: ReactNode; initialBundlePrices?: Record<string, number> }) {
  const [rxPriceResult, setRxPriceResult] = useState<RxPriceResult | null>(null);
  const [framePrice, setFramePrice] = useState<number>(0);
  const [formatPrice, setFormatPrice] = useState<((price: number) => string) | null>(null);
  const [prescriptionData, setPrescriptionDataState] = useState<PrescriptionData | null>(null);
  const [rxConfig, setRxConfigState] = useState<RxConfigData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Initialize with passed props or default constant
  const bundlePrices = initialBundlePrices || BUNDLE_PRICES;

  const setPriceData = (data: {
    rxPriceResult: RxPriceResult | null;
    framePrice: number;
    formatPrice: (price: number) => string;
    prescriptionData?: PrescriptionData;
    rxConfig?: RxConfigData;
    currentStep?: number;
  }) => {
    setRxPriceResult(data.rxPriceResult);
    setFramePrice(data.framePrice);
    // Store formatPrice directly (it's already a function from usePrice hook)
    setFormatPrice(data.formatPrice);
    if (data.prescriptionData) {
      setPrescriptionDataState(data.prescriptionData);
    }
    if (data.rxConfig) {
      setRxConfigState(data.rxConfig);
    }
    if (data.currentStep !== undefined) {
      setCurrentStep(data.currentStep);
    }
  };

  return (
    <PrescriptionPriceContext.Provider
      value={{
        rxPriceResult,
        framePrice,
        formatPrice,
        prescriptionData,
        rxConfig,
        currentStep,
        bundlePrices,
        setPriceData,
      }}
    >
      {children}
    </PrescriptionPriceContext.Provider>
  );
}

export function usePrescriptionPrice() {
  const context = useContext(PrescriptionPriceContext);
  if (context === undefined) {
    throw new Error("usePrescriptionPrice must be used within a PrescriptionPriceProvider");
  }
  return context;
}

