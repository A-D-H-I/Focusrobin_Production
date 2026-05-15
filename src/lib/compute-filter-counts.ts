import { type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { type AvailableMaterial } from "@/app/actions/getAvailableMaterials";
import { type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { prisma } from "@/lib/prisma";

/**
 * Compute glass shape counts from an array of products.
 * Works for both sunglasses (Product) and prescription glasses.
 */
export function computeGlassShapeCounts(products: { glassShape: string | null }[]): AvailableGlassShape[] {
  const shapeMap = new Map<string, number>();

  products.forEach((p) => {
    if (p.glassShape) {
      const shape = p.glassShape.trim();
      shapeMap.set(shape, (shapeMap.get(shape) || 0) + 1);
    }
  });

  return Array.from(shapeMap.entries())
    .map(([shape, count]) => ({ shape, count }))
    .sort((a, b) => b.count - a.count || a.shape.localeCompare(b.shape));
}

/**
 * Compute glass shape counts with images from the GlassShape table.
 */
export async function computeGlassShapeCountsWithImages(
  products: { glassShape: string | null }[]
): Promise<AvailableGlassShape[]> {
  const shapeMap = new Map<string, number>();

  products.forEach((p) => {
    if (p.glassShape) {
      const shape = p.glassShape.trim();
      shapeMap.set(shape, (shapeMap.get(shape) || 0) + 1);
    }
  });

  // Fetch shape images from GlassShape table
  const glassShapes = await prisma.glassShape.findMany({
    where: { isActive: true },
    select: { name: true, imageUrl: true, order: true },
  });

  const shapeImageMap = new Map<string, { imageUrl: string | null; order: number }>();
  glassShapes.forEach((gs) => {
    shapeImageMap.set(gs.name.toLowerCase(), { imageUrl: gs.imageUrl, order: gs.order });
  });

  return Array.from(shapeMap.entries())
    .map(([shape, count]) => {
      const mapData = shapeImageMap.get(shape.toLowerCase());
      return {
        shape,
        count,
        imageUrl: mapData?.imageUrl || null,
        _order: mapData?.order ?? 999,
      };
    })
    .sort((a, b) => {
      if (a._order !== b._order) return a._order - b._order;
      if (b.count !== a.count) return b.count - a.count;
      return a.shape.localeCompare(b.shape);
    })
    .map(({ _order, ...rest }) => rest);
}

/**
 * Compute gender counts from an array of products.
 */
export function computeGenderCounts(products: { gender: string[] }[]): GenderCount[] {
  const genderMap: Record<string, string> = {
    men: "Men",
    women: "Women",
    kids: "Kids",
    unisex: "Unisex",
    MEN: "Men",
    WOMEN: "Women",
    KIDS: "Kids",
    UNISEX: "Unisex",
  };

  const genderCountMap = new Map<string, number>();

  products.forEach((p) => {
    if (p.gender && Array.isArray(p.gender)) {
      p.gender.forEach((g) => {
        const key = g.toLowerCase();
        genderCountMap.set(key, (genderCountMap.get(key) || 0) + 1);
      });
    }
  });

  return Array.from(genderCountMap.entries())
    .map(([gender, count]) => ({
      gender,
      displayName: genderMap[gender] || gender,
      count,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Compute material counts from an array of products.
 */
export function computeMaterialCounts(products: { frameMaterial: string | null }[]): AvailableMaterial[] {
  const materialMap = new Map<string, number>();

  products.forEach((p) => {
    if (p.frameMaterial) {
      const material = p.frameMaterial.trim();
      materialMap.set(material, (materialMap.get(material) || 0) + 1);
    }
  });

  return Array.from(materialMap.entries())
    .map(([material, count]) => ({ material, count }))
    .sort((a, b) => b.count - a.count || a.material.localeCompare(b.material));
}

/**
 * Compute brand counts from an array of products.
 */
export async function computeBrandCounts(
  products: { brand: string | null }[]
): Promise<AvailableBrand[]> {
  const brandMap = new Map<string, number>();

  products.forEach((p) => {
    const brand = (p.brand || "").trim();
    if (brand) {
      brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
    }
  });

  // Fetch brand images
  const brandImages = await prisma.brand.findMany({
    where: { isActive: true },
    select: { name: true, imageUrl: true, order: true },
  });
  const brandImageMap = new Map(
    brandImages.map((b) => [b.name.toLowerCase(), { imageUrl: b.imageUrl, order: b.order }])
  );

  return Array.from(brandMap.entries())
    .map(([brand, count]) => {
      const mapData = brandImageMap.get(brand.toLowerCase());
      return {
        brand,
        count,
        imageUrl: mapData?.imageUrl || null,
        _order: mapData?.order ?? 999,
      };
    })
    .sort((a, b) => {
      if (a._order !== b._order) return a._order - b._order;
      if (b.count !== a.count) return b.count - a.count;
      return a.brand.localeCompare(b.brand);
    })
    .map(({ _order, ...rest }) => rest);
}
