"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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

  // Get display values
  const frameWidth = dimensions.frameWidth;
  const lensWidth = dimensions.lensWidth;
  const lensHeight = dimensions.lensHeight;
  const bridgeWidth = dimensions.bridgeWidth;
  const templeLength = dimensions.templeLength;

  // Calculate frame width in pixels based on actual measurement
  // Use a scale factor: if frameWidth is 125mm, make it visually 300px wide
  const scaleFactor = 2.4; // Adjust this to make the diagram bigger
  const frameWidthPx = (frameWidth || 125) * scaleFactor;
  
  // Calculate lens dimensions proportionally
  const lensWidthPx = (lensWidth || 54) * scaleFactor;
  const lensHeightPx = (lensHeight || 45) * scaleFactor;
  const bridgeWidthPx = (bridgeWidth || 16) * scaleFactor;
  const lensSpacing = 5; // Small gap between lens and bridge
  
  // SVG coordinates - centered glasses in viewBox
  const centerX = frameWidthPx / 2 + 50; // Center with padding
  const centerY = 180;
  const topPadding = 60; // Space for frame width measurement
  
  // Calculate positions
  const leftLensX = centerX - lensWidthPx - bridgeWidthPx / 2 - lensSpacing / 2;
  const rightLensX = centerX + bridgeWidthPx / 2 + lensSpacing / 2;
  const lensY = centerY - lensHeightPx / 2;
  
  // Calculate frame width line endpoints (should match actual frame width)
  const frameLeftX = leftLensX - 15; // Left temple/hinge position
  const frameRightX = rightLensX + lensWidthPx + 15; // Right temple/hinge position
  const actualFrameWidthPx = frameRightX - frameLeftX;

  return (
    <div className="relative w-full bg-card/50 rounded-lg border p-6 sm:p-8">
      {/* MM/IN Toggle */}
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

      {/* SVG Diagram */}
      <svg
        viewBox={`0 0 ${frameWidthPx + 100} 400`}
        className="w-full h-auto min-h-[400px]"
        role="img"
        aria-label="Glasses frame dimensions diagram"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Frame Width Measurement - Top */}
        <g>
          {/* Dotted line - spans actual frame width */}
          <line
            x1={frameLeftX}
            y1={topPadding}
            x2={frameRightX}
            y2={topPadding}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
          {/* Left screw head */}
          <circle cx={frameLeftX} cy={topPadding} r="5" fill="hsl(var(--foreground))" />
          <line
            x1={frameLeftX - 3}
            y1={topPadding}
            x2={frameLeftX + 3}
            y2={topPadding}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          />
          {/* Right screw head */}
          <circle cx={frameRightX} cy={topPadding} r="5" fill="hsl(var(--foreground))" />
          <line
            x1={frameRightX - 3}
            y1={topPadding}
            x2={frameRightX + 3}
            y2={topPadding}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          />
          {/* Label */}
          <text
            x={centerX}
            y={topPadding - 20}
            textAnchor="middle"
            className="font-headline text-sm fill-foreground/70"
          >
            Frame width
          </text>
          <text
            x={centerX}
            y={topPadding - 5}
            textAnchor="middle"
            className="font-headline text-lg font-bold fill-foreground"
          >
            {formatValue(frameWidth)}
          </text>
        </g>

        {/* Glasses Frame Outline - Wayfarer style */}
        <g>
          {/* Left lens frame - rounded rectangle */}
          <path
            d={`M ${leftLensX} ${lensY + 8}
                L ${leftLensX} ${lensY + lensHeightPx - 8}
                Q ${leftLensX} ${lensY + lensHeightPx}, ${leftLensX + 8} ${lensY + lensHeightPx}
                L ${leftLensX + lensWidthPx - 8} ${lensY + lensHeightPx}
                Q ${leftLensX + lensWidthPx} ${lensY + lensHeightPx}, ${leftLensX + lensWidthPx} ${lensY + lensHeightPx - 8}
                L ${leftLensX + lensWidthPx} ${lensY + 8}
                Q ${leftLensX + lensWidthPx} ${lensY}, ${leftLensX + lensWidthPx - 8} ${lensY}
                L ${leftLensX + 8} ${lensY}
                Q ${leftLensX} ${lensY}, ${leftLensX} ${lensY + 8}
                Z`}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
          />
          {/* Left temple hinge */}
          <rect
            x={frameLeftX}
            y={centerY - 4}
            width="8"
            height="8"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
          />
          <line
            x1={frameLeftX}
            y1={centerY}
            x2={frameLeftX + 8}
            y2={centerY}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          />

          {/* Bridge */}
          <line
            x1={leftLensX + lensWidthPx}
            y1={centerY}
            x2={rightLensX}
            y2={centerY}
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
          />

          {/* Right lens frame - rounded rectangle */}
          <path
            d={`M ${rightLensX} ${lensY + 8}
                L ${rightLensX} ${lensY + lensHeightPx - 8}
                Q ${rightLensX} ${lensY + lensHeightPx}, ${rightLensX + 8} ${lensY + lensHeightPx}
                L ${rightLensX + lensWidthPx - 8} ${lensY + lensHeightPx}
                Q ${rightLensX + lensWidthPx} ${lensY + lensHeightPx}, ${rightLensX + lensWidthPx} ${lensY + lensHeightPx - 8}
                L ${rightLensX + lensWidthPx} ${lensY + 8}
                Q ${rightLensX + lensWidthPx} ${lensY}, ${rightLensX + lensWidthPx - 8} ${lensY}
                L ${rightLensX + 8} ${lensY}
                Q ${rightLensX} ${lensY}, ${rightLensX} ${lensY + 8}
                Z`}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
          />
          {/* Right temple hinge */}
          <rect
            x={frameRightX - 8}
            y={centerY - 4}
            width="8"
            height="8"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2.5"
          />
          <line
            x1={frameRightX - 8}
            y1={centerY}
            x2={frameRightX}
            y2={centerY}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          />
        </g>

        {/* Lens Width Measurement - Inside left lens */}
        <g>
          <line
            x1={leftLensX + 8}
            y1={centerY}
            x2={leftLensX + lensWidthPx - 8}
            y2={centerY}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeDasharray="3,3"
            opacity="0.7"
          />
          <text
            x={leftLensX + lensWidthPx / 2}
            y={centerY - 12}
            textAnchor="middle"
            className="font-headline text-sm fill-foreground/70"
          >
            Lens width
          </text>
          <text
            x={leftLensX + lensWidthPx / 2}
            y={centerY + 8}
            textAnchor="middle"
            className="font-headline text-base font-bold fill-foreground"
          >
            {formatValue(lensWidth)}
          </text>
        </g>

        {/* Lens Height Measurement - Inside right lens */}
        <g>
          <line
            x1={rightLensX + lensWidthPx / 2}
            y1={lensY + 8}
            x2={rightLensX + lensWidthPx / 2}
            y2={lensY + lensHeightPx - 8}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeDasharray="3,3"
            opacity="0.7"
          />
          <text
            x={rightLensX + lensWidthPx / 2 + 30}
            y={centerY}
            textAnchor="middle"
            className="font-headline text-sm fill-foreground/70"
            transform={`rotate(90 ${rightLensX + lensWidthPx / 2 + 30} ${centerY})`}
          >
            Lens height
          </text>
          <text
            x={rightLensX + lensWidthPx / 2 + 15}
            y={centerY}
            textAnchor="middle"
            className="font-headline text-base font-bold fill-foreground"
            transform={`rotate(90 ${rightLensX + lensWidthPx / 2 + 15} ${centerY})`}
          >
            {formatValue(lensHeight)}
          </text>
        </g>

        {/* Bridge Measurement */}
        <g>
          <line
            x1={leftLensX + lensWidthPx}
            y1={centerY + 30}
            x2={rightLensX}
            y2={centerY + 30}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeDasharray="3,3"
            opacity="0.7"
          />
          <text
            x={centerX}
            y={centerY + 50}
            textAnchor="middle"
            className="font-headline text-sm fill-foreground/70"
          >
            Bridge
          </text>
          <text
            x={centerX}
            y={centerY + 65}
            textAnchor="middle"
            className="font-headline text-base font-bold fill-foreground"
          >
            {formatValue(bridgeWidth)}
          </text>
        </g>
      </svg>

      {/* Temple Length - Separate section below with dividing line */}
      {templeLength !== undefined && (
        <div className="-mt-20 pt-0 border-t">
          <div className="text-center">
            <p className="text-sm text-foreground/70 mb-2 font-headline">Temple length</p>
            <p className="text-2xl font-bold font-headline text-foreground mb-4">
              {formatValue(templeLength)}
            </p>
            <svg
              viewBox="0 0 200 40"
              className="w-full max-w-md mx-auto"
              role="img"
              aria-label="Temple length diagram"
            >
              {/* Temple length line */}
              <line
                x1="10"
                y1="20"
                x2="190"
                y2="20"
                stroke="hsl(var(--foreground))"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                opacity="0.6"
              />
              {/* End markers */}
              <line x1="10" y1="15" x2="10" y2="25" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <line x1="190" y1="15" x2="190" y2="25" stroke="hsl(var(--foreground))" strokeWidth="2" />
              {/* Temple shape */}
              <path
                d="M 10 20 L 150 20 L 170 30 Q 180 35, 185 30"
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      )}

    </div>
  );
}

