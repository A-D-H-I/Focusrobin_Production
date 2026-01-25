'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInstagramImage, updateInstagramImage, deleteInstagramImage } from '@/app/actions/instagramImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
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

interface InstagramImage {
  id: string;
  imageUrl: string;
  alt: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InstagramImageManagementProps {
  initialImages: InstagramImage[];
}

export function InstagramImageManagement({ initialImages }: InstagramImageManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<InstagramImage[]>(initialImages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const [formData, setFormData] = useState({
    imageUrl: '',
    alt: '',
    link: 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
    isActive: true,
    order: 0,
  });

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      alt: '',
      link: 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
      isActive: true,
      order: 0,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (image: InstagramImage) => {
    setFormData({
      imageUrl: image.imageUrl,
      alt: image.alt,
      link: image.link,
      isActive: image.isActive,
      order: image.order,
    });
    setEditingId(image.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('imageUrl', formData.imageUrl);
    form.append('alt', formData.alt);
    form.append('link', formData.link);
    form.append('isActive', formData.isActive.toString());
    form.append('order', formData.order.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateInstagramImage(form);
      } else {
        result = await createInstagramImage(form);
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
          description: editingId ? 'Instagram image updated successfully' : 'Instagram image created successfully',
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
    if (!confirm('Are you sure you want to delete this Instagram image?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteInstagramImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Instagram image deleted successfully',
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
              Add New Instagram Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Instagram Image' : 'Add New Instagram Image'}</DialogTitle>
              <DialogDescription>
                Configure Instagram images displayed on the homepage
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Image</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 3:4 (Portrait)</span>
                </div>
                <ImageUploader
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="instagram"
                  label="Instagram Image"
                  description="Recommended: 1080x1440px (3:4). Portrait format, displayed in a 2x4 grid (2 rows, 4 columns) in the Community Lookbook section."
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="FocusRobin Instagram post"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Instagram Link</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://www.instagram.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
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
                  Active
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
            <p className="text-muted-foreground mb-4">No Instagram images found.</p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Instagram Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className={!image.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">Order: {image.order}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                  {image.imageUrl && (
                    <Image
                      src={normalizeImageUrl(image.imageUrl)}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      unoptimized
                    />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{image.alt}</p>
                  {!image.isActive && (
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(image)}
                    disabled={isSubmitting}
                    className="flex-1 gap-2"
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

