'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';

/**
 * Microsoft Clarity Analytics Component
 * 
 * Provides heatmaps, session recordings, and user behavior insights.
 * Only loads after user consents to analytics cookies (GDPR compliant).
 * 
 * To get your Clarity Project ID:
 * 1. Go to https://clarity.microsoft.com/
 * 2. Sign in with your Microsoft account
 * 3. Create a new project for focusrobin.lt
 * 4. Copy the Project ID from the setup page
 * 5. Add it to your .env file as NEXT_PUBLIC_CLARITY_PROJECT_ID
 */

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function MicrosoftClarity() {
  // Don't render if no project ID is configured
  if (!CLARITY_PROJECT_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Microsoft Clarity: NEXT_PUBLIC_CLARITY_PROJECT_ID is not set');
    }
    return null;
  }

  return <MicrosoftClarityWithConsent projectId={CLARITY_PROJECT_ID} />;
}

function MicrosoftClarityWithConsent({ projectId }: { projectId: string }) {
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

  // Debug consent for troubleshooting
  useEffect(() => {
    console.log('🔍 Clarity Consent Check:', {
      consentReceived: !!consent,
      analyticsEnabled: consent?.analytics
    });
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

  // Don't load if not mounted or user hasn't consented to analytics
  if (!isMounted || !shouldLoad) {
    return null;
  }

  // Log in development to help verify it's working
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Microsoft Clarity: Project ID loaded', projectId.substring(0, 8) + '...');
  }

  return (
    <>
      {/* Microsoft Clarity initialization script */}
      <Script
        id="microsoft-clarity-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${projectId}");
          `,
        }}
      />
      {/* Verification script - runs after page loads */}
      <Script
        id="microsoft-clarity-verify"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function checkClarity() {
                if (typeof window.clarity !== 'undefined') {
                  console.log('✅ Microsoft Clarity is active and ready');
                  if (window.clarity) {
                    console.log('✅ Clarity object:', typeof window.clarity);
                  }
                  return true;
                }
                return false;
              }
              
              // Check immediately
              if (checkClarity()) return;
              
              // If not ready, check again after a short delay
              setTimeout(function() {
                if (!checkClarity()) {
                  console.warn('⚠️ Microsoft Clarity not detected yet. It may still be loading...');
                }
              }, 1000);
            })();
          `,
        }}
      />
    </>
  );
}

/**
 * Helper function to identify users in Clarity
 * Call this after user logs in to associate sessions with user IDs
 * 
 * Usage:
 * import { identifyClarityUser } from '@/components/analytics/MicrosoftClarity';
 * identifyClarityUser(userId, sessionId, customPageId);
 */
export function identifyClarityUser(
  customUserId?: string,
  customSessionId?: string,
  customPageId?: string
) {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('identify', customUserId, customSessionId, customPageId);
  }
}

/**
 * Helper function to set custom tags in Clarity
 * Useful for segmenting data by custom dimensions
 * 
 * Usage:
 * import { setClarityTag } from '@/components/analytics/MicrosoftClarity';
 * setClarityTag('user_type', 'premium');
 */
export function setClarityTag(key: string, value: string) {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('set', key, value);
  }
}

/**
 * Helper function to trigger custom events in Clarity
 * 
 * Usage:
 * import { trackClarityEvent } from '@/components/analytics/MicrosoftClarity';
 * trackClarityEvent('add_to_cart');
 */
export function trackClarityEvent(eventName: string) {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('event', eventName);
  }
}

