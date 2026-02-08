'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePrescriptionGlasses } from '@/app/actions/prescriptionGlassesCRUD';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Gender } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface PrescriptionGlassesData {
    id: string;
    name: string;
    slug: string;
    brand: string;
    description: string | null;
    basePrice: number;
    discountPct: number;
    cashbackAmount: number;
    gender: Gender[];
    tags: string[];
    frameWidth: number;
    lensWidth: number;
    lensHeight: number;
    bridgeWidth: number;
    templeLength: number;
    weightBg: number;
    frameMaterial: string;
    lensMaterial: string | null;
    uvProtection: string | null;
    glassShape: string | null;
    // Dynamic Features
    isPolarized: boolean;
    isUVProtection: boolean;
    isHydrophobic: boolean;
    isAntiScratch: boolean;
    isBioBased: boolean;
    warranty: string;
    customFeatures: string[];
    showHighlights: boolean;
    highlights: Array<{ id: string; title: string; description: string; imageUrl: string; order: number }>;
}

interface EditPrescriptionGlassesFormProps {
    prescriptionGlasses: PrescriptionGlassesData;
}

export function EditPrescriptionGlassesForm({ prescriptionGlasses }: EditPrescriptionGlassesFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic fields
    const [name, setName] = useState(prescriptionGlasses.name);
    const [slug, setSlug] = useState(prescriptionGlasses.slug);
    const [brand, setBrand] = useState(prescriptionGlasses.brand || 'FocusRobin');
    const [description, setDescription] = useState(prescriptionGlasses.description || '');
    const [basePrice, setBasePrice] = useState(prescriptionGlasses.basePrice.toString());
    const [discountPct, setDiscountPct] = useState(prescriptionGlasses.discountPct.toString());
    const [cashbackAmount, setCashbackAmount] = useState(prescriptionGlasses.cashbackAmount.toString());
    const [genders, setGenders] = useState<Gender[]>(prescriptionGlasses.gender);
    const [tags, setTags] = useState(prescriptionGlasses.tags.join(', '));

    // Dimensions
    const [frameWidth, setFrameWidth] = useState(prescriptionGlasses.frameWidth.toString());
    const [lensWidth, setLensWidth] = useState(prescriptionGlasses.lensWidth.toString());
    const [lensHeight, setLensHeight] = useState(prescriptionGlasses.lensHeight.toString());
    const [bridgeWidth, setBridgeWidth] = useState(prescriptionGlasses.bridgeWidth.toString());
    const [templeLength, setTempleLength] = useState(prescriptionGlasses.templeLength.toString());
    const [weightBg, setWeightBg] = useState(prescriptionGlasses.weightBg.toString());

    // Specs
    const [frameMaterial, setFrameMaterial] = useState(prescriptionGlasses.frameMaterial);
    const [lensMaterial, setLensMaterial] = useState(prescriptionGlasses.lensMaterial || 'Polycarbonate');
    const [uvProtection, setUvProtection] = useState(prescriptionGlasses.uvProtection || '');
    const [glassShape, setGlassShape] = useState(prescriptionGlasses.glassShape || '');

    // Dynamic Product Features
    const [isPolarized, setIsPolarized] = useState(prescriptionGlasses.isPolarized);
    const [isUVProtection, setIsUVProtection] = useState(prescriptionGlasses.isUVProtection);
    const [isHydrophobic, setIsHydrophobic] = useState(prescriptionGlasses.isHydrophobic);
    const [isAntiScratch, setIsAntiScratch] = useState(prescriptionGlasses.isAntiScratch);
    const [isBioBased, setIsBioBased] = useState(prescriptionGlasses.isBioBased);
    const [warranty, setWarranty] = useState(prescriptionGlasses.warranty);
    const [customFeatures, setCustomFeatures] = useState(prescriptionGlasses.customFeatures.join(', '));

    // Product Highlights
    const [showHighlights, setShowHighlights] = useState(prescriptionGlasses.showHighlights);
    const [highlights, setHighlights] = useState(
        prescriptionGlasses.highlights.map(h => ({ title: h.title, description: h.description, imageUrl: h.imageUrl }))
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('slug', slug);
        formData.set('brand', brand);
        formData.set('description', description);
        formData.set('basePrice', basePrice);
        formData.set('discountPct', discountPct);
        formData.set('cashbackAmount', cashbackAmount);
        formData.set('tags', tags);

        // Genders
        genders.forEach((g, index) => formData.append(`gender-${index}`, g));
        formData.set('genderCount', genders.length.toString());

        // Dimensions
        formData.set('frameWidth', frameWidth);
        formData.set('lensWidth', lensWidth);
        formData.set('lensHeight', lensHeight);
        formData.set('bridgeWidth', bridgeWidth);
        formData.set('templeLength', templeLength);
        formData.set('weightBg', weightBg);

        // Specs
        formData.set('frameMaterial', frameMaterial);
        formData.set('lensMaterial', lensMaterial);
        formData.set('uvProtection', uvProtection);
        formData.set('glassShape', glassShape);

        // Dynamic Features
        if (isPolarized) formData.append('isPolarized', 'on');
        if (isUVProtection) formData.append('isUVProtection', 'on');
        if (isHydrophobic) formData.append('isHydrophobic', 'on');
        if (isAntiScratch) formData.append('isAntiScratch', 'on');
        if (isBioBased) formData.append('isBioBased', 'on');
        formData.set('warranty', warranty);
        formData.set('customFeatures', customFeatures);

        // Highlights
        if (showHighlights) formData.append('showHighlights', 'on');
        formData.set('highlightCount', highlights.length.toString());
        highlights.forEach((h, i) => {
            formData.append(`highlight-${i}-title`, h.title);
            formData.append(`highlight-${i}-description`, h.description);
            formData.append(`highlight-${i}-image`, h.imageUrl);
        });

        const result = await updatePrescriptionGlasses(prescriptionGlasses.id, formData);

        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Prescription glasses updated successfully!' });
            router.push('/admin/prescription-glasses');
            router.refresh();
        }

        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <Card>
                <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug *</Label>
                            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="FocusRobin" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="basePrice">Base Price *</Label>
                            <Input id="basePrice" type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discountPct">Discount (%)</Label>
                            <Input id="discountPct" type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cashbackAmount">Cashback (€)</Label>
                            <Input id="cashbackAmount" type="number" step="0.01" value={cashbackAmount} onChange={(e) => setCashbackAmount(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Gender *</Label>
                        <div className="flex flex-wrap gap-4">
                            {Object.values(Gender).map((gender) => (
                                <div key={gender} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`gender-${gender}`}
                                        checked={genders.includes(gender)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setGenders([...genders, gender]);
                                            else setGenders(genders.filter((g) => g !== gender));
                                        }}
                                    />
                                    <Label htmlFor={`gender-${gender}`} className="cursor-pointer">{gender}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
                <CardHeader><CardTitle>Dimensions (mm)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="frameWidth">Frame Width *</Label>
                            <Input id="frameWidth" type="number" step="0.1" value={frameWidth} onChange={(e) => setFrameWidth(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lensWidth">Lens Width *</Label>
                            <Input id="lensWidth" type="number" step="0.1" value={lensWidth} onChange={(e) => setLensWidth(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lensHeight">Lens Height *</Label>
                            <Input id="lensHeight" type="number" step="0.1" value={lensHeight} onChange={(e) => setLensHeight(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bridgeWidth">Bridge Width *</Label>
                            <Input id="bridgeWidth" type="number" step="0.1" value={bridgeWidth} onChange={(e) => setBridgeWidth(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="templeLength">Temple Length *</Label>
                            <Input id="templeLength" type="number" step="0.1" value={templeLength} onChange={(e) => setTempleLength(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weightBg">Weight (g) *</Label>
                            <Input id="weightBg" type="number" step="0.1" value={weightBg} onChange={(e) => setWeightBg(e.target.value)} required />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
                <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="frameMaterial">Frame Material *</Label>
                            <Input id="frameMaterial" value={frameMaterial} onChange={(e) => setFrameMaterial(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lensMaterial">Lens Material</Label>
                            <Input id="lensMaterial" value={lensMaterial} onChange={(e) => setLensMaterial(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uvProtection">UV Protection</Label>
                            <Input id="uvProtection" value={uvProtection} onChange={(e) => setUvProtection(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="glassShape">Glass Shape</Label>
                            <Input id="glassShape" value={glassShape} onChange={(e) => setGlassShape(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Features */}
            <Card>
                <CardHeader><CardTitle>Product Features</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isPolarized" checked={isPolarized} onCheckedChange={(c) => setIsPolarized(c === true)} />
                            <Label htmlFor="isPolarized" className="cursor-pointer">Polarized Lenses</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isUVProtection" checked={isUVProtection} onCheckedChange={(c) => setIsUVProtection(c === true)} />
                            <Label htmlFor="isUVProtection" className="cursor-pointer">100% UV Protection</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isHydrophobic" checked={isHydrophobic} onCheckedChange={(c) => setIsHydrophobic(c === true)} />
                            <Label htmlFor="isHydrophobic" className="cursor-pointer">Superhydrophobic</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isAntiScratch" checked={isAntiScratch} onCheckedChange={(c) => setIsAntiScratch(c === true)} />
                            <Label htmlFor="isAntiScratch" className="cursor-pointer">Anti-Scratch Coating</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isBioBased" checked={isBioBased} onCheckedChange={(c) => setIsBioBased(c === true)} />
                            <Label htmlFor="isBioBased" className="cursor-pointer">Bio-based Material</Label>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="warranty">Warranty</Label>
                            <Input id="warranty" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customFeatures">Custom Features (comma-separated)</Label>
                            <Input id="customFeatures" value={customFeatures} onChange={(e) => setCustomFeatures(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Highlights */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle>Product Highlights</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="showHighlights" checked={showHighlights} onCheckedChange={(c) => setShowHighlights(c === true)} />
                                <Label htmlFor="showHighlights" className="text-sm cursor-pointer">Enable</Label>
                            </div>
                        </div>
                        {showHighlights && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setHighlights([...highlights, { title: '', description: '', imageUrl: '' }])}>
                                <Plus className="h-4 w-4 mr-1" /> Add Highlight
                            </Button>
                        )}
                    </div>
                </CardHeader>
                {showHighlights && (
                    <CardContent className="space-y-4">
                        {highlights.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No highlights. Click Add Highlight to get started.</p>
                        ) : highlights.map((h, i) => (
                            <div key={i} className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">Highlight {i + 1}</h4>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Title *</Label>
                                        <Input value={h.title} onChange={(e) => { const u = [...highlights]; u[i].title = e.target.value; setHighlights(u); }} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description *</Label>
                                        <Input value={h.description} onChange={(e) => { const u = [...highlights]; u[i].description = e.target.value; setHighlights(u); }} required />
                                    </div>
                                </div>
                                <ImageUploader value={h.imageUrl} onChange={(url) => { const u = [...highlights]; u[i].imageUrl = url; setHighlights(u); }} folder="other" label="Highlight Image" />
                            </div>
                        ))}
                    </CardContent>
                )}
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
