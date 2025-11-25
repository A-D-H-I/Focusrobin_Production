import { prisma } from '@/lib/prisma';
import { CustomShopPageManagement } from './CustomShopPageManagement';

export default async function AdminCustomShopPagesPage() {
  let customShopPages: any[] = [];
  let availableProducts: any[] = [];
  
  try {
    // @ts-ignore
    if (prisma.customShopPage && typeof prisma.customShopPage.findMany === 'function') {
      // @ts-ignore
      customShopPages = await prisma.customShopPage.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching custom shop pages:', error);
    customShopPages = [];
  }

  try {
    // Fetch all products for selection
    const prismaProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    availableProducts = prismaProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    availableProducts = [];
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Custom Shop Pages</h1>
          <p className="mt-2 text-muted-foreground">
            Create custom shop pages like "New Arrivals", "Offers", etc. with banners, videos, and selected products
          </p>
        </div>
        <CustomShopPageManagement 
          initialPages={customShopPages} 
          availableProducts={availableProducts}
        />
      </div>
    </div>
  );
}

