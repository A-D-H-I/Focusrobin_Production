"use client";

import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { getAvailableGenderCounts, type GenderCount } from "@/app/actions/getAvailableGenderCounts";
import { getPriceRange, type PriceRange } from "@/app/actions/getPriceRange";
import { getAvailableMaterials, type AvailableMaterial } from "@/app/actions/getAvailableMaterials";
import { getAvailableFrameColors, type AvailableColor } from "@/app/actions/getAvailableColors";

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
        <span>{title}</span>
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

export default function FilterSidebar() {
  const searchParams = useSearchParams();
  
  // Price range state
  const [priceRangeData, setPriceRangeData] = useState<PriceRange>({ min: 0, max: 500 });
  
  // Glass shapes state
  const [glassShapes, setGlassShapes] = useState<AvailableGlassShape[]>([]);
  
  // Gender counts state
  const [genderCounts, setGenderCounts] = useState<GenderCount[]>([]);
  
  // Materials state
  const [materials, setMaterials] = useState<AvailableMaterial[]>([]);
  
  // Colors state
  const [colors, setColors] = useState<AvailableColor[]>([]);
  
  // Get current filters from URL (for initialization)
  const genderParams = searchParams.getAll('gender');
  const glassShapeParams = searchParams.getAll('glassShape');
  const materialParams = searchParams.getAll('material');
  const colorParams = searchParams.getAll('color');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  
  // Create stable string representation of search params to use as dependency
  const searchParamsStr = useMemo(() => searchParams.toString(), [searchParams]);
  
  // Local state for pending filter selections (before applying)
  const [pendingGenders, setPendingGenders] = useState<string[]>([]);
  const [pendingGlassShapes, setPendingGlassShapes] = useState<string[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<string[]>([]);
  const [pendingColors, setPendingColors] = useState<string[]>([]);
  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([0, 500]);
  const [pendingMinPrice, setPendingMinPrice] = useState<string>("0");
  const [pendingMaxPrice, setPendingMaxPrice] = useState<string>("500");
  
  // Track previous search params to prevent unnecessary updates
  const prevSearchParamsStr = useRef<string>('');
  
  // Fetch available glass shapes, gender counts, materials, colors, and price range on mount
  useEffect(() => {
    async function fetchData() {
      const [shapes, genders, materialsData, colorsData, priceRange] = await Promise.all([
        getAvailableGlassShapes(),
        getAvailableGenderCounts(),
        getAvailableMaterials(),
        getAvailableFrameColors(),
        getPriceRange(),
      ]);
      setGlassShapes(shapes);
      setGenderCounts(genders);
      setMaterials(materialsData);
      setColors(colorsData);
      setPriceRangeData(priceRange);
      
      // Initialize pending filters from URL params
      const initialGenders = genderParams.map(g => g.toLowerCase());
      const initialShapes = glassShapeParams.map(s => s.toLowerCase().replace(/\s+/g, '-'));
      const initialMaterials = materialParams.map(m => m.toLowerCase());
      const initialColors = colorParams.map(c => c.toLowerCase());
      const initialMin = minPriceParam ? parseInt(minPriceParam) : priceRange.min;
      const initialMax = maxPriceParam ? parseInt(maxPriceParam) : priceRange.max;
      
      setPendingGenders(initialGenders);
      setPendingGlassShapes(initialShapes);
      setPendingMaterials(initialMaterials);
      setPendingColors(initialColors);
      setPendingPriceRange([initialMin, initialMax]);
      setPendingMinPrice(initialMin.toString());
      setPendingMaxPrice(initialMax.toString());
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
    const currentMin = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : priceRangeData.min;
    const currentMax = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : priceRangeData.max;
    
    setPendingGenders(currentGenders);
    setPendingGlassShapes(currentShapes);
    setPendingMaterials(currentMaterials);
    setPendingColors(currentColors);
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
  const handleColorToggle = useCallback((colorHex: string) => {
    const normalizedColor = colorHex.toLowerCase();
    setPendingColors(prev => {
      if (prev.includes(normalizedColor)) {
        return prev.filter(c => c !== normalizedColor);
      } else {
        return [...prev, normalizedColor];
      }
    });
  }, []);

  // Handle price slider change (updates pending state only)
  const handleSliderChange = (values: number[]) => {
    setPendingPriceRange(values);
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
    
    // Add price range if not at default
    if (pendingPriceRange[0] !== priceRangeData.min || pendingPriceRange[1] !== priceRangeData.max) {
      params.set('minPrice', pendingPriceRange[0].toString());
      params.set('maxPrice', pendingPriceRange[1].toString());
    }
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    navigateWithRefresh(newUrl);
  }, [searchParams, pendingGenders, pendingGlassShapes, pendingMaterials, pendingColors, pendingPriceRange, priceRangeData, navigateWithRefresh]);
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setPendingGenders([]);
    setPendingGlassShapes([]);
    setPendingMaterials([]);
    setPendingColors([]);
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
    params.delete('minPrice');
    params.delete('maxPrice');
    
    // Restore filter type if it existed
    if (filterType) {
      params.set('filter', filterType);
    }
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    navigateWithRefresh(newUrl);
  }, [searchParams, priceRangeData, navigateWithRefresh]);
  
  // Check if there are any pending changes (memoized to prevent unnecessary recalculations)
  const hasPendingChanges = useMemo(() => {
    const currentGendersStr = JSON.stringify([...genderParams].map(g => g.toLowerCase()).sort());
    const currentShapesStr = JSON.stringify([...glassShapeParams].map(s => s.toLowerCase().replace(/\s+/g, '-')).sort());
    const currentMaterialsStr = JSON.stringify([...materialParams].map(m => m.toLowerCase()).sort());
    const currentColorsStr = JSON.stringify([...colorParams].map(c => c.toLowerCase()).sort());
    
    const pendingGendersStr = JSON.stringify([...pendingGenders].sort());
    const pendingShapesStr = JSON.stringify([...pendingGlassShapes].sort());
    const pendingMaterialsStr = JSON.stringify([...pendingMaterials].sort());
    const pendingColorsStr = JSON.stringify([...pendingColors].sort());
    
    const currentMin = minPriceParam ? parseInt(minPriceParam) : priceRangeData.min;
    const currentMax = maxPriceParam ? parseInt(maxPriceParam) : priceRangeData.max;
    
    return (
      pendingGendersStr !== currentGendersStr ||
      pendingShapesStr !== currentShapesStr ||
      pendingMaterialsStr !== currentMaterialsStr ||
      pendingColorsStr !== currentColorsStr ||
      currentMin !== pendingPriceRange[0] ||
      currentMax !== pendingPriceRange[1]
    );
  }, [genderParams, glassShapeParams, materialParams, colorParams, minPriceParam, maxPriceParam, priceRangeData, pendingGenders, pendingGlassShapes, pendingMaterials, pendingColors, pendingPriceRange]);


  return (
    <aside className="w-full">
      {/* Gradient Header */}
      <div className="bg-teal-primary rounded-lg p-4 mb-6 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-white" />
        <span className="text-white font-semibold text-lg">Filters</span>
      </div>

      {/* Apply and Clear Buttons */}
      <div className="mb-6 space-y-3 pb-4 border-b border-border/50">
        <Button
          onClick={handleApplyFilters}
          disabled={!hasPendingChanges}
          className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white font-semibold h-11 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Filters
        </Button>
        {(hasPendingChanges || pendingGenders.length > 0 || pendingGlassShapes.length > 0 || pendingMaterials.length > 0 || pendingColors.length > 0 || (pendingPriceRange[0] !== priceRangeData.min || pendingPriceRange[1] !== priceRangeData.max)) && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full h-11 border-border hover:bg-muted"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
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
              const normalizedColor = colorData.colorHex.toLowerCase();
              const isChecked = pendingColors.includes(normalizedColor);
              return (
                <div key={colorData.colorHex} className="flex items-center space-x-3">
                  <Checkbox
                    id={`color-${colorData.colorHex}`}
                    checked={isChecked}
                    onCheckedChange={() => handleColorToggle(colorData.colorHex)}
                    className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                  />
                  <Label
                    htmlFor={`color-${colorData.colorHex}`}
                    className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-border/50 flex-shrink-0"
                      style={{ backgroundColor: colorData.colorHex }}
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
