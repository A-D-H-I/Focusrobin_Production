import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import Link from "next/link";

export default function WarrantyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <h1 className="text-4xl font-headline font-bold text-brand-blue mb-8">
            Warranty and Repairs
          </h1>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4 text-brand-blue">
              1. Warranty Coverage
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              FocusRobin provides a one-year warranty against manufacturing defects from the date of purchase. This warranty covers: Manufacturing defects, Material defects, Frame adjustments.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4 text-brand-blue">
              2. Repair Services
            </h2>
            <p className="text-brand-blue/80 leading-relaxed mb-6">
              We offer lens replacement and frame repairs for FocusRobin products under warranty. Contact <Link href="mailto:support@focusrobin.com" className="text-brand-teal hover:underline">support@focusrobin.com</Link> for repair service requests.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

