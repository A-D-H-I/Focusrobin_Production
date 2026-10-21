import type { Locale } from './config';
import lt from './messages/lt.json';
import ru from './messages/ru.json';

/**
 * Translation catalogs keyed by the English source text.
 * en.json is the generated source catalog (scripts/i18n-extract.ts); English needs
 * no lookup, so it maps to an empty catalog and every string falls back to itself.
 */
export type Messages = Record<string, string>;

const catalogs: Record<Locale, Messages> = {
  en: {},
  lt,
  ru,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? {};
}

export function translate(messages: Messages, text: string): string {
  return messages[text] || text;
}
