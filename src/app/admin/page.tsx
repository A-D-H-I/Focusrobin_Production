import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminDashboardSections } from './AdminDashboardSections';

export default async function AdminDashboard() {
  const session = await auth();
  
  // Server-side check: redirect if not logged in or not admin
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your store and products</p>
        </div>

        <AdminDashboardSections />
      </div>
    </div>
  );
}

