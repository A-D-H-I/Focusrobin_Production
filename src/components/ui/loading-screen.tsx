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
        <div className="relative animate-pulse">
          <Image
            src="/logo/Horizontal Primary dark (Color).svg"
            alt="FocusRobin Logo"
            width={180}
            height={54}
            className="h-auto w-auto max-h-12 md:max-h-16"
            priority
          />
        </div>
        <div className="flex gap-2">
          <div 
            className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '1.4s' }}
          ></div>
          <div 
            className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}
          ></div>
          <div 
            className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

