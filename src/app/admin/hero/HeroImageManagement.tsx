'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createHeroImage, updateHeroImage, deleteHeroImage, setActiveHeroImage } from '@/app/actions/heroImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
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

interface HeroImage {
  id: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HeroImageManagementProps {
  initialHeroImages: HeroImage[];
}

export function HeroImageManagement({ initialHeroImages }: HeroImageManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [heroImages, setHeroImages] = useState<HeroImage[]>(initialHeroImages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync state with props when they change (after router.refresh())
  useEffect(() => {
    setHeroImages(initialHeroImages);
  }, [initialHeroImages]);

  const [formData, setFormData] = useState({
    desktopImageUrl: '',
    mobileImageUrl: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    isActive: false,
  });

  const resetForm = () => {
    setFormData({
      desktopImageUrl: '',
      mobileImageUrl: '',
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      isActive: false,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (heroImage: HeroImage) => {
    setFormData({
      desktopImageUrl: heroImage.desktopImageUrl,
      mobileImageUrl: heroImage.mobileImageUrl,
      title: heroImage.title,
      subtitle: heroImage.subtitle,
      ctaText: heroImage.ctaText,
      ctaLink: heroImage.ctaLink,
      isActive: heroImage.isActive,
    });
    setEditingId(heroImage.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    form.append('desktopImageUrl', formData.desktopImageUrl);
    form.append('mobileImageUrl', formData.mobileImageUrl);
    form.append('title', formData.title);
    form.append('subtitle', formData.subtitle);
    form.append('ctaText', formData.ctaText);
    form.append('ctaLink', formData.ctaLink);
    form.append('isActive', formData.isActive.toString());

    try {
      let result;
      if (editingId) {
        form.append('id', editingId);
        result = await updateHeroImage(form);
      } else {
        result = await createHeroImage(form);
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
          description: editingId ? 'Hero image updated successfully' : 'Hero image created successfully',
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
    if (!confirm('Are you sure you want to delete this hero image?')) {
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append('id', id);

    try {
      const result = await deleteHeroImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Hero image deleted successfully',
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
      const result = await setActiveHeroImage(form);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Active hero image updated',
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
              Add New Hero Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Hero Image' : 'Add New Hero Image'}</DialogTitle>
              <DialogDescription>
                Configure the hero image that appears on the homepage
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="desktopImageUrl">Desktop Image URL</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 or 21:9 (Landscape)</span>
                </div>
                <Input
                  id="desktopImageUrl"
                  value={formData.desktopImageUrl}
                  onChange={(e) => setFormData({ ...formData, desktopImageUrl: e.target.value })}
                  placeholder="/heroimage/quality.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1920x1080px (16:9) or 2560x1080px (21:9). Full viewport width x height.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobileImageUrl">Mobile Image URL</Label>
                  <span className="text-xs text-muted-foreground">Aspect Ratio: 9:16 or 3:4 (Portrait)</span>
                </div>
                <Input
                  id="mobileImageUrl"
                  value={formData.mobileImageUrl}
                  onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
                  placeholder="/heroimage/quality.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1080x1920px (9:16) or 1080x1440px (3:4). Full screen portrait orientation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Elevate Your Style, Enhance Your Vision"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Shop our latest collection of premium sunglasses & prescription glasses."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="Shop Now"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaLink">CTA Button Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="/shop"
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

      {heroImages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No hero images found.</p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Hero Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {heroImages.map((heroImage) => (
            <Card key={heroImage.id} className={heroImage.isActive ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{heroImage.title}</CardTitle>
                    {heroImage.isActive && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-primary">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {heroImage.desktopImageUrl && (
                      <Image
                        src={normalizeImageUrl(heroImage.desktopImageUrl)}
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
                    {heroImage.mobileImageUrl && (
                      <Image
                        src={normalizeImageUrl(heroImage.mobileImageUrl)}
                        alt="Mobile preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Mobile
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground line-clamp-2">{heroImage.subtitle}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">CTA:</span>
                    <span>{heroImage.ctaText}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">{heroImage.ctaLink}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!heroImage.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(heroImage.id)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(heroImage)}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(heroImage.id)}
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

