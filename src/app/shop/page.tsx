"use client";

import { useState } from "react";
import { productCatalog } from "@/lib/productData";
import ProductCard from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";

export default function ShopPage() {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Get unique categories from products
  const allCategories = Array.from(
    new Set(productCatalog.flatMap((product) => product.categories))
  );

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Full-width Product Grid - MELLER Style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {productCatalog.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
