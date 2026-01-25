import type {Metadata, Viewport} from 'next';
import localFont from 'next/font/local';
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/providers/SessionProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SupportChat } from "@/components/chat/SupportChat";
import { OverflowDetector } from "@/components/dev/overflow-detector";
import { LayoutShiftDebugger } from "@/components/debug/LayoutShiftDebugger";
import { ScrollbarWidthSetter } from "@/components/utils/ScrollbarWidthSetter";
import { PreventSelectScrollLock } from "@/components/utils/PreventSelectScrollLock";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { CookieConsentBanner } from "@/components/cookie/CookieConsentBanner";
import { PageTranslationProvider } from "@/components/providers/PageTranslationProvider";
import './globals.css';

const chillax = localFont({
  src: '../fonts/Chillax-Variable.woff2',
  variable: '--font-chillax',
  display: 'swap',
});

// Helper function to get OG image URL with fallback
function getOGImageUrl(): string {
  // Use raster PNG (1200x630) for optimal social sharing
  // TODO: Create /public/og.png (1200x630) - currently falls back to placeholder
  return '/og.png';
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Enables safe-area-inset support for iOS
};

// Explicitly type metadata to exclude viewport (which is exported separately above)
export const metadata: Omit<Metadata, 'viewport'> = {
  metadataBase: new URL('https://focusrobin.lt'),
  title: {
    default: 'FocusRobin - Premium Sunglasses & Prescription Glasses | Lithuania',
    template: '%s | FocusRobin Lithuania',
  },
  description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses and prescription glasses designed in Lithuania. Fast shipping to Vilnius, Kaunas, Klaipėda, and EU/Schengen.',
  keywords: [
    // Brand - Primary
    'FocusRobin',
    'Focus Robin',
    'FocusRobin Lithuania',
    'FocusRobin Lietuva',
    'FocusRobin sunglasses',
    'FocusRobin prescription glasses',
    'FocusRobin eyewear',
    'FocusRobin glasses',
    'FocusRobin optical',
    // Brand + Product Intent
    'FocusRobin polarized sunglasses',
    'FocusRobin UV400 sunglasses',
    'FocusRobin designer eyewear',
    'FocusRobin premium glasses',
    'buy FocusRobin sunglasses',
    'buy FocusRobin glasses online',
    // English High-Intent - Sunglasses
    'Premium sunglasses Lithuania',
    'Polarized sunglasses Lithuania',
    'Minimalist sunglasses',
    'Designer sunglasses Lithuania',
    'Sunglasses online Lithuania',
    'UV400 sunglasses Lithuania',
    'Buy sunglasses in Lithuania',
    'Buy sunglasses online Lithuania',
    'Sunglasses shop Lithuania',
    'Sunglasses store Lithuania',
    'Best sunglasses Lithuania',
    'Affordable sunglasses Lithuania',
    'Luxury sunglasses Lithuania',
    'Men sunglasses Lithuania',
    'Women sunglasses Lithuania',
    'Unisex sunglasses Lithuania',
    // English High-Intent - Prescription Glasses
    'Prescription glasses Lithuania',
    'Prescription eyewear Lithuania',
    'Buy prescription glasses online Lithuania',
    'Prescription glasses online Lithuania',
    'Designer prescription glasses Lithuania',
    'Premium prescription eyewear Lithuania',
    'Optical glasses Lithuania',
    'Eyeglasses Lithuania',
    'Reading glasses Lithuania',
    'Prescription sunglasses Lithuania',
    'Prescription lenses Lithuania',
    'Eye glasses shop Lithuania',
    'Optical store Lithuania',
    // Lithuanian High-Intent - Sunglasses
    'akiniai nuo saulės',
    'saulės akiniai',
    'saulės akiniai internetu',
    'polarizuoti saulės akiniai',
    'akiniai su UV apsauga',
    'akiniai vyrams',
    'akiniai moterims',
    'pigūs saulės akiniai',
    'kokybiški saulės akiniai',
    'dizaineriniai akiniai',
    // Lithuanian High-Intent - Prescription Glasses
    'korekciniai akiniai',
    'akiniai su dioptrijomis',
    'receptiniai akiniai',
    'korekciniai akiniai internetu',
    'optiniai akiniai Lietuva',
    'akiniai regėjimui',
    'akiniai su lęšiais',
    'optika internetu',
    'akinių parduotuvė',
    // Geo-Targeting - Major Cities
    'sunglasses Vilnius',
    'sunglasses Kaunas',
    'sunglasses Klaipėda',
    'sunglasses Šiauliai',
    'sunglasses Panevėžys',
    'prescription glasses Vilnius',
    'prescription glasses Kaunas',
    'prescription glasses Klaipėda',
    'eyewear Vilnius',
    'eyewear Kaunas',
    'optical shop Vilnius',
    // Lithuanian Geo-Targeting
    'saulės akiniai Vilnius',
    'saulės akiniai Kaunas',
    'saulės akiniai Klaipėda',
    'korekciniai akiniai Vilnius',
    'korekciniai akiniai Kaunas',
    'optika Vilnius',
    'optika Kaunas',
    // EU/Schengen intent
    'EU shipping sunglasses',
    'Sunglasses delivery EU',
    'Europe sunglasses online',
    'Baltic sunglasses',
    'EU shipping prescription glasses',
    'Eyewear shipping Europe',
    'Fast delivery sunglasses EU',
  ],
  category: 'fashion',
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt',
    siteName: 'FocusRobin',
    title: 'FocusRobin - Premium Sunglasses & Prescription Glasses | Lithuania',
    description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses and prescription glasses designed in Lithuania. Fast shipping to Vilnius, Kaunas, Klaipėda, and EU/Schengen.',
    images: [
      {
        url: 'https://focusrobin.lt/og.png',
        width: 1200,
        height: 630,
        alt: 'FocusRobin - Premium Sunglasses & Prescription Glasses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocusRobin - Premium Sunglasses & Prescription Glasses | Lithuania',
    description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses and prescription glasses designed in Lithuania.',
    images: ['https://focusrobin.lt/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-site-verification': 'verification_code_placeholder',
  },
  alternates: {
    canonical: 'https://focusrobin.lt',
  },
  icons: {
    icon: [
      {
        url: '/Symbol Wide Primary light (Teal).svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: '/Symbol Wide Primary light (Teal).svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${chillax.variable} font-body antialiased`}>
        <CookieConsentProvider>
          <GoogleAnalytics />
          <MicrosoftClarity />
          <MetaPixel />
          <SessionProvider>
            <LanguageProvider>
              <PageTranslationProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <WishlistProvider>
                      {children}
                    <Toaster />
                    <SupportChat />
                    <ScrollbarWidthSetter />
                    <PreventSelectScrollLock />
                    <OverflowDetector />
                    <LayoutShiftDebugger />
                    <CookieConsentBanner />
                    </WishlistProvider>
                  </CartProvider>
                </CurrencyProvider>
              </PageTranslationProvider>
            </LanguageProvider>
          </SessionProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
