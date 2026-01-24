import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  return <AnalyticsDashboard />;
}

