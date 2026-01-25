
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const dimensions = {
  mm: {
    frameWidth: 128,
    lensWidth: 52,
    bridge: 18,
    lensHeight: 39,
    templeLength: 145,
  },
  in: {
    frameWidth: 5.04,
    lensWidth: 2.05,
    bridge: 0.71,
    lensHeight: 1.54,
    templeLength: 5.71,
  },
};

export default function ProductDimensions() {
  const [unit, setUnit] = useState<"mm" | "in">("mm");
  const data = dimensions[unit];

  const unitToggle = (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center border rounded-md p-0.5 sm:p-1 bg-background z-10">
      <Button
        variant={unit === "mm" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 sm:h-7 px-2 sm:px-3 text-xs sm:text-sm"
        onClick={() => setUnit("mm")}
      >
        MM
      </Button>
      <Button
        variant={unit === "in" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 sm:h-7 px-2 sm:px-3 text-xs sm:text-sm"
        onClick={() => setUnit("in")}
      >
        IN
      </Button>
    </div>
  );

  return (
    <div className="relative rounded-lg border bg-card/50 p-4 sm:p-6 pt-12 sm:pt-12 text-sm overflow-x-hidden">
      {unitToggle}
      
      {/* Frame Width - Top Section */}
      <div className="mb-6 sm:mb-8 text-center">
        <p className="text-sm sm:text-base text-foreground/80 mb-1">Frame width</p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground break-words">{data.frameWidth}{unit}</p>
        <div className="mt-3 flex items-center justify-center">
          <div className="relative w-full max-w-xs overflow-hidden">
            <div className="h-0.5 bg-border relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Glasses Frame Diagram */}
      <div className="relative mb-6 sm:mb-8 text-center text-foreground/80 overflow-x-hidden">
        <div className="w-full sm:w-[80%] md:w-[60%] mx-auto overflow-x-auto">
          <div className="min-w-[320px] sm:min-w-0">
            <svg viewBox="0 0 250 100" className="w-full h-auto max-w-full" role="img" aria-label="Glasses frame dimensions diagram" preserveAspectRatio="xMidYMid meet">
              {/* Glasses shape - moved down to make room for text */}
              <path d="M 30 35 C 10 35, 10 75, 30 75 L 70 75 C 80 60, 100 60, 110 75 L 140 75 C 150 60, 170 60, 180 75 L 220 75 C 240 75, 240 35, 220 35 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M 110 35 C 105 45, 145 45, 140 35" fill="none" stroke="currentColor" strokeWidth="2"/>

              {/* Lens Width - positioned above lens */}
              <text x="70" y="25" textAnchor="middle" fontSize="11" fontWeight="500" className="fill-current">{`Lens width ${data.lensWidth}${unit}`}</text>
              <path d="M 35 55 L 105 55" stroke="hsl(var(--border))" strokeDasharray="2,2" strokeWidth="1.5"/>
              
              {/* Lens Height - positioned above lens */}
              <text x="180" y="25" textAnchor="middle" fontSize="11" fontWeight="500" className="fill-current">{`Lens height ${data.lensHeight}${unit}`}</text>
              <path d="M 180 38 V 72" stroke="hsl(var(--border))" strokeDasharray="2,2" strokeWidth="1.5"/>

              {/* Bridge - positioned below bridge */}
              <text x="125" y="90" textAnchor="middle" fontSize="11" fontWeight="500" className="fill-current">{`Bridge ${data.bridge}${unit}`}</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Temple Arm */}
      <div className="relative text-center text-foreground/80 overflow-x-hidden">
        <p className="text-sm sm:text-base text-foreground/80 mb-1">Temple length</p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words">{data.templeLength}{unit}</p>
        <div className="w-full sm:w-[80%] md:w-[60%] mx-auto overflow-x-auto">
          <div className="min-w-[240px] sm:min-w-0">
            <svg viewBox="0 0 200 40" className="w-full h-auto max-w-full" role="img" aria-label="Glasses temple arm dimensions diagram" preserveAspectRatio="xMidYMid meet">
              {/* Temple length line */}
              <path d="M 0 5 L 200 5" stroke="hsl(var(--border))" strokeDasharray="2,2"/>
              <path d="M 0 2 V 8" stroke="hsl(var(--border))"/>
              <path d="M 200 2 V 8" stroke="hsl(var(--border))"/>

              {/* Temple shape */}
              <path d="M 0 20 L 160 20 L 180 35 C 190 40, 195 35, 195 30" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M 0 15 V 25" stroke="currentColor" strokeWidth="2"/>
              <rect x="158" y="18" width="4" height="4" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

