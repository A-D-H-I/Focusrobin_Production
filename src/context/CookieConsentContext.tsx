'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CookieConsent = {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean; // Google Analytics, Meta Pixel, Microsoft Clarity
  marketing: boolean; // Future marketing cookies
  functional: boolean; // Future functional cookies
};

type CookieConsentContextType = {
  consent: CookieConsent | null;
  hasConsented: boolean;
  updateConsent: (newConsent: Partial<CookieConsent>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const COOKIE_CONSENT_KEY = 'focusrobin_cookie_consent';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // Validate structure
    if (
      typeof parsed === 'object' &&
      typeof parsed.necessary === 'boolean' &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean' &&
      typeof parsed.functional === 'boolean' &&
      parsed.timestamp
    ) {
      // Check if consent is still valid (not expired)
      const consentAge = Date.now() - parsed.timestamp;
      const maxAge = COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (consentAge < maxAge) {
        return {
          necessary: true, // Always true
          analytics: parsed.analytics,
          marketing: parsed.marketing,
          functional: parsed.functional,
        };
      }
    }
  } catch (error) {
    console.error('Error reading cookie consent:', error);
  }
  
  return null;
}

function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  
  try {
    const toStore = {
      ...consent,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toStore));
    
    // Also set a cookie for server-side access if needed
    document.cookie = `${COOKIE_CONSENT_KEY}=${JSON.stringify(toStore)}; max-age=${COOKIE_EXPIRY_DAYS * 24 * 60 * 60}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  // Initialize with null to ensure server and client match initially
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only load consent after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasConsented(true);
      setShowBanner(false);
    } else {
      // Show banner if no consent stored
      setShowBanner(true);
    }
  }, []);

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    const updated: CookieConsent = {
      necessary: true, // Always true
      analytics: newConsent.analytics ?? consent?.analytics ?? false,
      marketing: newConsent.marketing ?? consent?.marketing ?? false,
      functional: newConsent.functional ?? consent?.functional ?? false,
    };
    
    setConsent(updated);
    saveConsent(updated);
    setHasConsented(true);
    setShowBanner(false);
    
    // Dispatch event for analytics components to listen
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: updated }));
  };

  const acceptAll = () => {
    const allAccepted: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    setConsent(allAccepted);
    saveConsent(allAccepted);
    setHasConsented(true);
    setShowBanner(false);
    
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: allAccepted }));
  };

  const rejectAll = () => {
    const allRejected: CookieConsent = {
      necessary: true, // Always true
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    setConsent(allRejected);
    saveConsent(allRejected);
    setHasConsented(true);
    setShowBanner(false);
    
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: allRejected }));
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsented,
        updateConsent,
        acceptAll,
        rejectAll,
        showBanner,
        setShowBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

