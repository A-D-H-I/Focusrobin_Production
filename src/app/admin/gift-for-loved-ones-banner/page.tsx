import { prisma } from '@/lib/prisma';
import { GiftForLovedOnesBannerManagement } from './GiftForLovedOnesBannerManagement';

export default async function AdminGiftForLovedOnesBannerPage() {
  let banner: any = null;
  
  try {
    // @ts-ignore
    if (prisma.giftForLovedOnesBanner && typeof prisma.giftForLovedOnesBanner.findFirst === 'function') {
      // @ts-ignore
      banner = await prisma.giftForLovedOnesBanner.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching gift for loved ones banner:', error);
    banner = null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gift for Loved Ones Banner</h1>
          <p className="mt-2 text-muted-foreground">
            Manage the "Gift for your loved ones" banner displayed below the best sellers section on the homepage
          </p>
        </div>
        <GiftForLovedOnesBannerManagement initialBanner={banner} />
      </div>
    </div>
  );
}

