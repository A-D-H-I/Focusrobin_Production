"use client";

import { useEffect } from "react";
import { Check, Feather, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RxConfigData } from "@/types/prescription";

interface Step4LensThicknessProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onConfigUpdateDefault?: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
}

export default function Step4LensThickness({
  rxConfig,
  onConfigUpdate,
  onConfigUpdateDefault,
  onNext,
  onBack,
  formatPrice,
}: Step4LensThicknessProps) {
  
  const standardIndex = rxConfig.lensBundle === "PHOTOCHROMIC" ? "1.56" : "1.60";

  const THICKNESS_OPTIONS = [
    {
      value: "STANDARD" as const,
      label: `${standardIndex} Standard Lens`,
      description: "Standard index. Perfect for everyday use.",
      price: 0,
      icon: Layers,
      features: ["Good durability", "Standard thickness"],
    },
    {
      value: "THINNER" as const,
      label: "Thinner Lens",
      description: "High index. Up to 30% thinner and lighter.",
      price: 60,
      icon: Feather,
      features: ["Lighter on the nose", "Better aesthetics", "Reduces eye magnification"],
    },
  ];

  // Set default thickness on mount if none selected
  useEffect(() => {
    if (!rxConfig.lensThickness && onConfigUpdateDefault) {
      onConfigUpdateDefault({ lensThickness: "STANDARD" });
    }
  }, [rxConfig.lensThickness, onConfigUpdateDefault]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Select Lens Thickness</h2>
        <p className="text-muted-foreground text-sm">
          Choose the lens thickness that best suits your prescription and comfort needs.
        </p>
      </div>

      <div className="grid gap-4">
        {THICKNESS_OPTIONS.map((option) => {
          const isSelected = rxConfig.lensThickness === option.value;
          const Icon = option.icon;

          return (
            <div
              key={option.value}
              className={cn(
                "relative flex flex-col sm:flex-row items-start p-4 cursor-pointer rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
              onClick={() => onConfigUpdate({ lensThickness: option.value })}
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div
                  className={cn(
                    "flex-shrink-0 p-3 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 text-left sm:pr-6">
                  <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    {/* Mobile price */}
                    <div className="sm:hidden font-medium text-primary">
                      {option.price === 0 ? "Included" : `+${formatPrice(option.price)}`}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {option.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {option.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-full bg-background border text-xs font-medium text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop price */}
              <div className="hidden sm:flex items-center justify-end w-32 ml-auto shrink-0 self-center">
                <div className="text-right">
                  <div className="font-bold text-lg text-primary whitespace-nowrap">
                    {option.price === 0 ? "Included" : `+${formatPrice(option.price)}`}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 sm:top-1/2 sm:-translate-y-1/2 text-primary hidden sm:block">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-8">
        <button
          onClick={onBack}
          className="w-full sm:w-1/3 px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-2/3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
        >
          Continue to Summary
        </button>
      </div>
    </div>
  );
}
