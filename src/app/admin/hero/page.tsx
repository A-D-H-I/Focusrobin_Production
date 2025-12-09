import { prisma } from '@/lib/prisma';
import { HeroImageManagement } from './HeroImageManagement';

export default async function AdminHeroPage() {
  let heroImages: any[] = [];
  
  try {
    // Check if heroImage model exists in Prisma client
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (prisma.heroImage && typeof prisma.heroImage.findMany === 'function') {
      // @ts-ignore
      heroImages = await prisma.heroImage.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    }
  } catch (error) {
    console.error('Error fetching hero images:', error);
    // If model doesn't exist yet, return empty array
    heroImages = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Hero Images Carousel</h1>
          <p className="mt-2 text-muted-foreground">
            Manage multiple hero images that automatically scroll on the homepage. <strong>Text and button text are shared</strong> (taken from the first image), but <strong>each image can route to different pages</strong>. Images are displayed in order (lowest number first).
          </p>
        </div>
        <HeroImageManagement initialHeroImages={heroImages} />
      </div>
    </div>
  );
}

