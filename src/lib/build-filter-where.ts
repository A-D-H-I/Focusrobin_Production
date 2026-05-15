import { Gender, Prisma } from "@prisma/client";

interface FilterParams {
  gender?: string | string[];
  glassShape?: string | string[];
  material?: string | string[];
  brand?: string | string[];
  color?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  filter?: string;
  search?: string;
}

/**
 * Build a Prisma where clause for sunglasses (Product model) from URL filter params.
 * The `baseGender` param is the hardcoded gender for sub-pages (e.g., Gender.MEN for /shop/men).
 * If provided, it will be included in the where clause alongside any user-selected filters.
 */
export function buildSunglassesWhere(
  params: FilterParams,
  baseGender?: Gender
) {
  const whereClause: any = {};
  const andConditions: any[] = [];

  // If this is a gender-specific sub-page, always filter by that gender
  if (baseGender) {
    whereClause.gender = { has: baseGender };
  }

  // Filter by additional gender selections from URL (on generic pages)
  if (!baseGender && params.gender) {
    const genders = Array.isArray(params.gender) ? params.gender : [params.gender];
    const genderEnums: Gender[] = [];
    genders.forEach((g) => {
      const normalized = g.toLowerCase();
      if (normalized === "men") genderEnums.push(Gender.MEN);
      else if (normalized === "women") genderEnums.push(Gender.WOMEN);
      else if (normalized === "kids") genderEnums.push(Gender.KIDS);
      else if (normalized === "unisex") genderEnums.push(Gender.UNISEX);
    });
    if (genderEnums.length > 0) {
      whereClause.gender = { hasSome: genderEnums };
    }
  }

  // Filter by glass shape
  if (params.glassShape) {
    const shapes = Array.isArray(params.glassShape) ? params.glassShape : [params.glassShape];
    const normalizedShapes = shapes.map((s) =>
      decodeURIComponent(s).replace(/-/g, " ").trim()
    );
    if (normalizedShapes.length === 1) {
      whereClause.glassShape = {
        equals: normalizedShapes[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedShapes.length > 1) {
      andConditions.push({
        OR: normalizedShapes.map((shape) => ({
          glassShape: { equals: shape, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by material
  if (params.material) {
    const materials = Array.isArray(params.material) ? params.material : [params.material];
    const normalizedMaterials = materials.map((m) =>
      decodeURIComponent(m).trim()
    );
    if (normalizedMaterials.length === 1) {
      whereClause.frameMaterial = {
        equals: normalizedMaterials[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedMaterials.length > 1) {
      andConditions.push({
        OR: normalizedMaterials.map((material) => ({
          frameMaterial: { equals: material, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by brand
  if (params.brand) {
    const brands = Array.isArray(params.brand) ? params.brand : [params.brand];
    const normalizedBrands = brands.map((b) =>
      decodeURIComponent(b).trim()
    );
    if (normalizedBrands.length === 1) {
      whereClause.brand = {
        equals: normalizedBrands[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedBrands.length > 1) {
      andConditions.push({
        OR: normalizedBrands.map((brand) => ({
          brand: { equals: brand, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by color
  if (params.color) {
    const colors = Array.isArray(params.color) ? params.color : [params.color];
    const colorHexes: string[] = [];
    const colorFamilies: string[] = [];

    colors.forEach((val) => {
      const decoded = decodeURIComponent(val).trim();
      if (decoded.startsWith("#")) {
        const normalized = decoded.toLowerCase();
        if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
      } else {
        const isHex = /^[0-9A-Fa-f]{6}$/i.test(decoded);
        if (isHex) {
          const normalized = `#${decoded.toLowerCase()}`;
          if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
        } else {
          if (!colorFamilies.includes(decoded)) colorFamilies.push(decoded);
        }
      }
    });

    if (colorHexes.length > 0 || colorFamilies.length > 0) {
      const colorConditions: any[] = [];
      if (colorHexes.length > 0) {
        colorConditions.push(
          ...colorHexes.map((hex) => ({ colorHex: hex, stock: { gt: 0 } }))
        );
      }
      if (colorFamilies.length > 0) {
        colorConditions.push(
          ...colorFamilies.map((family) => ({
            colorFamily: { equals: family, mode: "insensitive" as Prisma.QueryMode },
            stock: { gt: 0 },
          }))
        );
      }
      whereClause.ProductVariant = { some: { OR: colorConditions } };
    }
  }

  // Combine AND conditions
  if (andConditions.length > 0) {
    const directFilters: any = {};
    if (whereClause.gender) directFilters.gender = whereClause.gender;
    if (whereClause.glassShape) directFilters.glassShape = whereClause.glassShape;
    if (whereClause.frameMaterial) directFilters.frameMaterial = whereClause.frameMaterial;
    if (whereClause.brand) directFilters.brand = whereClause.brand;
    if (whereClause.ProductVariant) directFilters.ProductVariant = whereClause.ProductVariant;

    const allConditions = [...andConditions];
    if (Object.keys(directFilters).length > 0) {
      allConditions.push(directFilters);
    }

    Object.keys(whereClause).forEach((key) => delete whereClause[key]);
    whereClause.AND = allConditions;
  }

  return whereClause;
}

/**
 * Build a Prisma where clause for prescription glasses (PrescriptionGlasses model).
 * Similar to sunglasses but uses PrescriptionGlassesVariant for color filtering.
 */
export function buildPrescriptionGlassesWhere(
  params: FilterParams,
  baseGender?: Gender
) {
  const whereClause: any = {};
  const andConditions: any[] = [];

  // If this is a gender-specific sub-page, always filter by that gender
  if (baseGender) {
    whereClause.gender = { has: baseGender };
  }

  // Filter by additional gender selections from URL (on generic pages)
  if (!baseGender && params.gender) {
    const genders = Array.isArray(params.gender) ? params.gender : [params.gender];
    const genderEnums: Gender[] = [];
    genders.forEach((g) => {
      const normalized = g.toLowerCase();
      if (normalized === "men") genderEnums.push(Gender.MEN);
      else if (normalized === "women") genderEnums.push(Gender.WOMEN);
      else if (normalized === "kids") genderEnums.push(Gender.KIDS);
      else if (normalized === "unisex") genderEnums.push(Gender.UNISEX);
    });
    if (genderEnums.length > 0) {
      whereClause.gender = { hasSome: genderEnums };
    }
  }

  // Filter by glass shape
  if (params.glassShape) {
    const shapes = Array.isArray(params.glassShape) ? params.glassShape : [params.glassShape];
    const normalizedShapes = shapes.map((s) =>
      decodeURIComponent(s).replace(/-/g, " ").trim()
    );
    if (normalizedShapes.length === 1) {
      whereClause.glassShape = {
        equals: normalizedShapes[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedShapes.length > 1) {
      andConditions.push({
        OR: normalizedShapes.map((shape) => ({
          glassShape: { equals: shape, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by material
  if (params.material) {
    const materials = Array.isArray(params.material) ? params.material : [params.material];
    const normalizedMaterials = materials.map((m) =>
      decodeURIComponent(m).trim()
    );
    if (normalizedMaterials.length === 1) {
      whereClause.frameMaterial = {
        equals: normalizedMaterials[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedMaterials.length > 1) {
      andConditions.push({
        OR: normalizedMaterials.map((material) => ({
          frameMaterial: { equals: material, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by brand
  if (params.brand) {
    const brands = Array.isArray(params.brand) ? params.brand : [params.brand];
    const normalizedBrands = brands.map((b) =>
      decodeURIComponent(b).trim()
    );
    if (normalizedBrands.length === 1) {
      whereClause.brand = {
        equals: normalizedBrands[0],
        mode: "insensitive" as Prisma.QueryMode,
      };
    } else if (normalizedBrands.length > 1) {
      andConditions.push({
        OR: normalizedBrands.map((brand) => ({
          brand: { equals: brand, mode: "insensitive" as Prisma.QueryMode },
        })),
      });
    }
  }

  // Filter by color - uses PrescriptionGlassesVariant
  if (params.color) {
    const colors = Array.isArray(params.color) ? params.color : [params.color];
    const colorHexes: string[] = [];
    const colorFamilies: string[] = [];

    colors.forEach((val) => {
      const decoded = decodeURIComponent(val).trim();
      if (decoded.startsWith("#")) {
        const normalized = decoded.toLowerCase();
        if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
      } else {
        const isHex = /^[0-9A-Fa-f]{6}$/i.test(decoded);
        if (isHex) {
          const normalized = `#${decoded.toLowerCase()}`;
          if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
        } else {
          if (!colorFamilies.includes(decoded)) colorFamilies.push(decoded);
        }
      }
    });

    if (colorHexes.length > 0 || colorFamilies.length > 0) {
      const colorConditions: any[] = [];
      if (colorHexes.length > 0) {
        colorConditions.push(
          ...colorHexes.map((hex) => ({ colorHex: hex, stock: { gt: 0 } }))
        );
      }
      if (colorFamilies.length > 0) {
        colorConditions.push(
          ...colorFamilies.map((family) => ({
            colorFamily: { equals: family, mode: "insensitive" as Prisma.QueryMode },
            stock: { gt: 0 },
          }))
        );
      }
      whereClause.PrescriptionGlassesVariant = { some: { OR: colorConditions } };
    }
  }

  // Combine AND conditions
  if (andConditions.length > 0) {
    const directFilters: any = {};
    if (whereClause.gender) directFilters.gender = whereClause.gender;
    if (whereClause.glassShape) directFilters.glassShape = whereClause.glassShape;
    if (whereClause.frameMaterial) directFilters.frameMaterial = whereClause.frameMaterial;
    if (whereClause.brand) directFilters.brand = whereClause.brand;
    if (whereClause.PrescriptionGlassesVariant)
      directFilters.PrescriptionGlassesVariant = whereClause.PrescriptionGlassesVariant;

    const allConditions = [...andConditions];
    if (Object.keys(directFilters).length > 0) {
      allConditions.push(directFilters);
    }

    Object.keys(whereClause).forEach((key) => delete whereClause[key]);
    whereClause.AND = allConditions;
  }

  return whereClause;
}

/**
 * Apply price filter to products after fetching (since final price involves calculations).
 * Works for both sunglasses and prescription glasses.
 */
export function applyPriceFilter<T extends { basePrice: any; discountPct: number | null; brand: string | null }>(
  products: T[],
  minPrice?: string,
  maxPrice?: string
): T[] {
  if (!minPrice && !maxPrice) return products;

  const min = minPrice ? parseFloat(minPrice) : undefined;
  const max = maxPrice ? parseFloat(maxPrice) : undefined;

  return products.filter((product) => {
    const isFocusRobin = (product.brand || "").trim().toLowerCase() === "focusrobin";
    const rawBase = Number(product.basePrice);
    let effectiveBase = rawBase;
    if (!isFocusRobin && rawBase > 0) {
      let pm = rawBase * 1.1 + 13.5;
      pm = pm * 1.21;
      pm = pm * 1.015;
      effectiveBase = pm;
    }
    const discountPct = product.discountPct || 0;
    const finalPrice = effectiveBase * (1 - discountPct / 100);

    if (min !== undefined && finalPrice < min) return false;
    if (max !== undefined && finalPrice > max) return false;
    return true;
  });
}
