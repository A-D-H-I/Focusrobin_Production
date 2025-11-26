"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ className, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background",
        fullScreen ? "fixed inset-0 z-50" : "min-h-screen",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative inline-block">
          <Image
            src="/logo/Horizontal Primary dark (Color).svg"
            alt="FocusRobin Logo"
            width={180}
            height={54}
            className="h-auto w-auto max-h-12 md:max-h-16 relative z-10"
            priority
          />
          <div className="logo-gradient-overlay"></div>
        </div>
      </div>
    </div>
  );
}

