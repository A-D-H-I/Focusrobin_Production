
import { prisma } from "@/lib/prisma";
import ShopPageClient from "@/app/shop/ShopPageClient";
import { Gender } from "@prisma/client";
import CategoryBanner from "@/components/shop/category-banner";
import { getPrescriptionSubpageData } from "@/lib/subpage-data";

// ISR: Cache for 5 minutes
export const revalidate = 300;

export default async function PrescriptionGlassesKidsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;

    const { products, priceRange, genderCounts, brands } =
        await getPrescriptionSubpageData(params, Gender.KIDS);

    let shopBanner: any = null;
    try {
        // @ts-ignore
        if (prisma.prescriptionShopBanner && typeof prisma.prescriptionShopBanner.findUnique === 'function') {
            // @ts-ignore
            shopBanner = await prisma.prescriptionShopBanner.findUnique({
                where: { category: 'KIDS' },
            });
        }
    } catch (error) {
        console.error('Error fetching prescription shop banner:', error);
    }

    const bannerTitle = "Kids Eyeglasses";
    const bannerDescription = "Durable and colorful frames for children.";
    const bannerImage = shopBanner?.imageUrl || "/shopcategory/Kids.jpg";
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
            title="Kids Eyeglasses"
            priceRange={priceRange}
            genderCounts={genderCounts}
            brands={brands}
        />
    );
}
