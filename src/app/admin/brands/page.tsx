import { prisma } from '@/lib/prisma';
import { BrandManagement } from './BrandManagement';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
    // Fetch brands from database - using try/catch since table might not exist yet
    let brands: any[] = [];
    try {
        // @ts-ignore - Brand table might not exist until migration runs
        brands = await prisma.brand.findMany({
            orderBy: [
                { order: 'asc' },
                { name: 'asc' },
            ],
        });
    } catch (error) {
        console.error('Error fetching brands:', error);
        brands = [];
    }

    return (
        <div className="container mx-auto py-6">
            <BrandManagement initialBrands={brands} />
        </div>
    );
}
