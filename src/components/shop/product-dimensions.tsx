
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
    <div className="absolute top-4 right-4 flex items-center border rounded-md p-1 bg-background z-10">
      <Button
        variant={unit === "mm" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-3"
        onClick={() => setUnit("mm")}
      >
        MM
      </Button>
      <Button
        variant={unit === "in" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-3"
        onClick={() => setUnit("in")}
      >
        IN
      </Button>
    </div>
  );

  return (
    <div className="relative rounded-lg border bg-card/50 p-4 sm:p-6 pt-12 sm:pt-12 text-sm">
      {unitToggle}
      
      {/* Frame Width - Top Section */}
      <div className="mb-6 sm:mb-8 text-center">
        <p className="text-sm sm:text-base text-foreground/80 mb-1">Frame width</p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">{data.frameWidth}{unit}</p>
        <div className="mt-3 flex items-center justify-center">
          <div className="relative w-full max-w-xs">
            <div className="h-0.5 bg-border relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Glasses Frame Diagram */}
      <div className="relative mb-6 sm:mb-8 text-center text-foreground/80">
        <div className="w-[60%] mx-auto">
          <svg viewBox="0 0 250 80" className="w-full h-auto" role="img" aria-label="Glasses frame dimensions diagram">
            {/* Glasses shape */}
            <path d="M 30 25 C 10 25, 10 65, 30 65 L 70 65 C 80 50, 100 50, 110 65 L 140 65 C 150 50, 170 50, 180 65 L 220 65 C 240 65, 240 25, 220 25 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M 110 25 C 105 35, 145 35, 140 25" fill="none" stroke="currentColor" strokeWidth="2"/>

            {/* Lens Width */}
            <text x="70" y="40" textAnchor="middle" className="text-xs sm:text-sm fill-current">{`Lens width ${data.lensWidth}${unit}`}</text>
            <path d="M 35 45 L 105 45" stroke="hsl(var(--border))" strokeDasharray="2,2"/>
            
            {/* Lens Height */}
            <text x="180" y="40" textAnchor="middle" className="text-xs sm:text-sm fill-current">{`Lens height ${data.lensHeight}${unit}`}</text>
            <path d="M 180 28 V 62" stroke="hsl(var(--border))" strokeDasharray="2,2"/>

            {/* Bridge */}
             <text x="125" y="55" textAnchor="middle" className="text-xs sm:text-sm fill-current">{`Bridge ${data.bridge}${unit}`}</text>
          </svg>
        </div>
      </div>

      {/* Temple Arm */}
      <div className="relative text-center text-foreground/80">
        <p className="text-sm sm:text-base text-foreground/80 mb-1">Temple length</p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{data.templeLength}{unit}</p>
        <div className="w-[60%] mx-auto">
          <svg viewBox="0 0 200 40" className="w-full h-auto" role="img" aria-label="Glasses temple arm dimensions diagram">
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
  );
}

