"use client";

import { Logo } from "@/components/Landing/logo";
import { Instagram, RotateCcw, ShieldCheck, Lock, Truck } from "lucide-react";
import Link from 'next/link';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaApplePay, FaGooglePay, FaFacebook } from 'react-icons/fa';
import { NewsletterForm } from "./newsletter-form";
import TranslatableText from "@/components/ui/TranslatableText";

export default function Footer() {
  const paymentMethods = [
    { name: 'Visa', icon: FaCcVisa, hasIcon: true },
    { name: 'Mastercard', icon: FaCcMastercard, hasIcon: true },
    { name: 'Maestro', icon: FaCcMastercard, hasIcon: true }, // Maestro uses Mastercard branding
    { name: 'American Express', icon: FaCcAmex, hasIcon: true },
    { name: 'PayPal', icon: FaPaypal, hasIcon: true },
    { name: 'Apple Pay', icon: FaApplePay, hasIcon: true },
    { name: 'Google Pay', icon: FaGooglePay, hasIcon: true }
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground relative z-10">
      {/* Features Banner */}
      <div className="bg-secondary border-b border-border py-4 sm:py-5 md:py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* 14 Day Return */}
            <div className="flex items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1 overflow-hidden">
              <div className="flex-shrink-0">
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight">
                  <TranslatableText text="Return in 14 Days" />
                </p>
                <Link href="/returns" className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-brand-blue transition-colors block mt-0.5">
                  <TranslatableText text="(Terms & Refunds)" />
                </Link>
              </div>
            </div>

            {/* 100% Secure Payment */}
            <div className="flex items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1 overflow-hidden">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight">
                  <TranslatableText text="100% Secure Payment" />
                </p>
              </div>
            </div>

            {/* 2 Year Warranty */}
            <div className="flex items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1 overflow-hidden">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight">
                  <TranslatableText text="2 Year Warranty for FocusRobin Glasses" />
                </p>
              </div>
            </div>

            {/* Free Delivery */}
            <div className="flex items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1 overflow-hidden">
              <div className="flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight">
                  <TranslatableText text="Free Delivery" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 relative z-10">
              <div className="relative z-[101]">
                <Logo />
              </div>
              <p className="mt-4 text-sm">
                <TranslatableText text="Elevate Your Style, Enhance Your Vision." />
              </p>
              <div className="flex space-x-4 mt-4">
                <Link
                  href="https://www.instagram.com/focus.robin"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6 hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="https://www.facebook.com/share/1HKTxzU7XP/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebook className="h-6 w-6 hover:text-primary transition-colors" />
                </Link>

              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                <TranslatableText text="Chemijos St. 27C-62, LT-51332 Kaunas" />
              </p>
            </div>

            <div>
              <h4 className="font-bold font-headline mb-4"><TranslatableText text="Shop" /></h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop" className="hover:text-primary transition-colors"><TranslatableText text="Sunglasses" /></Link></li>
                <li><Link href="/shop?filter=new-arrivals" className="hover:text-primary transition-colors"><TranslatableText text="New Arrivals" /></Link></li>
                <li><Link href="/shop?filter=bestsellers" className="hover:text-primary transition-colors"><TranslatableText text="Bestsellers" /></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold font-headline mb-4"><TranslatableText text="Help & Support" /></h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="FAQs" /></Link></li>
                <li><Link href="/terms" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="Terms of Service" /></Link></li>
                <li><Link href="/warranty" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="Terms of Warranty" /></Link></li>
                <li><Link href="/returns" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="Returns and Refunds" /></Link></li>
                <li><Link href="/privacy" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="Privacy Policy" /></Link></li>
                <li><Link href="/cookie-preferences" prefetch={true} className="hover:text-primary transition-colors"><TranslatableText text="Cookie Preferences" /></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold font-headline mb-4"><TranslatableText text="Newsletter" /></h4>
              <p className="text-sm mb-4">
                <TranslatableText text="Join our list for exclusive offers and new product alerts." />
              </p>
              <NewsletterForm />
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="border-t border-border mt-8 pt-6">
            <h4 className="text-brand-h4 font-headline mb-4 text-center">
              <TranslatableText text="We Accept" />
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {paymentMethods.map((method) => {
                if (method.hasIcon && method.icon) {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.name}
                      className="px-4 py-3 bg-white rounded-md border border-gray-100 shadow-sm flex items-center justify-center"
                    >
                      <IconComponent size={28} className="text-brand-blue" />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={method.name}
                      className="px-4 py-3 bg-white rounded-md border border-gray-100 shadow-sm flex items-center justify-center"
                    >
                      <span className="text-xl font-bold text-brand-blue leading-none">{method.name}</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* SEO Content Section - Visible text for SEO */}
          <div className="border-t border-border mt-8 pt-6">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-base font-headline mb-3 text-secondary-foreground/80">
                FocusRobin - Premium Sunglasses & Prescription Glasses Lithuania
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Shop FocusRobin for premium sunglasses and prescription glasses in Lithuania.
                Fast delivery to Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys and across the EU.
                Our collection features polarized UV400 sunglasses, designer eyewear, and quality prescription glasses online.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Saulės akiniai internetu | Korekciniai akiniai Lietuva | Akiniai su dioptrijomis |
                Polarizuoti akiniai | Akiniai vyrams ir moterims | Optika internetu
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                FocusRobin Lithuania | Buy sunglasses online Lithuania | Buy prescription glasses online Lithuania |
                Sunglasses Vilnius | Sunglasses Kaunas | Prescription glasses Vilnius | Eyewear shop Lithuania |
                Best sunglasses Lithuania | Premium eyewear EU shipping
              </p>
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-6 text-center text-sm">
            <p>&copy; MB Focusrobin optika 2025, all rights reserved</p>
          </div>
        </div>
      </div>
    </footer >
  );
}
