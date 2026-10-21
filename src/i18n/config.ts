/**
 * i18n configuration shared by middleware (Edge), server components and client code.
 * Keep this file free of Node/React imports.
 *
 * URL scheme: English is served without a prefix (/shop), other locales are
 * prefixed (/lt/shop, /ru/shop). Middleware rewrites prefixed URLs to the
 * unprefixed route and passes the locale to the app via the x-locale header.
 */

export const locales = ['en', 'lt', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_HEADER = 'x-locale';
export const PATHNAME_HEADER = 'x-pathname';

export const SITE_URL = 'https://focusrobin.lt';

/** Open Graph locale codes for each site locale */
export const ogLocales: Record<Locale, string> = {
  en: 'en_IE',
  lt: 'lt_LT',
  ru: 'ru_RU',
};

/** Routes that are never localized (no /lt or /ru variants) */
const UNLOCALIZED_PREFIXES = ['/api', '/admin', '/_next'];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function isLocalizablePath(pathname: string): boolean {
  if (UNLOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  // Files such as /llms.txt or /og.png
  const lastSegment = pathname.split('/').pop() || '';
  return !lastSegment.includes('.');
}

/** Split "/lt/shop/men" into { locale: 'lt', pathname: '/shop/men' } */
export function splitLocale(pathname: string): { locale: Locale | null; pathname: string } {
  const segment = pathname.split('/')[1];
  if (isLocale(segment)) {
    const rest = pathname.slice(segment.length + 1);
    return { locale: segment, pathname: rest || '/' };
  }
  return { locale: null, pathname };
}

/** "/shop" + "lt" -> "/lt/shop"; English stays unprefixed */
export function localizePath(pathname: string, locale: Locale): string {
  const { pathname: bare } = splitLocale(pathname);
  if (locale === defaultLocale || !isLocalizablePath(bare)) return bare;
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

/** Absolute URL of a page in a given locale */
export function localizedUrl(pathname: string, locale: Locale): string {
  const path = localizePath(pathname, locale);
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

/** Pick the best supported locale from an Accept-Language header */
export function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => isLocale(r.lang))?.lang as Locale | undefined ?? null;
}
