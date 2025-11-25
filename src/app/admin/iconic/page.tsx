import { prisma } from '@/lib/prisma';
import { IconicImageManagement } from './IconicImageManagement';

export default async function AdminIconicPage() {
  let iconicImages: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.iconicImage && typeof prisma.iconicImage.findMany === 'function') {
      // @ts-ignore
      iconicImages = await prisma.iconicImage.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching iconic images:', error);
    iconicImages = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Iconic Images</h1>
          <p className="mt-2 text-muted-foreground">
            Manage iconic section background image on the homepage
          </p>
        </div>
        <IconicImageManagement initialImages={iconicImages} />
      </div>
    </div>
  );
}

