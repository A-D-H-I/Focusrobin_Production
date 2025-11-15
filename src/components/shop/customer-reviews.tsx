
"use client";

import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const reviews = [
  {
    author: "Jane D.",
    avatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    title: "Absolutely love them!",
    content: "The quality is amazing for the price. They feel sturdy and look so stylish. I've received so many compliments already! The virtual try-on was surprisingly accurate too.",
    date: "2 weeks ago",
    likes: 12,
    dislikes: 0,
  },
  {
    author: "Mike P.",
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 4,
    title: "Great value, comfortable fit.",
    content: "Really happy with my purchase. They're lightweight and comfortable for all-day wear. The only minor issue is they smudge a bit easily, but it's not a big deal.",
    date: "1 month ago",
    likes: 8,
    dislikes: 1,
  },
    {
    author: "Sarah K.",
    avatar: "https://i.pravatar.cc/150?img=5",
    rating: 5,
    title: "Exceeded my expectations!",
    content: "I was hesitant to buy glasses online, but I'm so glad I did. These are fantastic. The lens clarity is top-notch and the frame style is exactly what I was looking for. Highly recommend!",
    date: "3 weeks ago",
    likes: 5,
    dislikes: 0,
  },
];

const ratingDistribution = [
  { stars: 5, percentage: 80 },
  { stars: 4, percentage: 15 },
  { stars: 3, percentage: 5 },
  { stars: 2, percentage: 0 },
  { stars: 1, percentage: 0 },
];

export default function CustomerReviews() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="md:w-1/3">
            <h2 className="text-2xl font-bold font-headline mb-4">Customer Reviews</h2>
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"} />
                    ))}
                </div>
                <p className="font-bold text-lg">4.8 out of 5</p>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Based on 12 reviews</p>

            <div className="space-y-2 mb-8">
                {ratingDistribution.map(item => (
                    <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.stars} star</span>
                        <Progress value={item.percentage} className="w-full h-2" />
                        <span className="text-sm font-bold w-10 text-right">{item.percentage}%</span>
                    </div>
                ))}
            </div>

            <h3 className="font-semibold mb-3">Share your thoughts</h3>
            <p className="text-sm text-muted-foreground mb-4">Let other customers know what you think.</p>
            <Button variant="outline" className="w-full">Write a Review</Button>
          </div>
          <div className="md:w-2/3">
            {reviews.map((review, index) => (
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
                        <p className="text-sm text-foreground/80 mb-4">{review.content}</p>
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

