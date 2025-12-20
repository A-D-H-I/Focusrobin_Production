import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import PromoCodeManagement from './PromoCodeManagement';

export default async function AdminPromoCodesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  return <PromoCodeManagement />;
}

