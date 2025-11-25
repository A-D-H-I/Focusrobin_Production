import { prisma } from '@/lib/prisma';
import { InstagramImageManagement } from './InstagramImageManagement';

export default async function AdminInstagramPage() {
  let instagramImages: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.instagramImage && typeof prisma.instagramImage.findMany === 'function') {
      // @ts-ignore
      instagramImages = await prisma.instagramImage.findMany({
        orderBy: {
          order: 'asc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching instagram images:', error);
    instagramImages = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Instagram Images</h1>
          <p className="mt-2 text-muted-foreground">
            Manage Instagram images displayed on the homepage
          </p>
        </div>
        <InstagramImageManagement initialImages={instagramImages} />
      </div>
    </div>
  );
}

