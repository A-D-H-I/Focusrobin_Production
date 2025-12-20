import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDeletedUsers } from '@/app/actions/users';
import DeletedUsersManagement from './DeletedUsersManagement';

export default async function AdminDeletedUsersPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  const result = await getDeletedUsers();
  
  if (result.error) {
    console.error("Error fetching deleted users:", result.error);
  }
  
  const deletedUsers = result.error ? [] : result.deletedUsers || [];
  const currentUserId = (session.user as any)?.id;

  return <DeletedUsersManagement deletedUsers={deletedUsers} error={result.error} currentUserId={currentUserId} />;
}

