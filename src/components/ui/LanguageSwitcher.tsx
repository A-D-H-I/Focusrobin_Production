"use client";
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
  
  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className={cn("h-8 w-[100px] bg-transparent border rounded-md text-xs cursor-pointer [&>span]:text-current [&>svg]:text-current [&>svg]:opacity-70", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[300px] overflow-y-auto">
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.nativeName} {lang.name !== lang.nativeName && `(${lang.name})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

