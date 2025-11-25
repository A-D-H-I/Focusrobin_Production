import Header from '@/components/Landing/header';
import Footer from '@/components/Landing/footer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

