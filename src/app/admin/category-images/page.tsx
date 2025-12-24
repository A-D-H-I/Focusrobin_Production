import { prisma } from '@/lib/prisma';
import { CategoryImageManagement } from './CategoryImageManagement';

export default async function AdminCategoryImagesPage() {
  let categoryImages: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.categoryImage && typeof prisma.categoryImage.findMany === 'function') {
      // @ts-ignore
      categoryImages = await prisma.categoryImage.findMany({
        orderBy: {
          category: 'asc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching category images:', error);
    categoryImages = [];
  }

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Category Images</h1>
          <p className="mt-2 text-muted-foreground">
            Manage category images displayed on the homepage (Men, Women, Kids)
          </p>
        </div>
        <CategoryImageManagement initialImages={categoryImages} />
      </div>
    </div>
  );
}

