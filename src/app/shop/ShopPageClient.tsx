"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
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
  searchQuery?: string;
}

export default function ShopPageClient({ products, title = "All Products", searchQuery }: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const [filtersApplied, setFiltersApplied] = useState(0);
  const [sortBy, setSortBy] = useState<string>("recommend");

  // Count applied filters from URL params
  useEffect(() => {
    let count = 0;
    if (searchParams.get('gender')) count += searchParams.getAll('gender').length;
    if (searchParams.get('color')) count += searchParams.getAll('color').length;
    if (searchParams.get('filter')) count += 1;
    if (searchParams.get('glassShape')) count += searchParams.getAll('glassShape').length;
    if (searchParams.get('material')) count += searchParams.getAll('material').length;
    if (searchParams.get('minPrice') || searchParams.get('maxPrice')) count += 1;
    if (searchParams.get('search')) count += 1; // Count search as a filter
    setFiltersApplied(count);
  }, [searchParams]);

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
        return [...originalOrder];

      case "recommend":
      default:
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
    <div className="container mx-auto px-4 overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-8 py-8 overflow-x-hidden">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block md:w-72 lg:w-80 flex-shrink-0">
          <div className="sticky top-32">
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <Suspense fallback={<div className="text-muted-foreground">Loading filters...</div>}>
                <FilterSidebar />
              </Suspense>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:flex-1 min-w-0 overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-brand-h1 font-headline text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? (
                  <>
                    {sortedProducts.length === 0 
                      ? `No products found for "${searchQuery}"`
                      : `Found ${sortedProducts.length} ${sortedProducts.length === 1 ? 'product' : 'products'} for "${searchQuery}"`
                    }
                  </>
                ) : (
                  `Showing ${sortedProducts.length} results`
                )}
              </p>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-3">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommend">Recommended</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Shipping Signal - Above product grid */}
          <div className="mb-6">
            <p className="text-sm sm:text-base text-muted-foreground break-words max-w-full">
              Shop sunglasses online with shipping from Lithuania—fast delivery across Lithuania and the EU/Schengen.
            </p>
          </div>
          
          {/* Mobile Controls */}
          <div className="md:hidden mb-6 space-y-4">
            <div className="flex gap-3">
              {/* Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1 h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters {filtersApplied > 0 && `(${filtersApplied})`}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[300px] sm:w-[350px] p-0"
                >
                  <SheetHeader className="p-6 pb-0">
                    <SheetTitle className="text-xl font-bold font-headline">
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100%-4rem)]">
                    <div className="p-6">
                      <Suspense fallback={<div className="text-muted-foreground">Loading filters...</div>}>
                        <FilterSidebar />
                      </Suspense>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              
              {/* Sort Dropdown - Mobile */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 h-10">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommend">Recommended</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Products Grid */}
          <ProductGrid products={sortedProducts} viewMode="grid" />
        </div>
      </div>
    </div>
  );
}
