"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Dimensions {
  frameWidth: number;
  lensWidth: number;
  lensHeight: number;
  bridgeWidth: number;
  templeLength: number;
}

interface ProductDimensionsProps {
  dimensions: Partial<Dimensions>;
}

export default function ProductDimensions({ dimensions }: ProductDimensionsProps) {
  const [unit, setUnit] = useState<"mm" | "in">("mm");

  // Convert mm to inches (divide by 25.4)
  const convertToInches = (mm: number): number => {
    return parseFloat((mm / 25.4).toFixed(2));
  };

  // Format value based on unit
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return "N/A";
    const displayValue = unit === "in" ? convertToInches(value) : value;
    return `${displayValue}${unit === "in" ? "in" : "mm"}`;
  };

  // Get display values with fallbacks
  const frameWidth = dimensions.frameWidth || 128;
  const lensWidth = dimensions.lensWidth || 52;
  const lensHeight = dimensions.lensHeight || 39;
  const bridgeWidth = dimensions.bridgeWidth || 18;
  const templeLength = dimensions.templeLength || 145;

  const unitToggle = (
      <div className="absolute top-4 right-4 flex items-center border rounded-md p-1 bg-background z-10">
        <Button
          variant={unit === "mm" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setUnit("mm")}
        >
          MM
        </Button>
        <Button
          variant={unit === "in" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setUnit("in")}
        >
          IN
        </Button>
      </div>
  );

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-lg border bg-card/50 p-4 sm:p-6 pt-12 sm:pt-16">
      {unitToggle}

      {/* Frame Width View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 sm:mb-20"
      >
        {/* Frame Width Label */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-sm text-muted-foreground mb-1">Frame width</p>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground">{formatValue(frameWidth)}</p>
        </div>

        {/* Glasses Front View */}
        <div className="relative flex items-center justify-center gap-4 sm:gap-6 mt-12 sm:mt-24 w-full max-w-[700px] mx-auto">
          
          {/* Frame Width Indicator Line - Positioned to match frame width including temple arms */}
          {/* Width calculation: left temple tip (26px/36px) + left lens (128px/176px) + gap (16px/24px) + bridge (64px/80px) + gap (16px/24px) + right lens (128px/176px) + right temple tip (26px/36px) */}
          <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 w-[404px] sm:w-[552px] flex items-center">
            {/* Left dot - aligned with tip of left temple arm (temple line 24px/32px + square overlap 2px/4px) */}
            <div className="absolute -left-[26px] sm:-left-[36px] w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-foreground flex-shrink-0"></div>
            {/* Dashed line spanning the full frame width */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] border-t-2 border-dashed border-border"></div>
            {/* Right dot - aligned with tip of right temple arm */}
            <div className="absolute -right-[26px] sm:-right-[36px] w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-foreground flex-shrink-0"></div>
          </div>
          {/* Left Lens */}
          <div className="relative">
            <div className="w-32 h-24 sm:w-44 sm:h-32 border-4 border-foreground rounded-full relative">
              {/* Lens Width Indicator Line */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground flex-shrink-0"></div>
                <div className="flex-1 h-[2px] border-t-2 border-dashed border-border"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground flex-shrink-0"></div>
              </div>
              
              {/* Lens Width Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-6 sm:mt-8">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Lens width</p>
                <p className="text-sm sm:text-lg font-semibold text-foreground">{formatValue(lensWidth)}</p>
              </div>
              
              {/* Bridge connection point (left side) - extends to connect with bridge */}
              <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-4 bg-foreground"></div>
            </div>
            
            {/* Temple Arm Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
              <div className="w-6 sm:w-8 h-1 bg-foreground"></div>
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-foreground rounded-sm -ml-0.5 sm:-ml-1 -mt-0.5"></div>
            </div>
          </div>

          {/* Bridge - Connected to both lenses */}
          <div className="relative">
            <div className="w-16 sm:w-20 h-1 bg-foreground relative">
              {/* Left connection to left lens */}
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-4 bg-foreground"></div>
              {/* Right connection to right lens */}
              <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-4 bg-foreground"></div>
            </div>
            {/* Bridge Label */}
            <div className="absolute -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Bridge</p>
              <p className="text-sm sm:text-lg font-semibold text-foreground">{formatValue(bridgeWidth)}</p>
            </div>
          </div>

          {/* Right Lens */}
          <div className="relative">
            <div className="w-32 h-24 sm:w-44 sm:h-32 border-4 border-foreground rounded-full relative">
              {/* Lens Height Indicator - Full vertical line with dots */}
              <div className="absolute left-1/2 top-0 bottom-0 flex flex-col items-center" style={{ left: 'calc(5% + 20px)' }}>
                {/* Top dot */}
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground flex-shrink-0 mt-2 sm:mt-3"></div>
                
                {/* Top dashed segment */}
                <div className="flex-1 w-[2px] border-l-2 border-dashed border-border mt-1"></div>
                
                {/* Solid connecting line in the middle */}
                <div className="w-[2px] h-8 sm:h-12 bg-border"></div>
                
                {/* Bottom dashed segment */}
                <div className="flex-1 w-[2px] border-l-2 border-dashed border-border"></div>
                
                {/* Bottom dot */}
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground flex-shrink-0 mb-2 sm:mb-3"></div>
              </div>
              
              {/* Lens Height Label */}
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: 'calc(40% + 35px)' }}>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 whitespace-nowrap">Lens height</p>
                <p className="text-sm sm:text-lg font-semibold text-foreground">{formatValue(lensHeight)}</p>
              </div>

              {/* Bridge connection point (right side) - extends to connect with bridge */}
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-4 bg-foreground"></div>
            </div>
            
            {/* Temple Arm Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-foreground rounded-sm -mr-0.5 sm:-mr-1 -mt-0.5"></div>
              <div className="w-6 sm:w-8 h-1 bg-foreground"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Temple Length View */}
      {templeLength !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border-t border-border pt-8 sm:pt-16"
        >
          <div className="max-w-md mx-auto">
            {/* Temple Label */}
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-lg sm:text-xl font-semibold text-foreground">{formatValue(templeLength)}</p>
            </div>

            {/* Temple Arm Illustration */}
            <div className="relative">
              <svg viewBox="0 0 400 80" className="w-full h-auto">
                {/* Measurement Line */}
                <line x1="50" y1="20" x2="350" y2="20" stroke="hsl(var(--border))" strokeWidth="2" />
                <line x1="50" y1="15" x2="50" y2="25" stroke="hsl(var(--foreground))" strokeWidth="2" />
                <line x1="350" y1="15" x2="350" y2="25" stroke="hsl(var(--foreground))" strokeWidth="2" />
                
                {/* Temple Arm Shape */}
              <path
                  d="M 50 45 L 280 45 Q 320 45 340 55 L 355 65"
                fill="none"
                stroke="hsl(var(--foreground))"
                  strokeWidth="3"
                  strokeLinecap="round"
              />
                
                {/* Hinge */}
                <rect x="45" y="40" width="10" height="10" fill="hsl(var(--foreground))" rx="1" />
            </svg>
          </div>
        </div>
        </motion.div>
      )}
    </div>
  );
}
