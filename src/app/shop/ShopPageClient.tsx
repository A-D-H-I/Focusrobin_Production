"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Eye, Glasses } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilterSidebar from "@/components/shop/filter-sidebar";
import ProductGrid from "@/components/shop/product-grid";
import type { Product } from "@/lib/productData";

interface ShopPageClientProps {
  products: Product[];
  title?: string;
}

export default function ShopPageClient({ products, title = "Best Sellers Glasses" }: ShopPageClientProps) {
  const [filtersApplied, setFiltersApplied] = useState(0);
  const [sortBy, setSortBy] = useState<string>("recommend");

  // Store original order (newest first, as fetched from server)
  const originalOrder = useMemo(() => [...products], [products]);

  // Helper function to extract numeric price from price string (e.g., "€150.00" -> 150)
  const getPriceValue = (priceStr: string): number => {
    const numericStr = priceStr.replace(/[€$,\s]/g, '');
    return parseFloat(numericStr) || 0;
  };

  // Sort products based on selected option
  const sortedProducts = useMemo(() => {
    const productsCopy = [...products];

    switch (sortBy) {
      case "price-asc":
        return productsCopy.sort((a, b) => {
          const priceA = getPriceValue(a.price);
          const priceB = getPriceValue(b.price);
          return priceA - priceB;
        });

      case "price-desc":
        return productsCopy.sort((a, b) => {
          const priceA = getPriceValue(a.price);
          const priceB = getPriceValue(b.price);
          return priceB - priceA;
        });

      case "newest":
        // Return original order (products are already sorted by newest from server)
        return [...originalOrder];

      case "recommend":
      default:
        // Recommend: Sort by rating (highest first), then by review count
        return productsCopy.sort((a, b) => {
          const ratingA = a.averageRating || 0;
          const ratingB = b.averageRating || 0;
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          const reviewCountA = a.reviewCount || 0;
          const reviewCountB = b.reviewCount || 0;
          return reviewCountB - reviewCountA;
        });
    }
  }, [products, sortBy, originalOrder]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8 py-8">
        <div className="hidden md:block md:w-1/4 lg:w-1/5 self-start sticky top-24">
          <div className="h-[calc(100vh-7rem)] overflow-y-auto">
            <h2 className="text-2xl font-bold font-headline mb-4">
              Filters ({filtersApplied})
            </h2>
            <FilterSidebar />
          </div>
        </div>
        <div className="w-full md:w-3/4 lg:w-4/5">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="w-full sm:w-auto text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold">
                  {title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Results: {sortedProducts.length}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" className="rounded-r-none border-r text-xs sm:text-sm px-2 sm:px-4">
                    <Glasses className="mr-1 sm:mr-2 h-4 w-4" />
                    Product View
                  </Button>
                  <Button variant="ghost" className="rounded-l-none text-muted-foreground text-xs sm:text-sm px-2 sm:px-4">
                    <Eye className="mr-1 sm:mr-2 h-4 w-4" />
                    Try-On View
                  </Button>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto sm:w-[180px]">
                    <span className="text-muted-foreground mr-1 hidden sm:inline">Sort by:</span>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommend">Recommend</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:hidden mb-6 space-y-4">
              <div className="flex gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters ({filtersApplied})
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[300px] sm:w-[400px] p-0"
                  >
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle className="text-2xl font-bold font-headline">
                        Filters ({filtersApplied})
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100%-4rem)]">
                      <div className="p-6">
                        <FilterSidebar />
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommend">Recommend</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <ProductGrid products={sortedProducts} />
        </div>
      </div>
    </div>
  );
}

