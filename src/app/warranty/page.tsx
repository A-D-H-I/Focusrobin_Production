import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";
import { ShieldCheck, Wrench, AlertCircle, CheckCircle2, FileText, Clock, Mail, Package, Eye, Settings, Calendar } from 'lucide-react';
import TranslatableText from "@/components/ui/TranslatableText";

export const metadata: Metadata = {
  title: 'Terms of Warranty | FocusRobin',
  description: 'FocusRobin offers a 2-year warranty on all sunglasses and prescription glasses. Coverage for manufacturing defects, lens replacement, and frame repairs. Garantija ir remontas.',
  keywords: [
    'sunglasses warranty',
    'prescription glasses warranty',
    'eyewear warranty Lithuania',
    'FocusRobin warranty',
    'lens replacement',
    'frame repairs',
    '2 year warranty',
    'garantija',
    'akinių remontas',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/warranty',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/warranty',
    siteName: 'FocusRobin',
    title: 'Terms of Warranty | FocusRobin Lithuania',
    description: 'FocusRobin offers a 2-year warranty on sunglasses and prescription glasses. Coverage for manufacturing defects and repairs.',
  },
};

export default function WarrantyPage() {
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
        name: 'Warranty',
        item: 'https://focusrobin.lt/warranty',
      },
    ],
  };

  const sections = [
    { id: 'coverage', title: 'Warranty Coverage', icon: ShieldCheck },
    { id: 'covered', title: 'What\'s Covered', icon: CheckCircle2 },
    { id: 'not-covered', title: 'What\'s Not Covered', icon: AlertCircle },
    { id: 'prescription', title: 'Prescription Lenses', icon: Eye },
    { id: 'claim', title: 'Make a Claim', icon: FileText },
    { id: 'resolution', title: 'Resolution Options', icon: Package },
    { id: 'care', title: 'Care Recommendations', icon: Settings },
    { id: 'contact', title: 'Contact', icon: Mail },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-blue/5 via-brand-teal/5 to-brand-blue/5 border-b border-brand-blue/10">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand-teal/10 rounded-xl">
                <ShieldCheck className="h-8 w-8 text-brand-teal" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-headline text-brand-blue mb-2">
                  <TranslatableText text="Terms of Warranty" />
                </h1>
                <p className="text-brand-blue/60 text-sm">
                  <TranslatableText text="Comprehensive protection for your eyewear" />
                </p>
              </div>
            </div>

            {/* Warranty Highlight Box */}
            <div className="bg-gradient-to-r from-brand-teal/10 to-brand-blue/10 border-2 border-brand-teal/30 rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">2</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-headline text-brand-blue mb-3">
                    <TranslatableText text="2-Year Warranty on All Products" />
                  </h2>
                  <p className="text-lg text-brand-blue/80 leading-relaxed">
                    <TranslatableText text="Every pair of FocusRobin sunglasses and prescription glasses comes with our comprehensive 2-year warranty against manufacturing defects. We stand behind the quality of our products and your satisfaction." />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-brand-blue/10 rounded-xl p-6 shadow-sm">
                <h3 className="font-headline text-brand-blue mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-teal" />
                  <TranslatableText text="Quick Navigation" />
                </h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-2 text-sm text-brand-blue/70 hover:text-brand-teal transition-colors py-2 px-3 rounded-lg hover:bg-brand-teal/5"
                      >
                        <Icon className="h-4 w-4" />
                        <span><TranslatableText text={section.title} /></span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Warranty Coverage Period */}
              <section id="coverage" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="1. Warranty Coverage Period" />
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-brand-blue/80 leading-relaxed">
                      <TranslatableText text="FocusRobin provides a" /> <strong className="text-brand-blue"><TranslatableText text="2-year warranty" /></strong> <TranslatableText text="from the date of purchase on all sunglasses and prescription glasses purchased directly from focusrobin.lt. The warranty period begins on the date shown on your order confirmation email or invoice." />
                    </p>
                    <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
                      <p className="text-brand-blue/80 text-sm">
                        <strong><TranslatableText text="Important:" /></strong> <TranslatableText text="To validate your warranty, please retain your order confirmation email or invoice as proof of purchase." />
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* What Is Covered */}
              <section id="covered" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="2. What Is Covered" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="Our warranty covers defects in materials and workmanship under normal use, including:" />
                  </p>

                  <div className="grid gap-4">
                    {[
                      {
                        title: 'Manufacturing Defects',
                        desc: 'Defects in materials, construction, or assembly that affect the function or appearance of the eyewear',
                        icon: Package,
                      },
                      {
                        title: 'Frame Structural Issues',
                        desc: 'Breakage or cracking of frame components due to material defects, hinge failures, temple arm issues',
                        icon: Settings,
                      },
                      {
                        title: 'Lens Coating Defects',
                        desc: 'Peeling, bubbling, or delamination of lens coatings (anti-reflective, UV protection, polarization) under normal use',
                        icon: Eye,
                      },
                      {
                        title: 'Hardware Defects',
                        desc: 'Faulty screws, nose pads, or other hardware components that fail under normal use',
                        icon: Wrench,
                      },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-start gap-4 p-5 bg-gradient-to-r from-green-50 to-brand-teal/5 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                            <Icon className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-brand-blue font-semibold text-lg mb-1"><TranslatableText text={item.title} /></p>
                            <p className="text-brand-blue/70 text-sm leading-relaxed"><TranslatableText text={item.desc} /></p>
                          </div>
                          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* What Is NOT Covered */}
              <section id="not-covered" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="3. What Is NOT Covered" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="The warranty does not cover damage resulting from:" />
                  </p>

                  <div className="grid gap-4">
                    {[
                      {
                        title: 'Accidental Damage',
                        desc: 'Drops, impacts, crushing, sitting on glasses, or other physical accidents',
                      },
                      {
                        title: 'Normal Wear and Tear',
                        desc: 'Scratches from regular use, lens wear, fading due to prolonged sun exposure',
                      },
                      {
                        title: 'Misuse or Abuse',
                        desc: 'Using eyewear for purposes not intended, improper storage, exposure to extreme conditions',
                      },
                      {
                        title: 'Unauthorized Modifications',
                        desc: 'Repairs or modifications made by third parties not authorized by FocusRobin',
                      },
                      {
                        title: 'Chemical Damage',
                        desc: 'Exposure to chemicals, solvents, harsh cleaning agents, or saltwater corrosion',
                      },
                      {
                        title: 'Lost or Stolen Items',
                        desc: 'The warranty does not cover replacement for lost or stolen eyewear',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-5 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border-2 border-red-200 shadow-sm">
                        <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-brand-blue font-semibold text-lg mb-1"><TranslatableText text={item.title} /></p>
                          <p className="text-brand-blue/70 text-sm leading-relaxed"><TranslatableText text={item.desc} /></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Prescription Lenses Warranty */}
              <section id="prescription" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Eye className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="4. Prescription Lenses Warranty" />
                    </h2>
                  </div>
                  <div className="bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 border border-brand-teal/20 rounded-lg p-6">
                    <p className="text-brand-blue/80 leading-relaxed mb-4">
                      <TranslatableText text="Prescription lenses are covered under the same 2-year warranty for manufacturing defects. However, please note that changes to your prescription are not covered." />
                    </p>
                    <div className="bg-white/50 rounded-lg p-4 border border-brand-teal/20">
                      <p className="text-brand-blue/80 text-sm">
                        <strong><TranslatableText text="Lens Replacement Service:" /></strong> <TranslatableText text="If your vision changes and you require new lenses, we offer lens replacement services at a discounted rate for existing customers." />
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* How to Make a Warranty Claim */}
              <section id="claim" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="5. How to Make a Warranty Claim" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="To make a warranty claim, please follow these steps:" />
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        step: '1',
                        title: 'Contact Us',
                        desc: 'Email support@focusrobin.com with the subject line "Warranty Claim"',
                      },
                      {
                        step: '2',
                        title: 'Provide Details',
                        desc: 'Include your order number, date of purchase, and a detailed description of the defect',
                      },
                      {
                        step: '3',
                        title: 'Submit Photos',
                        desc: 'Attach clear photographs showing the defect from multiple angles',
                      },
                      {
                        step: '4',
                        title: 'Await Assessment',
                        desc: 'Our team will review your claim within 2-3 business days and respond with next steps',
                      },
                      {
                        step: '5',
                        title: 'Ship the Product',
                        desc: 'If requested, send the defective item to us for inspection (we will provide a shipping label for valid claims within Lithuania)',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-5 bg-gradient-to-r from-brand-blue/5 to-brand-teal/5 rounded-xl border border-brand-teal/20 hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-lg">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-brand-blue font-semibold text-lg mb-1"><TranslatableText text={item.title} /></p>
                          <p className="text-brand-blue/70 text-sm leading-relaxed"><TranslatableText text={item.desc} /></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Warranty Resolution Options */}
              <section id="resolution" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Package className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="6. Warranty Resolution Options" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="Upon verification of a valid warranty claim, FocusRobin will, at our discretion:" />
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: 'Replace', desc: 'Provide a replacement product of equal value', icon: Package },
                      { title: 'Credit', desc: 'Issue a store credit for the original purchase price', icon: CheckCircle2 },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="p-6 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-xl border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
                          <div className="inline-flex p-3 bg-brand-teal/10 rounded-full mb-4">
                            <Icon className="h-8 w-8 text-brand-teal" />
                          </div>
                          <h3 className="text-brand-blue font-semibold text-lg mb-2"><TranslatableText text={item.title} /></h3>
                          <p className="text-brand-blue/70 text-sm"><TranslatableText text={item.desc} /></p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Care Recommendations */}
              <section id="care" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Settings className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="7. Care Recommendations" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="To maximize the lifespan of your FocusRobin eyewear and maintain warranty validity:" />
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      'Store glasses in the provided protective case',
                      'Clean lenses with microfiber cloth and solution',
                      'Avoid placing glasses lens-down on hard surfaces',
                      'Use both hands when putting on and removing',
                      'Keep glasses away from extreme heat',
                      'Avoid contact with harsh chemicals',
                    ].map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                        <CheckCircle2 className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="text-brand-blue text-sm"><TranslatableText text={tip} /></span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section id="contact" className="scroll-mt-24">
                <div className="bg-gradient-to-br from-brand-blue/5 to-brand-teal/5 border border-brand-teal/20 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Mail className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="8. Contact Information" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="For warranty inquiries or to initiate a claim, please contact us:" />
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-blue/10">
                      <Mail className="h-5 w-5 text-brand-teal" />
                      <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">
                        support@focusrobin.com
                      </Link>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 border border-brand-teal/20">
                      <p className="text-brand-blue/80 text-sm mb-1">
                        <strong><TranslatableText text="Subject Line:" /></strong> <TranslatableText text="Warranty Claim - [Your Order Number]" />
                      </p>
                      <p className="text-brand-blue/80 text-sm">
                        <strong><TranslatableText text="Response Time:" /></strong> <TranslatableText text="Within 2-3 business days" />
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
