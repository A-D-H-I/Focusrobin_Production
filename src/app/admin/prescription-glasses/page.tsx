import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AdminPrescriptionGlassesListClient } from './AdminPrescriptionGlassesListClient';

export const metadata: Metadata = {
  title: 'Prescription Glasses | Admin Dashboard',
  description: 'Manage prescription glasses products',
};

export default async function AdminPrescriptionGlassesPage() {
  const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
    include: {
      PrescriptionGlassesVariant: {
        include: {
          PrescriptionGlassesAsset: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <AdminPrescriptionGlassesListClient prescriptionGlasses={prescriptionGlasses} />;
}

