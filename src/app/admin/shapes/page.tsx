import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllGlassShapes, syncGlassShapesFromProducts } from '@/app/actions/glassShapeCRUD';
import { GlassShapeManagement } from './GlassShapeManagement';

export default async function ShapesManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  // Auto-sync shapes from existing products on page load
  await syncGlassShapesFromProducts();

  const result = await getAllGlassShapes();
  const shapes = result.success ? result.data : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <GlassShapeManagement initialShapes={shapes} />
    </div>
  );
}

