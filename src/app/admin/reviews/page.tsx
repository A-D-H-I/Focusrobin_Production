import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAllReviews } from '@/app/actions/reviews';
import ReviewsManagement from './ReviewsManagement';

export default async function AdminReviewsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  const result = await getAllReviews();
  const reviews = result.success ? result.reviews : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reviews Management</h1>
          <p className="mt-2 text-muted-foreground">
            View, edit, and delete product reviews
          </p>
        </div>
        <ReviewsManagement initialReviews={reviews} />
      </div>
    </div>
  );
}

