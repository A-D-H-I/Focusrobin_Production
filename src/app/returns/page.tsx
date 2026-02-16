import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import Link from "next/link";
import { RotateCcw, Package, CreditCard, Clock, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import TranslatableText from "@/components/ui/TranslatableText";

export const metadata: Metadata = {
  title: 'Returns and Refunds | FocusRobin',
  description: 'FocusRobin\'s return policy offers a 14-day return window for unused items in original packaging. Fast refunds for customers in Lithuania and the EU. Grąžinimai ir pinigų grąžinimas.',
  keywords: [
    'returns policy',
    'refund policy',
    'FocusRobin returns',
    'eyewear returns Lithuania',
    'sunglasses refund',
    'prescription glasses return',
    'grąžinimai',
    'pinigų grąžinimas',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/returns',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/returns',
    siteName: 'FocusRobin',
    title: 'Returns and Refunds | FocusRobin Lithuania',
    description: 'FocusRobin offers a 14-day return window for unused items. Fast refunds for Lithuania and EU customers.',
  },
};

export default function ReturnsPage() {
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
        name: 'Returns',
        item: 'https://focusrobin.lt/returns',
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
          <div className="flex items-center gap-3 mb-8">
            <RotateCcw className="h-10 w-10 text-brand-teal" />
            <h1 className="text-brand-h1 font-headline text-brand-blue">
              <TranslatableText text="Returns and Refunds" />
            </h1>
          </div>

          {/* Return Highlight Box */}
          <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-brand-teal/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-brand-teal">14</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-headline text-brand-blue mb-2">
                  <TranslatableText text="14-Day Hassle-Free Returns" />
                </h2>
                <p className="text-brand-blue/80">
                  <TranslatableText text="Not satisfied with your purchase? Return any unused item within 14 days of delivery for a full refund. We want you to love your FocusRobin eyewear!" />
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              <TranslatableText text="At FocusRobin, customer satisfaction is our priority. We understand that buying eyewear online can be challenging, which is why we offer a generous return policy. Please read the following terms to understand how our returns and refunds process works." />
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="1. Return Eligibility" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="You may return products purchased from focusrobin.lt under the following conditions:" />
            </p>
            
            <div className="grid gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Within 14 Days" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Return must be initiated within 14 calendar days from the date of delivery" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Unused Condition" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Items must be unworn, unused, and in the same condition as received" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Original Packaging" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Products must be returned in original packaging with all accessories (case, cleaning cloth, etc.)" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Tags Attached" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Original tags and labels must still be attached to the product" /></p>
                </div>
              </div>
            </div>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="2. Non-Returnable Items" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="The following items cannot be returned:" />
            </p>
            
            <div className="grid gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Custom Prescription Lenses" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Prescription glasses with custom-made lenses to your specific prescription cannot be returned unless there is a manufacturing defect or incorrect prescription fulfillment" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Damaged or Used Items" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Products showing signs of wear, scratches, or damage after delivery" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Missing Components" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="Items returned without original packaging, accessories, or tags" /></p>
                </div>
              </div>
            </div>

            <div className="bg-brand-blue/5 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                <p className="text-brand-blue/80 text-sm">
                  <strong><TranslatableText text="Note on Prescription Glasses:" /></strong> <TranslatableText text="If you&apos;re unsure about your frame choice, we recommend trying our" /> <Link href="/try-on" className="text-brand-teal hover:underline"><TranslatableText text="Virtual Try-On" /></Link> <TranslatableText text="feature before ordering prescription lenses. For frame-only orders (without prescription lenses), standard return policies apply." />
                </p>
              </div>
            </div>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="3. How to Initiate a Return" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="To return a product, please follow these steps:" />
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Contact Our Support Team" /></p>
                  <p className="text-brand-blue/70 text-sm">
                    <TranslatableText text="Email" />{' '}
                    <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">
                      support@focusrobin.com
                    </Link>{' '}
                    <TranslatableText text="with the subject line &quot;Return Request - [Order Number]&quot;" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Provide Return Details" /></p>
                  <p className="text-brand-blue/70 text-sm">
                    <TranslatableText text="Include your order number, the items you wish to return, and the reason for the return" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Receive Return Authorization" /></p>
                  <p className="text-brand-blue/70 text-sm">
                    <TranslatableText text="We will send you a Return Authorization Number (RAN) and return instructions within 1-2 business days" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Pack Your Return" /></p>
                  <p className="text-brand-blue/70 text-sm">
                    <TranslatableText text="Carefully pack the item(s) in original packaging with all accessories and include the RAN inside the package" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  5
                </div>
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Ship Your Return" /></p>
                  <p className="text-brand-blue/70 text-sm">
                    <TranslatableText text="Send the package using the shipping method specified in your return instructions" />
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="4. Return Shipping Costs" />
            </h2>
            <div className="grid gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="FocusRobin Covers Shipping If:" /></p>
                  <ul className="text-brand-blue/70 text-sm mt-1 space-y-1">
                    <li>• <TranslatableText text="You received a defective or damaged product" /></li>
                    <li>• <TranslatableText text="You received the wrong item" /></li>
                    <li>• <TranslatableText text="Prescription was made incorrectly by us" /></li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Package className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Customer Covers Shipping If:" /></p>
                  <ul className="text-brand-blue/70 text-sm mt-1 space-y-1">
                    <li>• <TranslatableText text="You changed your mind about the purchase" /></li>
                    <li>• <TranslatableText text="The product doesn&apos;t fit as expected" /></li>
                    <li>• <TranslatableText text="You ordered the wrong item" /></li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="5. Refund Process" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="Once we receive and inspect your return, we will process your refund:" />
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg">
                <Clock className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Inspection Time" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="1-2 business days after receiving the return" /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg">
                <CreditCard className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-brand-blue font-medium"><TranslatableText text="Refund Processing" /></p>
                  <p className="text-brand-blue/70 text-sm"><TranslatableText text="3-5 business days after approval" /></p>
                </div>
              </div>
            </div>

            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <strong><TranslatableText text="Refund Method:" /></strong> <TranslatableText text="Refunds are issued to the original payment method:" />
            </p>
            <ul className="list-disc list-inside text-brand-blue/80 space-y-2 mb-6">
              <li><strong><TranslatableText text="Credit/Debit Cards:" /></strong> <TranslatableText text="5-10 business days to appear on your statement (depends on your bank)" /></li>
              <li><strong><TranslatableText text="PayPal:" /></strong> <TranslatableText text="1-3 business days" /></li>
              <li><strong><TranslatableText text="Apple Pay / Google Pay:" /></strong> <TranslatableText text="5-10 business days" /></li>
            </ul>

            <p className="text-brand-blue/80 leading-relaxed mb-6">
              <TranslatableText text="You will receive an email confirmation once your refund has been processed." />
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="6. Exchanges" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              <TranslatableText text="We do not offer direct exchanges at this time. If you would like a different product, please return the original item for a refund and place a new order. This ensures you receive your new item as quickly as possible without waiting for the return to be processed first." />
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="7. Defective or Wrong Items" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="If you received a defective product or the wrong item:" />
            </p>
            <ul className="list-disc list-inside text-brand-blue/80 space-y-2 mb-6">
              <li><TranslatableText text="Contact us immediately at" />{' '}
                <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">
                  support@focusrobin.com
                </Link>
              </li>
              <li><TranslatableText text="Include photos of the defect or incorrect item" /></li>
              <li><TranslatableText text="We will arrange for a prepaid return shipping label" /></li>
              <li><TranslatableText text="You can choose between a full refund or a replacement" /></li>
              <li><TranslatableText text="Replacement items are shipped with priority handling" /></li>
            </ul>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="8. Late or Missing Refunds" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="If you haven&apos;t received your refund within the expected timeframe:" />
            </p>
            <ol className="list-decimal list-inside text-brand-blue/80 space-y-2 mb-6">
              <li><TranslatableText text="Check your bank account or credit card statement again" /></li>
              <li><TranslatableText text="Contact your bank or credit card company, as processing times may vary" /></li>
              <li><TranslatableText text="If you&apos;ve done the above and still haven&apos;t received your refund, contact us at" />{' '}
                <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">
                  support@focusrobin.com
                </Link>
              </li>
            </ol>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              <TranslatableText text="9. Contact Us" />
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              <TranslatableText text="For any questions about returns or refunds, please contact our customer service team:" />
            </p>
            <div className="bg-brand-blue/5 p-4 rounded-lg mb-6">
              <p className="text-brand-blue/80 mb-1">
                <strong><TranslatableText text="Email:" /></strong>{' '}
                <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">
                  support@focusrobin.com
                </Link>
              </p>
              <p className="text-brand-blue/80 mb-1">
                <strong><TranslatableText text="Subject Line:" /></strong> <TranslatableText text="Return Request - [Your Order Number]" />
              </p>
              <p className="text-brand-blue/80">
                <strong><TranslatableText text="Response Time:" /></strong> <TranslatableText text="Within 1-2 business days" />
              </p>
            </div>

            <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-6">
              <h3 className="text-lg font-headline text-brand-blue mb-2"><TranslatableText text="Need More Help?" /></h3>
              <p className="text-brand-blue/80 text-sm mb-4">
                <TranslatableText text="Check out our other support resources:" />
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/faq" 
                  className="inline-flex items-center px-4 py-2 bg-white border border-brand-teal/30 rounded-lg text-brand-teal text-sm font-medium hover:bg-brand-teal/5 transition-colors"
                >
                  <TranslatableText text="FAQs" />
                </Link>
                <Link 
                  href="/warranty" 
                  className="inline-flex items-center px-4 py-2 bg-white border border-brand-teal/30 rounded-lg text-brand-teal text-sm font-medium hover:bg-brand-teal/5 transition-colors"
                >
                  <TranslatableText text="Warranty Information" />
                </Link>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center px-4 py-2 bg-white border border-brand-teal/30 rounded-lg text-brand-teal text-sm font-medium hover:bg-brand-teal/5 transition-colors"
                >
                  <TranslatableText text="Contact Us" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
