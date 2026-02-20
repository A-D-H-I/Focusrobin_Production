"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

// Track which pages have been translated for which language
const translatedPages = new Map<string, Set<string>>();

/**
 * Provider that handles page-level translation
 * Only translates content when a page is visited, not on language change
 */
export function PageTranslationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage();

  useEffect(() => {
    // Create a unique key for this page + language combination
    const pageKey = `${pathname}:${language}`;
    
    // Get or create the set of translated languages for this page
    if (!translatedPages.has(pathname)) {
      translatedPages.set(pathname, new Set());
    }
    
    const translatedLanguages = translatedPages.get(pathname)!;
    
    // If this page hasn't been translated for this language yet, mark it
    // The actual translation will happen via TranslatableText components
    if (!translatedLanguages.has(language)) {
      // Small delay to let components mount
      const timeoutId = setTimeout(() => {
        translatedLanguages.add(language);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, language]);

  // Clear translation cache for other languages when language changes
  useEffect(() => {
    const translatedLanguages = translatedPages.get(pathname);
    if (translatedLanguages) {
      // Keep only the current language in the cache
      const currentPageKey = `${pathname}:${language}`;
      translatedLanguages.clear();
      translatedLanguages.add(language);
    }
  }, [pathname, language]);

  return <>{children}</>;
}

/**
 * Clear translation cache for a specific page
 * Useful when page content changes dynamically
 */
export function clearPageTranslationCache(pathname: string) {
  translatedPages.delete(pathname);
}
















