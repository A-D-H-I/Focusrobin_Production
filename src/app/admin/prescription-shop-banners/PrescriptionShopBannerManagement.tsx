'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPrescriptionShopBanner, updatePrescriptionShopBanner, deletePrescriptionShopBanner } from '@/app/actions/prescriptionShopBanner';
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
import { ImageUploader } from '@/components/admin/ImageUploader';

interface PrescriptionShopBanner {
    id: string;
    category: string;
    imageUrl: string;
    alt: string;
    link: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface PrescriptionShopBannerManagementProps {
    initialBanners: PrescriptionShopBanner[];
}

export function PrescriptionShopBannerManagement({ initialBanners }: PrescriptionShopBannerManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [banners, setBanners] = useState<PrescriptionShopBanner[]>(initialBanners);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setBanners(initialBanners);
    }, [initialBanners]);

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

    const handleEdit = (banner: PrescriptionShopBanner) => {
        setFormData({
            category: banner.category,
            imageUrl: banner.imageUrl,
            alt: banner.alt,
            link: banner.link || '',
            isActive: banner.isActive,
        });
        setEditingId(banner.id);
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
                result = await updatePrescriptionShopBanner(form);
            } else {
                result = await createPrescriptionShopBanner(form);
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
                    description: editingId ? 'Banner updated successfully' : 'Banner created successfully',
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
        if (!confirm('Are you sure you want to delete this banner?')) {
            return;
        }

        setIsSubmitting(true);
        const form = new FormData();
        form.append('id', id);

        try {
            const result = await deletePrescriptionShopBanner(form);
            if (result.error) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Banner deleted successfully',
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
        UNISEX: 'Unisex',
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
                            Add New Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
                            <DialogDescription>
                                Configure banner images displayed at the top of prescription glasses category pages
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
                                        <SelectItem value="UNISEX">Unisex</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Banner Image</Label>
                                    <span className="text-xs text-muted-foreground">Aspect Ratio: 16:9 or 21:9 (Wide Banner)</span>
                                </div>
                                <ImageUploader
                                    value={formData.imageUrl}
                                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                    folder="other"
                                    label="Banner Image"
                                    description="Recommended: 1920x1080px (16:9) or 1920x820px (21:9). This banner appears at the top of the category page."
                                    maxSizeMB={10}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="alt">Alt Text</Label>
                                <Input
                                    id="alt"
                                    value={formData.alt}
                                    onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                                    placeholder="Prescription glasses for men"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link">Link URL (Optional)</Label>
                                <Input
                                    id="link"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="/shop/prescription-glasses/men"
                                />
                                <p className="text-xs text-muted-foreground">
                                    If provided, the banner will be clickable.
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

            {banners.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">No banners found.</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create banners for each prescription glasses category page (Men, Women, Kids, Unisex)
                        </p>
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsDialogOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Your First Banner
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {banners.map((banner) => (
                        <Card key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
                            <CardHeader>
                                <CardTitle className="text-lg">{categoryLabels[banner.category] || banner.category}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                                    {banner.imageUrl && (
                                        <Image
                                            src={normalizeImageUrl(banner.imageUrl)}
                                            alt={banner.alt}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                            unoptimized
                                        />
                                    )}
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground">{banner.alt}</p>
                                    {banner.link && (
                                        <p className="text-xs text-muted-foreground">Link: {banner.link}</p>
                                    )}
                                    {!banner.isActive && (
                                        <p className="text-xs text-muted-foreground">Inactive</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(banner)}
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
