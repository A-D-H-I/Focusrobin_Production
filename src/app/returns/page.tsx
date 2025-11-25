import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";

export default function ReturnsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-4xl font-headline font-bold text-brand-blue mb-8">
            Returns and Refunds
          </h1>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4 text-brand-blue">
              1. Return Process
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              To initiate a return, contact <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">support@focusrobin.com</Link> for return instructions. Returns must be: Initiated within 14 days of delivery, Unused and in original condition, In original packaging with all accessories.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4 text-brand-blue">
              2. Refund Timeline
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              Refunds will be processed within 5 business days after receiving the returned product. The refund will be issued to the original payment method.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4 text-brand-blue">
              3. Return Shipping
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              Customers are responsible for return shipping costs unless the return is due to a defect or FocusRobin's error.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

