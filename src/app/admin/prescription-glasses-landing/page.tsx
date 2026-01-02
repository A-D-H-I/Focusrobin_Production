import { Metadata } from 'next';
import { PrescriptionGlassesLandingImageManagement } from './PrescriptionGlassesLandingImageManagement';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Prescription Glasses Landing Images | Admin Dashboard',
  description: 'Manage prescription glasses landing page images',
};

export default async function AdminPrescriptionGlassesLandingPage() {
  // @ts-ignore
  const images = (await prisma.prescriptionGlassesLandingImage?.findMany({
    orderBy: { createdAt: 'desc' },
  })) || [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Prescription Glasses Landing Images</h1>
        <p className="text-muted-foreground mt-2">
          Manage the banner image displayed on the prescription glasses shop page
        </p>
      </div>
      <PrescriptionGlassesLandingImageManagement initialImages={images} />
    </div>
  );
}

