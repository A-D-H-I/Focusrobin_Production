
import { prisma } from "@/lib/prisma";
import ShopPageClient from "@/app/shop/ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { getPrescriptionSubpageData } from "@/lib/subpage-data";

// ISR: Cache for 5 minutes
export const revalidate = 300;

export default async function PrescriptionGlassesNewArrivalsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;

    const { products, priceRange, genderCounts, brands } =
        await getPrescriptionSubpageData(params, undefined, { isNewlyAdded: true });

    return (
        <ShopPageClient
            products={products}
            title="New Arrivals - Prescription Glasses"
            priceRange={priceRange}
            genderCounts={genderCounts}
            brands={brands}
        />
    );
}
