"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

// Cache key format: "text|sourceLang|targetLang"
function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${text}|${sourceLang}|${targetLang}`;
}

interface UseTranslationOptions {
  sourceLanguage?: string;
  enabled?: boolean;
}

/**
 * Hook for translating text based on current language context
 * 
 * @example
 * const { translate, isTranslating } = useTranslation();
 * const translatedText = await translate("Hello, world!");
 */
export function useTranslation(options: UseTranslationOptions = {}) {
  const { language: targetLanguage, isLoading: languageLoading } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const sourceLanguage = options.sourceLanguage || 'en';
  const enabled = options.enabled !== false;

  // Don't translate if target is same as source or language is loading
  const shouldTranslate = useMemo(() => {
    return enabled && 
           !languageLoading && 
           targetLanguage !== sourceLanguage && 
           targetLanguage !== 'en'; // Assuming English is the default source
  }, [enabled, languageLoading, targetLanguage, sourceLanguage]);

  const translate = useCallback(async (text: string): Promise<string> => {
    // Return original if translation not needed
    if (!shouldTranslate || !text || text.trim().length === 0) {
      return text;
    }

    // Check cache first
    const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage);
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          targetLanguage,
          sourceLanguage: sourceLanguage !== 'en' ? sourceLanguage : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn('[Translation] API error:', { status: response.status, error });
        return text; // Return original on error
      }

      const data = await response.json();
      const translated = data.translatedText || text;

      // Cache the translation
      translationCache.set(cacheKey, translated);

      return translated;
    } catch (error) {
      console.error('[Translation] Network error:', error);
      return text; // Return original on error
    } finally {
      setIsTranslating(false);
    }
  }, [shouldTranslate, sourceLanguage, targetLanguage]);

  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (!shouldTranslate || texts.length === 0) {
      return texts;
    }

    // Filter out empty texts
    const nonEmptyTexts = texts.filter(t => t && t.trim().length > 0);
    if (nonEmptyTexts.length === 0) {
      return texts;
    }

    // Check cache for all texts
    const cached: string[] = [];
    const toTranslate: { text: string; index: number }[] = [];

    nonEmptyTexts.forEach((text, index) => {
      const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage);
      if (translationCache.has(cacheKey)) {
        cached[index] = translationCache.get(cacheKey)!;
      } else {
        toTranslate.push({ text, index });
      }
    });

    // If all cached, return immediately
    if (toTranslate.length === 0) {
      return texts.map((text, index) => {
        if (!text || text.trim().length === 0) return text;
        const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage);
        return translationCache.get(cacheKey) || text;
      });
    }

    setIsTranslating(true);
    try {
      const textsToTranslate = toTranslate.map(t => t.text);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage,
          sourceLanguage: sourceLanguage !== 'en' ? sourceLanguage : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn('Batch translation failed:', error);
        return texts; // Return original on error
      }

      const data = await response.json();
      const translations = data.translations || textsToTranslate;

      // Cache translations
      toTranslate.forEach((item, i) => {
        const cacheKey = getCacheKey(item.text, sourceLanguage, targetLanguage);
        translationCache.set(cacheKey, translations[i]);
        cached[item.index] = translations[i];
      });

      // Map back to original array structure
      return texts.map((text, index) => {
        if (!text || text.trim().length === 0) return text;
        return cached[index] || text;
      });
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original on error
    } finally {
      setIsTranslating(false);
    }
  }, [shouldTranslate, sourceLanguage, targetLanguage]);

  // Clear cache when language changes
  useEffect(() => {
    // Optionally clear cache on language change to force fresh translations
    // translationCache.clear();
  }, [targetLanguage]);

  return {
    translate,
    translateBatch,
    isTranslating,
    targetLanguage,
    shouldTranslate,
  };
}

