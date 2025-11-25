import { prisma } from '@/lib/prisma';
import { ShopBannerManagement } from './ShopBannerManagement';

export default async function AdminShopBannersPage() {
  let shopBanners: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.shopBanner && typeof prisma.shopBanner.findMany === 'function') {
      // @ts-ignore
      shopBanners = await prisma.shopBanner.findMany({
        orderBy: {
          category: 'asc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banners:', error);
    shopBanners = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Shop Page Banners</h1>
          <p className="mt-2 text-muted-foreground">
            Manage banner images displayed at the top of shop category pages (Men, Women, Kids, Unisex)
          </p>
        </div>
        <ShopBannerManagement initialBanners={shopBanners} />
      </div>
    </div>
  );
}

