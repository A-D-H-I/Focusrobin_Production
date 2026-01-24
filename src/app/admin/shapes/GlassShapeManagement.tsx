'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGlassShape, updateGlassShape, deleteGlassShape, getAllGlassShapes, syncGlassShapesFromProducts } from '@/app/actions/glassShapeCRUD';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
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

interface GlassShape {
  id: string;
  name: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GlassShapeManagementProps {
  initialShapes: GlassShape[];
}

export function GlassShapeManagement({ initialShapes }: GlassShapeManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [shapes, setShapes] = useState<GlassShape[]>(initialShapes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setShapes(initialShapes);
  }, [initialShapes]);

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    order: '0',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      order: '0',
      isActive: true,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (shape: GlassShape) => {
    setFormData({
      name: shape.name,
      imageUrl: shape.imageUrl || '',
      order: shape.order.toString(),
      isActive: shape.isActive,
    });
    setEditingId(shape.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('imageUrl', formData.imageUrl);
    form.append('order', formData.order);
    form.append('isActive', formData.isActive.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateGlassShape(form);
      } else {
        result = await createGlassShape(form);
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
          description: editingId ? 'Glass shape updated successfully' : 'Glass shape created successfully',
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
    if (!confirm('Are you sure you want to delete this glass shape?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteGlassShape(form);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Glass shape deleted successfully',
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

  const handleSync = async () => {
    setIsSubmitting(true);
    try {
      const result = await syncGlassShapesFromProducts();
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const createdCount = result.created ?? 0;
        toast({
          title: 'Success',
          description: createdCount > 0 
            ? `Synced ${createdCount} shape(s) from existing products: ${result.shapes?.join(', ') || ''}`
            : 'All shapes are already synced. No new shapes found.',
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-brand-h1 font-headline text-foreground">Glass Shape Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage glass shapes and their images for the mega menu and shop by shapes section.
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Auto-Creation:</strong> When you add a new product and enter a glass shape (e.g., "Cat Eye", "Rectangle"), 
              the shape is automatically created here. You can then add an image for each shape to display in the mega menu.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleSync}
            disabled={isSubmitting}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            Sync from Products
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Shape
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Glass Shape' : 'Add New Glass Shape'}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update the glass shape details and image.'
                  : 'Create a new glass shape. The image will be displayed in the mega menu and shop by shapes section.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shape Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cat Eye, Rectangle"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This name should match the glassShape values used in products.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Shape Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/shape-image.jpg or /public/shapes/cat-eye.png"
                  type="text"
                />
                <p className="text-xs text-muted-foreground">
                  <strong>Upload your image:</strong> Upload the shape image to your storage/CDN (e.g., Dropbox, S3, or public folder) 
                  and paste the full URL here. This image will be displayed in the mega menu "Shop by Shape" section. 
                  Recommended size: 200x150px or similar aspect ratio.
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  💡 <strong>Tip:</strong> Shapes are automatically created when you add products with a glass shape. 
                  You can then come here to add images for each shape.
                </p>
                {formData.imageUrl && (
                  <div className="mt-2 relative w-full h-48 border rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={normalizeImageUrl(formData.imageUrl)}
                      alt={formData.name || 'Shape preview'}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first. Default is 0.
                </p>
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
                  Active (visible in mega menu)
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Glass Shapes ({shapes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shapes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No glass shapes found. Shapes will be automatically created when you add products with a glass shape.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shapes.map((shape) => (
                <Card key={shape.id} className={`relative ${!shape.imageUrl ? 'border-2 border-orange-200' : 'border'}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{shape.name}</h3>
                            {!shape.imageUrl && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded whitespace-nowrap">
                                No Image
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Order: {shape.order} | {shape.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(shape)}
                            disabled={isSubmitting}
                            className="h-8 w-8"
                            title="Edit shape"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(shape.id)}
                            disabled={isSubmitting}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete shape"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {shape.imageUrl ? (
                        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-gray-50">
                          <Image
                            src={normalizeImageUrl(shape.imageUrl)}
                            alt={shape.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-2">
                          <p className="text-xs text-muted-foreground font-medium">No image</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(shape)}
                            className="text-xs h-7"
                          >
                            Add Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

