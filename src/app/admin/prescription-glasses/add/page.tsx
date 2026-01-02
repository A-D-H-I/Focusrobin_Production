import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AddPrescriptionGlassesForm } from './AddPrescriptionGlassesForm';

export const metadata: Metadata = {
  title: 'Add Prescription Glasses | Admin Dashboard',
  description: 'Create a new prescription glasses product',
};

export default async function AddPrescriptionGlassesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  // Fetch all sunglasses products for linking
  const sunglassesProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Prescription Glasses</h1>
        <p className="text-muted-foreground mt-2">
          Create a new prescription glasses product with variants and images
        </p>
      </div>
      <AddPrescriptionGlassesForm availableSunglasses={sunglassesProducts} />
    </div>
  );
}

