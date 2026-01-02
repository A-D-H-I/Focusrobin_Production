import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { DeletePrescriptionGlassesButton } from './DeletePrescriptionGlassesButton';

export const metadata: Metadata = {
  title: 'Prescription Glasses | Admin Dashboard',
  description: 'Manage prescription glasses products',
};

function normalizeImage(url: string): string {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

export default async function AdminPrescriptionGlassesPage() {
  const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
    include: {
      PrescriptionGlassesVariant: {
        include: {
          PrescriptionGlassesAsset: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prescription Glasses</h1>
          <p className="text-muted-foreground mt-2">
            Manage all prescription glasses products separately from sunglasses
          </p>
        </div>
        <Link href="/admin/prescription-glasses/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Prescription Glasses
          </Button>
        </Link>
      </div>

      {prescriptionGlasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No prescription glasses products found.
            </p>
            <Link href="/admin/prescription-glasses/add">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Prescription Glasses
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptionGlasses.map((glasses) => {
            // Get first variant's first gallery image
            const firstVariant = glasses.PrescriptionGlassesVariant[0];
            const firstGalleryAsset = firstVariant?.PrescriptionGlassesAsset?.find(
              (a) => a.type === 'GALLERY'
            );
            const imageUrl = firstGalleryAsset?.url || '/placeholder.png';

            return (
              <Card key={glasses.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {imageUrl && (
                    <Image
                      src={normalizeImageUrl(imageUrl)}
                      alt={glasses.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="line-clamp-1">{glasses.name}</span>
                    {glasses.discountPct > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                        -{glasses.discountPct}%
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">
                      €{Number(glasses.basePrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Variants:</span>
                    <span>{glasses.PrescriptionGlassesVariant.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gender:</span>
                    <span>{glasses.gender.join(', ')}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/admin/prescription-glasses/${glasses.slug}/edit`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <DeletePrescriptionGlassesButton
                      id={glasses.id}
                      name={glasses.name}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

