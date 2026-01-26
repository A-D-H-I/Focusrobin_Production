import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";
import { FileText, User, ShoppingBag, Truck, Shield, Scale, Mail, AlertCircle, CheckCircle2, Package, CreditCard, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import TranslatableText from "@/components/ui/TranslatableText";

export const metadata: Metadata = {
  title: 'Terms of Service | FocusRobin',
  description: 'Read FocusRobin\'s Terms of Service. Learn about our policies for purchases, shipping, returns, privacy, and customer rights. Governed by Lithuanian law.',
  alternates: {
    canonical: 'https://focusrobin.lt/terms',
  },
};

export default function TermsPage() {
  const sections = [
    { id: 'eligibility', title: 'Account & Eligibility', icon: User },
    { id: 'products', title: 'Products & Pricing', icon: ShoppingBag },
    { id: 'shipping', title: 'Shipping & Delivery', icon: Truck },
    { id: 'privacy', title: 'Privacy & Data', icon: Shield },
    { id: 'ip', title: 'Intellectual Property', icon: FileText },
    { id: 'liability', title: 'Liability', icon: Scale },
    { id: 'contact', title: 'Contact', icon: Mail },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-blue/5 via-brand-teal/5 to-brand-blue/5 border-b border-brand-blue/10">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand-teal/10 rounded-xl">
                <FileText className="h-8 w-8 text-brand-teal" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-headline text-brand-blue mb-2">
                  <TranslatableText text="Terms of Service" />
                </h1>
                <p className="text-brand-blue/60 text-sm">
                  <TranslatableText text="Effective as of January 2026" />
                </p>
              </div>
            </div>
            <p className="text-lg text-brand-blue/80 max-w-3xl leading-relaxed">
              <TranslatableText text="These Terms of Service (&quot;Terms&quot;) govern your use of FocusRobin&apos;s website, products, and services. By accessing our website or making a purchase, you agree to these Terms. Please read them carefully." />
            </p>
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
              {/* Account and Eligibility */}
              <section id="eligibility" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <User className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="1. Account and Eligibility" />
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                      <CheckCircle2 className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-brand-blue font-medium mb-1"><TranslatableText text="Age Requirement" /></p>
                        <p className="text-brand-blue/70 text-sm">
                          <TranslatableText text="You must be at least 18 years old or have a guardian&apos;s permission to make purchases." />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-brand-blue font-medium mb-1"><TranslatableText text="Service Rights" /></p>
                        <p className="text-brand-blue/70 text-sm">
                          <TranslatableText text="FocusRobin reserves the right to refuse service, terminate accounts, or cancel orders at our discretion." />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Products and Pricing */}
              <section id="products" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="2. Products and Pricing" />
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-brand-teal" />
                        <TranslatableText text="2.1 Product Information" />
                      </h3>
                      <div className="bg-brand-blue/5 rounded-lg p-4 border border-brand-blue/10">
                        <p className="text-brand-blue/80 leading-relaxed">
                          <TranslatableText text="All product descriptions, specifications, and prices are subject to change without notice. While we strive to display accurate product information, slight variations in color, material, or measurements may occur." />
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-brand-teal" />
                        <TranslatableText text="2.2 Pricing" />
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg p-4 border border-brand-teal/20">
                          <p className="text-brand-blue font-semibold mb-1"><TranslatableText text="Currency" /></p>
                          <p className="text-brand-blue/70 text-sm"><TranslatableText text="All prices in euros (€)" /></p>
                        </div>
                        <div className="bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg p-4 border border-brand-teal/20">
                          <p className="text-brand-blue font-semibold mb-1"><TranslatableText text="VAT Included" /></p>
                          <p className="text-brand-blue/70 text-sm"><TranslatableText text="All applicable taxes included" /></p>
                        </div>
                        <div className="bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg p-4 border border-brand-teal/20">
                          <p className="text-brand-blue font-semibold mb-1"><TranslatableText text="Payment Gateway" /></p>
                          <p className="text-brand-blue/70 text-sm"><TranslatableText text="Secure processing via Stripe" /></p>
                        </div>
                        <div className="bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg p-4 border border-brand-teal/20">
                          <p className="text-brand-blue font-semibold mb-1"><TranslatableText text="Price Changes" /></p>
                          <p className="text-brand-blue/70 text-sm"><TranslatableText text="Prices subject to change" /></p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-brand-teal" />
                        <TranslatableText text="2.3 Bulk Orders" />
                      </h3>
                      <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
                        <p className="text-brand-blue/80 leading-relaxed mb-3">
                          <TranslatableText text="For bulk orders, please contact" />{' '}
                          <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">
                            support@focusrobin.com
                          </Link>{' '}
                          <TranslatableText text="with the subject &quot;Enquiry for Bulk Order&quot;." />
                        </p>
                        <p className="text-brand-blue/70 text-sm">
                          <TranslatableText text="Special pricing and terms may apply to bulk orders, which will be communicated separately." />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Shipping and Delivery */}
              <section id="shipping" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Truck className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="3. Shipping and Delivery" />
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4"><TranslatableText text="3.1 Shipping Carriers" /></h3>
                      <p className="text-brand-blue/80 leading-relaxed mb-4">
                        <TranslatableText text="We use the following carriers for delivery:" />
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          { name: 'Omniva', desc: 'Lithuania, Latvia, Estonia' },
                          { name: 'DHL', desc: 'International (All other countries)' }
                        ].map((carrier, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg border border-brand-teal/20">
                            <Truck className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-brand-blue font-semibold">{carrier.name}</p>
                              <p className="text-brand-blue/70 text-sm"><TranslatableText text={carrier.desc} /></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4"><TranslatableText text="3.2 Estimated Delivery Times" /></h3>
                      <p className="text-brand-blue/80 leading-relaxed mb-4">
                        <TranslatableText text="Delivery times vary based on product type and shipping location:" />
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-brand-blue mb-3"><TranslatableText text="Prescription Glasses" /></h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Country" /></TableHead>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Standard Shipping" /></TableHead>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Shipping Provider" /></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="text-center border text-sm sm:text-base"><TranslatableText text="Lithuania" /></TableCell>
                                <TableCell className="text-center border text-sm sm:text-base font-medium">4-7 days</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Omniva</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-center border text-sm sm:text-base"><TranslatableText text="Other Countries" /></TableCell>
                                <TableCell className="text-center border text-sm sm:text-base font-medium">9-14 days</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">DHL</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-brand-blue mb-3"><TranslatableText text="Sunglasses (Non-Prescription)" /></h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Country" /></TableHead>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Standard Shipping" /></TableHead>
                                <TableHead className="font-medium text-center border text-sm sm:text-base bg-brand-blue/5"><TranslatableText text="Shipping Provider" /></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="text-center border text-sm sm:text-base"><TranslatableText text="Lithuania" /></TableCell>
                                <TableCell className="text-center border text-sm sm:text-base font-medium">2-4 days</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Omniva</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="text-center border text-sm sm:text-base"><TranslatableText text="Other Countries" /></TableCell>
                                <TableCell className="text-center border text-sm sm:text-base font-medium">4-7 days</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">DHL</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
                        <p className="text-brand-blue/80 text-sm">
                          <strong><TranslatableText text="Note:" /></strong> <TranslatableText text="If your order contains both prescription glasses and sunglasses, the delivery time will be calculated based on prescription glasses (longer delivery time) as all items ship together." />
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4"><TranslatableText text="3.3 Order Processing" /></h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-brand-blue/80 leading-relaxed">
                          <TranslatableText text="Orders are typically processed within 48 hours. FocusRobin is not responsible for delays caused by customs, weather conditions, or other circumstances beyond our control." />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Privacy and Data Collection */}
              <section id="privacy" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Shield className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="4. Privacy and Data Collection" />
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-3"><TranslatableText text="4.1 Data Collection" /></h3>
                      <p className="text-brand-blue/80 leading-relaxed mb-3">
                        <TranslatableText text="We collect and process personal data under our Privacy Policy and applicable laws. This includes:" />
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {['Order information', 'Contact details', 'Payment information', 'Shopping preferences'].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                            <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                            <span className="text-brand-blue text-sm"><TranslatableText text={item} /></span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-3"><TranslatableText text="4.2 Marketing Communications" /></h3>
                      <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
                        <p className="text-brand-blue/80 leading-relaxed">
                          <TranslatableText text="With your consent, we may send you newsletters and marketing communications. You can opt out at any time." />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="ip" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="5. Intellectual Property" />
                    </h2>
                  </div>
                  <div className="bg-brand-blue/5 rounded-lg p-4 border border-brand-blue/10">
                    <p className="text-brand-blue/80 leading-relaxed">
                      <TranslatableText text="All content on the FocusRobin website, including text, graphics, logos, and images, is protected by intellectual property rights and may not be used without permission." />
                    </p>
                  </div>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Scale className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="6. Limitation of Liability" />
                    </h2>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-brand-blue/80 font-semibold mb-2"><TranslatableText text="FocusRobin&apos;s liability is limited to:" /></p>
                    <p className="text-brand-blue/80"><TranslatableText text="The purchase price of the product" /></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-brand-blue/80 font-semibold"><TranslatableText text="We are not liable for:" /></p>
                    {[
                      'Indirect or consequential damages',
                      'Lost profits',
                      'Business interruption',
                      'Personal injury from product misuse',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-brand-blue/80 text-sm"><TranslatableText text={item} /></span>
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
                      <TranslatableText text="7. Contact Information" />
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    <TranslatableText text="For questions about these Terms, please contact:" />
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-blue/10">
                    <Mail className="h-5 w-5 text-brand-teal" />
                    <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">
                      support@focusrobin.com
                    </Link>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Scale className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      <TranslatableText text="8. Governing Law" />
                    </h2>
                  </div>
                  <div className="bg-brand-blue/5 rounded-lg p-4 border border-brand-blue/10">
                    <p className="text-brand-blue/80 leading-relaxed">
                      <TranslatableText text="These Terms are governed by Lithuanian law. Any disputes shall be resolved in the courts of Lithuania." />
                    </p>
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
