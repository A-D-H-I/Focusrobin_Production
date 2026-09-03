"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { type PriceRange } from "@/app/actions/getPriceRange";
import { type AvailableBrand } from "@/app/actions/getAvailableBrands";
import TranslatableText from "@/components/ui/TranslatableText";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50 pb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span><TranslatableText text={title} /></span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="pt-2">{children}</div>}
    </div>
  );
}

interface FilterSidebarProps {
  initialPriceRange?: { min: number; max: number };
  genderCounts: GenderCount[];
  brands: AvailableBrand[];
  priceRange: PriceRange;
  onNavigate?: () => void;
}

export default function FilterSidebar({
  initialPriceRange,
  genderCounts,
  brands,
  priceRange,
  onNavigate
}: FilterSidebarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Check if we're on prescription glasses page
  const isPrescriptionGlassesPage = pathname?.includes('/prescription-glasses');

  // Price range state - default to passed priceRange or initialPriceRange
  // We use the data passed from server which is fresh
  const [priceRangeData] = useState<PriceRange>(priceRange);

  // Filter keys are now passed as props, so we don't need state for them
  // But we keep using props directly in rendering

  // Get current filters from URL (for initialization)
  const genderParams = searchParams.getAll('gender');
  const brandParams = searchParams.getAll('brand');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');

  // Create stable string representation of search params to use as dependency
  const searchParamsStr = useMemo(() => searchParams.toString(), [searchParams]);

  // Local state for pending filter selections (before applying)
  // Initialize directly from URL params to avoid race conditions on mobile
  const [pendingGenders, setPendingGenders] = useState<string[]>(() => genderParams.map(g => g.toLowerCase()));
  const [pendingBrands, setPendingBrands] = useState<string[]>(() => [...brandParams]);

  // Initialize pending price range
  const initialMin = minPriceParam ? parseInt(minPriceParam) : priceRangeData.min;
  const initialMax = maxPriceParam ? parseInt(maxPriceParam) : priceRangeData.max;

  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([initialMin, initialMax]);
  const [pendingMinPrice, setPendingMinPrice] = useState<string>(initialMin.toString());
  const [pendingMaxPrice, setPendingMaxPrice] = useState<string>(initialMax.toString());

  // Track previous search params to prevent unnecessary updates
  const prevSearchParamsStr = useRef<string>(searchParamsStr);


  // Update pending filters when URL params change (for external navigation)
  // Only update if searchParams actually changed to prevent infinite loops
  useEffect(() => {
    if (priceRangeData.max === 0) return; // Wait for price range to load
    if (prevSearchParamsStr.current === searchParamsStr) return; // No change

    // Update the ref
    prevSearchParamsStr.current = searchParamsStr;

    // Re-read from searchParams to get fresh values
    const currentGenders = searchParams.getAll('gender').map(g => g.toLowerCase()).sort();
    const currentBrands = searchParams.getAll('brand').sort();
    const currentMin = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : priceRangeData.min;
    const currentMax = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : priceRangeData.max;

    setPendingGenders(currentGenders);
    setPendingBrands(currentBrands);
    setPendingPriceRange([currentMin, currentMax]);
    setPendingMinPrice(currentMin.toString());
    setPendingMaxPrice(currentMax.toString());
  }, [searchParamsStr, searchParams, priceRangeData]);

  // Navigate to a new URL - use window.location for full page reload to ensure server re-renders
  const navigateWithRefresh = useCallback((newUrl: string) => {
    // Call onNavigate first to close the Sheet/drawer on mobile
    // This prevents Radix Dialog scroll lock from interfering with navigation
    if (onNavigate) {
      onNavigate();
    }
    // Use setTimeout to allow Radix Dialog cleanup to complete before navigation
    // This fixes mobile browsers (iOS Safari, Chrome) where navigation inside
    // a Dialog with scroll lock can fail or get intercepted
    setTimeout(() => {
      window.location.href = newUrl;
    }, 100);
  }, [onNavigate]);

  // Handle gender filter toggle (updates pending state only)
  const handleGenderToggle = useCallback((gender: string) => {
    setPendingGenders(prev => {
      if (prev.includes(gender)) {
        return prev.filter(g => g !== gender);
      } else {
        return [...prev, gender];
      }
    });
  }, []);

  // Handle brand filter toggle (updates pending state only)
  const handleBrandToggle = useCallback((brand: string) => {
    setPendingBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  }, []);

  // Handle price slider change (updates pending state only)
  const handleSliderChange = (values: number[]) => {
    setPendingPriceRange(values as [number, number]);
    setPendingMinPrice(values[0].toString());
    setPendingMaxPrice(values[1].toString());
  };

  // Handle min price input change (updates pending state only)
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPendingMinPrice(value);
    const numValue = parseInt(value) || priceRangeData.min;
    const clampedValue = Math.max(priceRangeData.min, Math.min(numValue, pendingPriceRange[1]));
    if (clampedValue >= priceRangeData.min && clampedValue <= pendingPriceRange[1]) {
      const newRange: [number, number] = [clampedValue, pendingPriceRange[1]];
      setPendingPriceRange(newRange);
    }
  };

  // Handle max price input change (updates pending state only)
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPendingMaxPrice(value);
    const numValue = parseInt(value) || priceRangeData.max;
    const clampedValue = Math.max(pendingPriceRange[0], Math.min(numValue, priceRangeData.max));
    if (clampedValue >= pendingPriceRange[0] && clampedValue <= priceRangeData.max) {
      const newRange: [number, number] = [pendingPriceRange[0], clampedValue];
      setPendingPriceRange(newRange);
    }
  };

  // Apply all pending filters
  const handleApplyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Preserve filter type (new-arrivals, bestsellers) if present
    const filterType = searchParams.get('filter');

    // Clear existing filters
    params.delete('gender');
    params.delete('brand');
    params.delete('minPrice');
    params.delete('maxPrice');

    // Restore filter type if it existed
    if (filterType) {
      params.set('filter', filterType);
    }

    // Add pending filters
    pendingGenders.forEach(g => params.append('gender', g));
    pendingBrands.forEach(b => params.append('brand', b));

    // Add price range if not at default
    if (pendingPriceRange[0] !== priceRangeData.min || pendingPriceRange[1] !== priceRangeData.max) {
      params.set('minPrice', pendingPriceRange[0].toString());
      params.set('maxPrice', pendingPriceRange[1].toString());
    }

    // Determine base URL based on current page
    let baseUrl = isPrescriptionGlassesPage ? '/shop/prescription-glasses' : '/shop';

    if (pathname && (
      pathname.includes('/shop/men') ||
      pathname.includes('/shop/women') ||
      pathname.includes('/shop/kids') ||
      pathname.includes('/shop/unisex') ||
      pathname.includes('/shop/new-arrivals') ||
      pathname.includes('/shop/prescription-glasses/')
    )) {
      baseUrl = pathname;
    }

    const newUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    navigateWithRefresh(newUrl);
  }, [searchParams, pendingGenders, pendingBrands, pendingPriceRange, priceRangeData, navigateWithRefresh, isPrescriptionGlassesPage, pathname]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setPendingGenders([]);
    setPendingBrands([]);
    setPendingPriceRange([priceRangeData.min, priceRangeData.max]);
    setPendingMinPrice(priceRangeData.min.toString());
    setPendingMaxPrice(priceRangeData.max.toString());

    // Also clear URL but preserve filter type
    const params = new URLSearchParams(searchParams.toString());
    const filterType = searchParams.get('filter');

    params.delete('gender');
    params.delete('brand');
    params.delete('minPrice');
    params.delete('maxPrice');

    // Restore filter type if it existed
    if (filterType) {
      params.set('filter', filterType);
    }

    // Determine base URL based on current page
    let baseUrl = isPrescriptionGlassesPage ? '/shop/prescription-glasses' : '/shop';

    if (pathname && (
      pathname.includes('/shop/men') ||
      pathname.includes('/shop/women') ||
      pathname.includes('/shop/kids') ||
      pathname.includes('/shop/unisex') ||
      pathname.includes('/shop/new-arrivals') ||
      pathname.includes('/shop/prescription-glasses/')
    )) {
      baseUrl = pathname;
    }

    const newUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    navigateWithRefresh(newUrl);
  }, [searchParams, priceRangeData, navigateWithRefresh, isPrescriptionGlassesPage, pathname]);

  // Check if there are any pending changes (memoized to prevent unnecessary recalculations)
  const hasPendingChanges = useMemo(() => {
    const currentGendersStr = JSON.stringify([...genderParams].map(g => g.toLowerCase()).sort());
    const currentBrandsStr = JSON.stringify([...brandParams].sort());

    const pendingGendersStr = JSON.stringify([...pendingGenders].sort());
    const pendingBrandsStr = JSON.stringify([...pendingBrands].sort());

    const currentMin = minPriceParam ? parseInt(minPriceParam) : priceRangeData.min;
    const currentMax = maxPriceParam ? parseInt(maxPriceParam) : priceRangeData.max;

    return (
      pendingGendersStr !== currentGendersStr ||
      pendingBrandsStr !== currentBrandsStr ||
      currentMin !== pendingPriceRange[0] ||
      currentMax !== pendingPriceRange[1]
    );
  }, [genderParams, brandParams, minPriceParam, maxPriceParam, priceRangeData, pendingGenders, pendingBrands, pendingPriceRange]);


  return (
    <aside className="w-full">
      {/* Gradient Header */}
      <div className="bg-teal-primary rounded-lg p-4 mb-6 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-white" />
        <span className="text-white font-semibold text-lg"><TranslatableText text="Filters" /></span>
      </div>

      {/* Apply and Clear Buttons - sticky so they stay reachable while scrolling through filters */}
      <div className="sticky top-0 z-20 bg-background mb-6 space-y-3 pb-4 border-b border-border/50">
        <Button
          onClick={handleApplyFilters}
          className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white font-semibold h-11"
        >
          <TranslatableText text="Apply Filters" />
        </Button>
        {(hasPendingChanges || pendingGenders.length > 0 || (pendingPriceRange[0] !== priceRangeData.min || pendingPriceRange[1] !== priceRangeData.max)) && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full h-11 border-border hover:bg-muted"
          >
            <X className="h-4 w-4 mr-2" />
            <TranslatableText text="Clear All Filters" />
          </Button>
        )}
      </div>

      {/* Price Range */}
      <CollapsibleSection title="Price Range" defaultOpen={true}>
        <div className="space-y-4">
          <Slider
            value={pendingPriceRange}
            onValueChange={handleSliderChange}
            max={priceRangeData.max}
            min={priceRangeData.min}
            step={Math.max(1, Math.floor((priceRangeData.max - priceRangeData.min) / 100))}
            className="w-full [&_[role=slider]]:bg-teal-primary [&_[role=slider]]:border-teal-primary [&_.bg-primary]:bg-teal-primary"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={pendingMinPrice}
              onChange={handleMinPriceChange}
              className="w-20 h-9 text-center text-sm"
              min={priceRangeData.min}
              max={priceRangeData.max}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              value={pendingMaxPrice}
              onChange={handleMaxPriceChange}
              className="w-20 h-9 text-center text-sm"
              min={priceRangeData.min}
              max={priceRangeData.max}
            />
            <span className="text-muted-foreground text-sm">€</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Brand */}
      {brands && brands.length > 0 && (
        <CollapsibleSection title="Brand" defaultOpen={true}>
          <div className="space-y-3">
            {brands.map((brandData) => {
              const isChecked = pendingBrands.includes(brandData.brand);
              return (
                <div key={brandData.brand} className="flex items-center space-x-3">
                  <Checkbox
                    id={`brand-${brandData.brand}`}
                    checked={isChecked}
                    onCheckedChange={() => handleBrandToggle(brandData.brand)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`brand-${brandData.brand}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                  >
                    {brandData.brand} ({brandData.count})
                  </Label>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Gender */}
      {genderCounts.length > 0 && (
        <CollapsibleSection title="Gender" defaultOpen={true}>
          <div className="space-y-3">
            {genderCounts.map((genderData) => {
              const normalizedGender = genderData.gender.toLowerCase();
              const isChecked = pendingGenders.includes(normalizedGender);
              return (
                <div key={genderData.gender} className="flex items-center space-x-3">
                  <Checkbox
                    id={`gender-${genderData.gender}`}
                    checked={isChecked}
                    onCheckedChange={() => handleGenderToggle(normalizedGender)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`gender-${genderData.gender}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                  >
                    {genderData.displayName} ({genderData.count})
                  </Label>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}


      {/* Glass Shape, Material, and Color filters removed */}
    </aside>
  );
}
