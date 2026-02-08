'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSplitBanner, updateSplitBanner, deleteSplitBanner } from '@/app/actions/splitBanner';
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

interface SplitBanner {
    id: string;
    sectionKey: string;
    title: string;
    leftImageUrl: string;
    leftLink: string;
    leftButtonText: string;
    rightImageUrl: string;
    rightLink: string;
    rightButtonText: string;
    isActive: boolean;
}

interface SplitBannerManagementProps {
    initialBanner: SplitBanner | null;
    sectionKey: string;
}

export function SplitBannerManagement({ initialBanner, sectionKey }: SplitBannerManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [banner, setBanner] = useState<SplitBanner | null>(initialBanner);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(initialBanner?.id || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setBanner(initialBanner);
        setEditingId(initialBanner?.id || null);
    }, [initialBanner]);

    const [formData, setFormData] = useState({
        title: initialBanner?.title || 'Eyeglasses design for people who see the world differently',
        leftImageUrl: initialBanner?.leftImageUrl || '',
        leftLink: initialBanner?.leftLink || '/shop/prescription-glasses/women',
        leftButtonText: initialBanner?.leftButtonText || "Women's Eyeglasses",
        rightImageUrl: initialBanner?.rightImageUrl || '',
        rightLink: initialBanner?.rightLink || '/shop/prescription-glasses/men',
        rightButtonText: initialBanner?.rightButtonText || "Men's Eyeglasses",
        isActive: initialBanner?.isActive ?? true,
    });

    const resetForm = () => {
        if (banner) {
            setFormData({
                title: banner.title,
                leftImageUrl: banner.leftImageUrl,
                leftLink: banner.leftLink,
                leftButtonText: banner.leftButtonText,
                rightImageUrl: banner.rightImageUrl,
                rightLink: banner.rightLink,
                rightButtonText: banner.rightButtonText,
                isActive: banner.isActive,
            });
        } else {
            setFormData({
                title: 'Eyeglasses design for people who see the world differently',
                leftImageUrl: '',
                leftLink: '/shop/prescription-glasses/women',
                leftButtonText: "Women's Eyeglasses",
                rightImageUrl: '',
                rightLink: '/shop/prescription-glasses/men',
                rightButtonText: "Men's Eyeglasses",
                isActive: true,
            });
        }
        setIsDialogOpen(false);
    };

    const handleEdit = () => {
        if (banner) {
            setFormData({
                title: banner.title,
                leftImageUrl: banner.leftImageUrl,
                leftLink: banner.leftLink,
                leftButtonText: banner.leftButtonText,
                rightImageUrl: banner.rightImageUrl,
                rightLink: banner.rightLink,
                rightButtonText: banner.rightButtonText,
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
        form.append('sectionKey', sectionKey);
        form.append('title', formData.title);
        form.append('leftImageUrl', formData.leftImageUrl);
        form.append('leftLink', formData.leftLink);
        form.append('leftButtonText', formData.leftButtonText);
        form.append('rightImageUrl', formData.rightImageUrl);
        form.append('rightLink', formData.rightLink);
        form.append('rightButtonText', formData.rightButtonText);
        form.append('isActive', formData.isActive.toString());

        try {
            let result;
            if (editingId) {
                form.append('id', editingId);
                result = await updateSplitBanner(form);
            } else {
                result = await createSplitBanner(form);
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
            const result = await deleteSplitBanner(form);
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
                        if (!open) resetForm();
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
                            {banner ? 'Update Banner' : 'Add Banner'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
                            <DialogDescription>
                                Configure the dual-section banner.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="title">Section Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Eyeglasses design for people..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Section */}
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg">Left Section (e.g. Women)</h3>
                                    <div className="space-y-2">
                                        <Label>Left Image</Label>
                                        <ImageUploader
                                            value={formData.leftImageUrl}
                                            onChange={(url) => setFormData({ ...formData, leftImageUrl: url })}
                                            folder="split-banners"
                                            label="Left Banner Image"
                                            description="Recommended: 4:5 or 3:4 portrait ratio."
                                            maxSizeMB={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="leftButtonText">Button Text</Label>
                                        <Input
                                            id="leftButtonText"
                                            value={formData.leftButtonText}
                                            onChange={(e) => setFormData({ ...formData, leftButtonText: e.target.value })}
                                            placeholder="Women's Eyeglasses"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="leftLink">Link URL</Label>
                                        <Input
                                            id="leftLink"
                                            value={formData.leftLink}
                                            onChange={(e) => setFormData({ ...formData, leftLink: e.target.value })}
                                            placeholder="/shop/women"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-lg">Right Section (e.g. Men)</h3>
                                    <div className="space-y-2">
                                        <Label>Right Image</Label>
                                        <ImageUploader
                                            value={formData.rightImageUrl}
                                            onChange={(url) => setFormData({ ...formData, rightImageUrl: url })}
                                            folder="split-banners"
                                            label="Right Banner Image"
                                            description="Recommended: 4:5 or 3:4 portrait ratio."
                                            maxSizeMB={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rightButtonText">Button Text</Label>
                                        <Input
                                            id="rightButtonText"
                                            value={formData.rightButtonText}
                                            onChange={(e) => setFormData({ ...formData, rightButtonText: e.target.value })}
                                            placeholder="Men's Eyeglasses"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rightLink">Link URL</Label>
                                        <Input
                                            id="rightLink"
                                            value={formData.rightLink}
                                            onChange={(e) => setFormData({ ...formData, rightLink: e.target.value })}
                                            placeholder="/shop/men"
                                            required
                                        />
                                    </div>
                                </div>
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
                        <p className="text-muted-foreground mb-4">No banner configuration found.</p>
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsDialogOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Banner
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{banner.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Preview */}
                            <div className="space-y-2">
                                <p className="font-semibold text-center">Left: {banner.leftButtonText}</p>
                                <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                                    {banner.leftImageUrl && (
                                        <Image
                                            src={normalizeImageUrl(banner.leftImageUrl)}
                                            alt="Left"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground text-center">{banner.leftLink}</p>
                            </div>

                            {/* Right Preview */}
                            <div className="space-y-2">
                                <p className="font-semibold text-center">Right: {banner.rightButtonText}</p>
                                <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                                    {banner.rightImageUrl && (
                                        <Image
                                            src={normalizeImageUrl(banner.rightImageUrl)}
                                            alt="Right"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground text-center">{banner.rightLink}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
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
