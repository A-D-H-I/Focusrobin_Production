import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EditProductForm } from './EditProductForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params (required in Next.js 15)
  const { slug } = await params;

  const decodedSlug = decodeURIComponent(slug);

  // Fetch product by slug from database
  const prismaProduct = (await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
      highlights: true,
    },
    // Use raw query workaround if Prisma has issues with enum arrays
  })) as any;

  // Ensure gender is always an array (handle any edge cases)
  if (prismaProduct && !Array.isArray(prismaProduct.gender)) {
    prismaProduct.gender = prismaProduct.gender ? [prismaProduct.gender] : [];
  }

  // Handle 404 if product not found
  if (!prismaProduct) {
    notFound();
  }

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href={`/admin/products/${prismaProduct.slug}`}>
            <Button variant="outline" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Product
            </Button>
          </Link>
          <h1 className="text-brand-h1 font-headline text-foreground">Edit Product</h1>
          <p className="mt-2 text-muted-foreground">Update product details, variants, and assets</p>
        </div>
        <EditProductForm product={prismaProduct} productId={prismaProduct.id} />
      </div>
    </div>
  );
}

