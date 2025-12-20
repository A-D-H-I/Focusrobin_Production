import { notFound } from 'next/navigation';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

export default async function CustomShopPage({ params }: { params: { slug: string } }) {
  // Decode the slug
  const decodedSlug = decodeURIComponent(params.slug);
  
  // Fetch custom shop page from database
  let customPage: any = null;
  try {
    // @ts-ignore
    if (prisma.customShopPage && typeof prisma.customShopPage.findUnique === 'function') {
      // @ts-ignore
      customPage = await prisma.customShopPage.findUnique({
        where: { slug: decodedSlug },
      });
    }
  } catch (error) {
    console.error('Error fetching custom shop page:', error);
  }

  // If page doesn't exist or is not visible, return 404
  if (!customPage || !customPage.isVisible) {
    notFound();
  }

  // Fetch products by their slugs
  const productSlugs = customPage.products || [];
  let prismaProducts: any[] = [];
  
  if (productSlugs.length > 0) {
    try {
      prismaProducts = await prisma.product.findMany({
        where: {
          slug: {
            in: productSlugs,
          },
        },
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
      });
    } catch (error) {
      console.error('Error fetching products for custom shop page:', error);
    }
  }

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);

  // Banner data
  const bannerTitle = customPage.name;
  const bannerDescription = customPage.description || '';
  const bannerImage = normalizeImageUrl(customPage.bannerImage);
  const bannerAlt = customPage.name || 'Shop page banner';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-36 sm:pt-40 bg-background">
        {/* Banner */}
        <CategoryBanner
          title={bannerTitle}
          imageSrc={bannerImage}
          description={bannerDescription}
          alt={bannerAlt}
        />

        {/* Video Section */}
        {customPage.videoUrl && (
          <section className="w-full py-12 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {customPage.videoUrl.includes('youtube.com') || customPage.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={customPage.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title={customPage.name}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={customPage.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Products Grid */}
        <div className="bg-background py-8">
          <div className="container mx-auto px-4">
            {products.length > 0 ? (
              <ShopPageClient products={products} title={customPage.name} />
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No products found for this page.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

