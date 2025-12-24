import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "./ShopPageClient";
import { Gender } from "@prisma/client";
import type { Prisma } from "@prisma/client";

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  // Get filters from URL
  const colorFilter = params.color as string | undefined;
  const filterType = params.filter as string | undefined;
  const genderFilter = params.gender as string | string[] | undefined;
  const glassShapeFilter = params.glassShape as string | string[] | undefined;
  const colorHex = colorFilter ? decodeURIComponent(colorFilter) : undefined;

  // Build where clause for filtering
  const whereClause: any = {};

  // Filter by gender if provided
  if (genderFilter) {
    const genders = Array.isArray(genderFilter) ? genderFilter : [genderFilter];
    const genderEnums: Gender[] = [];
    
    // Map display names to enum values
    genders.forEach((g) => {
      const normalized = g.toLowerCase();
      if (normalized === 'men') genderEnums.push(Gender.MEN);
      else if (normalized === 'women') genderEnums.push(Gender.WOMEN);
      else if (normalized === 'kids') genderEnums.push(Gender.KIDS);
      else if (normalized === 'unisex') genderEnums.push(Gender.UNISEX);
    });
    
    if (genderEnums.length > 0) {
      whereClause.gender = {
        hasSome: genderEnums, // Products that have at least one of the selected genders
      };
    }
  }

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

  // Filter by glass shape if provided
  if (glassShapeFilter) {
    const glassShapes = Array.isArray(glassShapeFilter) ? glassShapeFilter : [glassShapeFilter];
    // Filter products where glassShape matches any of the selected shapes (case-insensitive)
    if (glassShapes.length > 0) {
      // Use OR for multiple shapes, or direct equals for single shape
      if (glassShapes.length === 1) {
        whereClause.glassShape = {
          equals: glassShapes[0],
          mode: 'insensitive' as Prisma.QueryMode,
        };
      } else {
        // For multiple shapes, use OR
        whereClause.OR = glassShapes.map((shape) => ({
          glassShape: {
            equals: shape,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        }));
      }
    }
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
  let pageTitle = "All Products";
  if (filterType === 'new-arrivals') {
    pageTitle = "New Arrivals";
  } else if (filterType === 'bestsellers') {
    pageTitle = "Best Sellers";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <ShopPageClient products={products} title={pageTitle} />
      </main>
      <Footer />
    </div>
  );
}
