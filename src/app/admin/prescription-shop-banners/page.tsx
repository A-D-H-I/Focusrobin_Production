import { prisma } from '@/lib/prisma';
import { PrescriptionShopBannerManagement } from './PrescriptionShopBannerManagement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPrescriptionShopBannersPage() {
    let banners: any[] = [];

    try {
        // @ts-ignore
        if (prisma.prescriptionShopBanner && typeof prisma.prescriptionShopBanner.findMany === 'function') {
            // @ts-ignore
            banners = await prisma.prescriptionShopBanner.findMany({
                orderBy: {
                    category: 'asc',
                },
            });
        }
    } catch (error) {
        console.error('Error fetching prescription banners:', error);
        banners = [];
    }

    return (
        <div className="bg-background p-4 md:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-brand-h1 font-headline text-foreground">Prescription Shop Banners</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage banner images displayed at the top of prescription glasses category pages (Men, Women, Kids, Unisex)
                    </p>
                </div>
                <PrescriptionShopBannerManagement initialBanners={banners} />
            </div>
        </div>
    );
}
