import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'Learn about FocusRobin\'s shipping options. Fast delivery to Lithuania (Vilnius, Kaunas, Klaipėda) and EU/Schengen countries. Free shipping available.',
  alternates: {
    canonical: 'https://focusrobin.lt/shipping',
  },
};

export default function ShippingPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://focusrobin.lt',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shipping',
        item: 'https://focusrobin.lt/shipping',
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8">
            Shipping Information
          </h1>

          {/* Shipping Signal - Near top of page */}
          <p className="text-base sm:text-lg text-brand-blue/80 leading-relaxed mb-8 break-words max-w-full">
            We deliver sunglasses across Lithuania (Vilnius, Kaunas, Klaipėda) and to all EU/Schengen countries.
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              Shipping to Lithuania
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              We offer fast shipping to all major cities in Lithuania including Vilnius, Kaunas, and Klaipėda. 
              Most orders are delivered within 2-3 business days.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              EU/Schengen Shipping
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              We ship to all EU and Schengen countries. Delivery times vary by location, typically 3-7 business days.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              Free Shipping
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              Free shipping is available on orders over a certain amount. Check your cart for current shipping offers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

