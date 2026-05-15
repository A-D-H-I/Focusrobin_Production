"use client";

import { CheckCircle2, Glasses, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RxConfigData } from "@/types/prescription";

interface Step2PowerCategoryProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2PowerCategory({
  rxConfig,
  onConfigUpdate,
  onNext,
  onBack,
}: Step2PowerCategoryProps) {
  const currentCategory = rxConfig.powerCategory;

  const handleSelect = (category: 'NORMAL' | 'HIGH') => {
    onConfigUpdate({ powerCategory: category });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-headline font-semibold">Prescription Power</h2>
        <p className="text-muted-foreground">
          Select your prescription strength to help us determine the best lens options for your frame.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal Category */}
        <button
          onClick={() => handleSelect('NORMAL')}
          className={cn(
            "relative flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all duration-200 bg-card hover:bg-muted/50",
            currentCategory === 'NORMAL'
              ? "border-primary ring-1 ring-primary shadow-sm"
              : "border-border hover:border-primary/50"
          )}
        >
          {currentCategory === 'NORMAL' && (
            <div className="absolute top-3 right-3 text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Glasses className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Normal Prescription</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most common prescription range.
          </p>
          <div className="w-full bg-muted/50 rounded-lg p-3 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-foreground">SPH:</span>
              <span>Between -6.00 and +6.00</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">CYL:</span>
              <span>Between -2.00 and +2.00</span>
            </div>
          </div>
        </button>

        {/* High Category */}
        <button
          onClick={() => handleSelect('HIGH')}
          className={cn(
            "relative flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all duration-200 bg-card hover:bg-muted/50",
            currentCategory === 'HIGH'
              ? "border-primary ring-1 ring-primary shadow-sm"
              : "border-border hover:border-primary/50"
          )}
        >
          {currentCategory === 'HIGH' && (
            <div className="absolute top-3 right-3 text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600">
            <Glasses className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">High Power Prescription</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Stronger prescriptions requiring specialized lenses.
          </p>
          <div className="w-full bg-muted/50 rounded-lg p-3 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-foreground">SPH:</span>
              <span>Over +/- 6.00</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">CYL:</span>
              <span>Over +/- 2.00</span>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!currentCategory}
          className="min-w-[120px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
