"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useCallback, useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";

const genderFilters = ["Men", "Women", "Kids", "Unisex"];

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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Price range state
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("500");
  
  // Glass shapes state
  const [glassShapes, setGlassShapes] = useState<AvailableGlassShape[]>([]);
  
  // Get current gender filters from URL
  const genderParams = searchParams.getAll('gender');
  const selectedGenders = genderParams.map(g => g.toLowerCase());
  
  // Get current glass shape filters from URL
  const glassShapeParams = searchParams.getAll('glassShape');
  const selectedGlassShapes = glassShapeParams.map(s => s.toLowerCase());
  
  // Fetch available glass shapes on mount
  useEffect(() => {
    async function fetchGlassShapes() {
      const shapes = await getAvailableGlassShapes();
      setGlassShapes(shapes);
    }
    fetchGlassShapes();
  }, []);

  // Handle gender filter toggle
  const handleGenderToggle = useCallback((gender: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentGenders = params.getAll('gender').map(g => g.toLowerCase());
    
    if (currentGenders.includes(gender)) {
      params.delete('gender');
      currentGenders.forEach(g => {
        if (g !== gender) {
          params.append('gender', g);
        }
      });
    } else {
      params.append('gender', gender);
    }
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Handle glass shape filter toggle
  const handleGlassShapeToggle = useCallback((glassShape: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentShapes = params.getAll('glassShape').map(s => s.toLowerCase());
    const normalizedShape = glassShape.toLowerCase();
    
    if (currentShapes.includes(normalizedShape)) {
      params.delete('glassShape');
      currentShapes.forEach(s => {
        if (s !== normalizedShape) {
          params.append('glassShape', s);
        }
      });
    } else {
      params.append('glassShape', glassShape);
    }
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Handle price slider change
  const handleSliderChange = (values: number[]) => {
    setPriceRange(values);
    setMinPrice(values[0].toString());
    setMaxPrice(values[1].toString());
  };

  // Handle min price input change
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinPrice(value);
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= priceRange[1]) {
      setPriceRange([numValue, priceRange[1]]);
    }
  };

  // Handle max price input change
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxPrice(value);
    const numValue = parseInt(value) || 500;
    if (numValue >= priceRange[0] && numValue <= 500) {
      setPriceRange([priceRange[0], numValue]);
    }
  };


  return (
    <aside className="w-full">
      {/* Gradient Header */}
      <div className="bg-teal-primary rounded-lg p-4 mb-6 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-white" />
        <span className="text-white font-semibold text-lg">Filters</span>
      </div>

      {/* Price Range */}
      <CollapsibleSection title="Price Range" defaultOpen={true}>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={handleSliderChange}
            max={500}
            min={0}
            step={10}
            className="w-full [&_[role=slider]]:bg-teal-primary [&_[role=slider]]:border-teal-primary [&_.bg-primary]:bg-teal-primary"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={minPrice}
              onChange={handleMinPriceChange}
              className="w-20 h-9 text-center text-sm"
              min={0}
              max={500}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              className="w-20 h-9 text-center text-sm"
              min={0}
              max={500}
            />
            <span className="text-muted-foreground text-sm">€</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Gender */}
      <CollapsibleSection title="Gender" defaultOpen={true}>
        <div className="space-y-3">
          {genderFilters.map((gender) => {
            const normalizedGender = gender.toLowerCase();
            const isChecked = selectedGenders.includes(normalizedGender);
            return (
              <div key={gender} className="flex items-center space-x-3">
                <Checkbox
                  id={`gender-${gender}`}
                  checked={isChecked}
                  onCheckedChange={() => handleGenderToggle(normalizedGender)}
                  className="border-muted-foreground/50 data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                />
                <Label
                  htmlFor={`gender-${gender}`}
                  className="text-sm font-normal text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                >
                  {gender}
                </Label>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Glass Shape */}
      {glassShapes.length > 0 && (
        <CollapsibleSection title="Glass Shape" defaultOpen={true}>
          <div className="space-y-3">
            {glassShapes.map((shapeData) => {
              const normalizedShape = shapeData.shape.toLowerCase();
              const isChecked = selectedGlassShapes.includes(normalizedShape);
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
    </aside>
  );
}
