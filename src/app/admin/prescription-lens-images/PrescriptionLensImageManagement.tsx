'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Edit, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/admin/ImageUploader';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAllPrescriptionLensImages,
  upsertGlobalPrescriptionLensImage,
  deleteGlobalPrescriptionLensImage,
} from '@/app/actions/prescriptionLensImages';

interface PrescriptionLensImage {
  id: string;
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

interface Combination {
  key: string;
  type: 'lensIndex' | 'lensType' | 'coating' | 'tinted' | 'polarized';
  lensType?: 'CLEAR' | 'TINTED' | 'PHOTOCHROMIC_SOLIS' | 'POLARIZED_NUPOLAR';
  lensIndex?: string;
  coating?: string;
  tintType?: string;
  tintColor?: string;
  tintShadePercent?: number;
  tintRecipe?: string;
  photochromicColor?: string;
  polarizedColor?: string;
  label: string;
  description?: string;
}

// Generate simplified combinations
function generateCombinations(): Combination[] {
  const combinations: Combination[] = [];

  // 1. Lens Index images (3 total)
  const indexes = ['1.56', '1.60', '1.67'];
  indexes.forEach(index => {
    combinations.push({
      key: `INDEX_${index}`,
      type: 'lensIndex',
      lensIndex: index,
      label: `Lens Index ${index}`,
      description: `Preview image for ${index} index lenses`,
    });
  });

  // 2. Lens Type images
  combinations.push({
    key: 'LENS_TYPE_CLEAR',
    type: 'lensType',
    lensType: 'CLEAR',
    label: 'Clear (Mono RX)',
    description: 'Clear prescription lenses - perfect for everyday wear',
  });

  // 3. Photochromic colors (2 total)
  const photochromicColors = ['Brown', 'Grey'];
  photochromicColors.forEach(color => {
    combinations.push({
      key: `PHOTOCHROMIC_${color}`,
      type: 'lensType',
      lensType: 'PHOTOCHROMIC_SOLIS',
      photochromicColor: color,
      label: `Photochromic (Solis II) - ${color}`,
      description: 'Automatically adapt to changing light - dark outdoors, clear indoors',
    });
  });

  // 4. Tinted combinations
  // Full Tint Catalog
  const tintColors = ['Brown', 'Grey', 'Green'];
  const tintShades = [15, 30, 50, 70, 85];
  
  tintColors.forEach(color => {
    tintShades.forEach(shade => {
      combinations.push({
        key: `TINTED_FULL_${color}_${shade}`,
        type: 'tinted',
        lensType: 'TINTED',
        tintType: 'FULL_TINT_CATALOG',
        tintColor: color,
        tintShadePercent: shade,
        label: `Tinted - Full Tint - ${color} ${shade}%`,
        description: 'Full Tint (Catalog) - Solid color tint',
      });
    });
  });

  // Gradient Tint
  const gradientRecipes = ['30->0', '50->0', '90->15'];
  tintColors.forEach(color => {
    gradientRecipes.forEach(recipe => {
      combinations.push({
        key: `TINTED_GRADIENT_${color}_${recipe}`,
        type: 'tinted',
        lensType: 'TINTED',
        tintType: 'GRADIENT',
        tintColor: color,
        tintRecipe: recipe,
        label: `Tinted - Gradient - ${color} (${recipe})`,
        description: 'Gradient Tint - Fades from dark at top to lighter at bottom',
      });
    });
  });

  // 5. Polarized colors (3 total)
  const polarizedColors = ['Brown', 'Grey', 'Green'];
  polarizedColors.forEach(color => {
    combinations.push({
      key: `POLARIZED_${color}`,
      type: 'polarized',
      lensType: 'POLARIZED_NUPOLAR',
      polarizedColor: color,
      label: `Polarized (NuPolar) - ${color}`,
      description: 'Reduces glare from reflective surfaces - perfect for driving and water activities',
    });
  });

  // 6. Coating images (3 total)
  combinations.push({
    key: 'COATING_UC',
    type: 'coating',
    coating: 'UC',
    label: 'Uncoated (UC)',
    description: 'Basic uncoated lens',
  });

  combinations.push({
    key: 'COATING_BLUE_PRO',
    type: 'coating',
    coating: 'BLUE_PRO',
    label: 'Blue PRO',
    description: 'Blue light protection coating',
  });

  combinations.push({
    key: 'COATING_SERICUM_UV',
    type: 'coating',
    coating: 'SERICUM_UV',
    label: 'SERICUM UV',
    description: 'UV protection coating',
  });

  return combinations;
}

// Find matching image for a combination
function findMatchingImage(images: PrescriptionLensImage[], combination: Combination): PrescriptionLensImage | null {
  if (!images || !Array.isArray(images) || !combination) return null;
  
  return images.find(img => {
    if (!img) return false;

    if (combination.type === 'lensIndex') {
      return img.lensIndex === combination.lensIndex && !img.lensType && !img.coating;
    }

    if (combination.type === 'coating') {
      return img.coating === combination.coating && !img.lensType && !img.lensIndex;
    }

    if (combination.type === 'lensType') {
      if (img.lensType !== combination.lensType) return false;
      if (img.coating) return false;
      if (img.tintType) return false;
      if (img.polarizedColor) return false;
      if (img.lensIndex) return false;
      
      // For photochromic, check color match
      if (combination.lensType === 'PHOTOCHROMIC_SOLIS') {
        if (combination.photochromicColor) {
          return img.photochromicColor === combination.photochromicColor;
        }
        return !img.photochromicColor;
      }
      
      // For clear, no photochromic color
      if (combination.lensType === 'CLEAR') {
        return !img.photochromicColor;
      }
      
      return true;
    }

    if (combination.type === 'tinted') {
      if (img.lensType !== 'TINTED') return false;
      if (img.tintType !== combination.tintType) return false;
      if (img.tintColor !== combination.tintColor) return false;
      if (combination.tintShadePercent !== undefined && img.tintShadePercent !== combination.tintShadePercent) return false;
      if (combination.tintRecipe && img.tintRecipe !== combination.tintRecipe) return false;
      return true;
    }

    if (combination.type === 'polarized') {
      return img.lensType === 'POLARIZED_NUPOLAR' && 
             img.polarizedColor === combination.polarizedColor;
    }
    
    return false;
  }) || null;
}

export function PrescriptionLensImageManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<PrescriptionLensImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombination, setSelectedCombination] = useState<Combination | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const combinations = generateCombinations();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const result = await getAllPrescriptionLensImages();
      if (result && 'images' in result && result.images) {
        setImages(result.images as PrescriptionLensImage[]);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prescription lens images',
        variant: 'destructive',
      });
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCombinationClick = (combination: Combination) => {
    const existingImage = findMatchingImage(images, combination);
    setSelectedCombination(combination);
    setImageUrl(existingImage?.imageUrl || '');
    setEditingImageId(existingImage?.id || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCombination || !imageUrl) {
      toast({
        title: 'Error',
        description: 'Please upload an image',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();
      if (editingImageId) {
        submitFormData.append('id', editingImageId);
      }
      
      submitFormData.append('imageUrl', imageUrl);
      submitFormData.append('isOutdoor', 'false');

      if (selectedCombination.type === 'lensIndex') {
        submitFormData.append('lensIndex', selectedCombination.lensIndex || '');
      } else if (selectedCombination.type === 'coating') {
        submitFormData.append('coating', selectedCombination.coating || '');
      } else if (selectedCombination.type === 'lensType') {
        submitFormData.append('lensType', selectedCombination.lensType || '');
        if (selectedCombination.photochromicColor) {
          submitFormData.append('photochromicColor', selectedCombination.photochromicColor);
        }
      } else if (selectedCombination.type === 'tinted') {
        submitFormData.append('lensType', 'TINTED');
        submitFormData.append('tintType', selectedCombination.tintType || '');
        submitFormData.append('tintColor', selectedCombination.tintColor || '');
        if (selectedCombination.tintShadePercent !== undefined) {
          submitFormData.append('tintShadePercent', selectedCombination.tintShadePercent.toString());
        }
        if (selectedCombination.tintRecipe) {
          submitFormData.append('tintRecipe', selectedCombination.tintRecipe);
        }
      } else if (selectedCombination.type === 'polarized') {
        submitFormData.append('lensType', 'POLARIZED_NUPOLAR');
        submitFormData.append('polarizedColor', selectedCombination.polarizedColor || '');
      }

      const result = await upsertGlobalPrescriptionLensImage(submitFormData);

      if (result && result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: editingImageId ? 'Image updated successfully!' : 'Image added successfully!',
        });
        router.refresh();
        loadImages();
        setIsDialogOpen(false);
        setSelectedCombination(null);
        setImageUrl('');
        setEditingImageId(null);
      }
    } catch (error) {
      console.error('Error submitting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to save image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, combination: Combination) => {
    e.stopPropagation();
    const existingImage = findMatchingImage(images, combination);
    if (!existingImage) return;

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteGlobalPrescriptionLensImage(existingImage.id);
      if (result && result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Image deleted successfully!',
        });
        router.refresh();
        loadImages();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Group combinations by type
  const groupedCombinations = (combinations || []).reduce((acc, combo) => {
    if (!combo || !combo.type) return acc;
    if (!acc[combo.type]) {
      acc[combo.type] = [];
    }
    acc[combo.type].push(combo);
    return acc;
  }, {} as Record<string, Combination[]>);

  const sectionTitles: Record<string, string> = {
    lensIndex: 'Lens Index Images',
    lensType: 'Lens Type Images',
    coating: 'Coating Images',
    tinted: 'Tinted Combinations',
    polarized: 'Polarized Colors',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prescription Lens Images</h1>
        <p className="text-muted-foreground mt-2">
          Click on a combination to add or edit the preview image. Images are shared across all products.
        </p>
      </div>

      {Object.entries(groupedCombinations).map(([type, combos]) => {
        if (!combos || !Array.isArray(combos) || combos.length === 0) return null;
        return (
          <div key={type} className="space-y-4">
            <h2 className="text-xl font-semibold">{sectionTitles[type] || type}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {combos.map((combination) => {
                if (!combination) return null;
                const existingImage = findMatchingImage(images, combination);
                return (
                  <Card
                    key={combination.key || `${type}-${Math.random()}`}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${
                      existingImage ? 'border-green-500' : 'border-dashed'
                    }`}
                    onClick={() => handleCombinationClick(combination)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm">{combination.label}</CardTitle>
                          {combination.description && (
                            <p className="text-xs text-muted-foreground mt-1">{combination.description}</p>
                          )}
                        </div>
                        {existingImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, combination)}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {existingImage && existingImage.imageUrl ? (
                        <div className="relative aspect-square w-full bg-muted rounded overflow-hidden">
                          <Image
                            src={normalizeImageUrl(existingImage.imageUrl)}
                            alt={combination.label || 'Lens preview'}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-square w-full bg-muted rounded flex items-center justify-center border-2 border-dashed">
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">Click to add image</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingImageId ? 'Edit' : 'Add'} Image - {selectedCombination?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedCombination?.description || 'Upload the preview image for this lens combination. This image will be used for all products with matching lens configuration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lens Preview Image *</Label>
              <ImageUploader
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                folder="lens-images"
                label="Prescription Lens Preview Image"
                description="The image should have the same dimensions as the product image"
                maxSizeMB={10}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !imageUrl}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingImageId ? 'Update Image' : 'Add Image'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedCombination(null);
                  setImageUrl('');
                  setEditingImageId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
