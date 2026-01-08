"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { RxPriceResult } from "@/lib/pricing/rx167";
import type { PrescriptionData } from "../PrescriptionFlow";

interface PrescriptionPriceContextType {
  rxPriceResult: RxPriceResult | null;
  framePrice: number;
  formatPrice: ((price: number) => string) | null;
  prescriptionData: PrescriptionData | null;
  currentStep: number;
  setPriceData: (data: {
    rxPriceResult: RxPriceResult;
    framePrice: number;
    formatPrice: (price: number) => string;
    prescriptionData?: PrescriptionData;
    currentStep?: number;
  }) => void;
}

const PrescriptionPriceContext = createContext<PrescriptionPriceContextType | undefined>(undefined);

export function PrescriptionPriceProvider({ children }: { children: ReactNode }) {
  const [rxPriceResult, setRxPriceResult] = useState<RxPriceResult | null>(null);
  const [framePrice, setFramePrice] = useState<number>(0);
  const [formatPrice, setFormatPrice] = useState<((price: number) => string) | null>(null);
  const [prescriptionData, setPrescriptionDataState] = useState<PrescriptionData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const setPriceData = (data: {
    rxPriceResult: RxPriceResult;
    framePrice: number;
    formatPrice: (price: number) => string;
    prescriptionData?: PrescriptionData;
    currentStep?: number;
  }) => {
    setRxPriceResult(data.rxPriceResult);
    setFramePrice(data.framePrice);
    setFormatPrice(() => data.formatPrice);
    if (data.prescriptionData) {
      setPrescriptionDataState(data.prescriptionData);
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
        currentStep,
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

