import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import TranslatableText from "@/components/ui/TranslatableText";
import Link from 'next/link';

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
            <TranslatableText text="We deliver across Lithuania and to all EU/Schengen countries. Delivery times and shipping providers vary based on the brand and product type." />
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-brand-h2 font-headline mt-8 mb-6 text-brand-blue">
              <TranslatableText text="Estimated Delivery Times" />
            </h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-brand-blue mb-4"><TranslatableText text="Prescription Glasses" /></h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Brand" /></TableHead>
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Country" /></TableHead>
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Standard Shipping" /></TableHead>
                      <TableHead className="font-medium text-center border-b text-sm sm:text-base"><TranslatableText text="Shipping Provider" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="FocusRobin" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Lithuania" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base font-medium">4-7 days</TableCell>
                      <TableCell className="text-center border-b text-sm sm:text-base">Omniva</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="FocusRobin" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Other Countries" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base font-medium">9-14 days</TableCell>
                      <TableCell className="text-center border-b text-sm sm:text-base">DHL</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border-r text-sm sm:text-base"><TranslatableText text="Other Brands" /></TableCell>
                      <TableCell className="text-center border-r text-sm sm:text-base"><TranslatableText text="All Countries" /></TableCell>
                      <TableCell className="text-center border-r text-sm sm:text-base font-medium">7-15 days</TableCell>
                      <TableCell className="text-center text-sm sm:text-base">DHL/Omniva</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-brand-blue mb-4"><TranslatableText text="Sunglasses (Non-Prescription)" /></h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Brand" /></TableHead>
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Country" /></TableHead>
                      <TableHead className="font-medium text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Standard Shipping" /></TableHead>
                      <TableHead className="font-medium text-center border-b text-sm sm:text-base"><TranslatableText text="Shipping Provider" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="FocusRobin" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Lithuania" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base font-medium">2-4 days</TableCell>
                      <TableCell className="text-center border-b text-sm sm:text-base">Omniva</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="FocusRobin" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base"><TranslatableText text="Other Countries" /></TableCell>
                      <TableCell className="text-center border-r border-b text-sm sm:text-base font-medium">4-7 days</TableCell>
                      <TableCell className="text-center border-b text-sm sm:text-base">DHL</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border-r text-sm sm:text-base"><TranslatableText text="Other Brands" /></TableCell>
                      <TableCell className="text-center border-r text-sm sm:text-base"><TranslatableText text="All Countries" /></TableCell>
                      <TableCell className="text-center border-r text-sm sm:text-base font-medium">7-9 days</TableCell>
                      <TableCell className="text-center text-sm sm:text-base">DHL/Omniva</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-5 mb-8">
              <p className="text-brand-blue/80 text-base m-0">
                <strong><TranslatableText text="Note:" /></strong> <TranslatableText text="If your order contains both prescription glasses and sunglasses, the delivery time will be calculated based on prescription glasses (longer delivery time) as all items ship together." />
              </p>
            </div>

            <h2 className="text-brand-h2 font-headline mt-12 mb-4 text-brand-blue">
              <TranslatableText text="Free Shipping" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              <TranslatableText text="We currently offer free standard shipping on all orders." />
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="Order Processing" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              <TranslatableText text="Orders are typically processed within 48 hours. FocusRobin is not responsible for delays caused by customs, weather conditions, or other circumstances beyond our control." />
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

