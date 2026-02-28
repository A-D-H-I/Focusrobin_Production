'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPrescriptionGlasses, type PrescriptionGlassesVariantData as VariantData } from '@/app/actions/prescriptionGlassesCRUD';
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
import { Plus, Trash2, Loader2, Info } from 'lucide-react';
import { Gender } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { GalleryImageUploader } from '@/components/admin/GalleryImageUploader';

interface AddPrescriptionGlassesFormProps {
  availableSunglasses: Array<{ id: string; name: string; slug: string }>;
}

export function AddPrescriptionGlassesForm({ availableSunglasses }: AddPrescriptionGlassesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedProductId, setLinkedProductId] = useState<string>('none');
  const [useSharedStock, setUseSharedStock] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([Gender.UNISEX]);
  const [basePrice, setBasePrice] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<string>('0');
  const [cashbackAmount, setCashbackAmount] = useState<string>('0');
  const [brand, setBrand] = useState<string>('FocusRobin');

  // Dynamic Product Features
  const [isPolarized, setIsPolarized] = useState(true);
  const [isUVProtection, setIsUVProtection] = useState(true);
  const [isHydrophobic, setIsHydrophobic] = useState(true);
  const [isAntiScratch, setIsAntiScratch] = useState(false);
  const [isBioBased, setIsBioBased] = useState(true);
  const [warranty, setWarranty] = useState('1.5 Years Warranty');
  const [customFeatures, setCustomFeatures] = useState('hand made, Fast Delivery');

  // Product Highlights
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlights, setHighlights] = useState<Array<{ title: string; description: string; imageUrl: string }>>([]);

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

  // Calculate discounted price with dynamic margins for non-FocusRobin products
  const calculateDiscountedPrice = () => {
    if (!basePrice) return '';
    let price = parseFloat(basePrice);
    if (isNaN(price)) return '';

    // Apply margin calculation if not FocusRobin
    const isFocusRobin = brand.trim().toLowerCase() === 'focusrobin';
    if (!isFocusRobin) {
      // Base Price + 10% Margin + 13.5 EUR + 21% VAT
      price = (price * 1.10) + 13.5;
      price = price * 1.21;
      // + 1.5% Stripe
      // Multiply by 1.015 as per standard markup.
      price = price * 1.015;
    }

    const discount = parseFloat(discountPct) || 0;
    if (discount < 0 || discount > 100) return '';

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

    // Add linked product info
    if (linkedProductId && linkedProductId !== 'none') {
      formData.set('linkedProductId', linkedProductId);
    }
    formData.set('useSharedStock', useSharedStock.toString());

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

    // Add dynamic feature flags
    if (isPolarized) formData.append('isPolarized', 'on');
    if (isUVProtection) formData.append('isUVProtection', 'on');
    if (isHydrophobic) formData.append('isHydrophobic', 'on');
    if (isAntiScratch) formData.append('isAntiScratch', 'on');
    if (isBioBased) formData.append('isBioBased', 'on');
    formData.append('warranty', warranty);
    formData.append('customFeatures', customFeatures);

    // Add highlights
    if (showHighlights) formData.append('showHighlights', 'on');
    formData.append('highlightCount', highlights.length.toString());
    highlights.forEach((highlight, index) => {
      formData.append(`highlight-${index}-title`, highlight.title);
      formData.append(`highlight-${index}-description`, highlight.description);
      formData.append(`highlight-${index}-image`, highlight.imageUrl);
    });

    const result = await createPrescriptionGlasses(formData);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Prescription glasses created successfully!',
      });
      router.push('/admin/prescription-glasses');
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
              <Label htmlFor="slug">Slug (URL-friendly)</Label>
              <Input id="slug" name="slug" placeholder="cool-glasses" required />
              <p className="text-xs text-muted-foreground">Will be auto-generated from name if left empty.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="FocusRobin"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
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

          <Separator className="my-6" />

          {/* Stock Linking Section */}
          <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Stock Management</h4>
                <p className="text-xs text-muted-foreground">
                  If this prescription glasses uses the same frame as an existing sunglasses product,
                  you can link them to share inventory. Otherwise, leave unlinked for separate stock.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedProduct">Link to Sunglasses Product (Optional)</Label>
              <Select value={linkedProductId} onValueChange={setLinkedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="No link - Separate stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link - Separate stock</SelectItem>
                  {availableSunglasses.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a sunglasses product if this prescription glasses shares the same frame model
              </p>
            </div>

            {linkedProductId && linkedProductId !== 'none' && (
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <Checkbox
                  id="useSharedStock"
                  checked={useSharedStock}
                  onCheckedChange={(checked) => setUseSharedStock(checked === true)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="useSharedStock"
                    className="cursor-pointer font-semibold text-sm"
                  >
                    Use Shared Stock
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    When enabled, this product will share inventory with the linked sunglasses.
                    Selling one reduces stock for both. Recommended for same frame models.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

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
                {brand.trim().toLowerCase() === 'focusrobin'
                  ? 'Automatically calculated from base price and discount percentage'
                  : 'Calculated with margins: Base + 10% margin + 13.5 EUR shipping + 21% VAT + 1.5% Stripe'}
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
              <Label htmlFor="frameWidth">Frame Width</Label>
              <Input
                id="frameWidth"
                name="frameWidth"
                type="number"
                step="0.1"
                placeholder="140"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensWidth">Lens Width</Label>
              <Input
                id="lensWidth"
                name="lensWidth"
                type="number"
                step="0.1"
                placeholder="58"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensHeight">Lens Height</Label>
              <Input
                id="lensHeight"
                name="lensHeight"
                type="number"
                step="0.1"
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bridgeWidth">Bridge Width</Label>
              <Input
                id="bridgeWidth"
                name="bridgeWidth"
                type="number"
                step="0.1"
                placeholder="14"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templeLength">Temple Length</Label>
              <Input
                id="templeLength"
                name="templeLength"
                type="number"
                step="0.1"
                placeholder="145"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightBg">Weight (g)</Label>
              <Input
                id="weightBg"
                name="weightBg"
                type="number"
                step="0.1"
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
              <Label htmlFor="frameMaterial">Frame Material</Label>
              <Input
                id="frameMaterial"
                name="frameMaterial"
                placeholder="e.g., Titanium, Acetate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lensMaterial">Lens Material</Label>
              <Input
                id="lensMaterial"
                name="lensMaterial"
                placeholder="e.g., Polycarbonate, CR-39"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uvProtection">UV Protection</Label>
              <Input
                id="uvProtection"
                name="uvProtection"
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
                Optional. Enter the glass shape (e.g., Cat Eye, Rectangle, Round, Aviator)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Dynamic Product Features */}
      <Card>
        <CardHeader>
          <CardTitle>Product Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPolarized"
                checked={isPolarized}
                onCheckedChange={(checked) => setIsPolarized(checked === true)}
              />
              <Label htmlFor="isPolarized" className="cursor-pointer">Polarized Lenses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUVProtection"
                checked={isUVProtection}
                onCheckedChange={(checked) => setIsUVProtection(checked === true)}
              />
              <Label htmlFor="isUVProtection" className="cursor-pointer">100% UV Protection</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHydrophobic"
                checked={isHydrophobic}
                onCheckedChange={(checked) => setIsHydrophobic(checked === true)}
              />
              <Label htmlFor="isHydrophobic" className="cursor-pointer">Superhydrophobic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAntiScratch"
                checked={isAntiScratch}
                onCheckedChange={(checked) => setIsAntiScratch(checked === true)}
              />
              <Label htmlFor="isAntiScratch" className="cursor-pointer">Anti-Scratch Coating</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBioBased"
                checked={isBioBased}
                onCheckedChange={(checked) => setIsBioBased(checked === true)}
              />
              <Label htmlFor="isBioBased" className="cursor-pointer">Bio-based Material</Label>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g., 1.5 Years Warranty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customFeatures">Custom Features (comma-separated)</Label>
              <Input
                id="customFeatures"
                value={customFeatures}
                onChange={(e) => setCustomFeatures(e.target.value)}
                placeholder="e.g., hand made, Fast Delivery"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Product Highlights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Product Highlights</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showHighlights"
                  checked={showHighlights}
                  onCheckedChange={(checked) => setShowHighlights(checked === true)}
                />
                <Label htmlFor="showHighlights" className="text-sm cursor-pointer">Enable Highlights Section</Label>
              </div>
            </div>
            {showHighlights && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHighlights([...highlights, { title: '', description: '', imageUrl: '' }])}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Highlight
              </Button>
            )}
          </div>
        </CardHeader>
        {showHighlights && (
          <CardContent className="space-y-4">
            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No highlights added. Click "Add Highlight" to get started.</p>
            ) : (
              highlights.map((highlight, index) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Highlight {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setHighlights(highlights.filter((_, i) => i !== index))}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={highlight.title}
                        onChange={(e) => {
                          const updated = [...highlights];
                          updated[index].title = e.target.value;
                          setHighlights(updated);
                        }}
                        placeholder="e.g., Lightweight Design"
                        required={showHighlights}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Input
                        value={highlight.description}
                        onChange={(e) => {
                          const updated = [...highlights];
                          updated[index].description = e.target.value;
                          setHighlights(updated);
                        }}
                        placeholder="e.g., Weighs only 24g for all-day comfort"
                        required={showHighlights}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ImageUploader
                      value={highlight.imageUrl}
                      onChange={(url) => {
                        const updated = [...highlights];
                        updated[index].imageUrl = url;
                        setHighlights(updated);
                      }}
                      folder="other"
                      label="Highlight Image"
                      description="Image displaying the feature."
                      accept="image/*"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
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
                    <ImageUploader
                      value={variant.asset_nobg || ''}
                      onChange={(url) => updateVariant(index, 'asset_nobg', url)}
                      folder="products"
                      label="Bestseller Image (Transparent BG)"
                      description="For Landing Page 3D effect"
                      accept="image/*"
                    />
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
                    <ImageUploader
                      value={variant.asset_tryon || ''}
                      onChange={(url) => updateVariant(index, 'asset_tryon', url)}
                      folder="products"
                      label="Photo Try-On (Front View)"
                      description="For 'Upload Photo' Try-On"
                      accept="image/*"
                    />
                  </div>

                  <div className="space-y-2">
                    <ImageUploader
                      value={variant.asset_hover || ''}
                      onChange={(url) => updateVariant(index, 'asset_hover', url)}
                      folder="products"
                      label="Shop Card Hover (Tilted)"
                      description="For Shop Card hover effect"
                      accept="image/*"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <GalleryImageUploader
                      value={variant.asset_gallery || ''}
                      onChange={(urls) => updateVariant(index, 'asset_gallery', urls)}
                      folder="products"
                      label="Gallery Images"
                      description="Upload multiple images one by one. First image will be marked as primary."
                    />
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

