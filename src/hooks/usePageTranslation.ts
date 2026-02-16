"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

// Track which pages have been translated
const translatedPages = new Set<string>();

/**
 * Hook to translate page content on page load
 * Only translates once per page visit to avoid high API costs
 * 
 * @example
 * usePageTranslation(); // Call at the top of your page component
 */
export function usePageTranslation() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { shouldTranslate } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Create a unique key for this page + language combination
    const pageKey = `${pathname}:${language}`;
    
    // If already translated for this language, skip
    if (translatedPages.has(pageKey) || !shouldTranslate) {
      return;
    }

    // Mark as translating
    setIsTranslating(true);

    // Find all TranslatableText components on the page and trigger translation
    // This happens automatically via the TranslatableText component's useEffect
    // We just mark the page as being translated
    
    // Small delay to let components mount
    const timeoutId = setTimeout(() => {
      translatedPages.add(pageKey);
      setIsTranslating(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, language, shouldTranslate]);

  // Clear translation cache when language changes (but keep per-page cache)
  useEffect(() => {
    // Remove all entries for other languages
    const currentPageKey = `${pathname}:${language}`;
    const keysToRemove: string[] = [];
    
    translatedPages.forEach((key) => {
      if (key.startsWith(`${pathname}:`) && key !== currentPageKey) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach((key) => translatedPages.delete(key));
  }, [pathname, language]);

  return { isTranslating };
}

/**
 * Clear translation cache for a specific page
 * Useful when page content changes
 */
export function clearPageTranslationCache(pathname: string) {
  const keysToRemove: string[] = [];
  translatedPages.forEach((key) => {
    if (key.startsWith(`${pathname}:`)) {
      keysToRemove.push(key);
    }
  });
  keysToRemove.forEach((key) => translatedPages.delete(key));
}















