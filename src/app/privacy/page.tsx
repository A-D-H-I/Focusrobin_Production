import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";
import { Shield, Lock, Database, Users, FileText, Mail, AlertCircle, CheckCircle2, Eye, Globe, Clock, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | FocusRobin',
  description: 'FocusRobin\'s Privacy Policy explains how we collect, use, and protect your personal data. GDPR compliant data handling for customers in Lithuania and the EU.',
  keywords: [
    'privacy policy',
    'FocusRobin privacy',
    'data protection',
    'GDPR',
    'personal data',
    'privatumo politika',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/privacy',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/privacy',
    siteName: 'FocusRobin',
    title: 'Privacy Policy | FocusRobin Lithuania',
    description: 'Learn how FocusRobin collects, uses, and protects your personal data. GDPR compliant.',
  },
};

export default function PrivacyPolicyPage() {
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
        name: 'Privacy Policy',
        item: 'https://focusrobin.lt/privacy',
      },
    ],
  };

  const sections = [
    { id: 'controller', title: 'Data Controller', icon: Users },
    { id: 'collect', title: 'Data We Collect', icon: Database },
    { id: 'use', title: 'How We Use Data', icon: FileText },
    { id: 'legal', title: 'Legal Basis', icon: FileCheck },
    { id: 'sharing', title: 'Data Sharing', icon: Globe },
    { id: 'retention', title: 'Data Retention', icon: Clock },
    { id: 'rights', title: 'Your Rights', icon: Shield },
    { id: 'security', title: 'Data Security', icon: Lock },
    { id: 'cookies', title: 'Cookies', icon: Eye },
    { id: 'contact', title: 'Contact Us', icon: Mail },
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
                <Shield className="h-8 w-8 text-brand-teal" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-headline text-brand-blue mb-2">
                  Privacy Policy
                </h1>
                <p className="text-brand-blue/60 text-sm">
                  Last updated: January 2026
                </p>
              </div>
            </div>
            <p className="text-lg text-brand-blue/80 max-w-3xl leading-relaxed">
              MB Focusrobin optika (&quot;FocusRobin&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data. 
              We comply with GDPR and Lithuanian data protection laws.
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
                  Quick Navigation
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
                        <span>{section.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Data Controller */}
              <section id="controller" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Users className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      1. Data Controller
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-4">
                    The data controller responsible for your personal data is:
                  </p>
                  <div className="bg-gradient-to-r from-brand-blue/5 to-brand-teal/5 border border-brand-teal/20 rounded-xl p-6">
                    <div className="space-y-2">
                      <p className="text-brand-blue font-semibold text-lg">MB Focusrobin optika</p>
                      <p className="text-brand-blue/80">Republic of Lithuania</p>
                      <p className="text-brand-blue/80">
                        Email: <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">support@focusrobin.com</Link>
                      </p>
                      <p className="text-brand-blue/80">
                        Website: <Link href="https://focusrobin.lt" className="text-brand-teal hover:underline font-medium">focusrobin.lt</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data We Collect */}
              <section id="collect" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Database className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      2. Personal Data We Collect
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4">2.1 Information You Provide</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { title: 'Account Information', desc: 'Name, email, password, phone number' },
                          { title: 'Order Information', desc: 'Billing, shipping address, payment details' },
                          { title: 'Prescription Data', desc: 'Optical prescription details for glasses' },
                          { title: 'Communication Data', desc: 'Messages from contact forms and chat' },
                          { title: 'Newsletter Preferences', desc: 'Email and marketing consent' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                            <CheckCircle2 className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-brand-blue font-medium">{item.title}</p>
                              <p className="text-brand-blue/70 text-sm">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-headline text-brand-blue mb-4">2.2 Information Collected Automatically</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { title: 'Device Information', desc: 'IP address, browser type, OS, device IDs' },
                          { title: 'Usage Data', desc: 'Pages visited, time on site, click patterns' },
                          { title: 'Cookie Data', desc: 'Information from cookies and tracking technologies' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                            <CheckCircle2 className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-brand-blue font-medium">{item.title}</p>
                              <p className="text-brand-blue/70 text-sm">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How We Use Data */}
              <section id="use" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      3. How We Use Your Data
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      'Order Processing',
                      'Customer Service',
                      'Account Management',
                      'Marketing (with consent)',
                      'Website Improvement',
                      'Legal Compliance',
                      'Fraud Prevention',
                    ].map((use, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-teal/5 to-brand-blue/5 rounded-lg border border-brand-teal/20">
                        <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
                        <span className="text-brand-blue font-medium">{use}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Legal Basis */}
              <section id="legal" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <FileCheck className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      4. Legal Basis for Processing
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Contract Performance', desc: 'Processing necessary to fulfill our contract (e.g., processing orders)' },
                      { title: 'Consent', desc: 'Processing based on your explicit consent (e.g., marketing, analytics cookies)' },
                      { title: 'Legitimate Interests', desc: 'Processing for business interests (e.g., fraud prevention, security)' },
                      { title: 'Legal Obligation', desc: 'Processing required by law (e.g., tax records)' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-brand-blue/5 rounded-lg border-l-4 border-brand-teal">
                        <p className="text-brand-blue font-semibold mb-1">{item.title}</p>
                        <p className="text-brand-blue/70 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="sharing" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Globe className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      5. Data Sharing and Third Parties
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {[
                      { title: 'Payment Processors', desc: 'Stripe, PayPal' },
                      { title: 'Shipping Partners', desc: 'LP Express, Omniva, Venipak, DPD, DHL' },
                      { title: 'Analytics Services', desc: 'Google Analytics, Microsoft Clarity' },
                      { title: 'Marketing Platforms', desc: 'Meta (Facebook/Instagram)' },
                      { title: 'Cloud Services', desc: 'Hosting and infrastructure' },
                      { title: 'Legal Authorities', desc: 'When required by law' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                        <p className="text-brand-blue font-semibold mb-1">{item.title}</p>
                        <p className="text-brand-blue/70 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-brand-blue/80 text-sm">
                      <strong className="text-amber-800">Important:</strong> We do not sell your personal data. 
                      All third-party providers are contractually bound to protect your data.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section id="retention" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Clock className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      7. Data Retention
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { data: 'Account Data', period: 'While active + 3 years after deletion' },
                      { data: 'Order Data', period: '7 years (tax compliance)' },
                      { data: 'Marketing Data', period: 'Until consent withdrawn' },
                      { data: 'Analytics Data', period: 'Up to 26 months' },
                      { data: 'Communication Records', period: '3 years after last interaction' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                        <span className="text-brand-blue font-medium">{item.data}</span>
                        <span className="text-brand-blue/70 text-sm">{item.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="rights" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Shield className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      8. Your Rights Under GDPR
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {[
                      'Right of Access',
                      'Right to Rectification',
                      'Right to Erasure',
                      'Right to Restriction',
                      'Right to Data Portability',
                      'Right to Object',
                      'Right to Withdraw Consent',
                      'Right to Lodge a Complaint',
                    ].map((right, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5 rounded-lg border border-brand-teal/20">
                        <CheckCircle2 className="h-5 w-5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="text-brand-blue font-medium text-sm">{right}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4">
                    <p className="text-brand-blue/80 text-sm">
                      To exercise any of these rights, contact us at{' '}
                      <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">
                        support@focusrobin.com
                      </Link>
                      . We respond within 30 days.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="security" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Lock className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      9. Data Security
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      'SSL/TLS Encryption',
                      'PCI-DSS Compliant Payments',
                      'Regular Security Assessments',
                      'Access Controls',
                    ].map((measure, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                        <Lock className="h-5 w-5 text-brand-teal" />
                        <span className="text-brand-blue font-medium">{measure}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" className="scroll-mt-24">
                <div className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Eye className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      10. Cookies and Tracking Technologies
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-4">
                    We use cookies to enhance your experience, analyze traffic, and personalize content. 
                    Manage your preferences at any time through our{' '}
                    <Link href="/cookie-preferences" className="text-brand-teal hover:underline font-medium">
                      Cookie Preferences
                    </Link>{' '}
                    page.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact" className="scroll-mt-24">
                <div className="bg-gradient-to-br from-brand-blue/5 to-brand-teal/5 border border-brand-teal/20 rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-teal/10 rounded-lg">
                      <Mail className="h-6 w-6 text-brand-teal" />
                    </div>
                    <h2 className="text-2xl font-headline text-brand-blue">
                      14. Contact Us
                    </h2>
                  </div>
                  <p className="text-brand-blue/80 leading-relaxed mb-6">
                    Questions about this Privacy Policy or our data practices?
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-blue/10">
                      <Mail className="h-5 w-5 text-brand-teal" />
                      <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline font-medium">
                        support@focusrobin.com
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-blue/10">
                      <FileText className="h-5 w-5 text-brand-teal" />
                      <Link href="/contact" className="text-brand-teal hover:underline font-medium">
                        focusrobin.lt/contact
                      </Link>
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
