'use client';

import { useState, useEffect } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings, X, Cookie } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectAll, updateConsent, consent } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tempConsent, setTempConsent] = useState({
    analytics: false,
    marketing: false,
    functional: false,
  });

  // Only render after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    if (consent) {
      setTempConsent({
        analytics: consent.analytics,
        marketing: consent.marketing,
        functional: consent.functional,
      });
    }
  }, [consent]);

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted || !showBanner) return null;

  const handleSavePreferences = () => {
    updateConsent(tempConsent);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                We use cookies
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Necessary Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    These cookies are essential for the website to function properly. They cannot be disabled.
                  </p>
                </div>
                <Checkbox checked={true} disabled className="ml-4" />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Used for: Session management, security, CSRF protection, shopping cart functionality
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.analytics}
                  onCheckedChange={(checked) =>
                    setTempConsent({ ...tempConsent, analytics: checked === true })
                  }
                  className="ml-4"
                />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Used by: Google Analytics, Meta Pixel, Microsoft Clarity
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Marketing Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Used to deliver personalized advertisements and track campaign performance.
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.marketing}
                  onCheckedChange={(checked) =>
                    setTempConsent({ ...tempConsent, marketing: checked === true })
                  }
                  className="ml-4"
                />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Used for: Advertising, retargeting, campaign tracking
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Functional Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable enhanced functionality and personalization, such as remembering your preferences.
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.functional}
                  onCheckedChange={(checked) =>
                    setTempConsent({ ...tempConsent, functional: checked === true })
                  }
                  className="ml-4"
                />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Used for: Language preferences, currency settings, user preferences
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                For more information about how we use cookies and your rights, please read our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/cookie-policy" className="text-primary hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

