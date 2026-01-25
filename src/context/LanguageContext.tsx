"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supportedLanguages, supportedLanguageCodes, type Language } from '@/lib/languageData';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  currentLanguage: Language | undefined;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'focusrobin-language';

// Default language
const DEFAULT_LANGUAGE = 'en';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && supportedLanguageCodes.includes(saved)) {
        setLanguageState(saved);
      } else {
        // Try to detect language from browser
        const browserLang = navigator.language.split('-')[0];
        if (supportedLanguageCodes.includes(browserLang)) {
          setLanguageState(browserLang);
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Save language preference to localStorage
  const setLanguage = useCallback((newLanguage: string) => {
    if (supportedLanguageCodes.includes(newLanguage)) {
      setLanguageState(newLanguage);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
        // Dispatch custom event to notify components of language change
        window.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { language: newLanguage } 
        }));
      }
    }
  }, []);

  const currentLanguage = supportedLanguages.find(lang => lang.code === language);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      currentLanguage,
      isLoading,
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

