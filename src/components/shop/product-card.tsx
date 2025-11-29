"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";

type ProductCardProps = {
  product: Product;
  onColorClick?: (variant: ProductColorVariant) => void;
  priority?: boolean; // For above-the-fold images
};

function ProductCard({ product, onColorClick, priority = false }: ProductCardProps) {
  const [hoveredVariant, setHoveredVariant] = useState<ProductColorVariant | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  const isWishlisted = isInWishlist(product.id, selectedVariant.hex);
  
  // Determine which image to display
  // If hovering a color: show that color's thumbnail
  // If hovering the image (not a color): show the selected variant's tilted image if available
  // Otherwise: show the selected variant's thumbnail
  const displayVariant = hoveredVariant || selectedVariant;
  let mainImage = '';
  if (hoveredVariant) {
    // When hovering a color, show its thumbnail (not tilted)
    mainImage = hoveredVariant.thumbnail || hoveredVariant.images[0] || '';
  } else if (isImageHovered && selectedVariant?.tilted) {
    // When hovering the image (and not hovering a color), show the tilted/hover image
    mainImage = selectedVariant.tilted;
  } else {
    // Default: show the selected variant's thumbnail
    mainImage = selectedVariant?.thumbnail || selectedVariant?.images[0] || '';
  }

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
    <Link 
      href={`/products/${encodeURIComponent(product.id)}?viewed=${encodeURIComponent(product.id)}`} 
      prefetch={true} 
      className="block"
    >
      <Card className="overflow-hidden group relative border-none bg-card/50 h-full">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-10 bg-background/50 rounded-full h-8 w-8 hover:bg-background"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isWishlisted) {
              removeFromWishlist(product.id, selectedVariant.hex);
              toast({
                title: "Removed from wishlist",
                description: `${product.name} has been removed from your wishlist.`,
              });
            } else {
              addToWishlist(product, selectedVariant);
              toast({
                title: "Added to wishlist",
                description: `${product.name} has been added to your wishlist.`,
              });
            }
          }}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
        </Button>
        <CardContent className="p-0 flex flex-col h-full">
          <div 
            className="aspect-square relative bg-muted overflow-hidden group/image"
            onMouseEnter={() => {
              if (!hoveredVariant) {
                setIsImageHovered(true);
              }
            }}
            onMouseLeave={() => {
              setIsImageHovered(false);
            }}
          >
            {mainImage && (
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  key={`${displayVariant?.hex || 'default'}-${isImageHovered && !hoveredVariant && selectedVariant?.tilted ? 'tilted' : 'normal'}`} // Force re-render when image changes
                  src={mainImage}
                  alt={`${product.name} - ${displayVariant?.name || ''}`}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  className="object-contain p-4 transition-all duration-500 ease-in-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>
          <div className="p-4 text-center flex flex-col flex-grow">
            <h3 className="text-md font-semibold mb-2">{product.name}</h3>
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <p className="text-md font-bold text-foreground">
                {product.price}
              </p>
              {product.originalPrice && product.originalPrice !== product.price && (
                <>
                  <p className="text-sm text-muted-foreground line-through">
                    {product.originalPrice}
                  </p>
                  {product.discountPct && (
                    <span className="text-xs font-semibold text-destructive">
                      -{product.discountPct}%
                    </span>
                  )}
                </>
              )}
            </div>
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
                    setHoveredVariant(variant); // Change image to this variant only
                  }}
                  onMouseLeave={() => {
                    setHoveredVariant(null); // Revert to selected variant
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
            {product.cashback && (
              <div className="mb-4 flex justify-center">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  🎁 {product.cashback} cashback
                </Badge>
              </div>
            )}
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
