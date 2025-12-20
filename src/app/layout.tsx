import type {Metadata} from 'next';
import localFont from 'next/font/local';
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/providers/SessionProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SupportChat } from "@/components/chat/SupportChat";
import './globals.css';

const chillax = localFont({
  src: '../fonts/Chillax-Variable.woff2',
  variable: '--font-chillax',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FocusRobin Interactive',
  description: 'Elevate Your Style, Enhance Your Vision',
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
                </WishlistProvider>
              </CartProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
