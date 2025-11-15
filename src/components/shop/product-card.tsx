"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

type ProductCardProps = {
  product: Product;
  onColorClick?: (variant: ProductColorVariant) => void;
  priority?: boolean; // For above-the-fold images
};

function ProductCard({ product, onColorClick, priority = false }: ProductCardProps) {
  const [hoveredVariant, setHoveredVariant] = useState<ProductColorVariant | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // Use the hovered variant's image if hovering over a color, otherwise use selected variant
  const displayVariant = hoveredVariant || selectedVariant;
  const mainImage = displayVariant?.thumbnail || displayVariant?.images[0] || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedVariant, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };
  
  return (
    <Link href={`/products/${product.id}`} prefetch={true} className="block">
      <Card className="overflow-hidden group relative border-none bg-card/50 h-full">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 bg-background/50 rounded-full h-8 w-8 hover:bg-background">
              <Heart className="h-4 w-4" />
          </Button>
        <CardContent className="p-0 flex flex-col h-full">
          <div 
            className="aspect-square relative bg-muted overflow-hidden"
            onMouseEnter={() => {
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              setIsHovered(false);
            }}
          >
            {mainImage && (
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  key={displayVariant?.hex || 'default'} // Force re-render when variant changes
                  src={mainImage}
                  alt={`${product.name} - ${displayVariant?.name || ''}`}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  className={cn(
                    "object-cover p-4 transition-all duration-500 ease-out",
                    isHovered || hoveredVariant ? "scale-150" : "scale-100"
                  )}
                  style={{
                    objectPosition: (isHovered || hoveredVariant) ? 'right center' : 'center center'
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>
          <div className="p-4 text-center flex flex-col flex-grow">
            <h3 className="text-md font-semibold mb-2">{product.name}</h3>
            <p className="text-md font-bold text-foreground mb-4">
              {product.price}
            </p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              {product.variants.map((variant) => (
                <button
                  key={variant.hex}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(variant);
                    setHoveredVariant(null); // Reset hover on click
                    onColorClick?.(variant);
                  }}
                  onMouseEnter={() => {
                    setHoveredVariant(variant); // Change image to this variant
                    setIsHovered(true); // Also trigger zoom effect
                  }}
                  onMouseLeave={() => {
                    setHoveredVariant(null); // Revert to selected variant
                    setIsHovered(false); // Remove zoom effect
                  }}
                  className={cn(
                    "block h-5 w-5 rounded-full border-2 transition-all cursor-pointer",
                    selectedVariant?.hex === variant.hex 
                      ? "border-primary ring-2 ring-offset-1 ring-primary scale-110" 
                      : "border-border hover:scale-110"
                  )}
                  style={{ backgroundColor: variant.hex }}
                  title={variant.name}
                ></button>
              ))}
            </div>
            <div className="flex gap-2 mt-auto">
              <Button 
                onClick={handleAddToCart}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" className="flex-1">
                Try-On
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ProductCard);
