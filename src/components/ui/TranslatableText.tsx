"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

interface TranslatableTextProps {
  text: string;
  sourceLanguage?: string;
  className?: string;
  fallback?: string;
  skipTranslation?: boolean; // Skip translation (for product names, brand names, etc.)
  children?: never; // Don't allow children, only text prop
}

/**
 * Component that automatically translates text when language changes
 * Only translates when the page is loaded, not on language change
 * 
 * @example
 * <TranslatableText text="Hello, world!" />
 * <TranslatableText text="Product Name" skipTranslation={true} /> // For product/brand names
 */
export default function TranslatableText({ 
  text, 
  sourceLanguage = 'en',
  className = '',
  fallback,
  skipTranslation = false
}: TranslatableTextProps) {
  const { language: targetLanguage } = useLanguage();
  const { translate, shouldTranslate } = useTranslation({ sourceLanguage });
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);

  // Skip translation if flag is set
  if (skipTranslation) {
    return <span className={className}>{text}</span>;
  }

  // Translate on component mount or when language changes (page load scenario)
  useEffect(() => {
    // If translation not needed, use original text
    if (!shouldTranslate || !text || text.trim().length === 0) {
      setTranslatedText(text);
      setIsLoading(false);
      setHasTranslated(false);
      return;
    }

    // Translate when component mounts or language changes
    // This will trigger on page load with the current language
    let cancelled = false;
    setIsLoading(true);

    // Small delay to batch translations and let page fully load
    const timeoutId = setTimeout(() => {
      translate(text)
        .then((translated) => {
          if (!cancelled) {
            setTranslatedText(translated);
            setIsLoading(false);
            setHasTranslated(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTranslatedText(fallback || text);
            setIsLoading(false);
          }
        });
    }, 200); // Delay to batch requests

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [text, targetLanguage, shouldTranslate, translate, fallback]); // Include targetLanguage to trigger on language change

  return (
    <span className={className}>
      {isLoading ? (fallback || text) : translatedText}
    </span>
  );
}
