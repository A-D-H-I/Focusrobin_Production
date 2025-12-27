import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "./ShopPageClient";
import { Gender } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from 'next/cache';

// Force dynamic rendering to ensure filters work properly
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Shop Sunglasses',
  description: 'Browse our collection of premium polarized sunglasses. Fast shipping to Lithuania and EU/Schengen. Find your perfect style with UV400 protection.',
  alternates: {
    canonical: 'https://focusrobin.com/shop',
  },
};

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Prevent caching to ensure filters always work
  noStore();
  
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  // Get filters from URL
  const colorFilter = params.color as string | string[] | undefined; // Legacy single color filter
  const filterType = params.filter as string | undefined;
  const genderFilter = params.gender as string | string[] | undefined;
  const glassShapeFilter = params.glassShape as string | string[] | undefined;
  const materialFilter = params.material as string | string[] | undefined;
  const colorFilters = params.color as string | string[] | undefined; // New multi-color filter
  const minPriceParam = params.minPrice as string | undefined;
  const maxPriceParam = params.maxPrice as string | undefined;
  
  // Handle legacy single color filter (for backward compatibility)
  const legacyColorHex = typeof colorFilter === 'string' && !Array.isArray(colorFilter) 
    ? (colorFilter ? decodeURIComponent(colorFilter) : undefined)
    : undefined;

  // Build where clause for filtering
  const whereClause: any = {};
  const andConditions: any[] = [];

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

  // Filter by glass shape if provided
  if (glassShapeFilter) {
    const glassShapes = Array.isArray(glassShapeFilter) ? glassShapeFilter : [glassShapeFilter];
    if (glassShapes.length > 0) {
      // Normalize shapes: decode URL, replace hyphens with spaces, trim
      const normalizedShapes = glassShapes.map(shape => {
        const decoded = decodeURIComponent(shape);
        // Replace hyphens with spaces and normalize
        return decoded.replace(/-/g, ' ').trim();
      });
      
      if (normalizedShapes.length === 1) {
        whereClause.glassShape = {
          equals: normalizedShapes[0],
          mode: 'insensitive' as Prisma.QueryMode,
        };
      } else {
        // Multiple shapes - use OR
        andConditions.push({
          OR: normalizedShapes.map((shape) => ({
            glassShape: {
              equals: shape,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          })),
        });
      }
    }
  }

  // Filter by material if provided
  if (materialFilter) {
    const materials = Array.isArray(materialFilter) ? materialFilter : [materialFilter];
    if (materials.length > 0) {
      // Normalize materials: decode URL and trim
      const normalizedMaterials = materials.map(material => decodeURIComponent(material).trim());
      
      if (normalizedMaterials.length === 1) {
        whereClause.frameMaterial = {
          equals: normalizedMaterials[0],
          mode: 'insensitive' as Prisma.QueryMode,
        };
      } else {
        // Multiple materials - use OR
        andConditions.push({
          OR: normalizedMaterials.map((material) => ({
            frameMaterial: {
              equals: material,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          })),
        });
      }
    }
  }

  // Filter by frame color(s) if provided (before AND combination)
  const colorHexes: string[] = [];
  
  // Handle legacy single color filter
  if (legacyColorHex) {
    const normalized = legacyColorHex.startsWith('#') 
      ? legacyColorHex.toLowerCase() 
      : `#${legacyColorHex.toLowerCase()}`;
    colorHexes.push(normalized);
  }
  
  // Handle new multi-color filter
  if (colorFilters && Array.isArray(colorFilters)) {
    colorFilters.forEach((colorHex) => {
      const normalized = colorHex.startsWith('#') 
        ? colorHex.toLowerCase() 
        : `#${colorHex.toLowerCase()}`;
      if (!colorHexes.includes(normalized)) {
        colorHexes.push(normalized);
      }
    });
  } else if (colorFilters && typeof colorFilters === 'string') {
    const normalized = colorFilters.startsWith('#') 
      ? colorFilters.toLowerCase() 
      : `#${colorFilters.toLowerCase()}`;
    if (!colorHexes.includes(normalized)) {
      colorHexes.push(normalized);
    }
  }
  
  if (colorHexes.length > 0) {
    if (colorHexes.length === 1) {
      whereClause.ProductVariant = {
        some: {
          colorHex: colorHexes[0],
          stock: {
            gt: 0,
          },
        },
      };
    } else {
      // Multiple colors - need to use OR
      whereClause.ProductVariant = {
        some: {
          OR: colorHexes.map((hex) => ({
            colorHex: hex,
            stock: {
              gt: 0,
            },
          })),
        },
      };
    }
  }
  
  // Combine all AND conditions with existing whereClause
  // When we have OR conditions (multiple values), we need to wrap everything in AND
  if (andConditions.length > 0) {
    const directFilters: any = {};
    
    // Copy all direct filters (gender, single glassShape, single material, ProductVariant, filterType)
    if (whereClause.gender) directFilters.gender = whereClause.gender;
    if (whereClause.glassShape) directFilters.glassShape = whereClause.glassShape;
    if (whereClause.frameMaterial) directFilters.frameMaterial = whereClause.frameMaterial;
    if (whereClause.ProductVariant) directFilters.ProductVariant = whereClause.ProductVariant;
    if (whereClause.isNewlyAdded !== undefined) directFilters.isNewlyAdded = whereClause.isNewlyAdded;
    if (whereClause.isUniqueDesign !== undefined) directFilters.isUniqueDesign = whereClause.isUniqueDesign;
    
    // Combine all conditions
    const allConditions = [...andConditions];
    if (Object.keys(directFilters).length > 0) {
      allConditions.push(directFilters);
    }
    
    // Rebuild whereClause with AND wrapping everything
    Object.keys(whereClause).forEach(key => delete whereClause[key]);
    whereClause.AND = allConditions;
  }


  // Check if user has applied additional filters
  const hasAdditionalFilters = !!(glassShapeFilter || materialFilter || genderFilter || colorFilters || legacyColorHex);
  
  // Filter by type (new-arrivals, bestsellers) - BUT only if no additional filters are applied
  // This allows users to filter all products when they select specific criteria
  if (!hasAdditionalFilters) {
    if (filterType === 'new-arrivals') {
      whereClause.isNewlyAdded = true;
    } else if (filterType === 'bestsellers') {
      whereClause.isUniqueDesign = true;
    }
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

  // Filter by price range (after fetching, since we need to calculate final price)
  if (minPriceParam || maxPriceParam) {
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
    
    prismaProducts = prismaProducts.filter((product: any) => {
      const basePrice = Number(product.basePrice);
      const discountPct = product.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);
      
      if (minPrice !== undefined && finalPrice < minPrice) return false;
      if (maxPrice !== undefined && finalPrice > maxPrice) return false;
      return true;
    });
  }

  // Fallback for new-arrivals: if no products matched the combined filters
  if (filterType === 'new-arrivals' && prismaProducts.length === 0) {
    // Check if we have any additional filters applied
    const hasAdditionalFilters = glassShapeFilter || materialFilter || genderFilter || colorFilters || legacyColorHex;
    
    if (!hasAdditionalFilters) {
      // No additional filters, check if we have any newly added products at all
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
  }

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);
  
  // Products are already sorted by createdAt desc, which shows recently added first

  // Determine page title based on filter
  let pageTitle = "All Products";
  if (filterType === 'new-arrivals' && !hasAdditionalFilters) {
    pageTitle = "New Arrivals";
  } else if (filterType === 'bestsellers' && !hasAdditionalFilters) {
    pageTitle = "Best Sellers";
  } else if (hasAdditionalFilters) {
    pageTitle = "Filtered Products";
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <ShopPageClient products={products} title={pageTitle} />
        
        {/* Lithuanian SEO Content Block */}
        <section lang="lt" className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              Ieškote kokybiškų saulės akiniai internetu? Mūsų kolekcijoje rasite stilingus akiniai nuo saulės 
              su UV apsauga, kurie tinka tiek vyrams, tiek moterims. Visi mūsų polarizuoti saulės akiniai 
              yra suprojektuoti Lietuvoje ir atitinka aukščiausius kokybės standartus. Pristatome greitai 
              į Vilnių, Kauną, Klaipėdą ir visą EU/Schengen zoną. Raskite savo idealius akiniai su UV apsauga 
              mūsų internetinėje parduotuvėje.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
