'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';

/**
 * Meta (Facebook) Pixel Analytics Component
 * 
 * Tracks page views, conversions, and custom events for Facebook Ads optimization.
 * Only loads after user consents to analytics cookies (GDPR compliant).
 * 
 * To get your Meta Pixel ID:
 * 1. Go to https://business.facebook.com/
 * 2. Navigate to Events Manager
 * 3. Create a new Pixel or use existing one
 * 4. Copy the Pixel ID (looks like: 123456789012345)
 * 5. Add it to your .env file as NEXT_PUBLIC_META_PIXEL_ID
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  // Don't render if no pixel ID is configured
  if (!META_PIXEL_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID is not set');
    }
    return null;
  }

  return <MetaPixelWithConsent />;
}

function MetaPixelWithConsent() {
  const pathname = usePathname();
  const { consent } = useCookieConsent();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Don't load on admin pages - check this after hooks are called
  const isAdminPage = pathname?.startsWith('/admin');

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
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    };
  }, []);

  // Track page view on route change - always call this hook, but only track if conditions are met
  // IMPORTANT: This hook must be called before any conditional returns
  useEffect(() => {
    if (isMounted && shouldLoad && typeof window !== 'undefined' && (window as any).fbq && pathname) {
      (window as any).fbq('track', 'PageView');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Meta Pixel: PageView tracked for', pathname);
      }
    }
  }, [pathname, shouldLoad, isMounted]);

  // Don't load if not mounted, user hasn't consented to analytics, or on admin pages
  // IMPORTANT: This return must come AFTER all hooks are called
  if (!isMounted || !shouldLoad || isAdminPage) {
    return null;
  }

  // Log in development to help verify it's working
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Meta Pixel: Pixel ID loaded', META_PIXEL_ID.substring(0, 8) + '...');
  }

  return (
    <>
      {/* Meta Pixel Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Noscript fallback for users without JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Helper function to wait for fbq to be available
 * Returns a promise that resolves when fbq is ready
 */
function waitForFbq(maxAttempts: number = 10, delay: number = 100): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    let attempts = 0;
    const checkFbq = () => {
      if ((window as any).fbq) {
        resolve(true);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      
      setTimeout(checkFbq, delay);
    };
    
    checkFbq();
  });
}

/**
 * Helper function to track custom events in Meta Pixel
 * 
 * Usage:
 * import { trackMetaEvent } from '@/components/analytics/MetaPixel';
 * trackMetaEvent('Purchase', { value: 100.00, currency: 'EUR' });
 * 
 * Common events:
 * - 'ViewContent' - When user views a product/page
 * - 'AddToCart' - When user adds item to cart
 * - 'InitiateCheckout' - When user starts checkout
 * - 'Purchase' - When user completes purchase
 * - 'Lead' - When user submits a form
 * - 'CompleteRegistration' - When user signs up
 */
export function trackMetaEvent(eventName: string, parameters?: Record<string, any>) {
  // Check cookie consent for analytics
  if (typeof window !== 'undefined') {
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
  }

  // If fbq is already available, track immediately
  if (typeof window !== 'undefined' && (window as any).fbq) {
    trackEventNow(eventName, parameters);
    return;
  }

  // Otherwise, wait for fbq to be available (async, non-blocking)
  waitForFbq().then((fbqAvailable) => {
    if (fbqAvailable) {
      trackEventNow(eventName, parameters);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('❌ Meta Pixel: fbq not available after waiting, event not tracked:', eventName);
    }
  });
}

/**
 * Internal helper to actually track the event (assumes fbq is available)
 */
function trackEventNow(eventName: string, parameters?: Record<string, any>) {
  if (typeof window === 'undefined' || !(window as any).fbq) {
    return;
  }

  if (parameters) {
    // Ensure value is a number (not string) if present
    const sanitizedParams = { ...parameters };
    if ('value' in sanitizedParams && typeof sanitizedParams.value === 'string') {
      sanitizedParams.value = parseFloat(sanitizedParams.value) || 0;
    }
    // Ensure value is a positive number
    if ('value' in sanitizedParams && (isNaN(sanitizedParams.value) || sanitizedParams.value <= 0)) {
      // Remove value if invalid
      delete sanitizedParams.value;
      delete sanitizedParams.currency;
    }
    
    (window as any).fbq('track', eventName, sanitizedParams);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Meta Pixel: Event tracked', eventName, sanitizedParams);
    }
  } else {
    (window as any).fbq('track', eventName);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Meta Pixel: Event tracked', eventName, '(no parameters)');
    }
  }
}

/**
 * Helper function to track custom conversions
 * 
 * Usage:
 * import { trackMetaCustomConversion } from '@/components/analytics/MetaPixel';
 * trackMetaCustomConversion('custom_event_name', { value: 50.00 });
 */
export function trackMetaCustomConversion(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, parameters || {});
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Meta Pixel: Custom conversion tracked', eventName, parameters || '');
    }
  }
}

/**
 * Helper function to track AddToCart event
 * 
 * Usage:
 * import { trackAddToCart } from '@/components/analytics/MetaPixel';
 * trackAddToCart('product-id', 'Product Name', 'Category', 99.99, 'EUR');
 */
export function trackAddToCart(
  contentId: string,
  contentName: string,
  contentCategory: string,
  value: number,
  currency: string = 'EUR'
) {
  trackMetaEvent('AddToCart', {
    content_ids: [contentId],
    content_name: contentName,
    content_category: contentCategory,
    value: value,
    currency: currency,
  });
}

/**
 * Helper function to track Purchase event
 * 
 * Usage:
 * import { trackPurchase } from '@/components/analytics/MetaPixel';
 * trackPurchase('order-123', 199.99, 'EUR', [{ id: 'prod-1', quantity: 2 }]);
 */
export function trackPurchase(
  orderId: string,
  value: number,
  currency: string = 'EUR',
  contents: Array<{ id: string; quantity: number }> = []
) {
  trackMetaEvent('Purchase', {
    content_ids: contents.map(c => c.id),
    contents: contents,
    value: value,
    currency: currency,
    order_id: orderId,
  });
}

/**
 * Helper function to track ViewContent event (product page views)
 * 
 * Usage:
 * import { trackViewContent } from '@/components/analytics/MetaPixel';
 * trackViewContent('product-id', 'Product Name', 'Category', 99.99, 'EUR');
 */
export function trackViewContent(
  contentId: string,
  contentName: string,
  contentCategory: string,
  value: number,
  currency: string = 'EUR'
) {
  trackMetaEvent('ViewContent', {
    content_ids: [contentId],
    content_name: contentName,
    content_category: contentCategory,
    value: value,
    currency: currency,
  });
}

/**
 * Helper function to track InitiateCheckout event
 * 
 * Usage:
 * import { trackInitiateCheckout } from '@/components/analytics/MetaPixel';
 * trackInitiateCheckout(199.99, 'EUR', [{ id: 'prod-1', quantity: 2 }]);
 */
export function trackInitiateCheckout(
  value: number,
  currency: string = 'EUR',
  contents: Array<{ id: string; quantity: number }> = []
) {
  trackMetaEvent('InitiateCheckout', {
    content_ids: contents.map(c => c.id),
    contents: contents,
    value: value,
    currency: currency,
  });
}

