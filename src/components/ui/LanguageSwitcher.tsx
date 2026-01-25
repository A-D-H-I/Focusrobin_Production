"use client";
import { useRef } from 'react';
import { supportedLanguages } from '@/lib/languageData';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const handleOpenChange = (open: boolean) => {
    // Blur the trigger button when dropdown closes to remove focus highlight
    if (!open && triggerRef.current) {
      // Use setTimeout to ensure blur happens after React state updates
      setTimeout(() => {
        if (triggerRef.current) {
          triggerRef.current.blur();
          // Also remove focus programmatically
          if (document.activeElement === triggerRef.current) {
            (document.activeElement as HTMLElement).blur();
          }
        }
      }, 10);
    }
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent focus on pointer down to avoid focus ring
    if (e.pointerType === 'mouse') {
      e.currentTarget.setAttribute('data-no-focus', 'true');
    }
  };
  
  return (
    <Select value={language} onValueChange={setLanguage} onOpenChange={handleOpenChange}>
      <SelectTrigger 
        ref={triggerRef}
        onPointerDown={handlePointerDown}
        className={cn(
          "h-8 w-[80px] sm:w-[100px] bg-transparent border rounded-md text-xs cursor-pointer [&>span]:text-current [&>svg]:text-current [&>svg]:opacity-70",
          "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
          "[&[data-no-focus]]:focus:ring-0 [&[data-no-focus]]:focus:outline-none",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent 
        position="popper" 
        side="bottom" 
        sideOffset={4} 
        align="end"
        className="max-h-[300px] overflow-y-auto z-[110] min-w-[var(--radix-select-trigger-width)]"
      >
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.nativeName} {lang.name !== lang.nativeName && `(${lang.name})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

