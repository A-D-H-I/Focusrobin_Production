import { prisma } from "@/lib/prisma";
import { calculateRetailPrice } from "@/lib/price-utils";
import { Gender, Prisma } from "@prisma/client";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import { type Product } from "@/lib/productData";
import { type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { type AvailableMaterial } from "@/app/actions/getAvailableMaterials";
import { type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { type AvailableColor } from "@/app/actions/getAvailableColors";
import { type PriceRange } from "@/app/actions/getPriceRange";
import { getPriceRange } from "@/app/actions/getPriceRange";
import {
  computeGlassShapeCountsWithImages,
  computeGenderCounts,
  computeMaterialCounts,
  computeBrandCounts,
} from "@/lib/compute-filter-counts";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

type FilterParams = { [key: string]: string | string[] | undefined };

// ---------- Helper: in-memory filter for sunglasses ----------
function applyFiltersToSunglassProducts(
  products: any[],
  params: FilterParams
): any[] {
  let result = products;

  // Filter by glass shape
  if (params.glassShape) {
    const shapes = (
      Array.isArray(params.glassShape)
        ? params.glassShape
        : [params.glassShape]
    ).map((s) => decodeURIComponent(s).replace(/-/g, " ").trim().toLowerCase());
    result = result.filter(
      (p) =>
        p.glassShape && shapes.includes(p.glassShape.trim().toLowerCase())
    );
  }

  // Filter by material
  if (params.material) {
    const materials = (
      Array.isArray(params.material) ? params.material : [params.material]
    ).map((m) => decodeURIComponent(m).trim().toLowerCase());
    result = result.filter(
      (p) =>
        p.frameMaterial &&
        materials.includes(p.frameMaterial.trim().toLowerCase())
    );
  }

  // Filter by brand
  if (params.brand) {
    const brands = (
      Array.isArray(params.brand) ? params.brand : [params.brand]
    ).map((b) => decodeURIComponent(b).trim().toLowerCase());
    result = result.filter(
      (p) => p.brand && brands.includes(p.brand.trim().toLowerCase())
    );
  }

  // Filter by color
  if (params.color) {
    const colors = (
      Array.isArray(params.color) ? params.color : [params.color]
    ).map((c) => decodeURIComponent(c).trim().toLowerCase());
    result = result.filter((p) => {
      if (!p.ProductVariant || !Array.isArray(p.ProductVariant)) return false;
      return p.ProductVariant.some((v: any) => {
        if (v.stock <= 0) return false;
        const hexMatch =
          v.colorHex && colors.includes(v.colorHex.toLowerCase());
        const familyMatch =
          v.colorFamily &&
          colors.includes(v.colorFamily.trim().toLowerCase());
        return hexMatch || familyMatch;
      });
    });
  }

  // Filter by gender (additional gender filters on top of the base)
  if (params.gender) {
    const genders = (
      Array.isArray(params.gender) ? params.gender : [params.gender]
    ).map((g) => g.toUpperCase());
    result = result.filter((p) => {
      if (!p.gender || !Array.isArray(p.gender)) return false;
      return p.gender.some((g: string) => genders.includes(g));
    });
  }

  // Filter by price
  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
    const max = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
    result = result.filter((p) => {
      const basePrice = Number(p.basePrice);
      const discountPct = p.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);
      if (min !== undefined && finalPrice < min) return false;
      if (max !== undefined && finalPrice > max) return false;
      return true;
    });
  }

  return result;
}

// ---------- Helper: in-memory filter for prescription glasses ----------
function applyFiltersToPrescriptionProducts(
  products: any[],
  params: FilterParams
): any[] {
  let result = products;

  // Filter by glass shape
  if (params.glassShape) {
    const shapes = (
      Array.isArray(params.glassShape)
        ? params.glassShape
        : [params.glassShape]
    ).map((s) => decodeURIComponent(s).replace(/-/g, " ").trim().toLowerCase());
    result = result.filter(
      (p) =>
        p.glassShape && shapes.includes(p.glassShape.trim().toLowerCase())
    );
  }

  // Filter by material
  if (params.material) {
    const materials = (
      Array.isArray(params.material) ? params.material : [params.material]
    ).map((m) => decodeURIComponent(m).trim().toLowerCase());
    result = result.filter(
      (p) =>
        p.frameMaterial &&
        materials.includes(p.frameMaterial.trim().toLowerCase())
    );
  }

  // Filter by brand
  if (params.brand) {
    const brands = (
      Array.isArray(params.brand) ? params.brand : [params.brand]
    ).map((b) => decodeURIComponent(b).trim().toLowerCase());
    result = result.filter(
      (p) => p.brand && brands.includes(p.brand.trim().toLowerCase())
    );
  }

  // Filter by color (uses PrescriptionGlassesVariant)
  if (params.color) {
    const colors = (
      Array.isArray(params.color) ? params.color : [params.color]
    ).map((c) => decodeURIComponent(c).trim().toLowerCase());
    result = result.filter((p) => {
      if (
        !p.PrescriptionGlassesVariant ||
        !Array.isArray(p.PrescriptionGlassesVariant)
      )
        return false;
      return p.PrescriptionGlassesVariant.some((v: any) => {
        if (v.stock <= 0) return false;
        const hexMatch =
          v.colorHex && colors.includes(v.colorHex.toLowerCase());
        const familyMatch =
          v.colorFamily &&
          colors.includes(v.colorFamily.trim().toLowerCase());
        return hexMatch || familyMatch;
      });
    });
  }

  // Filter by gender (additional on top of base)
  if (params.gender) {
    const genders = (
      Array.isArray(params.gender) ? params.gender : [params.gender]
    ).map((g) => g.toUpperCase());
    result = result.filter((p) => {
      if (!p.gender || !Array.isArray(p.gender)) return false;
      return p.gender.some((g: string) => genders.includes(g));
    });
  }

  // Filter by price
  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
    const max = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
    result = result.filter((p) => {
      const rawBase = Number(p.basePrice);
      const effectiveBase = calculateRetailPrice(rawBase, p.brand || 'FocusRobin');
      const discountPct = p.discountPct || 0;
      const finalPrice = effectiveBase * (1 - discountPct / 100);
      if (min !== undefined && finalPrice < min) return false;
      if (max !== undefined && finalPrice > max) return false;
      return true;
    });
  }

  return result;
}

// ---------- Color counts helper ----------
async function computeColorCountsForSunglasses(
  products: any[]
): Promise<AvailableColor[]> {
  // Gather colorFamily counts from variants of the products
  const familyCountMap = new Map<string, number>();
  products.forEach((p) => {
    if (p.ProductVariant && Array.isArray(p.ProductVariant)) {
      // Use a set to count each family only once per product
      const seenFamilies = new Set<string>();
      p.ProductVariant.forEach((v: any) => {
        if (v.colorFamily && !seenFamilies.has(v.colorFamily.toLowerCase())) {
          seenFamilies.add(v.colorFamily.toLowerCase());
          familyCountMap.set(
            v.colorFamily.trim(),
            (familyCountMap.get(v.colorFamily.trim()) || 0) + 1
          );
        }
      });
    }
  });

  // Fetch hex from ColorFamily table
  const colorFamilies = await prisma.colorFamily.findMany();
  const familyHexMap = new Map<string, string>();
  colorFamilies.forEach((cf) => {
    familyHexMap.set(cf.name.toLowerCase(), cf.hex);
  });

  return Array.from(familyCountMap.entries())
    .map(([name, count]) => ({
      colorName: name,
      colorHex: familyHexMap.get(name.toLowerCase()) || "#E5E7EB",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.colorName.localeCompare(b.colorName));
}

async function computeColorCountsForPrescription(
  products: any[]
): Promise<AvailableColor[]> {
  const familyCountMap = new Map<string, number>();
  products.forEach((p) => {
    if (p.PrescriptionGlassesVariant && Array.isArray(p.PrescriptionGlassesVariant)) {
      const seenFamilies = new Set<string>();
      p.PrescriptionGlassesVariant.forEach((v: any) => {
        if (v.colorFamily && !seenFamilies.has(v.colorFamily.toLowerCase())) {
          seenFamilies.add(v.colorFamily.toLowerCase());
          familyCountMap.set(
            v.colorFamily.trim(),
            (familyCountMap.get(v.colorFamily.trim()) || 0) + 1
          );
        }
      });
    }
  });

  const colorFamilies = await prisma.colorFamily.findMany();
  const familyHexMap = new Map<string, string>();
  colorFamilies.forEach((cf) => {
    familyHexMap.set(cf.name.toLowerCase(), cf.hex);
  });

  return Array.from(familyCountMap.entries())
    .map(([name, count]) => ({
      colorName: name,
      colorHex: familyHexMap.get(name.toLowerCase()) || "#E5E7EB",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.colorName.localeCompare(b.colorName));
}

// ======================================================================
// PUBLIC API: Sunglasses sub-page data
// ======================================================================

export interface SubpageData {
  products: Product[];
  priceRange: PriceRange;
  glassShapes: AvailableGlassShape[];
  genderCounts: GenderCount[];
  materials: AvailableMaterial[];
  colors: AvailableColor[];
  brands: AvailableBrand[];
}

/**
 * Fetch products and compute filter counts for a sunglasses sub-page
 * (e.g., /shop/men, /shop/women, /shop/kids, /shop/unisex).
 *
 * 1. Fetches ALL products for the gender (no shape/material/brand filters)
 * 2. Computes filter counts from that full set (so sidebar counts match gender scope)
 * 3. Applies additional filters (shape, material, brand, color, price) in-memory
 */
export async function getSunglassesSubpageData(
  params: FilterParams,
  baseGender: Gender
): Promise<SubpageData> {
  // 1. Fetch ALL products for this gender (only gender filter applied)
  const [allGenderedProducts, priceRange] = await Promise.all([
    prisma.product.findMany({
      where: { gender: { has: baseGender } },
      include: {
        ProductVariant: {
          include: { ProductAsset: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getPriceRange(),
  ]);

  // 2. Compute filter counts from the full gender-scoped set
  const [glassShapes, genderCounts, materials, brands, colors] =
    await Promise.all([
      computeGlassShapeCountsWithImages(allGenderedProducts),
      Promise.resolve([]), // Hide gender filter on gender-specific sub-pages
      Promise.resolve(computeMaterialCounts(allGenderedProducts)),
      computeBrandCounts(allGenderedProducts),
      computeColorCountsForSunglasses(allGenderedProducts),
    ]);

  // 3. Apply additional filters in-memory
  const filteredProducts = applyFiltersToSunglassProducts(
    allGenderedProducts,
    params
  );

  // 4. Map to frontend Product type
  const products = filteredProducts.map(mapPrismaProductToProduct);

  return {
    products,
    priceRange,
    glassShapes,
    genderCounts,
    materials,
    colors,
    brands,
  };
}

// ======================================================================
// PUBLIC API: Prescription glasses sub-page data
// ======================================================================

/**
 * Map a prescription glasses Prisma product to frontend Product type.
 */
function mapPrescriptionToProduct(p: any): Product {
  const variants = (p.PrescriptionGlassesVariant || []).map((v: any) => {
    const assets = v.PrescriptionGlassesAsset || [];
    const thumbnail =
      assets.find((a: any) => a.type === "GALLERY" && a.isPrimary)?.url ||
      assets.find((a: any) => a.type === "GALLERY")?.url ||
      "";
    const tilted = assets.find((a: any) => a.type === "HOVER")?.url || "";
    const nobg = assets.find((a: any) => a.type === "NO_BG")?.url;
    const tryOn = assets.find((a: any) => a.type === "TRY_ON_2D")?.url;
    const galleryImages = assets
      .filter((a: any) => a.type === "GALLERY")
      .map((a: any) => a.url);

    return {
      name: v.name,
      hex: v.colorHex,
      sku: v.sku,
      stock: v.stock,
      thumbnail: normalizeImageUrl(thumbnail),
      tilted: normalizeImageUrl(tilted),
      nobg: nobg ? normalizeImageUrl(nobg) : undefined,
      images: galleryImages.map(normalizeImageUrl),
      tryOn: tryOn ? normalizeImageUrl(tryOn) : undefined,
      textureImageUrl: v.textureImageUrl
        ? normalizeImageUrl(v.textureImageUrl)
        : undefined,
    };
  });

  const rawBase = Number(p.basePrice);
  const effectiveBase = calculateRetailPrice(rawBase, p.brand || 'FocusRobin');
  const discountPctFromDb = p.discountPct || 0;
  const finalPriceVal = discountPctFromDb > 0 
    ? effectiveBase * (1 - discountPctFromDb / 100)
    : effectiveBase;

  const originalPriceValue = finalPriceVal * 1.30;
  const originalPrice = `€${originalPriceValue.toFixed(2)}`;
  const computedDiscountPct = undefined; // User requested to hide the percentage badge

  const pAny = p as any;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand || "",
    price: `€${finalPriceVal.toFixed(2)}`,
    originalPrice:
      originalPrice && originalPrice !== `€${finalPriceVal.toFixed(2)}`
        ? originalPrice
        : undefined,
    discountPct: computedDiscountPct,
    cashback: Number(p.cashbackAmount).toFixed(2),
    variants,
    categories: [p.Category?.name || ""],
    warranty: pAny.warranty || "2 years",
    description: p.description || "",
    lensMaterial: p.lensMaterial || undefined,
    frameMaterial: p.frameMaterial || undefined,
    uvProtection: p.uvProtection || undefined,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    size: {
      lensWidth: p.lensWidth?.toString() || "",
      bridge: p.bridgeWidth?.toString() || "",
      temple: p.templeLength?.toString() || "",
    },
    weight: p.weightBg,
    frameWidth: p.frameWidth,
    lensHeight: p.lensHeight,
    bridgeWidth: p.bridgeWidth,
    templeLength: p.templeLength,
  };
}

/**
 * Fetch products and compute filter counts for a prescription glasses sub-page.
 * If baseGender is undefined (e.g. new-arrivals), uses baseWhere for the initial fetch.
 */
export async function getPrescriptionSubpageData(
  params: FilterParams,
  baseGender?: Gender,
  baseWhere?: any
): Promise<SubpageData> {
  // 1. Build the base where clause (gender-only OR custom like isNewlyAdded)
  const baseFilter = baseWhere
    ? baseWhere
    : baseGender
    ? { gender: { has: baseGender } }
    : {};

  // Fetch ALL products matching the base filter (no shape/material/brand filters)
  const [allBaseProducts, priceRange] = await Promise.all([
    prisma.prescriptionGlasses.findMany({
      where: baseFilter,
      include: {
        PrescriptionGlassesVariant: {
          include: { PrescriptionGlassesAsset: true },
        },
        Category: true,
        LinkedProduct: {
          include: { ProductVariant: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getPriceRange(),
  ]);

  // 2. Compute filter counts from the full base set
  const [glassShapes, genderCounts, materials, brands, colors] =
    await Promise.all([
      computeGlassShapeCountsWithImages(allBaseProducts),
      Promise.resolve([]), // Hide gender filter on sub-pages
      Promise.resolve(computeMaterialCounts(allBaseProducts)),
      computeBrandCounts(allBaseProducts),
      computeColorCountsForPrescription(allBaseProducts),
    ]);

  // 3. Apply additional filters in-memory
  const filteredProducts = applyFiltersToPrescriptionProducts(
    allBaseProducts,
    params
  );

  // 4. Map to frontend Product type
  const products = filteredProducts.map(mapPrescriptionToProduct);

  return {
    products,
    priceRange,
    glassShapes,
    genderCounts,
    materials,
    colors,
    brands,
  };
}
