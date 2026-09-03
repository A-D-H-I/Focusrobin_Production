"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
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
import { type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { type PriceRange } from "@/app/actions/getPriceRange";

interface ShopPageClientProps {
  products: Product[];
  title?: string;
  searchQuery?: string;
  priceRange: PriceRange;
  genderCounts: GenderCount[];
  brands: AvailableBrand[];
  banner?: React.ReactNode;
}

export default function ShopPageClient({
  products,
  title = "All Products",
  searchQuery,
  priceRange,
  genderCounts = [],
  brands = [],
  banner
}: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filtersApplied, setFiltersApplied] = useState(0);
  const [sortBy, setSortBy] = useState<string>("recommend");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 50;

  // Key used to persist/restore page + scroll position across navigation (e.g.
  // visiting a product then pressing back) - unique per route + filter/sort state.
  const scrollStorageKey = `shop-scroll:${pathname}?${searchParams.toString()}`;
  const pageStorageKey = `${scrollStorageKey}:page`;

  // Restore the page number synchronously on first render (not in an effect) so
  // the correct page's products are already showing before anything paints or
  // scrolls - avoids a visible flash back to page 1 then a jump to the real page.
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = sessionStorage.getItem(pageStorageKey);
    const page = saved ? parseInt(saved, 10) : 1;
    return Number.isFinite(page) && page >= 1 ? page : 1;
  });

  const hasRestoredScroll = useRef(false);
  const isFirstPageEffect = useRef(true);

  // Callback for FilterSidebar to close the mobile sheet before navigating
  const handleMobileFilterClose = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  // Count applied filters from URL params
  useEffect(() => {
    let count = 0;
    if (searchParams.get('gender')) count += searchParams.getAll('gender').length;
    if (searchParams.get('brand')) count += searchParams.getAll('brand').length;
    if (searchParams.get('filter')) count += 1;
    if (searchParams.get('minPrice') || searchParams.get('maxPrice')) count += 1;
    if (searchParams.get('search')) count += 1;
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

  // Reset to page 1 when the viewed collection's identity (URL filters/search,
  // or sort order) actually changes - not on mount, and not when unrelated
  // state (like filtersApplied settling a render after mount) merely re-fires
  // this effect without the identity itself having changed.
  const prevFilterIdentityRef = useRef<string | null>(null);
  useEffect(() => {
    const identity = `${scrollStorageKey}|${sortBy}`;
    if (prevFilterIdentityRef.current === null) {
      // First run (mount) - just record it, don't reset a possibly-restored page.
      prevFilterIdentityRef.current = identity;
      return;
    }
    if (prevFilterIdentityRef.current !== identity) {
      prevFilterIdentityRef.current = identity;
      setCurrentPage(1);
    }
  }, [scrollStorageKey, sortBy]);

  // Persist the current page number so returning here (e.g. back button from
  // a product) restores the actual page the user was on, not just page 1.
  useEffect(() => {
    sessionStorage.setItem(pageStorageKey, String(currentPage));
  }, [currentPage, pageStorageKey]);

  // Restore scroll position on mount (e.g. returning here via the browser
  // back button after viewing a product) - only if we have a saved position
  // for this exact route+filter state. Runs once per mount.
  useEffect(() => {
    if (hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;
    const saved = sessionStorage.getItem(scrollStorageKey);
    if (!saved) return;
    const top = parseInt(saved, 10);
    if (!Number.isFinite(top) || top <= 0) return;
    // Wait a frame so the product grid has actually rendered before scrolling.
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top, behavior: "auto" });
      window.scrollTo({ top, behavior: "auto" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist scroll position as the user scrolls, so it can be restored above.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const save = () => {
      const top = container && container.scrollHeight > container.clientHeight
        ? container.scrollTop
        : window.scrollY;
      sessionStorage.setItem(scrollStorageKey, String(top));
    };
    container?.addEventListener("scroll", save, { passive: true });
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      container?.removeEventListener("scroll", save);
      window.removeEventListener("scroll", save);
    };
  }, [scrollStorageKey]);

  // Scroll to top when the page number changes via pagination (not on the
  // initial mount, which may instead be restoring a saved scroll position above).
  // Runs after the new page's products have rendered, avoiding a scroll
  // animation that gets interrupted by the content-height change.
  useEffect(() => {
    if (isFirstPageEffect.current) {
      isFirstPageEffect.current = false;
      return;
    }
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Determine if search is active (hide filters for cross-category search)
  const isSearchActive = !!(searchQuery && searchQuery.trim());

  return (
    <div className="container mx-auto px-4">
      {/* On desktop: fixed-height layout so only products scroll, not filters */}
      <div className="flex flex-col md:flex-row gap-8 py-8 md:h-[calc(100vh-7rem)]">
        {/* Desktop Filter Sidebar - hidden during search since results span both product categories */}
        {!isSearchActive && (
        <div className="hidden md:block md:w-72 lg:w-80 flex-shrink-0 h-full">
          <div className="h-full overflow-y-auto pr-2 pb-8 hide-scrollbar">
            <Suspense fallback={<div className="text-muted-foreground">Loading filters...</div>}>
              <FilterSidebar
                priceRange={priceRange}
                genderCounts={genderCounts}
                brands={brands}
              />
            </Suspense>
          </div>
        </div>
        )}

        {/* Main Content - ONLY this column scrolls on desktop */}
        <div 
          ref={scrollContainerRef}
          className="w-full md:flex-1 min-w-0 md:h-full md:overflow-y-auto md:pr-1 hide-scrollbar"
        >
          {/* Banner Section - scrolls with products */}
          {banner && (
            <div className="mb-6">
              {banner}
            </div>
          )}

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
                      ? `No products found`
                      : `Found ${sortedProducts.length} ${sortedProducts.length === 1 ? 'product' : 'products'} for "${searchQuery}"`
                    }
                  </>
                ) : (
                  sortedProducts.length === 0 ? "No products found" : `Showing ${sortedProducts.length} results`
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
              {/* Filter Button - hidden during search */}
              {!isSearchActive && (
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
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
                        <FilterSidebar
                          priceRange={priceRange}
                          genderCounts={genderCounts}
                          brands={brands}
                          onNavigate={handleMobileFilterClose}
                        />
                      </Suspense>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              )}

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
          {sortedProducts.length > 0 ? (
            <>
              <ProductGrid products={currentProducts} viewMode="grid" />
              
              {/* Pagination Controls - sticky/floating so Next/Previous stay reachable without scrolling */}
              {totalPages > 1 && (
                <div className="sticky bottom-4 z-20 flex justify-center mt-12 mb-8">
                  <div className="flex justify-center items-center space-x-4 bg-background/95 backdrop-blur border border-border shadow-lg rounded-full px-4 py-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/30 rounded-full p-6 mb-4">
                <Filter className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-headline font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `We couldn't find any products matching "${searchQuery}".`
                  : "There are no products available in this category yet."}
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => window.location.href = '/shop'}
              >
                View all products
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
