
"use client";

import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  Product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  User: {
    name: string | null;
    email: string;
  };
  createdAt: string | Date; // Can be ISO string or Date
};

interface CustomerReviewsProps {
  reviews?: Review[];
}

function calculateRatingDistribution(reviews: Review[]) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    distribution[review.rating as keyof typeof distribution]++;
  });
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percentage: total > 0 ? Math.round((distribution[stars as keyof typeof distribution] / total) * 100) : 0,
  }));
}

export default function CustomerReviews({ reviews }: CustomerReviewsProps) {
  // Only show real reviews, no dummy data
  const displayReviews = reviews && reviews.length > 0 
    ? reviews.map((review) => ({
        author: review.User?.name || review.User?.email?.split('@')[0] || 'Anonymous',
        avatar: review.User?.image || `https://i.pravatar.cc/150?u=${review.User?.email || 'user'}`,
        rating: review.rating,
        title: review.title,
        content: review.comment,
        images: review.images || [],
        productName: review.Product?.name || undefined, // Don't show "Product no longer available" on product page
        date: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
        likes: 0,
        dislikes: 0,
      }))
    : [];

  const averageRating = displayReviews.length > 0
    ? displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length
    : 0;

  const ratingDistribution = reviews && reviews.length > 0
    ? calculateRatingDistribution(reviews)
    : [
        { stars: 5, percentage: 0 },
        { stars: 4, percentage: 0 },
        { stars: 3, percentage: 0 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 },
      ];
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="md:w-1/3">
            <h2 className="text-2xl font-bold font-headline mb-4">Customer Reviews</h2>
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={i < Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"} />
                    ))}
                </div>
                <p className="font-bold text-lg">{averageRating.toFixed(1)} out of 5</p>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Based on {displayReviews.length} review{displayReviews.length !== 1 ? 's' : ''}</p>

            <div className="space-y-2 mb-8">
                {ratingDistribution.map(item => (
                    <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.stars} star</span>
                        <Progress value={item.percentage} className="w-full h-2" />
                        <span className="text-sm font-bold w-10 text-right">{item.percentage}%</span>
                    </div>
                ))}
            </div>
          </div>
          <div className="md:w-2/3">
            {displayReviews.map((review, index) => (
              <div key={index} className="border-b py-6 last:border-none">
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={review.avatar} alt={review.author}/>
                        <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                             <h4 className="font-bold">{review.author}</h4>
                             <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                            ))}
                        </div>
                        <h5 className="font-semibold mb-2">{review.title}</h5>
                        {review.productName && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Product: {review.productName}
                          </p>
                        )}
                        <p className="text-sm text-foreground/80 mb-4">{review.content}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-4 flex-wrap">
                            {review.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                <img
                                  src={image}
                                  alt={`Review image ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide broken images
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Was this review helpful?</span>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-auto px-2 py-1">
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    {review.likes}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-auto px-2 py-1">
                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                    {review.dislikes}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

