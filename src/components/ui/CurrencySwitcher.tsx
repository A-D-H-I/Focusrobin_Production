"use client";
import { useRef } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { supportedCurrencies } from '@/lib/currencyData';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CurrencySwitcherProps {
  className?: string;
}

export default function CurrencySwitcher({ className }: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();
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
    <Select value={currency} onValueChange={setCurrency} onOpenChange={handleOpenChange}>
      <SelectTrigger 
        ref={triggerRef}
        onPointerDown={handlePointerDown}
        className={cn(
          "h-8 w-[75px] sm:w-[90px] bg-transparent border rounded-md text-xs cursor-pointer [&>span]:text-current [&>svg]:text-current [&>svg]:opacity-70",
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
        className="max-h-[200px] overflow-y-auto z-[110] min-w-[var(--radix-select-trigger-width)]"
      >
        {supportedCurrencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            {curr.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

