import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getNavbarSettings } from '@/app/actions/navbarSettings';
import NavbarSettingsManagement from './NavbarSettingsManagement';

export default async function NavbarSettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  const result = await getNavbarSettings();
  const settings = result.success ? result.settings : {
    iconColorNotScrolled: 'white',
    logoColorNotScrolled: 'white',
  };

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-brand-h1 font-headline text-foreground">Navbar Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure navbar icon and logo colors when not scrolled (on homepage)
          </p>
        </div>
        <NavbarSettingsManagement initialSettings={settings} />
      </div>
    </div>
  );
}

