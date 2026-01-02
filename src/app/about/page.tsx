import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about FocusRobin\'s mission to create high-quality eyewear that combines style, functionality, and sustainability. Designed in Lithuania, shipped worldwide.',
  alternates: {
    canonical: 'https://focusrobin.lt/about',
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

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-brand-h1 font-headline text-foreground mb-8">
            About FocusRobin
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              FocusRobin is dedicated to creating high-quality eyewear that combines style, 
              functionality, and sustainability. Our mission is to provide exceptional vision 
              solutions while maintaining our commitment to environmental responsibility.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Our Story
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Founded with a vision to revolutionize the eyewear industry, FocusRobin brings 
              together cutting-edge design, premium materials, and sustainable practices to 
              create eyewear that you can feel good about wearing.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Our Values
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
              <li>Quality craftsmanship in every product</li>
              <li>Sustainable and eco-friendly materials</li>
              <li>Customer satisfaction and support</li>
              <li>Innovation in design and technology</li>
            </ul>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-foreground">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For any inquiries, please visit our <a href="/contact" className="text-primary hover:underline">Contact</a> page.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

