"use client";

import { createContext, useContext, ReactNode, useCallback } from 'react';
import { supportedLanguages, type Language } from '@/lib/languageData';
import { isLocale, localizePath, LOCALE_COOKIE, type Locale } from '@/i18n/config';
import { translate, type Messages } from '@/i18n/messages';

interface LanguageContextType {
  language: Locale;
  setLanguage: (language: string) => void;
  currentLanguage: Language | undefined;
  /** Kept for backwards compatibility; the language is known at render time now */
  isLoading: boolean;
  /** Translate an English source string using the active catalog */
  t: (text: string) => string;
  /** Prefix an internal path with the active locale ("/shop" -> "/lt/shop") */
  localizeHref: (href: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const ONE_YEAR = 60 * 60 * 24 * 365;

interface LanguageProviderProps {
  children: ReactNode;
  /** Locale resolved by middleware from the URL (/lt, /ru or none) */
  initialLanguage: Locale;
  messages: Messages;
}

export const LanguageProvider = ({ children, initialLanguage, messages }: LanguageProviderProps) => {
  const language = initialLanguage;

  const t = useCallback((text: string) => translate(messages, text), [messages]);

  const localizeHref = useCallback((href: string) => {
    if (!href.startsWith('/') || href.startsWith('//')) return href;
    const [path, query = ''] = href.split(/(?=[?#])/);
    return localizePath(path, language) + query;
  }, [language]);

  // Switching language moves to the localized URL; the server renders the new language
  const setLanguage = useCallback((newLanguage: string) => {
    if (!isLocale(newLanguage) || newLanguage === language) return;
    document.cookie = `${LOCALE_COOKIE}=${newLanguage}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    const { pathname, search, hash } = window.location;
    window.location.assign(localizePath(pathname, newLanguage) + search + hash);
  }, [language]);

  const currentLanguage = supportedLanguages.find(lang => lang.code === language);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      currentLanguage,
      isLoading: false,
      t,
      localizeHref,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
