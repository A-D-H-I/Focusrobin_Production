
import { prisma } from "@/lib/prisma";
import ShopPageClient from "@/app/shop/ShopPageClient";
import { Gender } from "@prisma/client";
import CategoryBanner from "@/components/shop/category-banner";
import { getPrescriptionSubpageData } from "@/lib/subpage-data";

// ISR: Cache for 5 minutes
export const revalidate = 300;

export default async function PrescriptionGlassesUnisexPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;

    const { products, priceRange, genderCounts, brands } =
        await getPrescriptionSubpageData(params, Gender.UNISEX);

    let shopBanner: any = null;
    try {
        // @ts-ignore
        if (prisma.prescriptionShopBanner && typeof prisma.prescriptionShopBanner.findUnique === 'function') {
            // @ts-ignore
            shopBanner = await prisma.prescriptionShopBanner.findUnique({
                where: { category: 'UNISEX' },
            });
        }
    } catch (error) {
        console.error('Error fetching prescription shop banner:', error);
    }

    const bannerTitle = "Unisex Eyeglasses";
    const bannerDescription = "Versatile and timeless frames for everyone.";
    const bannerImage = shopBanner?.imageUrl || "/shopcategory/Men.jpg";
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
            title="Unisex Eyeglasses"
            priceRange={priceRange}
            genderCounts={genderCounts}
            brands={brands}
        />
    );
}
