import { prisma } from '@/lib/prisma';
import { GiftBannerManagement } from './GiftBannerManagement';

export default async function AdminGiftBannerPage() {
  let giftBanner: any = null;
  
  try {
    // @ts-ignore
    if (prisma.giftBanner && typeof prisma.giftBanner.findFirst === 'function') {
      // @ts-ignore
      giftBanner = await prisma.giftBanner.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching gift banner:', error);
    giftBanner = null;
  }

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-brand-h1 font-headline text-foreground">Gift Banner</h1>
          <p className="mt-2 text-muted-foreground">
            Manage the "Gift for your loved ones" banner displayed on the homepage
          </p>
        </div>
        <GiftBannerManagement initialBanner={giftBanner} />
      </div>
    </div>
  );
}

