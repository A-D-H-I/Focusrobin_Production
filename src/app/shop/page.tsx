import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "./ShopPageClient";
import type { Prisma } from "@prisma/client";

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Get filters from URL
  const colorFilter = searchParams.color as string | undefined;
  const filterType = searchParams.filter as string | undefined;
  const colorHex = colorFilter ? decodeURIComponent(colorFilter) : undefined;

  // Build where clause for filtering
  const whereClause: any = {};

  // Filter by frame color if provided
  if (colorHex) {
    // Normalize color hex (remove # if present, convert to lowercase)
    const normalizedColorHex = colorHex.startsWith('#') 
      ? colorHex.toLowerCase() 
      : `#${colorHex.toLowerCase()}`;
    
    whereClause.ProductVariant = {
      some: {
        colorHex: normalizedColorHex,
        stock: {
          gt: 0, // Only include variants with stock
        },
      },
    };
  }

  // Filter by type (new-arrivals, bestsellers)
  if (filterType === 'new-arrivals') {
    whereClause.isNewlyAdded = true;
  } else if (filterType === 'bestsellers') {
    whereClause.isUniqueDesign = true;
  }

  // Fetch products from database
  let prismaProducts = (await prisma.product.findMany({
    where: whereClause,
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

  // Fallback for new-arrivals: if no products marked as newly added, show recent products
  if (filterType === 'new-arrivals' && prismaProducts.length === 0) {
    const newlyAddedCount = await prisma.product.count({ where: { isNewlyAdded: true } });
    if (newlyAddedCount === 0) {
      // No products marked as newly added, show recent products instead
      prismaProducts = (await prisma.product.findMany({
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
        take: 20, // Show up to 20 recent products
      } as any)) as any;
    }
  }

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);
  
  // Products are already sorted by createdAt desc, which shows recently added first

  // Determine page title based on filter
  let pageTitle = "Best Sellers Glasses";
  if (filterType === 'new-arrivals') {
    pageTitle = "New Arrivals";
  } else if (filterType === 'bestsellers') {
    pageTitle = "Best Sellers";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-36 sm:pt-40 bg-background">
        <ShopPageClient products={products} title={pageTitle} />
      </main>
      <Footer />
    </div>
  );
}
