import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with FocusRobin. We\'re here to help with your eyewear needs. Fast shipping to Lithuania and EU/Schengen.',
  alternates: {
    canonical: 'https://focusrobin.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

