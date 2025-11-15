
"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Sun, ParkingCircle, Shield, Droplet, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/productData";
import { Badge } from "@/components/ui/badge";

type ProductPurchaseFormProps = {
  product: Product;
  onVariantChange?: (variant: typeof product.variants[0]) => void;
  selectedVariant?: typeof product.variants[0];
};

const lensFeatures = [
  { icon: Sun, text: "CAT3 (UV400)" },
  { icon: ParkingCircle, text: "Polarized lenses" },
  { icon: Shield, text: "Antiscratch coating" },
  { icon: Droplet, text: "Superhydrophobic" },
];

export default function ProductPurchaseForm({ product, onVariantChange, selectedVariant: externalSelectedVariant }: ProductPurchaseFormProps) {
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.hex || '#000000');
  const [internalSelectedVariant, setInternalSelectedVariant] = useState(product.variants[0]);
  const selectedVariant = externalSelectedVariant || internalSelectedVariant;
  const [quantity, setQuantity] = useState(1);
  
  const price = parseFloat(product.price.replace('€', ''));

  // Sync selectedColor when external variant changes
  useEffect(() => {
    if (externalSelectedVariant) {
      setSelectedColor(externalSelectedVariant.hex);
    }
  }, [externalSelectedVariant]);

  const handleColorSelect = (variant: typeof product.variants[0]) => {
    if (!externalSelectedVariant) {
      setInternalSelectedVariant(variant);
    }
    setSelectedColor(variant.hex);
    onVariantChange?.(variant);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold font-headline">{product.name}</h1>
      
      <div className="flex items-center gap-4">
        <p className="text-3xl font-bold text-primary">{product.price}</p>
        <Badge variant="secondary" className="text-sm">{product.cashback}</Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn("h-5 w-5", i < 4 ? "text-yellow-400 fill-current" : "text-gray-300")} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground hover:underline cursor-pointer">(12 customer reviews)</p>
      </div>

      <div>
          <h3 className="text-md font-semibold mb-3">Color: <span className="font-normal text-muted-foreground">{selectedVariant?.name || 'Default'}</span></h3>
          <div className="flex items-center gap-2 flex-wrap">
              {product.variants.map((variant) => (
                  <button
                      key={variant.hex}
                      onClick={() => handleColorSelect(variant)}
                      className={cn("h-8 w-8 rounded-full border-2 transition-all", selectedColor === variant.hex ? 'border-primary ring-2 ring-offset-2 ring-primary' : 'border-border')}
                      style={{ backgroundColor: variant.hex }}
                      title={variant.name}
                  />
              ))}
          </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="grid grid-cols-2 gap-4">
          {lensFeatures.map(feature => (
            <div key={feature.text} className="flex items-center gap-3">
              <feature.icon className="h-6 w-6 text-primary" />
              <span className="text-sm text-foreground/80 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
          <h3 className="text-md font-semibold">Quantity:</h3>
          <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))} className="h-10 w-10">
                  <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-bold">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q+1)} className="h-10 w-10">
                  <Plus className="h-4 w-4" />
              </Button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Button size="lg" className="h-14 text-lg w-full">Add to Cart</Button>
        <Button size="lg" variant="outline" className="h-14 text-lg border-2 w-full">
          <Heart className="mr-2 h-5 w-5" />
          Add to Wishlist
        </Button>
      </div>
    </div>
  );
}

