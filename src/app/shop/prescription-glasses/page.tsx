import { prisma } from "@/lib/prisma";
import ShopPageClient from "../ShopPageClient";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { Product, ProductColorVariant } from "@/lib/productData";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { getPrescriptionGlassesGlassShapes } from "@/app/actions/getPrescriptionGlassesGlassShapes";
import { getPrescriptionGlassesGenderCounts } from "@/app/actions/getPrescriptionGlassesGenderCounts";
import { getPrescriptionGlassesMaterials } from "@/app/actions/getPrescriptionGlassesMaterials";
import { getPrescriptionGlassesColors } from "@/app/actions/getPrescriptionGlassesColors";
import { getPrescriptionGlassesPriceRange } from "@/app/actions/getPrescriptionGlassesPriceRange";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { Gender, Prisma } from "@prisma/client";

export const revalidate = 0; // Disable caching for real-time updates

export default async function PrescriptionGlassesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParamsValue = await searchParams;

    const colorFilter = searchParamsValue.color as string | string[] | undefined;
    const genderFilter = searchParamsValue.gender as string | string[] | undefined;
    const glassShapeFilter = searchParamsValue.glassShape as string | string[] | undefined;
    const materialFilter = searchParamsValue.material as string | string[] | undefined;
    const brandFilter = searchParamsValue.brand as string | string[] | undefined;
    const minPriceParam = searchParamsValue.minPrice as string | undefined;
    const maxPriceParam = searchParamsValue.maxPrice as string | undefined;

    const whereClause: any = {};
    const andConditions: any[] = [];

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

    // Filter by color
    if (colorFilter) {
        const colors = Array.isArray(colorFilter) ? colorFilter : [colorFilter];
        const colorHexes: string[] = [];
        colors.forEach(c => {
            const normalized = c.startsWith('#') ? c.toLowerCase() : `#${c.toLowerCase()}`;
            if (!colorHexes.includes(normalized)) colorHexes.push(normalized);
        });

        if (colorHexes.length > 0) {
            if (colorHexes.length === 1) {
                whereClause.PrescriptionGlassesVariant = { some: { colorHex: colorHexes[0] } };
            } else {
                whereClause.PrescriptionGlassesVariant = { some: { OR: colorHexes.map(h => ({ colorHex: h })) } };
            }
        }
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    // Fetch products and filters in parallel
    const [
        prismaProducts,
        priceRange,
        glassShapes,
        genderCounts,
        materials,
        colors,
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
        getPrescriptionGlassesGlassShapes(),
        getPrescriptionGlassesGenderCounts(),
        getPrescriptionGlassesMaterials(),
        getPrescriptionGlassesColors(),
        getAvailableBrands('eyeglasses'),
    ]);

    // Filter by price range (after fetching, since we need to calculate final price)


    // Use a mutable variable for filtering
    let displayedProducts = prismaProducts;

    if (minPriceParam || maxPriceParam) {
        const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
        const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

        displayedProducts = prismaProducts.filter((product) => {
            const basePrice = Number(product.basePrice);
            const discountPct = product.discountPct || 0;
            const finalPrice = basePrice * (1 - discountPct / 100);

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
            const thumbnail = assets.find(a => a.type === 'GALLERY' && a.isPrimary)?.url || assets.find(a => a.type === 'GALLERY')?.url || '';
            const tilted = assets.find(a => a.type === 'HOVER')?.url || '';
            const nobg = assets.find(a => a.type === 'NO_BG')?.url;
            const tryOn = assets.find(a => a.type === 'TRY_ON_2D')?.url;
            // Collect all gallery images
            const galleryImages = assets.filter(a => a.type === 'GALLERY').map(a => a.url);

            let stock = v.stock;

            return {
                name: v.name,
                hex: v.colorHex,
                sku: v.sku,
                stock: stock,
                thumbnail: normalizeImageUrl(thumbnail),
                tilted: normalizeImageUrl(tilted),
                nobg: nobg ? normalizeImageUrl(nobg) : undefined,
                images: galleryImages.map(normalizeImageUrl),
                tryOn: tryOn ? normalizeImageUrl(tryOn) : undefined,
            };
        });

        const priceVal = Number(p.basePrice) * (1 - (p.discountPct || 0) / 100);

        // Cast to any to access new fields if TypeScript definition isn't updated yet in the project context
        const pAny = p as any;

        return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: priceVal.toFixed(2),
            originalPrice: p.discountPct ? Number(p.basePrice).toFixed(2) : undefined,
            discountPct: p.discountPct || 0,
            cashback: Number(p.cashbackAmount).toFixed(2),
            variants: variants,
            categories: [p.Category.name],
            warranty: pAny.warranty || "1.5 Years Warranty",
            description: p.description || "",
            lensMaterial: p.lensMaterial || "Polycarbonate",
            frameMaterial: p.frameMaterial,
            uvProtection: p.uvProtection || "UV400",
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

    return (
        <ShopPageClient
            products={products}
            title="Prescription Glasses"
            priceRange={priceRange}
            glassShapes={glassShapes}
            genderCounts={genderCounts}
            materials={materials}
            colors={colors}
            brands={brands}
        />
    );
}
