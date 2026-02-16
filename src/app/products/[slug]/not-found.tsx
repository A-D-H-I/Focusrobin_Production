import Link from "next/link";
import Footer from "@/components/Landing/footer";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-brand-h1 font-headline mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/shop" 
            prefetch={true} 
            className="text-primary hover:underline inline-block"
          >
            Back to Shop
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

