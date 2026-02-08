
import { prisma } from "@/lib/prisma";
import ShopPageClient from "@/app/shop/ShopPageClient";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { Product, ProductColorVariant } from "@/lib/productData";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

export const revalidate = 0; // Disable caching for real-time updates

export default async function PrescriptionGlassesNewArrivalsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParamsValue = await searchParams;

    // Fetch only prescription glasses that are marked as Newly Added
    let prismaProducts = await prisma.prescriptionGlasses.findMany({
        where: {
            isNewlyAdded: true,
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
            const basePrice = Number(product.basePrice);
            const discountPct = product.discountPct || 0;
            const finalPrice = basePrice * (1 - discountPct / 100);

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
            };
        });

        const priceVal = Number(p.basePrice) * (1 - (p.discountPct || 0) / 100);

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
            warranty: "2 years",
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
            templeLength: p.templeLength
        };
    });

    return (
        <ShopPageClient
            products={products}
            title="New Arrivals: Prescription Glasses"
            priceRange={await getPriceRange()}
        />
    );
}
