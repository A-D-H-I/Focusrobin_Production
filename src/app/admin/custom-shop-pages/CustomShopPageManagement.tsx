'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomShopPage, updateCustomShopPage, deleteCustomShopPage } from '@/app/actions/customShopPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomShopPage {
  id: string;
  name: string;
  slug: string;
  bannerImage: string;
  videoUrl: string | null;
  description: string | null;
  isVisible: boolean;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface CustomShopPageManagementProps {
  initialPages: CustomShopPage[];
  availableProducts: Product[];
}

export function CustomShopPageManagement({ initialPages, availableProducts }: CustomShopPageManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState<CustomShopPage[]>(initialPages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bannerImage: '',
    videoUrl: '',
    description: '',
    isVisible: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      bannerImage: '',
      videoUrl: '',
      description: '',
      isVisible: false,
    });
    setSelectedProductIds([]);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (page: CustomShopPage) => {
    setFormData({
      name: page.name,
      slug: page.slug,
      bannerImage: page.bannerImage,
      videoUrl: page.videoUrl || '',
      description: page.description || '',
      isVisible: page.isVisible,
    });
    setSelectedProductIds(page.products);
    setEditingId(page.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('slug', formData.slug);
    form.append('bannerImage', formData.bannerImage);
    form.append('videoUrl', formData.videoUrl);
    form.append('description', formData.description);
    form.append('isVisible', formData.isVisible.toString());
    form.append('products', selectedProductIds.join(','));

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateCustomShopPage(form);
      } else {
        result = await createCustomShopPage(form);
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
          description: editingId ? 'Custom shop page updated successfully' : 'Custom shop page created successfully',
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

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm('Are you sure you want to delete this custom shop page?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);
    form.append('slug', slug);

    try {
      const result = await deleteCustomShopPage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Custom shop page deleted successfully',
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

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
              Add New Custom Shop Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingId ? 'Edit Custom Shop Page' : 'Add New Custom Shop Page'}</DialogTitle>
              <DialogDescription>
                Create custom shop pages like "New Arrivals", "Offers", etc. with banner, video, and selected products
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Page Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!editingId) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    placeholder="New Arrivals"
                    required
                  />
                  <p className="text-xs text-muted-foreground">e.g., "New Arrivals", "Summer Collection", "Offers"</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="new-arrivals"
                    required
                  />
                  <p className="text-xs text-muted-foreground">URL will be: /shop/{formData.slug || 'slug'}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerImage">Banner Image URL *</Label>
                  <Input
                    id="bannerImage"
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    placeholder="/images/banner.jpg"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 1920x1080px (16:9) wide banner</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or /videos/promo.mp4"
                  />
                  <p className="text-xs text-muted-foreground">YouTube URL or direct video file URL</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this collection or page..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Products *</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {availableProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products available</p>
                    ) : (
                      <div className="space-y-2">
                        {availableProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedProductIds.includes(product.slug)}
                              onCheckedChange={() => toggleProductSelection(product.slug)}
                            />
                            <Label 
                              htmlFor={`product-${product.id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {product.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVisible"
                    checked={formData.isVisible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isVisible: checked === true })
                    }
                  />
                  <Label htmlFor="isVisible" className="cursor-pointer">
                    Make page visible (page will only appear if this is checked)
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 px-6 pb-6 border-t bg-background">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || selectedProductIds.length === 0}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No custom shop pages found.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create custom shop pages like "New Arrivals", "Offers", etc.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Custom Shop Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className={!page.isVisible ? 'opacity-60 border-dashed' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{page.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {page.isVisible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">/shop/{page.slug}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  {page.bannerImage && (
                    <Image
                      src={normalizeImageUrl(page.bannerImage)}
                      alt={page.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                  )}
                </div>

                {page.videoUrl && (
                  <div className="text-sm">
                    <span className="font-semibold">Video:</span>
                    <p className="text-muted-foreground truncate">{page.videoUrl}</p>
                  </div>
                )}

                {page.description && (
                  <div className="text-sm">
                    <span className="font-semibold">Description:</span>
                    <p className="text-muted-foreground">{page.description}</p>
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-semibold">Products:</span>
                  <p className="text-muted-foreground">{page.products.length} product{page.products.length !== 1 ? 's' : ''} selected</p>
                </div>

                {!page.isVisible && (
                  <p className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    ⚠️ Page is hidden (not visible to users)
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                    disabled={isSubmitting}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id, page.slug)}
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

