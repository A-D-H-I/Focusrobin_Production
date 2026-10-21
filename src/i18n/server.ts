import 'server-only';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import {
  defaultLocale,
  isLocale,
  isLocalizablePath,
  locales,
  localizedUrl,
  LOCALE_HEADER,
  PATHNAME_HEADER,
  type Locale,
} from './config';
import { getMessages, translate } from './messages';

/** Locale of the current request, as resolved by middleware */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : defaultLocale;
}

/** Unprefixed pathname of the current request (e.g. "/shop" for /lt/shop) */
export async function getRequestPathname(): Promise<string> {
  return (await headers()).get(PATHNAME_HEADER) || '/';
}

/** Server-side equivalent of <TranslatableText> */
export async function getTranslator() {
  const messages = getMessages(await getLocale());
  return (text: string) => translate(messages, text);
}

/** Canonical URL for this locale plus hreflang links to every other locale */
export function buildAlternates(pathname: string, locale: Locale): Metadata['alternates'] {
  // /products/[slug] is a legacy duplicate of /shop/[slug]
  const canonicalPath = pathname.startsWith('/products/') ? pathname.replace('/products/', '/shop/') : pathname;

  if (!isLocalizablePath(canonicalPath)) {
    return { canonical: localizedUrl(canonicalPath, defaultLocale) };
  }

  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizedUrl(canonicalPath, l);
  languages['x-default'] = localizedUrl(canonicalPath, defaultLocale);

  return { canonical: localizedUrl(canonicalPath, locale), languages };
}
