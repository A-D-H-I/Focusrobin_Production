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
  const lensSpacing = 60; // Increased gap between lenses for bridge measurement
  
  // SVG coordinates - centered glasses in viewBox
  const centerY = 200; // Moved down to accommodate extended lenses
  const topPadding = 60; // Space for frame width measurement
  const lensExtension = 30; // Extra space to extend lenses downward
  
  // Calculate the total width needed for the diagram
  const totalContentWidth = lensWidthPx * 2 + bridgeWidthPx + lensSpacing + 30; // 30 for temple/hinge on each side
  const viewBoxWidth = Math.max(frameWidthPx + 200, totalContentWidth + 100); // Ensure viewBox is wide enough
  const centerX = viewBoxWidth / 2; // True center of the viewBox
  
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
        viewBox={`0 0 ${viewBoxWidth} 450`}
        className="w-full h-auto min-h-[450px]"
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
            stroke="#1C3142"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
          {/* Left screw head */}
          <circle cx={frameLeftX} cy={topPadding} r="5" fill="#1C3142" />
          <line
            x1={frameLeftX - 3}
            y1={topPadding}
            x2={frameLeftX + 3}
            y2={topPadding}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
          />
          {/* Right screw head */}
          <circle cx={frameRightX} cy={topPadding} r="5" fill="#1C3142" />
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
            y={topPadding - 30}
            textAnchor="middle"
            className="font-headline text-sm"
            fill="#1C3142"
            opacity="0.7"
          >
            Frame width
          </text>
          <text
            x={centerX}
            y={topPadding - 12}
            textAnchor="middle"
            className="font-sans text-lg font-bold"
            fill="#1C3142"
          >
            {formatValue(frameWidth)}
          </text>
        </g>

        {/* Glasses Frame Outline - Wayfarer style */}
        <g>
          {/* Left lens frame - rounded rectangle (extended downward) */}
          <path
            d={`M ${leftLensX} ${lensY + 8}
                L ${leftLensX} ${lensY + lensHeightPx + lensExtension - 8}
                Q ${leftLensX} ${lensY + lensHeightPx + lensExtension}, ${leftLensX + 8} ${lensY + lensHeightPx + lensExtension}
                L ${leftLensX + lensWidthPx - 8} ${lensY + lensHeightPx + lensExtension}
                Q ${leftLensX + lensWidthPx} ${lensY + lensHeightPx + lensExtension}, ${leftLensX + lensWidthPx} ${lensY + lensHeightPx + lensExtension - 8}
                L ${leftLensX + lensWidthPx} ${lensY + 8}
                Q ${leftLensX + lensWidthPx} ${lensY}, ${leftLensX + lensWidthPx - 8} ${lensY}
                L ${leftLensX + 8} ${lensY}
                Q ${leftLensX} ${lensY}, ${leftLensX} ${lensY + 8}
                Z`}
            fill="none"
            stroke="#1C3142"
            strokeWidth="2.5"
          />
          {/* Left temple hinge */}
          <rect
            x={frameLeftX}
            y={centerY - 4}
            width="8"
            height="8"
            fill="none"
            stroke="#1C3142"
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

          {/* Bridge - Visual connection between lenses */}
          <line
            x1={leftLensX + lensWidthPx}
            y1={centerY}
            x2={rightLensX}
            y2={centerY}
            stroke="#1C3142"
            strokeWidth="2.5"
          />

          {/* Right lens frame - rounded rectangle (extended downward) */}
          <path
            d={`M ${rightLensX} ${lensY + 8}
                L ${rightLensX} ${lensY + lensHeightPx + lensExtension - 8}
                Q ${rightLensX} ${lensY + lensHeightPx + lensExtension}, ${rightLensX + 8} ${lensY + lensHeightPx + lensExtension}
                L ${rightLensX + lensWidthPx - 8} ${lensY + lensHeightPx + lensExtension}
                Q ${rightLensX + lensWidthPx} ${lensY + lensHeightPx + lensExtension}, ${rightLensX + lensWidthPx} ${lensY + lensHeightPx + lensExtension - 8}
                L ${rightLensX + lensWidthPx} ${lensY + 8}
                Q ${rightLensX + lensWidthPx} ${lensY}, ${rightLensX + lensWidthPx - 8} ${lensY}
                L ${rightLensX + 8} ${lensY}
                Q ${rightLensX} ${lensY}, ${rightLensX} ${lensY + 8}
                Z`}
            fill="none"
            stroke="#1C3142"
            strokeWidth="2.5"
          />
          {/* Right temple hinge */}
          <rect
            x={frameRightX - 8}
            y={centerY - 4}
            width="8"
            height="8"
            fill="none"
            stroke="#1C3142"
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
            stroke="#1C3142"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
          <text
            x={leftLensX + lensWidthPx / 2}
            y={centerY - 20}
            textAnchor="middle"
            className="font-headline text-sm"
            fill="#1C3142"
            opacity="0.7"
          >
            Lens width
          </text>
          <text
            x={leftLensX + lensWidthPx / 2}
            y={centerY + 15}
            textAnchor="middle"
            className="font-sans text-base font-bold"
            fill="#1C3142"
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
            y2={lensY + lensHeightPx + lensExtension - 8}
            stroke="#1C3142"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
          <text
            x={rightLensX + lensWidthPx / 2 + 40}
            y={centerY}
            textAnchor="middle"
            className="font-headline text-sm"
            fill="#1C3142"
            opacity="0.7"
            transform={`rotate(90 ${rightLensX + lensWidthPx / 2 + 40} ${centerY})`}
          >
            Lens height
          </text>
          <text
            x={rightLensX + lensWidthPx / 2 + 20}
            y={centerY}
            textAnchor="middle"
            className="font-sans text-base font-bold"
            fill="#1C3142"
            transform={`rotate(90 ${rightLensX + lensWidthPx / 2 + 20} ${centerY})`}
          >
            {formatValue(lensHeight)}
          </text>
        </g>

        {/* Bridge Measurement - Positioned between lenses, perfectly centered */}
        <g>
          {/* Bridge measurement line - touches lens edges but doesn't overlap */}
          <line
            x1={leftLensX + lensWidthPx}
            y1={centerY + 20}
            x2={rightLensX}
            y2={centerY + 20}
            stroke="#1C3142"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
          {/* Bridge label - with proper spacing */}
          <text
            x={centerX}
            y={centerY + 38}
            textAnchor="middle"
            className="font-headline text-sm"
            fill="#1C3142"
            opacity="0.7"
          >
            Bridge
          </text>
          {/* Bridge value - with proper spacing */}
          <text
            x={centerX}
            y={centerY + 55}
            textAnchor="middle"
            className="font-sans text-base font-bold"
            fill="#1C3142"
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

