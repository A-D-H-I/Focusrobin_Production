"use client";
import { supportedLanguages } from '@/lib/languageData';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // This is a placeholder. We will hook this into next-intl later.
  return (
    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
      <SelectTrigger className={cn("h-8 w-[100px] bg-transparent border rounded-md text-xs cursor-pointer [&>span]:text-current [&>svg]:text-current [&>svg]:opacity-70", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[200px] overflow-y-auto">
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

