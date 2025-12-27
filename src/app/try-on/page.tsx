import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import TryOnPageClient from "./TryOnPageClient";

export default async function TryOnPage() {
  try {
    // Fetch ALL products to show all models in sidebar
    // Users can still try-on only those with try-on images
    const prismaProducts = (await prisma.product.findMany({
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    } as any)) as any;

    // Map Prisma products to frontend Product type
    const products = prismaProducts.map(mapPrismaProductToProduct);

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
          <TryOnPageClient products={products} />
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading try-on page:', error);
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-brand-h1 font-headline text-foreground mb-4">
                Error Loading Try-On Page
              </h1>
              <p className="text-muted-foreground">
                Please try again later or contact support if the problem persists.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
}

