'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrand, updateBrand, deleteBrand, getAllBrands, syncBrandsFromProducts } from '@/app/actions/brandCRUD';
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
import { ImageUploader } from '@/components/admin/ImageUploader';

interface Brand {
    id: string;
    name: string;
    imageUrl: string | null;
    landingImageUrl: string | null;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface BrandManagementProps {
    initialBrands: Brand[];
}

export function BrandManagement({ initialBrands }: BrandManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [brands, setBrands] = useState<Brand[]>(initialBrands);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setBrands(initialBrands);
    }, [initialBrands]);

    const [formData, setFormData] = useState({
        name: '',
        imageUrl: '',
        landingImageUrl: '',
        order: '0',
        isActive: true,
    });

    const resetForm = () => {
        setFormData({
            name: '',
            imageUrl: '',
            landingImageUrl: '',
            order: '0',
            isActive: true,
        });
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const handleEdit = (brand: Brand) => {
        setFormData({
            name: brand.name,
            imageUrl: brand.imageUrl || '',
            landingImageUrl: brand.landingImageUrl || '',
            order: brand.order.toString(),
            isActive: brand.isActive,
        });
        setEditingId(brand.id);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = new FormData();
        form.append('name', formData.name);
        form.append('imageUrl', formData.imageUrl);
        form.append('landingImageUrl', formData.landingImageUrl);
        form.append('order', formData.order);
        form.append('isActive', formData.isActive.toString());

        try {
            let result;
            if (editingId) {
                form.append('id', editingId);
                result = await updateBrand(form);
            } else {
                result = await createBrand(form);
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
                    description: editingId ? 'Brand updated successfully' : 'Brand created successfully',
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
        if (!confirm('Are you sure you want to delete this brand?')) {
            return;
        }

        setIsSubmitting(true);
        const form = new FormData();
        form.append('id', id);

        try {
            const result = await deleteBrand(form);

            if (result.error) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Brand deleted successfully',
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
            const result = await syncBrandsFromProducts();

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
                        ? `Synced ${createdCount} brand(s) from existing products: ${result.brands?.join(', ') || ''}`
                        : 'All brands are already synced. No new brands found.',
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
                    <h1 className="text-brand-h1 font-headline text-foreground">Brand Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage brands and their images for the mega menu and shop sections.
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <strong>Auto-Creation:</strong> When you add a new product and enter a brand name,
                            the brand is automatically created here. You can then add an image for each brand to display in the mega menu.
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
                                Add Brand
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                                <DialogDescription>
                                    {editingId
                                        ? 'Update the brand details and images.'
                                        : 'Create a new brand. The images will be displayed in the mega menu and shop sections.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Brand Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., FocusRobin, RayBan"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This name should match the brand values used in products.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Mega Menu Image</Label>
                                        <ImageUploader
                                            value={formData.imageUrl}
                                            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                            folder="brands"
                                            label="Mega Menu Image"
                                            description="Displayed in the dropdown menu."
                                            maxSizeMB={5}
                                        />
                                        {formData.imageUrl && (
                                            <div className="mt-2 relative w-full h-32 border rounded-lg overflow-hidden bg-gray-50">
                                                <Image
                                                    src={normalizeImageUrl(formData.imageUrl)}
                                                    alt={formData.name || 'Brand preview'}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Landing Page Image</Label>
                                        <ImageUploader
                                            value={formData.landingImageUrl}
                                            onChange={(url) => setFormData({ ...formData, landingImageUrl: url })}
                                            folder="brands"
                                            label="Landing Page Image"
                                            description="Displayed in 'Shop By Brand' section."
                                            maxSizeMB={5}
                                        />
                                        {formData.landingImageUrl && (
                                            <div className="mt-2 relative w-full h-32 border rounded-lg overflow-hidden bg-gray-50">
                                                <Image
                                                    src={normalizeImageUrl(formData.landingImageUrl)}
                                                    alt={formData.name || 'Brand preview'}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
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
                                        Active (visible in menu)
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
                    <CardTitle>Brands ({brands.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {brands.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No brands found. Brands will be automatically created when you add products with a brand name.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {brands.map((brand) => (
                                <Card key={brand.id} className={`relative ${!brand.imageUrl && !brand.landingImageUrl ? 'border-2 border-orange-200' : 'border'}`}>
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-lg">{brand.name}</h3>
                                                        {(!brand.imageUrl || !brand.landingImageUrl) && (
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded whitespace-nowrap">
                                                                {(!brand.imageUrl && !brand.landingImageUrl) ? 'No Images' : 'Missing Image'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Order: {brand.order} | {brand.isActive ? 'Active' : 'Inactive'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(brand)}
                                                        disabled={isSubmitting}
                                                        className="h-8 w-8"
                                                        title="Edit brand"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(brand.id)}
                                                        disabled={isSubmitting}
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        title="Delete brand"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground">Mega Menu</span>
                                                    {brand.imageUrl ? (
                                                        <div className="relative w-full h-24 border rounded-lg overflow-hidden bg-gray-50">
                                                            <Image
                                                                src={normalizeImageUrl(brand.imageUrl)}
                                                                alt={`${brand.name} Mega Menu`}
                                                                fill
                                                                className="object-contain"
                                                                sizes="100px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                                            <span className="text-xs text-gray-400">None</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground">Landing Page</span>
                                                    {brand.landingImageUrl ? (
                                                        <div className="relative w-full h-24 border rounded-lg overflow-hidden bg-gray-50">
                                                            <Image
                                                                src={normalizeImageUrl(brand.landingImageUrl)}
                                                                alt={`${brand.name} Landing`}
                                                                fill
                                                                className="object-contain"
                                                                sizes="100px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                                            <span className="text-xs text-gray-400">None</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
