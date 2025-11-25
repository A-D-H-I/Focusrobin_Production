'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCategoryImage, updateCategoryImage, deleteCategoryImage } from '@/app/actions/categoryImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface CategoryImage {
  id: string;
  category: string;
  imageUrl: string;
  alt: string;
  link: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryImageManagementProps {
  initialImages: CategoryImage[];
}

export function CategoryImageManagement({ initialImages }: CategoryImageManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<CategoryImage[]>(initialImages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const [formData, setFormData] = useState({
    category: '',
    imageUrl: '',
    alt: '',
    link: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      category: '',
      imageUrl: '',
      alt: '',
      link: '',
      isActive: true,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (image: CategoryImage) => {
    setFormData({
      category: image.category,
      imageUrl: image.imageUrl,
      alt: image.alt,
      link: image.link,
      isActive: image.isActive,
    });
    setEditingId(image.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('category', formData.category);
    form.append('imageUrl', formData.imageUrl);
    form.append('alt', formData.alt);
    form.append('link', formData.link);
    form.append('isActive', formData.isActive.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateCategoryImage(form);
      } else {
        result = await createCategoryImage(form);
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
          description: editingId ? 'Category image updated successfully' : 'Category image created successfully',
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
    if (!confirm('Are you sure you want to delete this category image?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteCategoryImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category image deleted successfully',
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

  const categoryLabels: Record<string, string> = {
    MEN: 'Men',
    WOMEN: 'Women',
    KIDS: 'Kids',
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
              Add New Category Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category Image' : 'Add New Category Image'}</DialogTitle>
              <DialogDescription>
                Configure category images displayed on the homepage
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={!!editingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEN">Men</SelectItem>
                    <SelectItem value="WOMEN">Women</SelectItem>
                    <SelectItem value="KIDS">Kids</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 4:3 or 3:2 (Landscape)</span>
                </div>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="/shopcategory/Men.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x900px (4:3) or 1200x800px (3:2). Each category takes 1/3 of the section width on desktop, full width on mobile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="Shop for men"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/shop/men"
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
            <p className="text-muted-foreground mb-4">No category images found.</p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Category Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className={!image.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">{categoryLabels[image.category] || image.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  {image.imageUrl && (
                    <Image
                      src={normalizeImageUrl(image.imageUrl)}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{image.alt}</p>
                  <p className="text-xs text-muted-foreground">Link: {image.link}</p>
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

