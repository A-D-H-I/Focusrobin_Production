import { Logo } from "@/components/Landing/logo";
import { Instagram, RotateCcw, ShieldCheck, Lock, Camera, Truck } from "lucide-react";
import Link from 'next/link';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaApplePay, FaGooglePay, FaFacebook } from 'react-icons/fa';
import { SiKlarna, SiShopify } from 'react-icons/si';
import { NewsletterForm } from "./newsletter-form";

export default function Footer() {
  const paymentMethods = [
    { name: 'Visa', icon: FaCcVisa, hasIcon: true },
    { name: 'Mastercard', icon: FaCcMastercard, hasIcon: true },
    { name: 'Maestro', icon: FaCcMastercard, hasIcon: true }, // Maestro uses Mastercard branding
    { name: 'American Express', icon: FaCcAmex, hasIcon: true },
    { name: 'PayPal', icon: FaPaypal, hasIcon: true },
    { name: 'Apple Pay', icon: FaApplePay, hasIcon: true },
    { name: 'Google Pay', icon: FaGooglePay, hasIcon: true },
    { name: 'Klarna', icon: SiKlarna, hasIcon: true },
    { name: 'Shop Pay', icon: SiShopify, hasIcon: true },
    { name: 'iDEAL', hasIcon: false },
    { name: 'Bancontact', hasIcon: false },
    { name: 'Blik', hasIcon: false },
    { name: 'UnionPay', hasIcon: false }
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Features Banner */}
      <div className="bg-secondary border-b border-border py-4 sm:py-5 md:py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 lg:gap-4">
            {/* 14 Day Return */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight break-words">
                  Return in 14 Days
                </p>
                <Link href="/returns" className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-brand-blue transition-colors block mt-0.5 sm:mt-1">
                  (Terms & Refunds)
                </Link>
              </div>
            </div>

            {/* 100% Secure Payment */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight break-words">
                  100% Secure Payment
                </p>
              </div>
            </div>

            {/* 1 Year Warranty */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight break-words">
                  1 Year Warranty
                </p>
              </div>
            </div>

            {/* Virtual Try-On */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight break-words">
                  Virtual Try-On
                </p>
              </div>
            </div>

            {/* Free Delivery */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-center sm:justify-start py-1">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-bold text-brand-blue uppercase leading-tight break-words">
                  Free Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm">
              Elevate Your Style, Enhance Your Vision.
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
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Sunglasses</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Bestsellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">Help & Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Help & Guides</Link></li>
              <li><Link href="/faq" prefetch={true} className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/terms" prefetch={true} className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/warranty" prefetch={true} className="hover:text-primary transition-colors">Terms of Warranty</Link></li>
              <li><Link href="/returns" prefetch={true} className="hover:text-primary transition-colors">Returns and Refunds</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">Newsletter</h4>
            <p className="text-sm mb-4">
              Join our list for exclusive offers and new product alerts.
            </p>
            <NewsletterForm />
          </div>
        </div>
        
        {/* Payment Methods Section */}
        <div className="border-t border-border mt-8 pt-6">
          <h4 className="text-sm font-semibold mb-4 text-center">
            We Accept
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

        <div className="border-t border-border mt-6 pt-6 text-center text-sm">
          <p>&copy; MB Focusrobin optika 2025, all rights reserved</p>
        </div>
      </div>
      </div>
    </footer>
  );
}
