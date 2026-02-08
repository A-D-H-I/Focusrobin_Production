import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";
import { Trash2, Mail, Shield, AlertCircle, CheckCircle2, FileText, User, Database } from 'lucide-react';
import TranslatableText from "@/components/ui/TranslatableText";

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | FocusRobin',
  description: 'Learn how to request deletion of your personal data from FocusRobin. GDPR compliant data deletion process for users in Lithuania and the EU.',
  keywords: [
    'data deletion',
    'GDPR',
    'delete account',
    'privacy rights',
    'data protection',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/data-deletion',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/data-deletion',
    siteName: 'FocusRobin',
    title: 'Data Deletion Instructions | FocusRobin Lithuania',
    description: 'Request deletion of your personal data from FocusRobin. GDPR compliant process.',
  },
};

export default function DataDeletionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-blue/5 via-brand-teal/5 to-brand-blue/5 border-b border-brand-blue/10">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand-teal/10 rounded-xl">
                <Trash2 className="h-8 w-8 text-brand-teal" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-headline text-brand-blue mb-2">
                  <TranslatableText text="Data Deletion Instructions" />
                </h1>
                <p className="text-brand-blue/60 text-sm">
                  <TranslatableText text="Last updated: January 2026" />
                </p>
              </div>
            </div>
            <p className="text-lg text-brand-blue/80 max-w-3xl leading-relaxed">
              <TranslatableText text="Under GDPR and Lithuanian data protection laws, you have the right to request deletion of your personal data. This page explains how to request data deletion from FocusRobin." />
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* How to Request Deletion */}
          <section className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <User className="h-6 w-6 text-brand-teal" />
              </div>
              <h2 className="text-2xl font-headline text-brand-blue">
                <TranslatableText text="How to Request Data Deletion" />
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-brand-blue/5 rounded-lg border-l-4 border-brand-teal">
                <h3 className="text-lg font-semibold text-brand-blue mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-teal" />
                  <TranslatableText text="Option 1: Delete Your Account (Recommended)" />
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-brand-blue/80 ml-7">
                  <li><TranslatableText text="Log in to your FocusRobin account" /></li>
                  <li><TranslatableText text="Go to your Account Settings page" /></li>
                  <li><TranslatableText text="Scroll to the 'Delete Account' section" /></li>
                  <li><TranslatableText text="Click 'Delete Account' and confirm" /></li>
                  <li><TranslatableText text="All your personal data will be permanently deleted" /></li>
                </ol>
                <div className="mt-4 p-4 bg-white rounded-lg border border-brand-teal/20">
                  <p className="text-sm text-brand-blue/70">
                    <strong className="text-brand-blue"><TranslatableText text="Note:" /></strong> <TranslatableText text="Account deletion is immediate and cannot be undone. All your orders, reviews, and account data will be permanently removed." />
                  </p>
                </div>
              </div>

              <div className="p-6 bg-brand-blue/5 rounded-lg border-l-4 border-brand-blue">
                <h3 className="text-lg font-semibold text-brand-blue mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-brand-blue" />
                  <TranslatableText text="Option 2: Request via Email" />
                </h3>
                <p className="text-brand-blue/80 mb-4">
                  <TranslatableText text="If you cannot access your account or prefer to request deletion via email:" />
                </p>
                <div className="bg-white rounded-lg p-4 border border-brand-blue/10">
                  <p className="text-brand-blue font-semibold mb-2"><TranslatableText text="Send an email to:" /></p>
                  <a 
                    href="mailto:privacy@focusrobin.lt" 
                    className="text-brand-teal hover:underline text-lg font-medium"
                  >
                    privacy@focusrobin.lt
                  </a>
                  <p className="text-brand-blue/70 text-sm mt-3">
                    <TranslatableText text="Include the following information:" />
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-brand-blue/70 text-sm mt-2 ml-4">
                    <li><TranslatableText text="Subject line: 'Data Deletion Request'" /></li>
                    <li><TranslatableText text="Your full name" /></li>
                    <li><TranslatableText text="Email address associated with your account" /></li>
                    <li><TranslatableText text="Clear statement requesting data deletion" /></li>
                  </ul>
                </div>
                <p className="text-sm text-brand-blue/60 mt-4">
                  <TranslatableText text="We will process your request within 30 days as required by GDPR." />
                </p>
              </div>
            </div>
          </section>

          {/* What Data is Deleted */}
          <section className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Database className="h-6 w-6 text-brand-teal" />
              </div>
              <h2 className="text-2xl font-headline text-brand-blue">
                <TranslatableText text="What Data Will Be Deleted" />
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Account Information', items: ['Email address', 'Name', 'Password (hashed)', 'Profile image'] },
                { title: 'Order History', items: ['All order records', 'Shipping addresses', 'Billing information'] },
                { title: 'Shopping Data', items: ['Cart items', 'Wishlist items', 'Saved preferences'] },
                { title: 'User Content', items: ['Product reviews', 'Ratings', 'Uploaded images'] },
                { title: 'Wallet & Transactions', items: ['Wallet balance', 'Transaction history', 'Cashback records'] },
                { title: 'Authentication Data', items: ['OAuth connections', 'Session tokens', 'Login history'] },
              ].map((category, idx) => (
                <div key={idx} className="p-4 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                  <h3 className="font-semibold text-brand-blue mb-2">{category.title}</h3>
                  <ul className="space-y-1">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-sm text-brand-blue/70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-teal"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Data Retention Exceptions */}
          <section className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-2xl font-headline text-brand-blue">
                <TranslatableText text="Data Retention Exceptions" />
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-brand-blue/80">
                <TranslatableText text="Some data may be retained for legal or business purposes, as permitted by GDPR:" />
              </p>
              <div className="space-y-3">
                {[
                  { 
                    title: 'Legal Obligations', 
                    desc: 'Financial records (orders, payments) may be retained for tax and accounting purposes as required by Lithuanian law (typically 10 years).' 
                  },
                  { 
                    title: 'Fraud Prevention', 
                    desc: 'Transaction records may be retained to prevent fraud and comply with anti-money laundering regulations.' 
                  },
                  { 
                    title: 'Dispute Resolution', 
                    desc: 'Order and transaction data may be retained to resolve disputes or claims.' 
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                    <p className="text-brand-blue font-semibold mb-1">{item.title}</p>
                    <p className="text-brand-blue/70 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Processing Time */}
          <section className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <FileText className="h-6 w-6 text-brand-teal" />
              </div>
              <h2 className="text-2xl font-headline text-brand-blue">
                <TranslatableText text="Processing Time" />
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-brand-teal/5 rounded-lg border border-brand-teal/20">
                <p className="text-brand-blue/80 mb-2">
                  <TranslatableText text="We will process your data deletion request within 30 days of receipt, as required by GDPR Article 17." />
                </p>
                <p className="text-brand-blue/70 text-sm">
                  <TranslatableText text="You will receive a confirmation email once your data has been deleted. If we need to retain any data for legal reasons, we will inform you of what data is retained and why." />
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white border border-brand-blue/10 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Shield className="h-6 w-6 text-brand-teal" />
              </div>
              <h2 className="text-2xl font-headline text-brand-blue">
                <TranslatableText text="Contact Us" />
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-brand-blue/80">
                <TranslatableText text="For questions about data deletion or your privacy rights, please contact us:" />
              </p>
              <div className="bg-brand-blue/5 rounded-lg p-6 border border-brand-blue/10">
                <p className="text-brand-blue font-semibold mb-2"><TranslatableText text="Data Protection Officer" /></p>
                <p className="text-brand-blue/80 mb-1"><TranslatableText text="Email:" /> <a href="mailto:privacy@focusrobin.lt" className="text-brand-teal hover:underline">privacy@focusrobin.lt</a></p>
                <p className="text-brand-blue/80"><TranslatableText text="Company:" /> MB Focusrobin optika</p>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <div className="mt-8 p-6 bg-brand-blue/5 rounded-xl border border-brand-blue/10">
            <h3 className="font-semibold text-brand-blue mb-4"><TranslatableText text="Related Information" /></h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="text-brand-teal hover:underline flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <TranslatableText text="Privacy Policy" />
              </Link>
              <Link href="/terms" className="text-brand-teal hover:underline flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <TranslatableText text="Terms of Service" />
              </Link>
              <Link href="/account" className="text-brand-teal hover:underline flex items-center gap-2">
                <User className="h-4 w-4" />
                <TranslatableText text="My Account" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


