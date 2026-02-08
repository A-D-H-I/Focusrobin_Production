import { prisma } from '@/lib/prisma';
import { SplitBannerManagement } from './SplitBannerManagement';

export default async function AdminSplitBannerPage() {
    let splitBanner: any = null;

    try {
        // @ts-ignore
        if (prisma.splitBanner && typeof prisma.splitBanner.findFirst === 'function') {
            // @ts-ignore
            // Fetch the default one for now, or we can make a list if we have multiple
            // For this task, we assume "eyeglasses" section is the primary one or just find first
            splitBanner = await prisma.splitBanner.findUnique({
                where: { sectionKey: 'eyeglasses' },
            });

            if (!splitBanner) {
                // Fallback to find first if key doesn't match
                // @ts-ignore
                splitBanner = await prisma.splitBanner.findFirst();
            }
        }
    } catch (error) {
        console.error('Error fetching split banner:', error);
        splitBanner = null;
    }

    return (
        <div className="bg-background p-4 md:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-brand-h1 font-headline text-foreground">Split Banner (Eyeglasses/Sunglasses)</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage the dual-section banner displayed on the homepage.
                    </p>
                </div>
                <SplitBannerManagement initialBanner={splitBanner} sectionKey="eyeglasses" />
            </div>
        </div>
    );
}
