import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "./ShopPageClient";
import { Gender } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from 'next/cache';
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { getAvailableGlassShapes } from "@/app/actions/getAvailableGlassShapes";
import { getAvailableGenderCounts } from "@/app/actions/getAvailableGenderCounts";
import { getAvailableMaterials } from "@/app/actions/getAvailableMaterials";
import { getAvailableFrameColors } from "@/app/actions/getAvailableColors";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";

// Force dynamic rendering to ensure filters work properly
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Shop Sunglasses & Prescription Glasses Online | FocusRobin Lithuania',
  description: 'Shop FocusRobin sunglasses and prescription glasses online in Lithuania. Premium polarized eyewear with UV400 protection. Fast delivery to Vilnius, Kaunas, Klaipėda & EU. Best prices on designer sunglasses. Saulės akiniai ir korekciniai akiniai internetu Lietuvoje.',
  keywords: [
    // Brand + Shop
    'FocusRobin shop',
    'FocusRobin sunglasses shop',
    'FocusRobin prescription glasses shop',
    'buy FocusRobin sunglasses',
    'buy FocusRobin glasses',
    // English Shop Keywords
    'sunglasses shop Lithuania',
    'prescription glasses shop Lithuania',
    'buy sunglasses online Lithuania',
    'buy prescription glasses online Lithuania',
    'eyewear shop Lithuania',
    'optical shop Lithuania',
    'sunglasses store Lithuania',
    'glasses store Lithuania',
    'polarized sunglasses shop',
    'UV400 sunglasses shop',
    'designer sunglasses Lithuania',
    'premium eyewear Lithuania',
    'affordable sunglasses Lithuania',
    'best sunglasses Lithuania',
    // Lithuanian Keywords
    'saulės akiniai',
    'saulės akiniai internetu',
    'korekciniai akiniai',
    'korekciniai akiniai internetu',
    'akiniai internetu',
    'akinių parduotuvė',
    'optika internetu',
    'pigūs saulės akiniai',
    'kokybiški akiniai',
    // Geo-targeted
    'sunglasses Vilnius',
    'sunglasses Kaunas',
    'prescription glasses Vilnius',
    'eyewear Vilnius',
    'saulės akiniai Vilnius',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/shop',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/shop',
    siteName: 'FocusRobin',
    title: 'Shop Sunglasses & Prescription Glasses Online | FocusRobin Lithuania',
    description: 'Shop FocusRobin premium polarized sunglasses and prescription glasses online. Fast delivery to Vilnius, Kaunas, Klaipėda & EU. Best eyewear prices in Lithuania.',
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
  const brandFilter = params.brand as string | string[] | undefined;
  const colorFilters = params.color as string | string[] | undefined; // New multi-color filter
  const minPriceParam = params.minPrice as string | undefined;
  const maxPriceParam = params.maxPrice as string | undefined;
  const searchQuery = params.search as string | undefined;

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

  // Filter by brand if provided
  if (brandFilter) {
    const brands = Array.isArray(brandFilter) ? brandFilter : [brandFilter];
    if (brands.length > 0) {
      const normalizedBrands = brands.map(brand => decodeURIComponent(brand).trim());
      if (normalizedBrands.length === 1) {
        whereClause.brand = {
          equals: normalizedBrands[0],
          mode: 'insensitive' as Prisma.QueryMode,
        };
      } else {
        andConditions.push({
          OR: normalizedBrands.map((brand) => ({
            brand: {
              equals: brand,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          })),
        });
      }
    }
  }

  // Filter by frame color(s) if provided (before AND combination)
  const colorHexes: string[] = [];
  const colorFamilies: string[] = [];

  // Helper to process color input
  const processColor = (val: string) => {
    const decoded = decodeURIComponent(val).trim();
    if (decoded.startsWith('#')) {
      // It's a hex code
      const normalized = decoded.toLowerCase();
      if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
    } else {
      // It's likely a color family name (e.g. "Blue", "Tortoise")
      // Check if it's a valid hex without # (e.g. "000000")
      const isHex = /^[0-9A-Fa-f]{6}$/i.test(decoded);
      if (isHex) {
        const normalized = `#${decoded.toLowerCase()}`;
        if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
      } else {
        // It's a family name
        if (!colorFamilies.includes(decoded)) colorFamilies.push(decoded);
      }
    }
  };

  // Handle legacy single color filter
  if (colorFilter) {
    if (Array.isArray(colorFilter)) {
      colorFilter.forEach(processColor);
    } else {
      processColor(colorFilter);
    }
  }

  // Handle new multi-color filter
  if (colorFilters) {
    if (Array.isArray(colorFilters)) {
      colorFilters.forEach(processColor);
    } else {
      processColor(colorFilters);
    }
  }

  if (colorHexes.length > 0 || colorFamilies.length > 0) {
    const colorConditions: any[] = [];

    if (colorHexes.length > 0) {
      colorConditions.push(...colorHexes.map(hex => ({
        colorHex: hex,
        stock: { gt: 0 }
      })));
    }

    if (colorFamilies.length > 0) {
      colorConditions.push(...colorFamilies.map(family => ({
        colorFamily: {
          equals: family,
          mode: 'insensitive' as Prisma.QueryMode
        },
        stock: { gt: 0 }
      })));
    }

    whereClause.ProductVariant = {
      some: {
        OR: colorConditions
      }
    };
  }

  // Add search condition if provided
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.trim();
    const searchCondition = {
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
        {
          Category: {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        },
        {
          ProductVariant: {
            some: {
              name: {
                contains: searchTerm,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
        },
      ],
    };

    // If there are other filters, add search to AND conditions
    // Otherwise, use search OR directly in whereClause
    const hasOtherFilters = andConditions.length > 0 ||
      whereClause.gender ||
      whereClause.glassShape ||
      whereClause.frameMaterial ||
      whereClause.ProductVariant ||
      whereClause.isNewlyAdded !== undefined ||
      whereClause.isUniqueDesign !== undefined;

    if (hasOtherFilters) {
      andConditions.push(searchCondition);
    } else {
      whereClause.OR = searchCondition.OR;
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

  // Fetch products and filters in parallel
  const [
    prismaProductsResult,
    priceRange,
    glassShapes,
    genderCounts,
    materials,
    colors,
    sgBrands
  ] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        discountPct: true,
        averageRating: true,
        reviewCount: true,
        isNewlyAdded: true,
        isUniqueDesign: true,
        // price removed
        Category: {
          select: {
            name: true
          }
        },
        ProductVariant: {
          take: 20, // Take more variants to show color options
          select: {
            id: true,
            name: true,
            // price removed
            stock: true,
            colorHex: true,
            colorName: true,
            ProductAsset: {
              take: 5, // Take more assets to ensure we get HOVER/GALLERY images
              select: {
                url: true,
                isPrimary: true,
                type: true // Required for mapper to identify HOVER/GALLERY images
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Safety limit
    }),
    getPriceRange(),
    getAvailableGlassShapes(),
    getAvailableGenderCounts(),
    getAvailableMaterials(),
    getAvailableFrameColors(),
    getAvailableBrands('sunglasses'),
  ]);

  const brands = sgBrands;

  let prismaProducts = prismaProductsResult as any;

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
  if (searchQuery && searchQuery.trim()) {
    pageTitle = `Search Results for "${searchQuery.trim()}"`;
  } else if (filterType === 'new-arrivals' && !hasAdditionalFilters) {
    pageTitle = "New Arrivals";
  } else if (filterType === 'bestsellers' && !hasAdditionalFilters) {
    pageTitle = "Best Sellers";
  } else if (hasAdditionalFilters) {
    pageTitle = "Filtered Products";
  }

  // Build JSON-LD structured data for CollectionPage with ItemList
  const baseUrl = 'https://focusrobin.lt';
  const itemListElement = products.map((product: any, index: number) => {
    const prismaProduct = prismaProducts[index];
    const productSlug = prismaProduct?.slug || '';
    const productUrl = `${baseUrl}/shop/${productSlug}`;

    // Get product image (use first variant thumbnail)
    let productImage: string | undefined;
    if (product.variants && product.variants.length > 0 && product.variants[0].thumbnail) {
      const normalized = normalizeImageUrl(product.variants[0].thumbnail);
      productImage = normalized.startsWith('http')
        ? normalized
        : `${baseUrl}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
    }

    const listItem: any = {
      '@type': 'ListItem',
      position: index + 1,
      url: productUrl,
      name: product.name,
    };

    // Only include image if available
    if (productImage) {
      listItem.image = productImage;
    }

    return listItem;
  });

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    url: `${baseUrl}/shop`,
    description: 'Browse our collection of premium polarized sunglasses and prescription glasses. Fast shipping to Lithuania and EU/Schengen.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: itemListElement,
    },
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background overflow-x-hidden">
        <ShopPageClient
          products={products}
          title={pageTitle}
          searchQuery={searchQuery}
          priceRange={priceRange}
          glassShapes={glassShapes}
          genderCounts={genderCounts}
          materials={materials}
          colors={colors}
          brands={brands}
        />

        {/* Lithuanian SEO Content Block */}
        <section lang="lt" className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              Ieškote kokybiškų saulės akinių ar korekcinių akinių internetu? Mūsų kolekcijoje rasite
              stilingus akinius nuo saulės su UV apsauga ir kokybiškus akinius su dioptrijomis, kurie
              tinka tiek vyrams, tiek moterims. Visi mūsų polarizuoti saulės akiniai ir receptiniai
              akiniai yra suprojektuoti Lietuvoje ir atitinka aukščiausius kokybės standartus.
              Pristatome greitai į Vilnių, Kauną, Klaipėdą ir visą EU/Schengen zoną. Raskite savo
              idealius akinius mūsų internetinėje parduotuvėje.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
