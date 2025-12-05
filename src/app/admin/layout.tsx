import Header from '@/components/Landing/header';
import Footer from '@/components/Landing/footer';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// Force dynamic rendering - prevents static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: Check auth at layout level (middleware should catch this first)
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 bg-background">
        {children}
      </main>
      <Footer />
    </div>
  );
}

