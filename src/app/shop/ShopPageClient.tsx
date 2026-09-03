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
  const lastProductStorageKey = `${scrollStorageKey}:lastProduct`;

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

  // Whether the products container is the actual scrolling element right now
  // (desktop: `md:overflow-y-auto md:h-full` makes it its own scroll box) vs.
  // the whole page scrolling instead (mobile: no such classes apply below the
  // `md:` breakpoint, so window/html/body scroll). This is tied directly to
  // Tailwind's `md:` breakpoint (768px) - NOT to measuring the container's
  // scrollHeight/clientHeight, which depends on layout having fully settled
  // and was flaky immediately after a back-navigation (still resolving flex
  // sizing), causing restoration to occasionally pick the wrong element.
  const isDesktopScrollColumn = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  // Scrolls whichever element actually owns scrolling to `top`. Scrolling
  // BOTH unconditionally is wrong: forcing window/html/body to the
  // container's (much larger) offset on desktop overshoots the outer page's
  // real scroll range and the browser clamps it to the bottom of the page.
  const scrollOwnerTo = useCallback((top: number, behavior: ScrollBehavior) => {
    if (isDesktopScrollColumn()) {
      scrollContainerRef.current?.scrollTo({ top, behavior });
    } else {
      window.scrollTo({ top, behavior });
      document.documentElement.scrollTo({ top, behavior });
      document.body.scrollTo({ top, behavior });
    }
  }, []);

  // Take manual control of scroll restoration - the browser's own native
  // restoration on back/forward navigation can race with (and override) our
  // sessionStorage-based restore below, especially on slower mobile devices.
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  // Callback for FilterSidebar to close the mobile sheet before navigating
  const handleMobileFilterClose = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  // Remember exactly which product card was clicked so that on returning here
  // (browser back) we can scroll that specific card back into view via
  // scrollIntoView, instead of restoring a raw pixel offset - scrollIntoView
  // is handled natively by the browser regardless of which element actually
  // owns scrolling, sidestepping the desktop-vs-mobile scroll-container
  // ambiguity that made pixel-offset restoration unreliable.
  const handleProductCardClick = useCallback((productId: string) => {
    sessionStorage.setItem(lastProductStorageKey, productId);
  }, [lastProductStorageKey]);

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

  // Refs so the restore logic below always reads the current keys, even when
  // triggered from a long-lived event listener registered only once.
  const pageStorageKeyRef = useRef(pageStorageKey);
  const scrollStorageKeyRef = useRef(scrollStorageKey);
  const lastProductStorageKeyRef = useRef(lastProductStorageKey);
  pageStorageKeyRef.current = pageStorageKey;
  scrollStorageKeyRef.current = scrollStorageKey;
  lastProductStorageKeyRef.current = lastProductStorageKey;

  // Restores the page returned to (e.g. via the browser back button after
  // viewing a product). Prefers scrolling the actual clicked product card
  // back into view via scrollIntoView - the browser resolves this correctly
  // regardless of which element actually owns scrolling (the products
  // container on desktop vs. the whole page on mobile), which is exactly the
  // distinction that made restoring a raw pixel offset unreliable. Falls back
  // to the saved pixel offset only if no product-card position was recorded.
  const restoreScroll = useCallback(() => {
    const savedPage = sessionStorage.getItem(pageStorageKeyRef.current);
    if (savedPage) {
      const page = parseInt(savedPage, 10);
      if (Number.isFinite(page) && page >= 1) {
        setCurrentPage(page);
      }
    }

    const savedProductId = sessionStorage.getItem(lastProductStorageKeyRef.current);
    const savedTop = sessionStorage.getItem(scrollStorageKeyRef.current);
    const fallbackTop = savedTop ? parseInt(savedTop, 10) : NaN;

    const tryScrollToProduct = (): boolean => {
      if (!savedProductId) return false;
      const el = document.querySelector(`[data-product-id="${CSS.escape(savedProductId)}"]`);
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "auto" });
      return true;
    };

    const applyScroll = () => {
      if (!tryScrollToProduct() && Number.isFinite(fallbackTop) && fallbackTop > 0) {
        scrollOwnerTo(fallbackTop, "auto");
      }
    };

    // Double rAF plus a delayed retry: give slower devices time to finish
    // painting the restored page's grid (and settle any late image-driven
    // layout shift) before the scroll position is considered final.
    requestAnimationFrame(() => {
      applyScroll();
      requestAnimationFrame(applyScroll);
    });
    const retryTimer = setTimeout(applyScroll, 300);
    return () => clearTimeout(retryTimer);
  }, [scrollOwnerTo]);

  // Runs once per mount.
  useEffect(() => {
    if (hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;
    return restoreScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback for browser back/forward navigation where this component
  // instance is reused from Next.js's router cache instead of being freshly
  // mounted (common on mobile) - in that case the mount-only effect above
  // never re-runs, so nothing re-applies the saved position. Listening for
  // popstate/pageshow catches that case regardless of whether a remount
  // happened.
  useEffect(() => {
    window.addEventListener("popstate", restoreScroll);
    window.addEventListener("pageshow", restoreScroll);
    return () => {
      window.removeEventListener("popstate", restoreScroll);
      window.removeEventListener("pageshow", restoreScroll);
    };
  }, [restoreScroll]);

  // Persist scroll position as the user scrolls, so it can be restored above.
  // Also save on pagehide/visibilitychange (not just "scroll"): mobile
  // browsers throttle/coalesce scroll events during momentum scrolling, so if
  // the user taps a product right after flicking the list, the last "scroll"
  // event may not have fired yet and sessionStorage can be left holding a
  // stale, earlier position - pagehide/visibilitychange fire reliably right
  // as the page is actually being left, guaranteeing one final accurate save.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const save = () => {
      const top = isDesktopScrollColumn() && container
        ? container.scrollTop
        : Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
      sessionStorage.setItem(scrollStorageKey, String(top));
    };
    const saveIfHidden = () => {
      if (document.visibilityState === "hidden") save();
    };
    container?.addEventListener("scroll", save, { passive: true });
    window.addEventListener("scroll", save, { passive: true });
    document.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", saveIfHidden);
    return () => {
      container?.removeEventListener("scroll", save);
      window.removeEventListener("scroll", save);
      document.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", saveIfHidden);
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
    scrollOwnerTo(0, "smooth");
  }, [currentPage, scrollOwnerTo]);

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
              <ProductGrid products={currentProducts} viewMode="grid" onCardClick={handleProductCardClick} />
              
              {/* Pagination Controls - fixed/floating so Next/Previous stay reachable without
                  scrolling. Deliberately `fixed` (viewport-relative) rather than `sticky`:
                  sticky depends on which ancestor owns scrolling, which differs between the
                  desktop (own scroll column) and mobile (page-level scroll) layouts above,
                  and silently fails to stick on mobile browsers as a result. */}
              {totalPages > 1 && (
                <>
                <div className="h-24" aria-hidden="true" />
                <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-20 flex justify-center px-2 max-w-[calc(100vw-1rem)]">
                  <div className="flex justify-center items-center gap-2 sm:gap-4 bg-background/95 backdrop-blur border border-border shadow-lg rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-xs sm:text-sm font-medium whitespace-nowrap">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                </>
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
