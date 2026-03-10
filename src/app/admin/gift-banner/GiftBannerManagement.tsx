'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGiftBanner, updateGiftBanner, deleteGiftBanner } from '@/app/actions/giftBanner';
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

interface GiftBanner {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  title: string;
  subtitle: string | null;
  link: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GiftBannerManagementProps {
  initialBanner: GiftBanner | null;
}

export function GiftBannerManagement({ initialBanner }: GiftBannerManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [banner, setBanner] = useState<GiftBanner | null>(initialBanner);
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
    title: initialBanner?.title || 'Gift for your loved ones',
    subtitle: initialBanner?.subtitle || '',
    link: initialBanner?.link || '/shop/unisex',
    isActive: initialBanner?.isActive ?? true,
  });

  const resetForm = () => {
    if (banner) {
      setFormData({
        imageUrl: banner.imageUrl,
        mobileTabletImageUrl: banner.mobileTabletImageUrl || '',
        title: banner.title,
        subtitle: banner.subtitle || '',
        link: banner.link,
        isActive: banner.isActive,
      });
    } else {
      setFormData({
        imageUrl: '',
        mobileTabletImageUrl: '',
        title: 'Gift for your loved ones',
        subtitle: '',
        link: '/shop/unisex',
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
        title: banner.title,
        subtitle: banner.subtitle || '',
        link: banner.link,
        isActive: banner.isActive,
      });
      setEditingId(banner.id);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('imageUrl', formData.imageUrl);
    form.append('mobileTabletImageUrl', formData.mobileTabletImageUrl);
    form.append('title', formData.title);
    form.append('subtitle', formData.subtitle);
    form.append('link', formData.link);
    form.append('isActive', formData.isActive.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateGiftBanner(form);
      } else {
        result = await createGiftBanner(form);
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
          description: editingId ? 'Gift banner updated successfully' : 'Gift banner created successfully',
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
    if (!confirm('Are you sure you want to delete this gift banner?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteGiftBanner(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Gift banner deleted successfully',
        });
        setBanner(null);
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
              {banner ? 'Update Gift Banner' : 'Add Gift Banner'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Gift Banner' : 'Add New Gift Banner'}</DialogTitle>
              <DialogDescription>
                Configure the "Gift for your loved ones" banner displayed on the homepage
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Desktop Image</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 (Wide Banner)</span>
                </div>
                <ImageUploader
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="gift-banners"
                  label="Desktop Gift Banner Image"
                  description="Recommended: 1920x1080px (16:9). Full width banner displayed on homepage."
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
                  folder="gift-banners"
                  label="Mobile & Tablet Gift Banner Image (Optional)"
                  description="Recommended: 1080x1920px (9:16) or 1080x1440px (3:4). Full screen portrait orientation. Optional - if not provided, desktop image will be used."
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Gift for your loved ones"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Discover our unisex collection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/shop/unisex"
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

      {!banner ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No gift banner found.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a banner for the "Gift for your loved ones" section on the homepage
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Gift Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Current Gift Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Title:</span>
                <p className="text-muted-foreground">{banner.title}</p>
              </div>
              {banner.subtitle && (
                <div>
                  <span className="font-semibold">Subtitle:</span>
                  <p className="text-muted-foreground">{banner.subtitle}</p>
                </div>
              )}
              <div>
                <span className="font-semibold">Link:</span>
                <p className="text-muted-foreground">{banner.link}</p>
              </div>
              {!banner.isActive && (
                <p className="text-xs text-muted-foreground">Inactive</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(banner.id)}
                disabled={isSubmitting}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

              