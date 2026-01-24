import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'About FocusRobin | Premium Eyewear Brand Lithuania',
  description: 'FocusRobin is Lithuania\'s leading online eyewear brand. We design premium polarized sunglasses and prescription glasses with UV400 protection. Fast delivery to Vilnius, Kaunas, Klaipėda and across Europe. Shop quality eyewear made for Lithuanian style.',
  keywords: [
    'FocusRobin',
    'FocusRobin about',
    'FocusRobin Lithuania',
    'about FocusRobin',
    'eyewear brand Lithuania',
    'sunglasses brand Lithuania',
    'prescription glasses brand Lithuania',
    'Lithuanian eyewear company',
    'premium eyewear Lithuania',
    'sustainable eyewear Lithuania',
    'eyewear shop Lithuania',
    'apie mus',
    'apie FocusRobin',
    'Lietuvos akinių prekės ženklas',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/about',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/about',
    siteName: 'FocusRobin',
    title: 'About FocusRobin | Premium Eyewear Brand Lithuania',
    description: 'FocusRobin is Lithuania\'s leading online eyewear brand offering premium polarized sunglasses and prescription glasses.',
  },
};

export default function AboutPage() {
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
        name: 'About',
        item: 'https://focusrobin.lt/about',
      },
    ],
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FocusRobin',
    alternateName: ['Focus Robin', 'FocusRobin Lithuania', 'FocusRobin Lietuva'],
    url: 'https://focusrobin.lt',
    logo: 'https://focusrobin.lt/Symbol Wide Primary light (Teal).svg',
    description: 'FocusRobin is Lithuania\'s premium online eyewear store offering designer sunglasses and prescription glasses with fast delivery across Lithuania and Europe.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LT',
      addressRegion: 'Lithuania',
    },
    areaServed: [
      {
        '@type': 'Country',
        name: 'Lithuania',
      },
      {
        '@type': 'Place',
        name: 'European Union',
      },
    ],
    sameAs: [
      'https://www.instagram.com/focus.robin',
      'https://www.facebook.com/share/1HKTxzU7XP/',
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-brand-h1 font-headline text-foreground mb-8">
            About FocusRobin - Premium Eyewear Lithuania
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong>FocusRobin</strong> is Lithuania&apos;s premier online destination for premium 
              <strong> sunglasses and prescription glasses</strong>. Based in Lithuania, we design and 
              curate the finest eyewear with a focus on quality, style, and protection. Whether you&apos;re 
              looking for <strong>polarized sunglasses in Vilnius</strong>, <strong>prescription glasses 
              in Kaunas</strong>, or designer eyewear anywhere in Lithuania and the EU, FocusRobin delivers 
              excellence to your doorstep.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Why Choose FocusRobin for Your Eyewear in Lithuania?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              At <strong>FocusRobin</strong>, we understand that eyewear is more than just a functional 
              accessory—it&apos;s an expression of your personal style. That&apos;s why we offer an extensive 
              collection of <strong>premium sunglasses</strong> and <strong>prescription glasses</strong> that 
              combine cutting-edge design with superior quality. Every pair of <strong>FocusRobin glasses</strong> 
              features <strong>UV400 protection</strong> and premium polarized lenses to protect your eyes 
              while keeping you stylish.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              FocusRobin Sunglasses - Designed for Lithuanian Lifestyle
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our <strong>FocusRobin sunglasses</strong> collection is designed to complement the modern 
              Lithuanian lifestyle. From the sunny beaches of Palanga to the vibrant streets of Vilnius, 
              our <strong>polarized sunglasses</strong> provide exceptional glare reduction and crystal-clear 
              vision. Shop <strong>sunglasses online in Lithuania</strong> with confidence—we offer fast 
              delivery to Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys, and all across Lithuania.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Prescription Glasses Lithuania - Quality Optical Eyewear
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Need <strong>prescription glasses in Lithuania</strong>? FocusRobin offers premium 
              <strong> prescription eyewear</strong> that combines fashion-forward design with precise 
              optical quality. Our <strong>prescription glasses</strong> are available with various lens 
              options to suit your vision needs. Buy <strong>prescription glasses online</strong> from 
              FocusRobin and experience the convenience of doorstep delivery across Lithuania and the EU.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Our Commitment to Quality
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li><strong>Premium Materials</strong> - Quality frames and UV400 protective lenses</li>
              <li><strong>Polarized Technology</strong> - Reduces glare for clearer, more comfortable vision</li>
              <li><strong>Fast Delivery</strong> - Quick shipping to Vilnius, Kaunas, Klaipėda and all of Lithuania</li>
              <li><strong>1-Year Warranty</strong> - We stand behind every pair of FocusRobin glasses</li>
              <li><strong>14-Day Returns</strong> - Shop with confidence with our hassle-free return policy</li>
              <li><strong>EU-Wide Shipping</strong> - Fast delivery across the European Union and Schengen area</li>
            </ul>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Shop FocusRobin Eyewear Today
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Ready to find your perfect pair? <Link href="/shop" className="text-primary hover:underline font-medium">Browse our collection</Link> of 
              premium <strong>sunglasses and prescription glasses</strong>. Whether you&apos;re searching for 
              &quot;<strong>sunglasses Vilnius</strong>&quot;, &quot;<strong>prescription glasses Kaunas</strong>&quot;, or the 
              best <strong>eyewear shop in Lithuania</strong>, FocusRobin has you covered with stylish, 
              high-quality options at competitive prices.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Contact FocusRobin
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Have questions about our <strong>FocusRobin sunglasses</strong> or <strong>prescription 
              glasses</strong>? Our customer service team is here to help. Visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">Contact page</Link> to get 
              in touch, or explore our <Link href="/faq" className="text-primary hover:underline">FAQ</Link> for 
              quick answers about ordering <strong>eyewear in Lithuania</strong>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

