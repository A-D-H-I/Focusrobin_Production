import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import TryOnPageClient from "./TryOnPageClient";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TryOnPage() {
  try {
    // Fetch ALL products to show all models in sidebar
    // Users can still try-on only those with try-on images
    console.log('[Try-On] Starting to fetch products...');
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

    console.log(`[Try-On] Fetched ${prismaProducts.length} products`);
    
    if (prismaProducts.length === 0) {
      console.log('[Try-On] No products found');
    } else {
      console.log(`[Try-On] First product: ${prismaProducts[0]?.name}, variants: ${prismaProducts[0]?.ProductVariant?.length || 0}`);
    }

    // Map Prisma products to frontend Product type
    console.log('[Try-On] Starting to map products...');
    const products = prismaProducts.map((product: any, index: number) => {
      try {
        return mapPrismaProductToProduct(product);
      } catch (mapError) {
        console.error(`[Try-On] Error mapping product ${index} (${product?.name || 'unknown'}):`, mapError);
        throw mapError;
      }
    });

    console.log(`[Try-On] Successfully mapped ${products.length} products`);

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
    console.error('[Try-On] Error loading try-on page:', error);
    console.error('[Try-On] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
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

