import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EditPrescriptionGlassesForm } from './EditPrescriptionGlassesForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditPrescriptionGlassesPageProps {
    params: Promise<{ slug: string }>;
}

export default async function EditPrescriptionGlassesPage({ params }: EditPrescriptionGlassesPageProps) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    const prescriptionGlasses = await prisma.prescriptionGlasses.findUnique({
        where: { slug: decodedSlug },
        include: {
            highlights: true,
            PrescriptionGlassesVariant: {
                include: {
                    PrescriptionGlassesAsset: true,
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!prescriptionGlasses) {
        notFound();
    }

    // Map to the expected format
    const formData = {
        id: prescriptionGlasses.id,
        name: prescriptionGlasses.name,
        slug: prescriptionGlasses.slug,
        description: prescriptionGlasses.description,
        basePrice: Number(prescriptionGlasses.basePrice),
        discountPct: prescriptionGlasses.discountPct || 0,
        cashbackAmount: Number(prescriptionGlasses.cashbackAmount || 0),
        gender: prescriptionGlasses.gender,
        tags: prescriptionGlasses.tags,
        frameWidth: prescriptionGlasses.frameWidth,
        lensWidth: prescriptionGlasses.lensWidth,
        lensHeight: prescriptionGlasses.lensHeight,
        bridgeWidth: prescriptionGlasses.bridgeWidth,
        templeLength: prescriptionGlasses.templeLength,
        weightBg: prescriptionGlasses.weightBg,
        frameMaterial: prescriptionGlasses.frameMaterial,
        lensMaterial: prescriptionGlasses.lensMaterial,
        uvProtection: prescriptionGlasses.uvProtection,
        glassShape: prescriptionGlasses.glassShape,
        // Dynamic Features
        isPolarized: prescriptionGlasses.isPolarized ?? true,
        isUVProtection: prescriptionGlasses.isUVProtection ?? true,
        isHydrophobic: prescriptionGlasses.isHydrophobic ?? true,
        isAntiScratch: prescriptionGlasses.isAntiScratch ?? false,
        isBioBased: prescriptionGlasses.isBioBased ?? true,
        warranty: prescriptionGlasses.warranty ?? '1.5 Years Warranty',
        customFeatures: prescriptionGlasses.customFeatures ?? [],
        showHighlights: prescriptionGlasses.showHighlights ?? false,
        highlights: (prescriptionGlasses.highlights || []).map((h: any) => ({
            id: h.id,
            title: h.title,
            description: h.description,
            imageUrl: h.imageUrl,
            order: h.order,
        })),
        brand: (prescriptionGlasses as any).brand || 'FocusRobin',
        variants: ((prescriptionGlasses as any).PrescriptionGlassesVariant || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            colorName: v.colorName,
            colorHex: v.colorHex,
            colorFamily: v.colorFamily || '',
            lensColor: v.lensColor || '',
            stock: v.stock || 0,
            asset_nobg: v.PrescriptionGlassesAsset?.find((a: any) => a.type === 'NO_BG')?.url || '',
            asset_glb: v.PrescriptionGlassesAsset?.find((a: any) => a.type === 'GLB')?.url || '',
            asset_tryon: v.PrescriptionGlassesAsset?.find((a: any) => a.type === 'TRY_ON_2D')?.url || '',
            asset_hover: v.PrescriptionGlassesAsset?.find((a: any) => a.type === 'HOVER')?.url || '',
            asset_gallery: v.PrescriptionGlassesAsset?.filter((a: any) => a.type === 'GALLERY').map((a: any) => a.url).join(', ') || '',
        })),
    };

    return (
        <div className="container py-8">
            <div className="mb-6">
                <Link href="/admin/prescription-glasses">
                    <Button variant="ghost" className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Prescription Glasses
                    </Button>
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">Edit: {prescriptionGlasses.name}</h1>
            <EditPrescriptionGlassesForm prescriptionGlasses={formData} />
        </div>
    );
}
