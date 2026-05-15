import { prisma } from "@/lib/prisma";
import ShopPageClient from "../ShopPageClient";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { Product, ProductColorVariant } from "@/lib/productData";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { getPrescriptionGlassesGlassShapes } from "@/app/actions/getPrescriptionGlassesGlassShapes";
import { getPrescriptionGlassesGenderCounts } from "@/app/actions/getPrescriptionGlassesGenderCounts";
import { getPrescriptionGlassesMaterials } from "@/app/actions/getPrescriptionGlassesMaterials";

import { getPrescriptionGlassesPriceRange } from "@/app/actions/getPrescriptionGlassesPriceRange";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { Gender, Prisma } from "@prisma/client";

// ISR: Cache for 5 minutes, rebuilt in the background after expiry
export const revalidate = 300;

export default async function PrescriptionGlassesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParamsValue = await searchParams;

    const colorFilter = searchParamsValue.color as string | string[] | undefined;
    const genderFilter = searchParamsValue.gender as string | string[] | undefined;
    const glassShapeFilter = searchParamsValue.glassShape as string | string[] | undefined;
    const materialFilter = searchParamsValue.material as string | string[] | undefined;
    const brandFilter = searchParamsValue.brand as string | string[] | undefined;
    const minPriceParam = searchParamsValue.minPrice as string | undefined;
    const maxPriceParam = searchParamsValue.maxPrice as string | undefined;
    const filterType = searchParamsValue.filter as string | undefined;
    const searchQuery = searchParamsValue.search as string | undefined;

    const whereClause: any = {};
    const andConditions: any[] = [];

    const hasAdditionalFilters =
        colorFilter || genderFilter || glassShapeFilter || materialFilter || brandFilter || minPriceParam || maxPriceParam;

    if (!hasAdditionalFilters && filterType) {
        if (filterType === 'new-arrivals') {
            whereClause.isNewlyAdded = true;
        } else if (filterType === 'bestsellers') {
            whereClause.isUniqueDesign = true;
        } else {
            whereClause.brand = {
                equals: decodeURIComponent(filterType).trim(),
                mode: 'insensitive' as Prisma.QueryMode,
            };
        }
    }

    // Filter by gender
    if (genderFilter) {
        const genders = Array.isArray(genderFilter) ? genderFilter : [genderFilter];
        const genderEnums: Gender[] = [];
        genders.forEach((g) => {
            const normalized = g.toLowerCase();
            if (normalized === 'men') genderEnums.push(Gender.MEN);
            else if (normalized === 'women') genderEnums.push(Gender.WOMEN);
            else if (normalized === 'kids') genderEnums.push(Gender.KIDS);
            else if (normalized === 'unisex') genderEnums.push(Gender.UNISEX);
        });
        if (genderEnums.length > 0) {
            whereClause.gender = { hasSome: genderEnums };
        }
    }

    // Filter by glass shape
    if (glassShapeFilter) {
        const glassShapes = Array.isArray(glassShapeFilter) ? glassShapeFilter : [glassShapeFilter];
        if (glassShapes.length > 0) {
            const normalizedShapes = glassShapes.map(s => decodeURIComponent(s).replace(/-/g, ' ').trim());
            if (normalizedShapes.length === 1) {
                whereClause.glassShape = { equals: normalizedShapes[0], mode: 'insensitive' };
            } else {
                andConditions.push({
                    OR: normalizedShapes.map(s => ({ glassShape: { equals: s, mode: 'insensitive' } }))
                });
            }
        }
    }

    // Filter by material
    if (materialFilter) {
        const materials = Array.isArray(materialFilter) ? materialFilter : [materialFilter];
        if (materials.length > 0) {
            const normalizedMaterials = materials.map(m => decodeURIComponent(m).trim());
            if (normalizedMaterials.length === 1) {
                whereClause.frameMaterial = { equals: normalizedMaterials[0], mode: 'insensitive' };
            } else {
                andConditions.push({
                    OR: normalizedMaterials.map(m => ({ frameMaterial: { equals: m, mode: 'insensitive' } }))
                });
            }
        }
    }

    // Filter by brand
    if (brandFilter) {
        const brands = Array.isArray(brandFilter) ? brandFilter : [brandFilter];
        if (brands.length > 0) {
            const normalizedBrands = brands.map(b => decodeURIComponent(b).trim());
            if (normalizedBrands.length === 1) {
                whereClause.brand = { equals: normalizedBrands[0], mode: 'insensitive' };
            } else {
                andConditions.push({
                    OR: normalizedBrands.map(b => ({ brand: { equals: b, mode: 'insensitive' } }))
                });
            }
        }
    }

    // Filter by color(s) if provided
    const colorHexes: string[] = [];
    const colorFamilies: string[] = [];

    const processColor = (val: string) => {
        const decoded = decodeURIComponent(val).trim();
        if (decoded.startsWith('#')) {
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
    };

    if (colorFilter) {
        if (Array.isArray(colorFilter)) {
            colorFilter.forEach(processColor);
        } else {
            processColor(colorFilter);
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

        whereClause.PrescriptionGlassesVariant = { some: { OR: colorConditions } };
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
                    PrescriptionGlassesVariant: {
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

        const hasOtherFilters = andConditions.length > 0 ||
            whereClause.gender ||
            whereClause.glassShape ||
            whereClause.frameMaterial ||
            whereClause.PrescriptionGlassesVariant ||
            whereClause.isNewlyAdded !== undefined ||
            whereClause.isUniqueDesign !== undefined;

        if (hasOtherFilters) {
            andConditions.push(searchCondition);
        } else {
            whereClause.OR = searchCondition.OR;
        }
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    // Fetch products and filters in parallel
    const [
        prismaProducts,
        priceRange,
        genderCounts,
        brands
    ] = await Promise.all([
        prisma.prescriptionGlasses.findMany({
            where: whereClause,
            include: {
                PrescriptionGlassesVariant: {
                    include: {
                        PrescriptionGlassesAsset: true,
                    },
                },
                Category: true,
                LinkedProduct: {
                    include: {
                        ProductVariant: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        getPrescriptionGlassesPriceRange(),
        getPrescriptionGlassesGenderCounts(),
        getAvailableBrands('eyeglasses'),
    ]);

    // Filter by price range (after fetching, since we need to calculate final price)


    // Use a mutable variable for filtering
    let displayedProducts = prismaProducts;

    if (minPriceParam || maxPriceParam) {
        const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
        const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

        displayedProducts = prismaProducts.filter((product) => {
            const isFocusRobin = (product.brand || '').trim().toLowerCase() === 'focusrobin';
            const rawBase = Number(product.basePrice);
            let effectiveBase = rawBase;
            if (!isFocusRobin && rawBase > 0) {
                let p = (rawBase * 1.10) + 13.5;
                p = p * 1.21;
                p = p * 1.015;
                effectiveBase = p;
            }
            const discountPct = product.discountPct || 0;
            const finalPrice = effectiveBase * (1 - discountPct / 100);

            if (minPrice !== undefined && finalPrice < minPrice) return false;
            if (maxPrice !== undefined && finalPrice > maxPrice) return false;
            return true;
        });
    }

    // Map to Product interface
    const products: Product[] = displayedProducts.map((p) => {
        // For prescription glasses, we use variants
        const variants: ProductColorVariant[] = p.PrescriptionGlassesVariant.map(v => {
            // Find assets
            const assets = v.PrescriptionGlassesAsset;
            // Prefer GALLERY, fall back to NO_BG (BigBuy products only have NO_BG)
            const thumbnail =
              assets.find(a => a.type === 'GALLERY' && a.isPrimary)?.url ||
              assets.find(a => a.type === 'GALLERY')?.url ||
              assets.find(a => a.type === 'NO_BG' && a.isPrimary)?.url ||
              assets.find(a => a.type === 'NO_BG')?.url ||
              assets[0]?.url || '';
            const tilted = assets.find(a => a.type === 'HOVER')?.url || '';
            const nobg = assets.find(a => a.type === 'NO_BG')?.url;
            const tryOn = assets.find(a => a.type === 'TRY_ON_2D')?.url;
            // Collect gallery images — fall back to NO_BG images for BigBuy
            const galleryImages = assets.filter(a => a.type === 'GALLERY').map(a => a.url);
            const allImages = galleryImages.length > 0
              ? galleryImages
              : assets.filter(a => a.type === 'NO_BG').map(a => a.url);

            let stock = v.stock;

            return {
                name: v.name,
                hex: v.colorHex,
                sku: v.sku,
                stock: stock,
                thumbnail: normalizeImageUrl(thumbnail),
                tilted: normalizeImageUrl(tilted),
                nobg: nobg ? normalizeImageUrl(nobg) : undefined,
                images: allImages.map(normalizeImageUrl),
                tryOn: tryOn ? normalizeImageUrl(tryOn) : undefined,
                textureImageUrl: v.textureImageUrl ? normalizeImageUrl(v.textureImageUrl) : undefined,
            };
        });

        const isFocusRobin = (p.brand || '').trim().toLowerCase() === 'focusrobin';
        const rawBase = Number(p.basePrice);
        let effectiveBase = rawBase;
        if (!isFocusRobin && rawBase > 0) {
            let pm = (rawBase * 1.10) + 13.5;
            pm = pm * 1.21;
            pm = pm * 1.015;
            effectiveBase = pm;
        }
        const discountPctFromDb = p.discountPct || 0;
        const finalPriceVal = discountPctFromDb > 0 
          ? effectiveBase * (1 - discountPctFromDb / 100)
          : effectiveBase;

        // Cast to any to access new fields
        const pAny = p as any;

        const originalPriceValue = finalPriceVal * 1.30;
        const originalPrice = `€${originalPriceValue.toFixed(2)}`;
        const computedDiscountPct = undefined; // User requested to hide percentage badge

        return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand || '',
            price: `€${finalPriceVal.toFixed(2)}`,
            originalPrice: originalPrice && originalPrice !== `€${finalPriceVal.toFixed(2)}` ? originalPrice : undefined,
            discountPct: computedDiscountPct,
            cashback: Number(p.cashbackAmount).toFixed(2),
            variants: variants,
            categories: [p.Category.name],
            warranty: pAny.warranty || "1.5 Years Warranty",
            description: p.description || "",
            lensMaterial: p.lensMaterial || undefined,
            frameMaterial: p.frameMaterial || undefined,
            uvProtection: p.uvProtection || undefined,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount,
            size: {
                lensWidth: p.lensWidth.toString(),
                bridge: p.bridgeWidth.toString(),
                temple: p.templeLength.toString()
            },
            weight: p.weightBg,
            frameWidth: p.frameWidth,
            lensHeight: p.lensHeight,
            bridgeWidth: p.bridgeWidth,
            templeLength: p.templeLength,
            isPolarized: pAny.isPolarized ?? true,
            isUVProtection: pAny.isUVProtection ?? true,
            isHydrophobic: pAny.isHydrophobic ?? true,
            isAntiScratch: pAny.isAntiScratch ?? false,
            isBioBased: pAny.isBioBased ?? true,
            customFeatures: pAny.customFeatures || []
        } as any;
    });

    // Determine page title based on search
    let pageTitle = "Prescription Glasses";
    if (searchQuery && searchQuery.trim()) {
        pageTitle = `Search Results for "${searchQuery.trim()}"`;
    }

    return (
        <ShopPageClient
            products={products}
            title={pageTitle}
            searchQuery={searchQuery}
            priceRange={priceRange}
            genderCounts={genderCounts}
            brands={brands}
        />
    );
}
