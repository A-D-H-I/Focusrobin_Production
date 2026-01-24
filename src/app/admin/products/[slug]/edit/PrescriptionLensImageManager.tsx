'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPrescriptionLensImagesForProduct, upsertPrescriptionLensImage, deletePrescriptionLensImage } from '@/app/actions/prescriptionLensImages';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { Checkbox } from '@/components/ui/checkbox';

interface PrescriptionLensImage {
  id: string;
  productId: string;
  productSlug: string;
  lensType: string;
  lensIndex: string | null;
  coating: string | null;
  tintType: string | null;
  tintColor: string | null;
  tintShadePercent: number | null;
  tintRecipe: string | null;
  photochromicColor: string | null;
  polarizedColor: string | null;
  frameType: string | null;
  imageUrl: string;
  isOutdoor: boolean;
}

interface PrescriptionLensImageManagerProps {
  productId: string;
  productSlug: string;
}

export function PrescriptionLensImageManager({ productId, productSlug }: PrescriptionLensImageManagerProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<PrescriptionLensImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const result = await getPrescriptionLensImagesForProduct(productId);
      if (result.images) {
        setImages(result.images as PrescriptionLensImage[]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load prescription lens images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId('new');
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add product info
    formData.append('productId', productId);
    formData.append('productSlug', productSlug);
    
    // If editing, add the ID
    if (editingId && editingId !== 'new') {
      formData.append('id', editingId);
    }

    try {
      const result = await upsertPrescriptionLensImage(formData);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Prescription lens image saved successfully',
        });
        setEditingId(null);
        loadImages();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save prescription lens image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save prescription lens image',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const result = await deletePrescriptionLensImage(id);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Prescription lens image deleted successfully',
        });
        loadImages();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete prescription lens image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prescription lens image',
        variant: 'destructive',
      });
    }
  };

  const editingImage = editingId ? (editingId === 'new' ? null : images.find(img => img.id === editingId)) : null;

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Prescription Lens Images</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage fixed images for different lens combinations. Image size should match the product image dimensions.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {/* Add/Edit Form */}
      {editingId && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Add' : 'Edit'} Prescription Lens Image</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lensType">Lens Type *</Label>
                  <Select name="lensType" defaultValue={editingImage?.lensType || ''} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lens type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLEAR">Clear</SelectItem>
                      <SelectItem value="TINTED">Tinted</SelectItem>
                      <SelectItem value="PHOTOCHROMIC_SOLIS">Photochromic Solis</SelectItem>
                      <SelectItem value="POLARIZED_NUPOLAR">Polarized NuPolar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lensIndex">Lens Index (Optional)</Label>
                  <Select name="lensIndex" defaultValue={editingImage?.lensIndex || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any index" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Index</SelectItem>
                      <SelectItem value="1.56">1.56</SelectItem>
                      <SelectItem value="1.60">1.60</SelectItem>
                      <SelectItem value="1.67">1.67</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coating">Coating (Optional)</Label>
                  <Select name="coating" defaultValue={editingImage?.coating || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any coating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Coating</SelectItem>
                      <SelectItem value="UC">UC</SelectItem>
                      <SelectItem value="BLUE_PRO">Blue Pro</SelectItem>
                      <SelectItem value="SERICUM_UV">Sericum UV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frameType">Frame Type (Optional)</Label>
                  <Input
                    name="frameType"
                    defaultValue={editingImage?.frameType || ''}
                    placeholder="e.g., FULL_FRAME, NYLON_FRAME"
                  />
                </div>
              </div>

              {/* Tint-specific fields */}
              <div id="tintFields" className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tintType">Tint Type (For TINTED only)</Label>
                    <Select name="tintType" defaultValue={editingImage?.tintType || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any tint type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Tint Type</SelectItem>
                        <SelectItem value="FULL_TINT_CATALOG">Full Tint Catalog</SelectItem>
                        <SelectItem value="GRADIENT">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tintColor">Tint Color (For TINTED only)</Label>
                    <Select name="tintColor" defaultValue={editingImage?.tintColor || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Color</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Grey">Grey</SelectItem>
                        <SelectItem value="Green">Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tintShadePercent">Tint Shade % (For Full Tint only)</Label>
                    <Select name="tintShadePercent" defaultValue={editingImage?.tintShadePercent?.toString() || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any shade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Shade</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="85">85%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tintRecipe">Tint Recipe (For Gradient only)</Label>
                    <Select name="tintRecipe" defaultValue={editingImage?.tintRecipe || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Recipe</SelectItem>
                        <SelectItem value="30->0">30→0</SelectItem>
                        <SelectItem value="50->0">50→0</SelectItem>
                        <SelectItem value="90->15">90→15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Photochromic-specific fields */}
              <div id="photochromicFields" className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="photochromicColor">Photochromic Color (For PHOTOCHROMIC_SOLIS only)</Label>
                    <Select name="photochromicColor" defaultValue={editingImage?.photochromicColor || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Color</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Grey">Grey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-8">
                    <Label htmlFor="isOutdoor" className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isOutdoor"
                        id="isOutdoor"
                        value="true"
                        defaultChecked={editingImage?.isOutdoor || false}
                        className="h-4 w-4"
                      />
                      <span>Outdoor (darkened) variant</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Polarized-specific fields */}
              <div id="polarizedFields" className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="polarizedColor">Polarized Color (For POLARIZED_NUPOLAR only)</Label>
                  <Select name="polarizedColor" defaultValue={editingImage?.polarizedColor || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Color</SelectItem>
                      <SelectItem value="Brown">Brown</SelectItem>
                      <SelectItem value="Grey">Grey</SelectItem>
                      <SelectItem value="Green">Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="imageUrl">Image URL *</Label>
                <Input
                  name="imageUrl"
                  type="url"
                  defaultValue={editingImage?.imageUrl || ''}
                  placeholder="https://example.com/image.png"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The image should have the same dimensions as the product image
                </p>
                {editingImage?.imageUrl && (
                  <div className="mt-2 aspect-square w-32 relative bg-muted rounded overflow-hidden">
                    <Image
                      src={normalizeImageUrl(editingImage.imageUrl)}
                      alt="Preview"
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Images List */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((image) => (
            <Card key={image.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="aspect-square w-24 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={normalizeImageUrl(image.imageUrl)}
                      alt="Lens image"
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {image.lensType}
                        {image.lensIndex && ` - Index ${image.lensIndex}`}
                        {image.coating && ` - ${image.coating}`}
                        {image.tintColor && ` - ${image.tintColor}`}
                        {image.photochromicColor && ` - ${image.photochromicColor}`}
                        {image.polarizedColor && ` - ${image.polarizedColor}`}
                        {image.isOutdoor && ' (Outdoor)'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{image.imageUrl}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(image.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && !editingId && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No prescription lens images configured. Click "Add Image" to get started.
        </div>
      )}
    </div>
  );
}

