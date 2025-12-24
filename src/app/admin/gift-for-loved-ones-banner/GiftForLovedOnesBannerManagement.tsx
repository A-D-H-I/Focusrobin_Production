'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGiftForLovedOnesBanner, updateGiftForLovedOnesBanner, deleteGiftForLovedOnesBanner } from '@/app/actions/giftForLovedOnesBanner';
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

interface GiftForLovedOnesBanner {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GiftForLovedOnesBannerManagementProps {
  initialBanner: GiftForLovedOnesBanner | null;
}

export function GiftForLovedOnesBannerManagement({ initialBanner }: GiftForLovedOnesBannerManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [banner, setBanner] = useState<GiftForLovedOnesBanner | null>(initialBanner);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(initialBanner?.id || null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setBanner(initialBanner);
    setEditingId(initialBanner?.id || null);
  }, [initialBanner]);

  const [formData, setFormData] = useState({
    imageUrl: initialBanner?.imageUrl || '',
    mobileTabletImageUrl: initialBanner?.mobileTabletImageUrl || '',
    isActive: initialBanner?.isActive ?? true,
  });

  const resetForm = () => {
    if (banner) {
      setFormData({
        imageUrl: banner.imageUrl,
        mobileTabletImageUrl: banner.mobileTabletImageUrl || '',
        isActive: banner.isActive,
      });
    } else {
      setFormData({
        imageUrl: '',
        mobileTabletImageUrl: '',
        isActive: true,
      });
    }
    setIsDialogOpen(false);
  };

  const handleEdit = () => {
    if (banner) {
      setFormData({
        imageUrl: banner.imageUrl,
        mobileTabletImageUrl: banner.mobileTabletImageUrl || '',
        isActive: banner.isActive,
      });
      setEditingId(banner.id);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append('imageUrl', formData.imageUrl);
      submitFormData.append('mobileTabletImageUrl', formData.mobileTabletImageUrl);
      submitFormData.append('isActive', formData.isActive.toString());

      let result;
      if (editingId) {
        submitFormData.append('id', editingId);
        result = await updateGiftForLovedOnesBanner(submitFormData);
      } else {
        result = await createGiftForLovedOnesBanner(submitFormData);
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
          description: editingId ? 'Banner updated successfully!' : 'Banner created successfully!',
        });
        router.refresh();
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to save banner. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!banner) return;

    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', banner.id);
      const result = await deleteGiftForLovedOnesBanner(formData);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Banner deleted successfully!',
        });
        router.refresh();
        setBanner(null);
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete banner. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {banner ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Banner</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {banner.isActive ? (
                    <span className="text-green-600">Active - Displayed on homepage</span>
                  ) : (
                    <span className="text-gray-500">Inactive - Not displayed</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit} disabled={isSubmitting}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                {banner.imageUrl && (
                  <Image
                    src={normalizeImageUrl(banner.imageUrl)}
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
                {(banner.mobileTabletImageUrl || banner.imageUrl) && (
                  <Image
                    src={normalizeImageUrl(banner.mobileTabletImageUrl || banner.imageUrl)}
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No banner configured yet.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Gift for Loved Ones Banner</DialogTitle>
                  <DialogDescription>
                    This banner will be displayed below the best sellers section on the homepage.
                    It will link to the unisex shop page.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="imageUrl">Desktop Image URL</Label>
                      <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 (Wide Banner)</span>
                    </div>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="/heroimage/HeroImage1.png or /shopcategory/kids.jpg"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1920x1080px (16:9). Full width banner displayed below best sellers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mobileTabletImageUrl">Mobile & Tablet Image URL</Label>
                      <span className="text-xs text-muted-foreground">Aspect Ratio: 9:16 or 3:4 (Portrait)</span>
                    </div>
                    <Input
                      id="mobileTabletImageUrl"
                      value={formData.mobileTabletImageUrl}
                      onChange={(e) => setFormData({ ...formData, mobileTabletImageUrl: e.target.value })}
                      placeholder="/heroimage/HeroImage1-mobile.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1080x1920px (9:16) or 1080x1440px (3:4). Full screen portrait orientation. Optional - if not provided, desktop image will be used.
                    </p>
                  </div>
                    {formData.imageUrl && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border mt-2">
                        <Image
                          src={normalizeImageUrl(formData.imageUrl)}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Active (Display on homepage)
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Banner
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen && !!banner} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gift for Loved Ones Banner</DialogTitle>
            <DialogDescription>
              Update the banner image. The banner will always link to /shop/unisex.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-imageUrl">Desktop Image URL</Label>
                <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 (Wide Banner)</span>
              </div>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/heroimage/HeroImage1.png or /shopcategory/kids.jpg"
                required
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1920x1080px (16:9). Full width banner displayed below best sellers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-mobileTabletImageUrl">Mobile & Tablet Image URL</Label>
                <span className="text-xs text-muted-foreground">Aspect Ratio: 9:16 or 3:4 (Portrait)</span>
              </div>
              <Input
                id="edit-mobileTabletImageUrl"
                value={formData.mobileTabletImageUrl}
                onChange={(e) => setFormData({ ...formData, mobileTabletImageUrl: e.target.value })}
                placeholder="/heroimage/HeroImage1-mobile.png"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1080x1920px (9:16) or 1080x1440px (3:4). Full screen portrait orientation. Optional - if not provided, desktop image will be used.
              </p>
            </div>
              {formData.imageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border mt-2">
                  <Image
                    src={normalizeImageUrl(formData.imageUrl)}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="edit-isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Active (Display on homepage)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Banner
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

