"use client";

import { useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface UseTranslationOptions {
  /** @deprecated Source text is always English */
  sourceLanguage?: string;
  enabled?: boolean;
}

/**
 * Hook for translating text based on current language context.
 * Translations come from the static catalogs in src/i18n/messages; the async
 * signatures are kept for compatibility with existing callers.
 *
 * @example
 * const { t } = useTranslation();
 * t("Hello, world!");
 */
export function useTranslation(options: UseTranslationOptions = {}) {
  const { language: targetLanguage, t } = useLanguage();
  const enabled = options.enabled !== false;
  const shouldTranslate = enabled && targetLanguage !== 'en';

  const translate = useCallback(
    async (text: string): Promise<string> => (shouldTranslate ? t(text) : text),
    [shouldTranslate, t]
  );

  const translateBatch = useCallback(
    async (texts: string[]): Promise<string[]> => (shouldTranslate ? texts.map(t) : texts),
    [shouldTranslate, t]
  );

  return {
    t: shouldTranslate ? t : (text: string) => text,
    translate,
    translateBatch,
    isTranslating: false,
    targetLanguage,
    shouldTranslate,
  };
}
