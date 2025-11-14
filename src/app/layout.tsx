import type {Metadata} from 'next';
import localFont from 'next/font/local';
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/context/CurrencyContext";
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
      <body className={`${chillax.variable} font-body antialiased`}>
        <CurrencyProvider>
          {children}
          <Toaster />
        </CurrencyProvider>
      </body>
    </html>
  );
}
