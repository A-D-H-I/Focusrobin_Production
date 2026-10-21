"use client";

import { useLanguage } from '@/context/LanguageContext';

interface TranslatableTextProps {
  text: string;
  /** @deprecated Source text is always English; kept so existing call sites compile */
  sourceLanguage?: string;
  className?: string;
  /** @deprecated Translations are synchronous now; kept so existing call sites compile */
  fallback?: string;
  skipTranslation?: boolean; // Skip translation (for product names, brand names, etc.)
  children?: never; // Don't allow children, only text prop
}

/**
 * Renders `text` in the active language using the i18n catalogs in src/i18n/messages.
 * Strings missing from the catalog render in English. After adding new strings, run
 * `npx tsx scripts/i18n-extract.ts` and add the translations to lt.json / ru.json.
 *
 * @example
 * <TranslatableText text="Hello, world!" />
 * <TranslatableText text="Product Name" skipTranslation={true} /> // For product/brand names
 */
export default function TranslatableText({
  text,
  className = '',
  skipTranslation = false
}: TranslatableTextProps) {
  const { t } = useLanguage();

  return <span className={className}>{skipTranslation ? text : t(text)}</span>;
}
