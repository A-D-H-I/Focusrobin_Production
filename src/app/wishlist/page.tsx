"use client";

import { useWishlist } from "@/context/WishlistContext";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import ProductCard from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-white">
        <Header />
        <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center py-16">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
              <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-4">
                Your Wishlist is Empty
              </h1>
              <p className="text-muted-foreground mb-8">
                Start adding products you love to your wishlist.
              </p>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                  Browse Shop
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <ProductCard
                key={`${item.product.id}-${item.variant.hex}`}
                product={item.product}
                priority={false}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

