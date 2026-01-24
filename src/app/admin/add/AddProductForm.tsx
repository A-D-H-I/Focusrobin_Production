'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, type VariantData } from '@/app/actions/createProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Gender } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

export function AddProductForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([Gender.UNISEX]);
  const [basePrice, setBasePrice] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<string>('0');
  const [cashbackAmount, setCashbackAmount] = useState<string>('0');
  const [variants, setVariants] = useState<VariantData[]>([
    {
      name: '',
      sku: '',
      colorName: '',
      colorHex: '#000000',
      lensColor: '',
      stock: 0,
      asset_nobg: '',
      asset_glb: '',
      asset_tryon: '',
      asset_hover: '',
      asset_gallery: '',
    },
  ]);

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!basePrice || !discountPct) return '';
    const price = parseFloat(basePrice);
    const discount = parseFloat(discountPct) || 0;
    if (isNaN(price) || discount < 0 || discount > 100) return '';
    const discounted = price * (1 - discount / 100);
    return discounted.toFixed(2);
  };

  const discountedPrice = calculateDiscountedPrice();

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        sku: '',
        colorName: '',
        colorHex: '#000000',
        lensColor: '',
        stock: 0,
        asset_nobg: '',
        asset_glb: '',
        asset_tryon: '',
        asset_hover: '',
        asset_gallery: '',
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  // Helper function to strip quotes from URLs
  const stripQuotes = (value: string): string => {
    if (typeof value !== 'string') return value;
    return value.replace(/^["']|["']$/g, '').trim();
  };

  const updateVariant = (index: number, field: keyof VariantData, value: string | number) => {
    const updated = [...variants];
    // Strip quotes from URL fields
    if (typeof value === 'string' && (field === 'asset_nobg' || field === 'asset_glb' || field === 'asset_tryon' || field === 'asset_hover' || field === 'asset_gallery')) {
      value = stripQuotes(value);
    }
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Add gender array and discount
    genders.forEach((g, index) => {
      formData.append(`gender-${index}`, g);
    });
    formData.set('genderCount', genders.length.toString());
    formData.set('discountPct', discountPct || '0');

    // Add variant count
    formData.append('variantCount', variants.length.toString());

    // Add all variant data
    variants.forEach((variant, index) => {
      formData.append(`variant-${index}-name`, variant.name);
      formData.append(`variant-${index}-sku`, variant.sku);
      formData.append(`variant-${index}-colorName`, variant.colorName);
      formData.append(`variant-${index}-colorHex`, variant.colorHex);
      formData.append(`variant-${index}-lensColor`, variant.lensColor);
      formData.append(`variant-${index}-stock`, variant.stock.toString());
      if (variant.asset_nobg) {
        formData.append(`variant-${index}-asset_nobg`, variant.asset_nobg);
      }
      if (variant.asset_glb) {
        formData.append(`variant-${index}-asset_glb`, variant.asset_glb);
      }
      if (variant.asset_tryon) {
        formData.append(`variant-${index}-asset_tryon`, variant.asset_tryon);
      }
      if (variant.asset_hover) {
        formData.append(`variant-${index}-asset_hover`, variant.asset_hover);
      }
      if (variant.asset_gallery) {
        formData.append(`variant-${index}-asset_gallery`, variant.asset_gallery);
      }
    });

    const result = await createProduct(formData);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product created successfully!',
      });
      router.push('/admin/add');
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" required placeholder="e.g., The Horizon" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" required placeholder="e.g., the-horizon" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter a detailed product description (optional)..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Describe the product features, materials, and benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price *</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                required
                placeholder="129.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender * (Select one or more)</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {Object.values(Gender).map((genderOption) => (
                  <div key={genderOption} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${genderOption}`}
                      checked={genders.includes(genderOption)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setGenders([...genders, genderOption]);
                        } else {
                          setGenders(genders.filter((g) => g !== genderOption));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`gender-${genderOption}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {genderOption === Gender.MEN ? 'Men' :
                       genderOption === Gender.WOMEN ? 'Women' :
                       genderOption === Gender.UNISEX ? 'Unisex' :
                       genderOption === Gender.KIDS ? 'Kids' : genderOption}
                    </Label>
                  </div>
                ))}
              </div>
              {genders.length === 0 && (
                <p className="text-sm text-destructive mt-1">Please select at least one gender</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="discountPct">Discount Percentage (%)</Label>
              <Input
                id="discountPct"
                name="discountPct"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashbackAmount">Cashback Amount (€) *</Label>
              <Input
                id="cashbackAmount"
                name="cashbackAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cashbackAmount}
                onChange={(e) => setCashbackAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Fixed Euro amount returned to customer wallet per purchase
              </p>
            </div>
            <div className="space-y-2">
              <Label>Discounted Price</Label>
              <div className="h-10 px-3 py-2 bg-muted rounded-md border border-input flex items-center">
                <span className="text-lg font-semibold">
                  {discountedPrice ? `€${discountedPrice}` : 'Enter price and discount to calculate'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically calculated from base price and discount percentage
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="bestseller, new-arrival, limited"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="frameWidth">Frame Width *</Label>
              <Input
                id="frameWidth"
                name="frameWidth"
                type="number"
                step="0.1"
                required
                placeholder="140"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensWidth">Lens Width *</Label>
              <Input
                id="lensWidth"
                name="lensWidth"
                type="number"
                step="0.1"
                required
                placeholder="58"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensHeight">Lens Height *</Label>
              <Input
                id="lensHeight"
                name="lensHeight"
                type="number"
                step="0.1"
                required
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bridgeWidth">Bridge Width *</Label>
              <Input
                id="bridgeWidth"
                name="bridgeWidth"
                type="number"
                step="0.1"
                required
                placeholder="14"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templeLength">Temple Length *</Label>
              <Input
                id="templeLength"
                name="templeLength"
                type="number"
                step="0.1"
                required
                placeholder="145"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightBg">Weight (g) *</Label>
              <Input
                id="weightBg"
                name="weightBg"
                type="number"
                step="0.1"
                required
                placeholder="24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Specs */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frameMaterial">Frame Material *</Label>
              <Input
                id="frameMaterial"
                name="frameMaterial"
                required
                placeholder="e.g., Titanium, Acetate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensMaterial">Lens Material *</Label>
              <Input
                id="lensMaterial"
                name="lensMaterial"
                required
                placeholder="e.g., Polycarbonate, CR-39"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uvProtection">UV Protection *</Label>
              <Input
                id="uvProtection"
                name="uvProtection"
                required
                placeholder="e.g., UV400 Polarized"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="glassShape">Glass Shape</Label>
              <Input
                id="glassShape"
                name="glassShape"
                placeholder="e.g., Cat Eye, Rectangle, Round"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Enter the glass shape (e.g., Cat Eye, Rectangle, Round, Aviator). 
                The shape will be automatically created in <Link href="/admin/shapes" className="text-primary hover:underline" target="_blank">Shape Management</Link> where you can add an image for the mega menu.
              </p>
            </div>
          </div>
          
          {/* Prescription Lens Images */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-4">Prescription Lens Images (Optional)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Upload images for prescription lens color preview. Base image should have transparent lenses (no temple legs). Mask image should be black/white where white areas define lens regions.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lensBaseImageUrl">Lens Base Image URL</Label>
                <Input
                  id="lensBaseImageUrl"
                  name="lensBaseImageUrl"
                  type="url"
                  placeholder="https://example.com/lens-base.png"
                />
                <p className="text-xs text-muted-foreground">
                  Base image with transparent lenses (no temple legs)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lensMaskImageUrl">Lens Mask Image URL</Label>
                <Input
                  id="lensMaskImageUrl"
                  name="lensMaskImageUrl"
                  type="url"
                  placeholder="https://example.com/lens-mask.png"
                />
                <p className="text-xs text-muted-foreground">
                  Black/white mask image (white = lens areas)
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="lensBackgroundImageUrl">Lens Background Image URL (Optional)</Label>
              <Input
                id="lensBackgroundImageUrl"
                name="lensBackgroundImageUrl"
                type="url"
                placeholder="https://example.com/background-scene.png"
              />
              <p className="text-xs text-muted-foreground">
                Image visible through transparent lenses (scene/pattern behind glasses)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Variants (Colors)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {variants.map((variant, index) => (
            <div key={index} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Variant {index + 1}</h3>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-name`}>Variant Name *</Label>
                  <Input
                    id={`variant-${index}-name`}
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    required
                    placeholder="e.g., Jet Blue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-sku`}>SKU *</Label>
                  <Input
                    id={`variant-${index}-sku`}
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    required
                    placeholder="e.g., HRZ-JET-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-colorName`}>Color Name *</Label>
                  <Input
                    id={`variant-${index}-colorName`}
                    value={variant.colorName}
                    onChange={(e) => updateVariant(index, 'colorName', e.target.value)}
                    required
                    placeholder="e.g., Jet Blue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-colorHex`}>Color Hex *</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`variant-${index}-colorHex`}
                      type="color"
                      value={variant.colorHex}
                      onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      value={variant.colorHex}
                      onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                      placeholder="#1C3142"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-lensColor`}>Lens Color *</Label>
                  <Input
                    id={`variant-${index}-lensColor`}
                    value={variant.lensColor}
                    onChange={(e) => updateVariant(index, 'lensColor', e.target.value)}
                    required
                    placeholder="e.g., Black Smoke"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variant-${index}-stock`}>Stock *</Label>
                  <Input
                    id={`variant-${index}-stock`}
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                    required
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Assets Configuration Section */}
              <div className="mt-6 space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-brand-h4 font-headline">Assets Configuration</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-asset_nobg`}>
                      Bestseller Image (Transparent BG)
                    </Label>
                    <Input
                      id={`variant-${index}-asset_nobg`}
                      type="url"
                      value={variant.asset_nobg || ''}
                      onChange={(e) => updateVariant(index, 'asset_nobg', e.target.value)}
                      placeholder="/images/products/product-nobg.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      For Landing Page 3D effect
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-asset_glb`}>
                      Live AR Model (.glb)
                    </Label>
                    <Input
                      id={`variant-${index}-asset_glb`}
                      type="url"
                      value={variant.asset_glb || ''}
                      onChange={(e) => updateVariant(index, 'asset_glb', e.target.value)}
                      placeholder="/models/product.glb"
                    />
                    <p className="text-xs text-muted-foreground">
                      For Live Camera AR
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-asset_tryon`}>
                      Photo Try-On (Front View)
                    </Label>
                    <Input
                      id={`variant-${index}-asset_tryon`}
                      type="url"
                      value={variant.asset_tryon || ''}
                      onChange={(e) => updateVariant(index, 'asset_tryon', e.target.value)}
                      placeholder="/images/products/product-front.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      For "Upload Photo" Try-On
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-asset_hover`}>
                      Shop Card Hover (Tilted)
                    </Label>
                    <Input
                      id={`variant-${index}-asset_hover`}
                      type="url"
                      value={variant.asset_hover || ''}
                      onChange={(e) => updateVariant(index, 'asset_hover', e.target.value)}
                      placeholder="/images/products/product-tilted.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      For Shop Card hover effect
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`variant-${index}-asset_gallery`}>
                      Gallery Images
                    </Label>
                    <Textarea
                      id={`variant-${index}-asset_gallery`}
                      value={variant.asset_gallery || ''}
                      onChange={(e) => updateVariant(index, 'asset_gallery', e.target.value)}
                      placeholder="/images/products/gallery1.jpg, /images/products/gallery2.jpg, /images/products/gallery3.jpg"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter multiple URLs separated by commas. First image will be marked as primary.
                    </p>
                  </div>
                </div>
              </div>

              {index < variants.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Product'
          )}
        </Button>
      </div>
    </form>
  );
}

