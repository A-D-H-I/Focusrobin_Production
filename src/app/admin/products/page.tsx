import { prisma } from '@/lib/prisma';
import { mapPrismaProductToProduct } from '@/lib/prisma-product-mapper';
import { AdminProductListClient } from './AdminProductListClient';

export default async function AdminProductsPage() {
  // Fetch all products with their variants and assets
  const prismaProducts = (await prisma.product.findMany({
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })) as any;

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);

  return <AdminProductListClient products={products} prismaProducts={prismaProducts} />;
}

