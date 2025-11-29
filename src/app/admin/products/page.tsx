import { prisma } from '@/lib/prisma';
import { mapPrismaProductToProduct } from '@/lib/prisma-product-mapper';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Plus } from 'lucide-react';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Handle Windows absolute paths - look for public folder
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    const path = publicPathMatch[1].replace(/\\/g, '/');
    return '/' + path;
  }
  
  // Handle paths that might have backslashes but no "public" folder
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  // Fallback: return as is (might be a relative path without leading /)
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Products</h1>
            <p className="mt-2 text-muted-foreground">
              Manage and view all products in your store ({products.length} total)
            </p>
          </div>
          <Link href="/admin/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found.</p>
            <Link href="/admin/add">
              <Button>Add Your First Product</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any, index: number) => {
              const rawImage = product.variants[0]?.thumbnail || product.variants[0]?.images[0] || '';
              const primaryImage = normalizeImageUrl(rawImage);
              // Get the actual database ID from the original Prisma product
              const dbProductId = prismaProducts[index].id;
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.categories.join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-lg font-bold">{product.price}</p>
                      {product.cashback && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          🎁 {product.cashback}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${product.id}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="outline" className="gap-2" size="sm">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <DeleteProductButton
                        productId={dbProductId}
                        productName={product.name}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

