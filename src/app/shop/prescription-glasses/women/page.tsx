
import { prisma } from "@/lib/prisma";
import ShopPageClient from "@/app/shop/ShopPageClient";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { Product, ProductColorVariant } from "@/lib/productData";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { Gender } from "@prisma/client";
import CategoryBanner from "@/components/shop/category-banner";

import { getAvailableGlassShapes } from "@/app/actions/getAvailableGlassShapes";
import { getAvailableGenderCounts } from "@/app/actions/getAvailableGenderCounts";
import { getAvailableMaterials } from "@/app/actions/getAvailableMaterials";
import { getAvailableFrameColors } from "@/app/actions/getAvailableColors";
import { getAvailableBrands } from "@/app/actions/getAvailableBrands";

export const revalidate = 0; // Disable caching for real-time updates

export default async function PrescriptionGlassesWomenPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParamsValue = await searchParams;

    // Fetch only prescription glasses for WOMEN
    let prismaProducts = await prisma.prescriptionGlasses.findMany({
        where: {
            gender: {
                has: Gender.WOMEN,
            },
        },
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
    });

    // Filter by price range (after fetching, since we need to calculate final price)
    const minPriceParam = searchParamsValue.minPrice as string | undefined;
    const maxPriceParam = searchParamsValue.maxPrice as string | undefined;

    if (minPriceParam || maxPriceParam) {
        const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
        const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

        const filtered = prismaProducts.filter((product) => {
            const isFocusRobin = (product.brand || '').trim().toLowerCase() === 'focusrobin';
            const rawBase = Number(product.basePrice);
            let effectiveBase = rawBase;
            if (!isFocusRobin && rawBase > 0) {
                let pm = (rawBase * 1.10) + 13.5;
                pm = pm * 1.21;
                pm = pm * 1.015;
                effectiveBase = pm;
            }
            const discountPct = product.discountPct || 0;
            const finalPrice = effectiveBase * (1 - discountPct / 100);

            if (minPrice !== undefined && finalPrice < minPrice) return false;
            if (maxPrice !== undefined && finalPrice > maxPrice) return false;
            return true;
        });

        prismaProducts = filtered;
    }

    // Map to Product interface
    const products: Product[] = prismaProducts.map((p) => {
        // For prescription glasses, we use variants
        const variants: ProductColorVariant[] = p.PrescriptionGlassesVariant.map(v => {
            // Find assets
            const assets = v.PrescriptionGlassesAsset;
            const thumbnail = assets.find(a => a.type === 'GALLERY' && a.isPrimary)?.url || assets.find(a => a.type === 'GALLERY')?.url || '';
            const tilted = assets.find(a => a.type === 'HOVER')?.url || '';
            const nobg = assets.find(a => a.type === 'NO_BG')?.url;
            const tryOn = assets.find(a => a.type === 'TRY_ON_2D')?.url;
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
        const discountPct = p.discountPct || 0;
        const finalPriceVal = effectiveBase * (1 - discountPct / 100);

        const pAny = p as any;
        const compareAtPriceRaw = pAny.compareAtPrice;
        let originalPrice: string | undefined;
        let computedDiscountPct: number | undefined = discountPct > 0 ? discountPct : undefined;
        if (compareAtPriceRaw != null && Number(compareAtPriceRaw) > 0) {
          const compareAt = Number(compareAtPriceRaw);
          originalPrice = `€${compareAt.toFixed(2)}`;
          if (compareAt > finalPriceVal) {
            computedDiscountPct = Math.round(((compareAt - finalPriceVal) / compareAt) * 100);
          }
        } else if (discountPct > 0) {
          originalPrice = `€${effectiveBase.toFixed(2)}`;
        }

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
            warranty: pAny.warranty || "2 years",
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
            templeLength: p.templeLength
        };
    });

    // Fetch all filter options for eyeglasses
    const [glassShapes, genderCounts, materials, colors, brands] = await Promise.all([
        getAvailableGlassShapes('eyeglasses'),
        getAvailableGenderCounts('eyeglasses'),
        getAvailableMaterials('eyeglasses'),
        getAvailableFrameColors('eyeglasses'),
        getAvailableBrands('eyeglasses'),
    ]);

    // Fetch shop banner from database
    let shopBanner: any = null;
    try {
        // @ts-ignore
        if (prisma.prescriptionShopBanner && typeof prisma.prescriptionShopBanner.findUnique === 'function') {
            // @ts-ignore
            shopBanner = await prisma.prescriptionShopBanner.findUnique({
                where: { category: 'WOMEN' },
            });
        }
    } catch (error) {
        console.error('Error fetching prescription shop banner:', error);
    }

    // Fallback to default values if no shop banner found
    const bannerTitle = "Women's Eyeglasses";
    const bannerDescription = "Elegant and comfortable frames designed for her.";
    const bannerImage = shopBanner?.imageUrl || "/shopcategory/Women.jpg"; // Fallback image
    const bannerAlt = shopBanner?.alt || bannerTitle;
    const bannerLink = shopBanner?.link || undefined;

    return (
        <ShopPageClient
            banner={
                <CategoryBanner
                    title={bannerTitle}
                    imageSrc={bannerImage}
                    description={bannerDescription}
                    alt={bannerAlt}
                    link={bannerLink}
                    className="mt-0 sm:mt-0 mb-6"
                    contentClassName="pb-2 sm:pb-3 md:pb-4 lg:pb-6 xl:pb-6"
                />
            }
            products={products}
            title="Women's Eyeglasses"
            priceRange={await getPriceRange()}
            glassShapes={glassShapes}
            genderCounts={genderCounts}
            materials={materials}
            colors={colors}
            brands={brands}
        />
    );
}
