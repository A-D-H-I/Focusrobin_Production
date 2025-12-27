import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mapPrismaProductToProduct } from '@/lib/prisma-product-mapper';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';

/**
 * Converts Google Drive share link to direct image URL
 */
function convertGoogleDriveLink(url: string): string {
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  return url;
}

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), check for Google Drive links
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }
  
  // Handle Windows absolute paths - look for public folder
  // Match: G:\Dev\...\public\image.jpg or C:\...\public\image.jpg
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    const path = publicPathMatch[1].replace(/\\/g, '/');
    return '/' + path;
  }
  
  // Handle paths that might have backslashes but no "public" folder
  // Extract filename from end of path
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  // Fallback: return as is (might be a relative path without leading /)
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

export default async function AdminProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params (required in Next.js 15)
  const { slug } = await params;
  
  // Decode the slug
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
      Review: {
        include: {
          User: true,
        },
      },
    },
  })) as any;

  // Handle 404 if product not found
  if (!prismaProduct) {
    notFound();
  }

  // Map Prisma product to frontend Product type for display
  const product = mapPrismaProductToProduct(prismaProduct);

  // Get all assets organized by type
  const getAssetsByType = (type: string) => {
    return prismaProduct.ProductVariant.flatMap((variant: any) =>
      variant.ProductAsset.filter((asset: any) => asset.type === type)
    );
  };

  const galleryAssets = getAssetsByType('GALLERY');
  const noBgAssets = getAssetsByType('NO_BG');
  const glbAssets = getAssetsByType('GLB');
  const tryOnAssets = getAssetsByType('TRY_ON_2D');
  const hoverAssets = getAssetsByType('HOVER');

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <div>
              <h1 className="text-brand-h1 font-headline text-foreground">{product.name}</h1>
              <p className="text-muted-foreground">Product Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/products/${decodedSlug}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <DeleteProductButton
              productId={prismaProduct.id}
              productName={product.name}
              variant="outline"
              className="gap-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gallery Images */}
                {galleryAssets.length > 0 && (
                  <div>
                    <h4 className="text-brand-h4 font-headline mb-3">Gallery Images ({galleryAssets.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryAssets.map((asset: any, index: number) => {
                        const normalizedUrl = normalizeImageUrl(asset.url);
                        return (
                          <div key={asset.id} className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                            {normalizedUrl ? (
                              <Image
                                src={normalizedUrl}
                                alt={`Gallery ${index + 1}`}
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 50vw, 33vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                            {asset.isPrimary && (
                              <Badge className="absolute top-2 right-2">Primary</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hover Images */}
                {hoverAssets.length > 0 && (
                  <div>
                    <h4 className="text-brand-h4 font-headline mb-3">Hover Images ({hoverAssets.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hoverAssets.map((asset: any) => {
                        const normalizedUrl = normalizeImageUrl(asset.url);
                        return (
                          <div key={asset.id} className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                            {normalizedUrl ? (
                              <Image
                                src={normalizedUrl}
                                alt="Hover"
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 50vw, 33vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Background Images */}
                {noBgAssets.length > 0 && (
                  <div>
                    <h4 className="text-brand-h4 font-headline mb-3">Transparent Background ({noBgAssets.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {noBgAssets.map((asset: any) => {
                        const normalizedUrl = normalizeImageUrl(asset.url);
                        return (
                          <div key={asset.id} className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                            {normalizedUrl ? (
                              <Image
                                src={normalizedUrl}
                                alt="No BG"
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 50vw, 33vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Try-On Images */}
                {tryOnAssets.length > 0 && (
                  <div>
                    <h4 className="text-brand-h4 font-headline mb-3">Try-On Images ({tryOnAssets.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {tryOnAssets.map((asset: any) => {
                        const normalizedUrl = normalizeImageUrl(asset.url);
                        return (
                          <div key={asset.id} className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                            {normalizedUrl ? (
                              <Image
                                src={normalizedUrl}
                                alt="Try-On"
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 50vw, 33vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3D Models */}
                {glbAssets.length > 0 && (
                  <div>
                    <h4 className="text-brand-h4 font-headline mb-3">3D Models (.glb) ({glbAssets.length})</h4>
                    <div className="space-y-2">
                      {glbAssets.map((asset: any) => (
                        <div key={asset.id} className="p-3 bg-muted rounded-lg">
                          <code className="text-sm">{asset.url}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Product Variants ({prismaProduct.ProductVariant.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prismaProduct.ProductVariant.map((variant: any) => (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-brand-h4 font-headline">{variant.name}</h4>
                          <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-border"
                            style={{ backgroundColor: variant.colorHex }}
                            title={variant.colorName}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Color:</span>
                          <p className="font-medium">{variant.colorName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lens:</span>
                          <p className="font-medium">{variant.lensColor}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock:</span>
                          <p className="font-medium">{variant.stock}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium">
                            {variant.price ? `€${Number(variant.price).toFixed(2)}` : `€${Number(prismaProduct.basePrice).toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">
                          Assets: {variant.ProductAsset.length}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Name</span>
                  <p className="font-medium">{prismaProduct.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Slug</span>
                  <p className="font-medium font-mono text-sm">{prismaProduct.slug}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="font-medium">{prismaProduct.description}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Gender</span>
                  <p className="font-medium">
                    {Array.isArray(prismaProduct.gender) 
                      ? prismaProduct.gender.map((g: string) => 
                          g === 'MEN' ? 'Men' : 
                          g === 'WOMEN' ? 'Women' : 
                          g === 'KIDS' ? 'Kids' : 
                          'Unisex'
                        ).join(', ')
                      : 'Unisex'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Base Price</span>
                  <p className="font-medium">€{Number(prismaProduct.basePrice).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Discount Percentage</span>
                  <p className="font-medium">{prismaProduct.discountPct || 0}%</p>
                </div>
                {prismaProduct.discountPct && prismaProduct.discountPct > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Discounted Price</span>
                    <p className="font-medium text-destructive">
                      €{(Number(prismaProduct.basePrice) * (1 - (prismaProduct.discountPct || 0) / 100)).toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Cashback Amount</span>
                  <p className="font-medium">
                    {prismaProduct.cashbackAmount && Number(prismaProduct.cashbackAmount) > 0 
                      ? `€${Number(prismaProduct.cashbackAmount).toFixed(2)}` 
                      : '€0.00'}
                  </p>
                </div>
                {prismaProduct.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prismaProduct.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frame Width:</span>
                  <span className="font-medium">{prismaProduct.frameWidth}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens Width:</span>
                  <span className="font-medium">{prismaProduct.lensWidth}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens Height:</span>
                  <span className="font-medium">{prismaProduct.lensHeight}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge Width:</span>
                  <span className="font-medium">{prismaProduct.bridgeWidth}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temple Length:</span>
                  <span className="font-medium">{prismaProduct.templeLength}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{prismaProduct.weightBg}g</span>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Frame Material:</span>
                  <p className="font-medium">{prismaProduct.frameMaterial}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lens Material:</span>
                  <p className="font-medium">{prismaProduct.lensMaterial || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">UV Protection:</span>
                  <p className="font-medium">{prismaProduct.uvProtection}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <p className="font-medium">{prismaProduct.weightBg}g</p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {prismaProduct.Review.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({prismaProduct.Review.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prismaProduct.Review.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{review.User.name || review.User.email}</span>
                          <span className="text-muted-foreground">⭐ {review.rating}/5</span>
                        </div>
                        <p className="text-muted-foreground">{review.title}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

