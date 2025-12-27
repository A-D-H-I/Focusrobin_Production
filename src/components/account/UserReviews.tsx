import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface UserReviewsProps {
  userId: string;
}

export default async function UserReviews({ userId }: UserReviewsProps) {
  // Fetch all reviews for this user, including products (which may be null)
  const reviews = await prisma.review.findMany({
    where: {
      userId,
    },
    include: {
      Product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (reviews.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
          My Reviews
        </h2>
        <p className="text-muted-foreground">You haven't written any reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
        My Reviews ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-brand-h3 font-headline">{review.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {review.rating}/5
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.Product ? (
                    <Link
                      href={`/products/${review.Product.slug}`}
                      className="text-sm text-brand-blue hover:underline"
                    >
                      Product: {review.Product.name}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Product: Product no longer available
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{review.comment}</p>
              {review.images.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

