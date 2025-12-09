import { prisma } from '@/lib/prisma';
import { ScrollingBannerManagement } from './ScrollingBannerManagement';

export default async function AdminScrollingBannerPage() {
  let banners: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.scrollingBanner && typeof prisma.scrollingBanner.findMany === 'function') {
      // @ts-ignore
      banners = await prisma.scrollingBanner.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching scrolling banners:', error);
    banners = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Scrolling Banners / Offers</h1>
          <p className="mt-2 text-muted-foreground">
            Manage multiple scrolling banner offers. All active banners will be displayed on the homepage between "GIVE SOMETHING ICONIC" and "Shop by Category" sections.
          </p>
        </div>
        <ScrollingBannerManagement initialBanners={banners} />
      </div>
    </div>
  );
}

