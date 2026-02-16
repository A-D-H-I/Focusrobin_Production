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
import { type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { type PriceRange } from "@/app/actions/getPriceRange";
import { type AvailableMaterial } from "@/app/actions/getAvailableMaterials";
import { type AvailableColor } from "@/app/actions/getAvailableColors";
import { type AvailableBrand } from "@/app/actions/getAvailableBrands";
import { getAvailableColorFamilies } from "@/app/actions/getAvailableColorFamilies";
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
  glassShapes: AvailableGlassShape[];
  genderCounts: GenderCount[];
  materials: AvailableMaterial[];
  colors: AvailableColor[];
  brands: AvailableBrand[];
  priceRange: PriceRange;
}

export default function FilterSidebar({
  initialPriceRange,
  glassShapes,
  genderCounts,
  materials,

  colors,
  brands,
  priceRange
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
  const glassShapeParams = searchParams.getAll('glassShape');
  const materialParams = searchParams.getAll('material');
  const colorParams = searchParams.getAll('color');
  const brandParams = searchParams.getAll('brand');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');

  // Create stable string representation of search params to use as dependency
  const searchParamsStr = useMemo(() => searchParams.toString(), [searchParams]);

  // Local state for pending filter selections (before applying)
  const [pendingGenders, setPendingGenders] = useState<string[]>([]);
  const [pendingGlassShapes, setPendingGlassShapes] = useState<string[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<string[]>([]);
  const [pendingColors, setPendingColors] = useState<string[]>([]);
  const [pendingBrands, setPendingBrands] = useState<string[]>([]);

  // Initialize pending price range
  const initialMin = minPriceParam ? parseInt(minPriceParam) : priceRangeData.min;
  const initialMax = maxPriceParam ? parseInt(maxPriceParam) : priceRangeData.max;

  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([initialMin, initialMax]);
  const [pendingMinPrice, setPendingMinPrice] = useState<string>(initialMin.toString());
  const [pendingMaxPrice, setPendingMaxPrice] = useState<string>(initialMax.toString());

  const [colorPalette, setColorPalette] = useState<Record<string, string>>({});

  useEffect(() => {
    getAvailableColorFamilies().then(setColorPalette);
  }, []);

  // Track previous search params to prevent unnecessary updates
  const prevSearchParamsStr = useRef<string>('');

  // Initialize pending filters from URL params on mount
  useEffect(() => {
    const initialGenders = genderParams.map(g => g.toLowerCase());
    const initialShapes = glassShapeParams.map(s => s.toLowerCase().replace(/\s+/g, '-'));
    const initialMaterials = materialParams.map(m => m.toLowerCase());
    const initialColors = colorParams.map(c => c.toLowerCase());
    const initialBrands = brandParams.map(b => b); // Brands are case sensitive or stored as is? Better keep original case if possible, or normalize. I'll defer normalization to backend or consistent usage.

    setPendingGenders(initialGenders);
    setPendingGlassShapes(initialShapes);
    setPendingMaterials(initialMaterials);
    setPendingColors(initialColors);
    setPendingBrands(initialBrands);
  }, []); // Only run on mount


  // Update pending filters when URL params change (for external navigation)
  // Only update if searchParams actually changed to prevent infinite loops
  useEffect(() => {
    if (priceRangeData.max === 0) return; // Wait for price range to load
    if (prevSearchParamsStr.current === searchParamsStr) return; // No change

    // Update the ref
    prevSearchParamsStr.current = searchParamsStr;

    // Re-read from searchParams to get fresh values
    const currentGenders = searchParams.getAll('gender').map(g => g.toLowerCase()).sort();
    const currentShapes = searchParams.getAll('glassShape').map(s => s.toLowerCase().replace(/\s+/g, '-')).sort();
    const currentMaterials = searchParams.getAll('material').map(m => m.toLowerCase()).sort();
    const currentColors = searchParams.getAll('color').map(c => c.toLowerCase()).sort();
    const currentBrands = searchParams.getAll('brand').sort();
    const currentMin = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : priceRangeData.min;
    const currentMax = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : priceRangeData.max;

    setPendingGenders(currentGenders);
    setPendingGlassShapes(currentShapes);
    setPendingMaterials(currentMaterials);
    setPendingColors(currentColors);
    setPendingBrands(currentBrands);
    setPendingPriceRange([currentMin, currentMax]);
    setPendingMinPrice(currentMin.toString());
    setPendingMaxPrice(currentMax.toString());
  }, [searchParamsStr, searchParams, priceRangeData]);

  // Navigate to a new URL - use window.location for full page reload to ensure server re-renders
  const navigateWithRefresh = useCallback((newUrl: string) => {
    // Use window.location for guaranteed full page reload
    window.location.href = newUrl;
  }, []);

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

  // Handle glass shape filter toggle (updates pending state only)
  const handleGlassShapeToggle = useCallback((glassShape: string) => {
    const urlShape = glassShape.toLowerCase().replace(/\s+/g, '-');
    setPendingGlassShapes(prev => {
      if (prev.includes(urlShape)) {
        return prev.filter(s => s !== urlShape);
      } else {
        return [...prev, urlShape];
      }
    });
  }, []);

  // Handle material filter toggle (updates pending state only)
  const handleMaterialToggle = useCallback((material: string) => {
    const normalizedMaterial = material.toLowerCase();
    setPendingMaterials(prev => {
      if (prev.includes(normalizedMaterial)) {
        return prev.filter(m => m !== normalizedMaterial);
      } else {
        return [...prev, normalizedMaterial];
      }
    });
  }, []);

  // Handle color filter toggle (updates pending state only)
  // We use colorName (Family) as key if it's a family-grouped result, or colorHex?
  // getAvailableColors returns: colorName (Family), colorHex (Rep), textureImageUrl
  // If we filter by family, we should push the Family Name (colorName) to URL.
  // Existing code expects colorHex in params?
  // Our updated ShopPage logic handles both Hex and Family Name in params.
  // So we should use colorName (which is Family Name for families) as the value.
  const handleColorToggle = useCallback((colorValue: string) => {
    const normalizedColor = colorValue.toLowerCase(); // Hex or Name
    setPendingColors(prev => {
      // Check if we have this value (case insensitive)
      const exists = prev.some(c => c.toLowerCase() === normalizedColor);
      if (exists) {
        return prev.filter(c => c.toLowerCase() !== normalizedColor);
      } else {
        return [...prev, colorValue]; // Keep original case? Logic uses lowercase for check.
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
    params.delete('glassShape');
    params.delete('material');
    params.delete('color');
    params.delete('brand');
    params.delete('minPrice');
    params.delete('maxPrice');

    // Restore filter type if it existed
    if (filterType) {
      params.set('filter', filterType);
    }

    // Add pending filters
    pendingGenders.forEach(g => params.append('gender', g));
    pendingGlassShapes.forEach(s => params.append('glassShape', s));
    pendingMaterials.forEach(m => params.append('material', m));
    pendingColors.forEach(c => params.append('color', c));
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
  }, [searchParams, pendingGenders, pendingGlassShapes, pendingMaterials, pendingColors, pendingBrands, pendingPriceRange, priceRangeData, navigateWithRefresh, isPrescriptionGlassesPage, pathname]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setPendingGenders([]);
    setPendingGlassShapes([]);
    setPendingMaterials([]);
    setPendingColors([]);
    setPendingBrands([]);
    setPendingPriceRange([priceRangeData.min, priceRangeData.max]);
    setPendingMinPrice(priceRangeData.min.toString());
    setPendingMaxPrice(priceRangeData.max.toString());

    // Also clear URL but preserve filter type
    const params = new URLSearchParams(searchParams.toString());
    const filterType = searchParams.get('filter');

    params.delete('gender');
    params.delete('glassShape');
    params.delete('material');
    params.delete('color');
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
    const currentShapesStr = JSON.stringify([...glassShapeParams].map(s => s.toLowerCase().replace(/\s+/g, '-')).sort());
    const currentMaterialsStr = JSON.stringify([...materialParams].map(m => m.toLowerCase()).sort());
    const currentColorsStr = JSON.stringify([...colorParams].map(c => c.toLowerCase()).sort());
    const currentBrandsStr = JSON.stringify([...brandParams].sort());

    const pendingGendersStr = JSON.stringify([...pendingGenders].sort());
    const pendingShapesStr = JSON.stringify([...pendingGlassShapes].sort());
    const pendingMaterialsStr = JSON.stringify([...pendingMaterials].sort());
    const pendingColorsStr = JSON.stringify([...pendingColors].sort());
    const pendingBrandsStr = JSON.stringify([...pendingBrands].sort());

    const currentMin = minPriceParam ? parseInt(minPriceParam) : priceRangeData.min;
    const currentMax = maxPriceParam ? parseInt(maxPriceParam) : priceRangeData.max;

    return (
      pendingGendersStr !== currentGendersStr ||
      pendingShapesStr !== currentShapesStr ||
      pendingMaterialsStr !== currentMaterialsStr ||
      pendingColorsStr !== currentColorsStr ||
      pendingBrandsStr !== currentBrandsStr ||
      currentMin !== pendingPriceRange[0] ||
      currentMax !== pendingPriceRange[1]
    );
  }, [genderParams, glassShapeParams, materialParams, colorParams, brandParams, minPriceParam, maxPriceParam, priceRangeData, pendingGenders, pendingGlassShapes, pendingMaterials, pendingColors, pendingBrands, pendingPriceRange]);


  return (
    <aside className="w-full">
      {/* Gradient Header */}
      <div className="bg-teal-primary rounded-lg p-4 mb-6 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-white" />
        <span className="text-white font-semibold text-lg"><TranslatableText text="Filters" /></span>
      </div>

      {/* Apply and Clear Buttons */}
      <div className="mb-6 space-y-3 pb-4 border-b border-border/50">
        <Button
          onClick={handleApplyFilters}
          disabled={!hasPendingChanges}
          className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white font-semibold h-11 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TranslatableText text="Apply Filters" />
        </Button>
        {(hasPendingChanges || pendingGenders.length > 0 || pendingGlassShapes.length > 0 || pendingMaterials.length > 0 || pendingColors.length > 0 || (pendingPriceRange[0] !== priceRangeData.min || pendingPriceRange[1] !== priceRangeData.max)) && (
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

      {/* Glass Shape */}
      {glassShapes.length > 0 && (
        <CollapsibleSection title="Glass Shape" defaultOpen={true}>
          <div className="space-y-3">
            {glassShapes.map((shapeData) => {
              // Normalize shape for comparison: lowercase and replace spaces with hyphens
              const normalizedShape = shapeData.shape.toLowerCase().replace(/\s+/g, '-');
              const isChecked = pendingGlassShapes.includes(normalizedShape);
              return (
                <div key={shapeData.shape} className="flex items-center space-x-3">
                  <Checkbox
                    id={`glassShape-${shapeData.shape}`}
                    checked={isChecked}
                    onCheckedChange={() => handleGlassShapeToggle(shapeData.shape)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`glassShape-${shapeData.shape}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                  >
                    {shapeData.shape} ({shapeData.count})
                  </Label>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Material */}
      {materials.length > 0 && (
        <CollapsibleSection title="Material" defaultOpen={true}>
          <div className="space-y-3">
            {materials.map((materialData) => {
              const normalizedMaterial = materialData.material.toLowerCase();
              const isChecked = pendingMaterials.includes(normalizedMaterial);
              return (
                <div key={materialData.material} className="flex items-center space-x-3">
                  <Checkbox
                    id={`material-${materialData.material}`}
                    checked={isChecked}
                    onCheckedChange={() => handleMaterialToggle(materialData.material)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`material-${materialData.material}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                  >
                    {materialData.material} ({materialData.count})
                  </Label>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <CollapsibleSection title="Color" defaultOpen={true}>
          <div className="space-y-3">
            {colors.map((colorData) => {
              // We use colorName as the unique ID for filtering if it's a family
              // But wait, existing logic used colorHex.
              // If we change to use colorName (Family), we must iterate over colors.
              // For backward compatibility, if colorData came from getAvailableColors,
              // colorName is "Blue" (Family) and colorHex is representative.

              // We'll use colorName as the filter value if distinct families are enabled.
              // Let's assume we want to filter by Name (Family) primarily now.
              // But we need to support legacy Hex too?

              // Key: use distinct identifier. Name is good for Family.
              const filterValue = colorData.colorName;

              // Check if selected
              // pendingColors might contain hexes or names.
              const isChecked = pendingColors.some(c =>
                c.toLowerCase() === filterValue.toLowerCase() ||
                c.toLowerCase() === colorData.colorHex.toLowerCase()
              );

              // Color family logic
              const colorFamily = colorData.colorName.toLowerCase();
              const paletteColor = colorPalette[colorFamily] || colorPalette[colorData.colorName];
              // prioritize palette, fallback to hex
              const displayColor = paletteColor || (colorData.colorHex.startsWith("#") ? colorData.colorHex : "#" + colorData.colorHex);

              // Check for light color to add border
              const isLight = colorFamily === 'white' || colorFamily === 'transparent' || displayColor.toLowerCase() === '#ffffff' || displayColor.toLowerCase() === '#fff';

              return (
                <div key={colorData.colorName /* use name as key for family */} className="flex items-center space-x-3">
                  <Checkbox
                    id={`color-${colorData.colorName}`}
                    checked={isChecked}
                    onCheckedChange={() => handleColorToggle(filterValue)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`color-${colorData.colorName}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full flex-shrink-0",
                        isLight ? "border border-border" : "border border-transparent"
                      )}
                      style={{ background: displayColor }}
                      aria-hidden="true"
                    />
                    <span>
                      {colorData.colorName} ({colorData.count})
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </aside>
  );
}
