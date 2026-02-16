'use client';

import { useState, useEffect } from 'react';
import Footer from "@/components/Landing/footer";
import { useCookieConsent } from '@/context/CookieConsentContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CookiePreferencesPage() {
  const { consent, updateConsent, acceptAll, rejectAll } = useCookieConsent();
  const { toast } = useToast();
  const [tempConsent, setTempConsent] = useState({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    functional: consent?.functional ?? false,
  });

  useEffect(() => {
    if (consent) {
      setTempConsent({
        analytics: consent.analytics,
        marketing: consent.marketing,
        functional: consent.functional,
      });
    }
  }, [consent]);

  const handleSavePreferences = () => {
    updateConsent(tempConsent);
    toast({
      title: 'Preferences Saved',
      description: 'Your cookie preferences have been updated successfully.',
    });
  };

  const handleAcceptAll = () => {
    acceptAll();
    toast({
      title: 'All Cookies Accepted',
      description: 'All cookies have been enabled.',
    });
  };

  const handleRejectAll = () => {
    rejectAll();
    toast({
      title: 'All Cookies Rejected',
      description: 'Only necessary cookies are enabled.',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="h-8 w-8 text-primary" />
            <h1 className="text-brand-h1 font-headline text-foreground">
              Cookie Preferences
            </h1>
          </div>

          <p className="text-muted-foreground mb-8 text-lg">
            Manage your cookie preferences. You can enable or disable different types of cookies below. 
            For more information, please read our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/cookie-policy" className="text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>

          <div className="space-y-6">
            {/* Necessary Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Necessary Cookies
                    </CardTitle>
                    <CardDescription className="mt-2">
                      These cookies are essential for the website to function properly. They cannot be disabled.
                    </CardDescription>
                  </div>
                  <Checkbox checked={true} disabled className="ml-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Used for: Session management, security, CSRF protection, shopping cart functionality, 
                  user authentication, and maintaining your preferences during your visit.
                </p>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Analytics Cookies</CardTitle>
                    <CardDescription className="mt-2">
                      Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={tempConsent.analytics}
                    onCheckedChange={(checked) =>
                      setTempConsent({ ...tempConsent, analytics: checked === true })
                    }
                    className="ml-4"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Used by: Google Analytics, Meta Pixel, Microsoft Clarity
                </p>
                <p className="text-xs text-muted-foreground">
                  These cookies help us analyze website traffic, understand user behavior, and improve our services. 
                  All data is anonymized and aggregated.
                </p>
              </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Marketing Cookies</CardTitle>
                    <CardDescription className="mt-2">
                      Used to deliver personalized advertisements and track campaign performance.
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={tempConsent.marketing}
                    onCheckedChange={(checked) =>
                      setTempConsent({ ...tempConsent, marketing: checked === true })
                    }
                    className="ml-4"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Used for: Advertising, retargeting, campaign tracking
                </p>
                <p className="text-xs text-muted-foreground">
                  These cookies allow us to show you relevant advertisements and measure the effectiveness of our marketing campaigns.
                </p>
              </CardContent>
            </Card>

            {/* Functional Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle>Functional Cookies</CardTitle>
                    <CardDescription className="mt-2">
                      Enable enhanced functionality and personalization, such as remembering your preferences.
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={tempConsent.functional}
                    onCheckedChange={(checked) =>
                      setTempConsent({ ...tempConsent, functional: checked === true })
                    }
                    className="ml-4"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Used for: Language preferences, currency settings, user preferences
                </p>
                <p className="text-xs text-muted-foreground">
                  These cookies remember your choices and preferences to provide a more personalized experience.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline" onClick={handleRejectAll}>
              Reject All
            </Button>
            <Button variant="outline" onClick={handleAcceptAll}>
              Accept All
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>

          {/* Additional Information */}
          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Under GDPR and other privacy laws, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              To exercise these rights, please contact us at{' '}
              <Link href="mailto:support@focusrobin.lt" className="text-primary hover:underline">
                support@focusrobin.lt
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

