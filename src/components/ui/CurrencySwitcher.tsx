"use client";
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

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className={cn("h-8 w-[75px] sm:w-[90px] bg-transparent border rounded-md text-xs cursor-pointer [&>span]:text-current [&>svg]:text-current [&>svg]:opacity-70", className)}>
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

