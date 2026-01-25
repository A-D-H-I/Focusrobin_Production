'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createIconicImage, updateIconicImage, deleteIconicImage, setActiveIconicImage } from '@/app/actions/iconicImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface IconicImage {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  alt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IconicImageManagementProps {
  initialImages: IconicImage[];
}

export function IconicImageManagement({ initialImages }: IconicImageManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<IconicImage[]>(initialImages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const [formData, setFormData] = useState({
    imageUrl: '',
    mobileTabletImageUrl: '',
    alt: '',
    isActive: false,
  });

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      mobileTabletImageUrl: '',
      alt: '',
      isActive: false,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (image: IconicImage) => {
    setFormData({
      imageUrl: image.imageUrl,
      mobileTabletImageUrl: image.mobileTabletImageUrl || '',
      alt: image.alt,
      isActive: image.isActive,
    });
    setEditingId(image.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('imageUrl', formData.imageUrl);
    form.append('mobileTabletImageUrl', formData.mobileTabletImageUrl);
    form.append('alt', formData.alt);
    form.append('isActive', formData.isActive.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateIconicImage(form);
      } else {
        result = await createIconicImage(form);
      }

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: editingId ? 'Iconic image updated successfully' : 'Iconic image created successfully',
        });
        resetForm();
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this iconic image?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteIconicImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Iconic image deleted successfully',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await setActiveIconicImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Active iconic image updated',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Iconic Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Iconic Image' : 'Add New Iconic Image'}</DialogTitle>
              <DialogDescription>
                Configure the iconic section background image
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Desktop Image</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 or 21:9 (Landscape)</span>
                </div>
                <ImageUploader
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="iconic"
                  label="Desktop Iconic Image"
                  description="Recommended: 1920x1080px (16:9) or 2560x1080px (21:9). Wide banner format, minimum height 600px."
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mobile & Tablet Image</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 9:16 or 3:4 (Portrait)</span>
                </div>
                <ImageUploader
                  value={formData.mobileTabletImageUrl || ""}
                  onChange={(url) => setFormData({ ...formData, mobileTabletImageUrl: url })}
                  folder="iconic"
                  label="Mobile & Tablet Iconic Image (Optional)"
                  description="Recommended: 1080x1920px (9:16) or 1080x1440px (3:4). Full screen portrait orientation. Optional - if not provided, desktop image will be used."
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="FocusRobin background"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked === true })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Set as active (only one can be active at a time)
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No iconic images found.</p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Iconic Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image) => (
            <Card key={image.id} className={image.isActive ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Iconic Image</CardTitle>
                  {image.isActive && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {image.imageUrl && (
                      <Image
                        src={normalizeImageUrl(image.imageUrl)}
                        alt="Desktop preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Desktop
                    </div>
                  </div>
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {(image.mobileTabletImageUrl || image.imageUrl) && (
                      <Image
                        src={normalizeImageUrl(image.mobileTabletImageUrl || image.imageUrl)}
                        alt="Mobile/Tablet preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Mobile/Tablet
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{image.alt}</p>
                </div>

                <div className="flex gap-2">
                  {!image.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(image.id)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(image)}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    disabled={isSubmitting}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

