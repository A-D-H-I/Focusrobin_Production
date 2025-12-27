import type {Metadata} from 'next';
import localFont from 'next/font/local';
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/providers/SessionProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SupportChat } from "@/components/chat/SupportChat";
import { OverflowDetector } from "@/components/dev/overflow-detector";
import './globals.css';

const chillax = localFont({
  src: '../fonts/Chillax-Variable.woff2',
  variable: '--font-chillax',
  display: 'swap',
});

// Helper function to get OG image URL with fallback
function getOGImageUrl(): string {
  // TODO: Add /og.png (1200x630) for better social sharing
  // For now, fallback to logo
  return '/Symbol Wide Primary light (Teal).svg';
}

export const metadata: Metadata = {
  metadataBase: new URL('https://focusrobin.com'),
  title: {
    default: 'FocusRobin - Premium Sunglasses & Eyewear | Lithuania',
    template: '%s | FocusRobin Lithuania',
  },
  description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses designed in Lithuania. Fast shipping to Vilnius, Kaunas, Klaipėda, and EU/Schengen.',
  keywords: [
    // Brand
    'FocusRobin',
    'FocusRobin Lithuania',
    'FocusRobin sunglasses',
    // English High-Intent
    'Premium sunglasses Lithuania',
    'Polarized sunglasses',
    'Minimalist sunglasses',
    'Sunglasses online Lithuania',
    'Designer sunglasses Lithuania',
    'UV400 sunglasses',
    'Buy sunglasses in Lithuania',
    'Sunglasses in Lithuania',
    // Lithuanian High-Intent
    'akiniai nuo saulės',
    'saulės akiniai internetu',
    'polarizuoti saulės akiniai',
    'akiniai su UV apsauga',
    'akiniai vyrams',
    'akiniai moterims',
    // Geo-Targeting
    'sunglasses Vilnius',
    'sunglasses Kaunas',
    'sunglasses Klaipėda',
    'saulės akiniai Vilnius',
    'saulės akiniai Kaunas',
    'saulės akiniai Klaipėda',
    // EU/Schengen intent
    'EU shipping sunglasses',
    'Sunglasses shipping to EU',
    'Schengen shipping sunglasses',
  ],
  category: 'fashion',
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.com',
    siteName: 'FocusRobin',
    title: 'FocusRobin - Premium Sunglasses & Eyewear | Lithuania',
    description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses designed in Lithuania. Fast shipping to Vilnius, Kaunas, Klaipėda, and EU/Schengen.',
    images: [
      {
        url: getOGImageUrl(),
        width: 1200,
        height: 630,
        alt: 'FocusRobin - Premium Sunglasses & Eyewear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocusRobin - Premium Sunglasses & Eyewear | Lithuania',
    description: 'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses designed in Lithuania.',
    images: [getOGImageUrl()],
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
    canonical: 'https://focusrobin.com',
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
        <SessionProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <CartProvider>
                <WishlistProvider>
                  {children}
                  <Toaster />
                  <SupportChat />
                  <OverflowDetector />
                </WishlistProvider>
              </CartProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
