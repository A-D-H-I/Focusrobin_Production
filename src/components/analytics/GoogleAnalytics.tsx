'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';

/**
 * Google Analytics 4 (GA4) Component
 * 
 * Features:
 * - Only loads in production (NODE_ENV === "production")
 * - Only loads after user consents to analytics cookies (GDPR compliant)
 * - Tracks page views on route changes (App Router compatible)
 * - Anonymizes IP addresses for GDPR compliance
 * - Safely no-ops if measurement ID is missing
 * 
 * Setup:
 * 1. Go to https://analytics.google.com/
 * 2. Create a property for your website
 * 3. Go to Admin → Data Streams → Web → Create stream
 * 4. Copy the Measurement ID (format: G-XXXXXXXXXX)
 * 5. Add to .env: NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

// Declare gtag on window for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Track page views on route changes
 * Uses usePathname and useSearchParams for App Router compatibility
 */
function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (typeof window === 'undefined') return;
    // Don't track if user hasn't consented to analytics
    if (consent?.analytics !== true) return;
    
    // Wait for gtag to be available
    let retryCount = 0;
    const maxRetries = 50; // Max 5 seconds (50 * 100ms)
    
    const sendPageView = () => {
      try {
        if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
          retryCount++;
          if (retryCount < maxRetries) {
            // Retry after a short delay if gtag isn't ready
            setTimeout(sendPageView, 100);
          }
          return;
        }

        // Construct full page path with search params
        const searchString = searchParams && typeof searchParams.toString === 'function' 
          ? searchParams.toString() 
          : '';
        const url = pathname + (searchString ? `?${searchString}` : '');
        const fullUrl = window.location?.origin ? window.location.origin + url : url;

        // Send pageview to GA4 using both methods for reliability
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: url,
          page_location: fullUrl,
        });
        
        // Also send explicit page_view event to ensure it's tracked
        window.gtag('event', 'page_view', {
          page_path: url,
          page_location: fullUrl,
        });
      } catch (error) {
        // Silently fail - don't break the app
        console.error('GA4 page view tracking error:', error);
      }
    };

    sendPageView();
  }, [pathname, searchParams, consent]);

  return null;
}

/**
 * Main Google Analytics component
 * Mount once in layout.tsx
 * Only loads after user consents to analytics cookies (GDPR compliant)
 */
export function GoogleAnalytics() {
  // Only load in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Don't render if no measurement ID is configured
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return <GoogleAnalyticsWithConsent />;
}

function GoogleAnalyticsWithConsent() {
  const { consent } = useCookieConsent();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only check consent after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    if (consent?.analytics === true) {
      setShouldLoad(true);
    } else {
      setShouldLoad(false);
    }
  }, [consent]);

  // Listen for consent updates
  useEffect(() => {
    const handleConsentUpdate = (event: CustomEvent) => {
      const updatedConsent = event.detail;
      if (updatedConsent?.analytics === true) {
        setShouldLoad(true);
      } else {
        setShouldLoad(false);
        // Clear GA4 data if consent is withdrawn
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer = [];
        }
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    };
  }, []);

  // Don't load if not mounted or user hasn't consented to analytics
  if (!isMounted || !shouldLoad) {
    return null;
  }

  return (
    <>
      {/* Initialize GA4 dataLayer first */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              anonymize_ip: true,
              send_page_view: false
            });
          `,
        }}
      />
      
      {/* Load gtag.js - must load after dataLayer is initialized */}
      <Script
        id="google-analytics-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          // Wait a bit for gtag.js to fully initialize, then send initial page view
          if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
            return;
          }
          
          try {
            setTimeout(() => {
              try {
                if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
                  return;
                }
                
                // Safely get location info
                const pathname = window.location?.pathname || '/';
                const search = window.location?.search || '';
                const url = pathname + search;
                const fullUrl = window.location?.href || url;
                
                // Send both config and explicit page_view event
                window.gtag('config', GA_MEASUREMENT_ID, {
                  page_path: url,
                  page_location: fullUrl,
                });
                
                // Explicit page_view event to ensure it's sent
                window.gtag('event', 'page_view', {
                  page_path: url,
                  page_location: fullUrl,
                });
              } catch (innerError) {
                // Silently fail - don't break the app
                if (process.env.NODE_ENV === 'development') {
                  console.error('GA4 onLoad inner error:', innerError);
                }
              }
            }, 100);
          } catch (error) {
            // Silently fail - don't break the app
            if (process.env.NODE_ENV === 'development') {
              console.error('GA4 onLoad error:', error);
            }
          }
        }}
      />
      
      {/* Route change tracking - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}

/**
 * Track custom events in GA4
 * 
 * Usage:
 * import { trackGA4Event } from '@/components/analytics/GoogleAnalytics';
 * trackGA4Event('purchase', { transaction_id: '123', value: 99.99, currency: 'EUR' });
 * 
 * Common e-commerce events:
 * - 'view_item' - When user views a product
 * - 'add_to_cart' - When user adds item to cart
 * - 'begin_checkout' - When user starts checkout
 * - 'purchase' - When user completes purchase
 * - 'sign_up' - When user registers
 * - 'login' - When user logs in
 * - 'search' - When user searches
 */
export function trackGA4Event(
  eventName: string,
  parameters?: Record<string, any>
) {
  // Only track in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  if (!GA_MEASUREMENT_ID) {
    return;
  }

  // Check cookie consent for analytics
  try {
    const consentStr = localStorage.getItem('focusrobin_cookie_consent');
    if (consentStr) {
      const consent = JSON.parse(consentStr);
      if (consent.analytics !== true) {
        return; // Don't track if analytics consent not given
      }
    } else {
      return; // Don't track if no consent given
    }
  } catch {
    return; // Don't track if consent check fails
  }

  window.gtag('event', eventName, parameters);
}

/**
 * Track e-commerce view_item event
 */
export function trackGA4ViewItem(item: {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
  item_category?: string;
}) {
  trackGA4Event('view_item', {
    currency: item.currency || 'EUR',
    value: item.price,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      currency: item.currency || 'EUR',
      item_category: item.item_category || 'Sunglasses',
    }],
  });
}

/**
 * Track e-commerce add_to_cart event
 */
export function trackGA4AddToCart(item: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency?: string;
  item_category?: string;
}) {
  trackGA4Event('add_to_cart', {
    currency: item.currency || 'EUR',
    value: item.price * item.quantity,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity,
      currency: item.currency || 'EUR',
      item_category: item.item_category || 'Sunglasses',
    }],
  });
}

/**
 * Track e-commerce begin_checkout event
 */
export function trackGA4BeginCheckout(data: {
  value: number;
  currency?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}) {
  trackGA4Event('begin_checkout', {
    currency: data.currency || 'EUR',
    value: data.value,
    items: data.items,
  });
}

/**
 * Track e-commerce purchase event
 */
export function trackGA4Purchase(data: {
  transaction_id: string;
  value: number;
  currency?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}) {
  trackGA4Event('purchase', {
    transaction_id: data.transaction_id,
    currency: data.currency || 'EUR',
    value: data.value,
    items: data.items,
  });
}

/**
 * Track search event
 */
export function trackGA4Search(searchTerm: string) {
  trackGA4Event('search', {
    search_term: searchTerm,
  });
}

/**
 * Track sign_up event
 */
export function trackGA4SignUp(method?: string) {
  trackGA4Event('sign_up', {
    method: method || 'email',
  });
}

/**
 * Track login event
 */
export function trackGA4Login(method?: string) {
  trackGA4Event('login', {
    method: method || 'email',
  });
}

