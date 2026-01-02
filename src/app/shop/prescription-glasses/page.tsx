import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaPrescriptionGlassesToProduct } from "@/lib/prisma-prescription-glasses-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { Gender } from "@prisma/client";
import { unstable_noStore as noStore } from 'next/cache';

// Force dynamic rendering to ensure filters work properly
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PrescriptionGlassesShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PrescriptionGlassesShopPage({ searchParams }: PrescriptionGlassesShopPageProps) {
  // Prevent caching to ensure filters always work
  noStore();
  
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  // Get filters from URL
  const genderFilter = params.gender as string | string[] | undefined;
  const glassShapeFilter = params.glassShape as string | string[] | undefined;
  const materialFilter = params.material as string | string[] | undefined;
  const colorFilters = params.color as string | string[] | undefined;
  const minPriceParam = params.minPrice as string | undefined;
  const maxPriceParam = params.maxPrice as string | undefined;

  // Build where clause for prescription glasses
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
        hasSome: genderEnums,
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
          mode: 'insensitive' as any,
        };
      } else {
        // Multiple shapes - use OR
        andConditions.push({
          OR: normalizedShapes.map((shape) => ({
            glassShape: {
              equals: shape,
              mode: 'insensitive' as any,
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
          mode: 'insensitive' as any,
        };
      } else {
        // Multiple materials - use OR
        andConditions.push({
          OR: normalizedMaterials.map((material) => ({
            frameMaterial: {
              equals: material,
              mode: 'insensitive' as any,
            },
          })),
        });
      }
    }
  }

  // Filter by frame color(s) if provided
  const colorHexes: string[] = [];
  
  // Handle new multi-color filter
  if (colorFilters && Array.isArray(colorFilters)) {
    colorFilters.forEach((colorHex) => {
      const decoded = decodeURIComponent(colorHex);
      const normalized = decoded.startsWith('#') 
        ? decoded.toLowerCase() 
        : `#${decoded.toLowerCase()}`;
      if (!colorHexes.includes(normalized)) {
        colorHexes.push(normalized);
      }
    });
  } else if (colorFilters && typeof colorFilters === 'string') {
    const decoded = decodeURIComponent(colorFilters);
    const normalized = decoded.startsWith('#') 
      ? decoded.toLowerCase() 
      : `#${decoded.toLowerCase()}`;
    if (!colorHexes.includes(normalized)) {
      colorHexes.push(normalized);
    }
  }
  
  if (colorHexes.length > 0) {
    if (colorHexes.length === 1) {
      whereClause.PrescriptionGlassesVariant = {
        some: {
          colorHex: colorHexes[0],
          stock: {
            gt: 0,
          },
        },
      };
    } else {
      // Multiple colors - need to use OR
      whereClause.PrescriptionGlassesVariant = {
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
  if (andConditions.length > 0) {
    const directFilters: any = {};
    
    // Copy all direct filters
    if (whereClause.gender) directFilters.gender = whereClause.gender;
    if (whereClause.glassShape) directFilters.glassShape = whereClause.glassShape;
    if (whereClause.frameMaterial) directFilters.frameMaterial = whereClause.frameMaterial;
    if (whereClause.PrescriptionGlassesVariant) directFilters.PrescriptionGlassesVariant = whereClause.PrescriptionGlassesVariant;
    
    // Combine all conditions
    whereClause.AND = [
      directFilters,
      ...andConditions,
    ];
    
    // Remove direct filters that are now in AND
    delete whereClause.gender;
    delete whereClause.glassShape;
    delete whereClause.frameMaterial;
    delete whereClause.PrescriptionGlassesVariant;
    
    // Merge directFilters into whereClause
    Object.assign(whereClause, directFilters);
    whereClause.AND = andConditions;
  }

  // Fetch prescription glasses from separate table
  let prismaPrescriptionGlasses = (await prisma.prescriptionGlasses.findMany({
    where: whereClause,
    include: {
      PrescriptionGlassesVariant: {
        include: {
          PrescriptionGlassesAsset: true,
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
    
    prismaPrescriptionGlasses = prismaPrescriptionGlasses.filter((glasses: any) => {
      const basePrice = Number(glasses.basePrice);
      const discountPct = glasses.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);
      
      if (minPrice !== undefined && finalPrice < minPrice) return false;
      if (maxPrice !== undefined && finalPrice > maxPrice) return false;
      return true;
    });
  }

  // Map Prisma prescription glasses to frontend Product type
  const products = prismaPrescriptionGlasses.map(mapPrismaPrescriptionGlassesToProduct);

  // Fetch prescription glasses landing image from database
  let landingImage: any = null;
  try {
    // @ts-ignore
    if (prisma.prescriptionGlassesLandingImage && typeof prisma.prescriptionGlassesLandingImage.findFirst === 'function') {
      // @ts-ignore
      landingImage = await prisma.prescriptionGlassesLandingImage.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching prescription glasses landing image:', error);
  }

  // Fallback to default values if no landing image found
  const bannerTitle = "Prescription Glasses";
  const bannerDescription = "Discover our premium collection of prescription eyewear with the same stylish frames as our sunglasses";
  const bannerImage = landingImage?.imageUrl ? normalizeImageUrl(landingImage.imageUrl) : "/shopcategory/prescription-glasses.jpg";
  const bannerAlt = landingImage?.alt || bannerTitle;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <CategoryBanner
          title={bannerTitle}
          imageSrc={bannerImage}
          description={bannerDescription}
          alt={bannerAlt}
        />
        <ShopPageClient products={products} title="Prescription Glasses" />
      </main>
      <Footer />
    </div>
  );
}

