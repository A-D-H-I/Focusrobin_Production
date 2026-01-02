import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with FocusRobin. We\'re here to help with your eyewear needs. Fast shipping to Lithuania and EU/Schengen.',
  alternates: {
    canonical: 'https://focusrobin.lt/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ContactPage JSON-LD structured data
  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Us',
    url: 'https://focusrobin.lt/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'FocusRobin',
      url: 'https://focusrobin.lt',
      email: 'support@focusrobin.com',
      telephone: '+37060966069',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kaunas',
        addressCountry: 'LT',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      {children}
    </>
  );
}

