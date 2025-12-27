import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              These Terms of Service ("Terms") govern your use of FocusRobin's website, products, and services. By accessing our website or making a purchase, you agree to these Terms. Please read them carefully.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              1. Account and Eligibility
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              To make purchases from FocusRobin, you must be at least 18 years old or have a guardian's permission. For customers under 18, a guardian must confirm the order and provide their contact information during checkout. FocusRobin reserves the right to refuse service, terminate accounts, or cancel orders at our discretion.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              2. Products and Pricing
            </h2>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              2.1 Product Information
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              All product descriptions, specifications, and prices are subject to change without notice. While we strive to display accurate product information, slight variations in color, material, or measurements may occur.
            </p>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              2.2 Pricing
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              All prices are listed in euros and include applicable VAT. Payments are processed securely through the Stripe payment gateway. FocusRobin reserves the right to change prices at any time.
            </p>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              2.3 Bulk Orders
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              For bulk orders, please contact <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">support@focusrobin.com</Link> with the subject "Enquiry for Bulk Order". Special pricing and terms may apply to bulk orders, which will be communicated separately.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              3. Shipping and Delivery
            </h2>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              3.1 Shipping Carriers
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              We use the following carriers for delivery: LP Express, Omniva, Venipak, DPD (Lithuania, Latvia, Estonia) and DHL (International).
            </p>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              3.2 Delivery Times
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              Lithuania: 1-3 business days; Latvia and Estonia: 2-4 business days; International: 2-6 business days.
            </p>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              3.3 Order Processing
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              Orders are typically processed within 48 hours. FocusRobin is not responsible for delays caused by customs, weather conditions, or other circumstances beyond our control.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              4. Privacy and Data Collection
            </h2>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              4.1 Data Collection
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-4">
              We collect and process personal data under our Privacy Policy and applicable laws. This includes: Order information, Contact details, Payment information, Shopping preferences.
            </p>
            <h3 className="text-brand-h3 font-headline mt-6 mb-3 text-brand-blue">
              4.2 Marketing Communications
            </h3>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              With your consent, we may send you newsletters and marketing communications. You can opt out at any time.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              5. Try-On Service
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              Customers may visit our administrative office to try on products by appointment. Contact <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">support@focusrobin.com</Link> to schedule a visit. Products must be retrieved from our warehouse before the appointment.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              6. Intellectual Property
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              All content on the FocusRobin website, including text, graphics, logos, and images, is protected by intellectual property rights and may not be used without permission.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              7. Limitation of Liability
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              FocusRobin's liability is limited to the purchase price of the product. We are not liable for: Indirect or consequential damages, Lost profits, Business interruption, Personal injury from product misuse.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              8. Changes to Terms
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              FocusRobin reserves the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website.
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              9. Contact Information
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              For questions about these Terms, please contact: Email: <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">support@focusrobin.com</Link>
            </p>

            <h2 className="text-brand-h2 font-headline mt-8 mb-4 text-brand-blue">
              10. Governing Law
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              These Terms are governed by Lithuanian law. Any disputes shall be resolved in the courts of Lithuania.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

