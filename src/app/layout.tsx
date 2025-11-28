import type {Metadata} from 'next';
import localFont from 'next/font/local';
import { Toaster } from "@/components/ui/toaster";
import SessionProvider from "@/components/providers/SessionProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import './globals.css';

const chillax = localFont({
  src: '../fonts/Chillax-Variable.woff2',
  variable: '--font-chillax',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FocusRobin Interactive',
  description: 'Elevate Your Style, Enhance Your Vision',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js" async></script>
      </head>
      <body className={`${chillax.variable} font-body antialiased`}>
        <SessionProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
