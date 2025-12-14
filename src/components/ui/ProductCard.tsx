"use client";

import { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/productData";
import { cn } from "@/lib/utils";
import { usePrice } from "@/hooks/usePrice";

interface ProductCardProps {
  product: Product;
  showCashback?: boolean;
  priority?: boolean; // For above-the-fold images
}

function ProductCard({ product, showCashback = false, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [hoveredVariant, setHoveredVariant] = useState<typeof product.variants[0] | null>(null);
  const { formatPrice, parseEurPrice } = usePrice();
  
  // Parse EUR prices from product
  const priceInEur = parseEurPrice(product.price);
  const cashbackInEur = product.cashback ? parseEurPrice(product.cashback) : null;
  
  // Use the hovered variant's image if hovering over a color, otherwise use selected variant
  const displayVariant = hoveredVariant || selectedVariant;
  const mainImage = displayVariant?.thumbnail || displayVariant?.images[0] || "/images/placeholder.jpg";

  return (
    <Link
      href={`/products/${product.id}`}
      prefetch={true}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-transparent rounded-lg shadow-none hover:shadow-md transition-all duration-300 overflow-hidden relative">
        {/* Best Seller Tag - Grey Oval */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-muted text-foreground text-xs font-medium px-3 py-1 rounded-full">
            BEST SELLER
          </span>
        </div>

        {/* Wishlist Icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors stroke-2",
              isWishlisted
                ? "fill-primary text-primary"
                : "text-foreground hover:text-primary"
            )}
          />
        </button>

        {/* Product Image with Hover Effect - Zoom and show right side */}
        <div 
          className="aspect-square relative bg-background overflow-hidden rounded-t-lg"
          onMouseEnter={() => {
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
        >
          <div className="relative w-full h-full overflow-hidden">
            <Image
              key={displayVariant?.hex || 'default'} // Force re-render when variant changes
              src={mainImage}
              alt={`${product.name} - ${displayVariant?.name || ''}`}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className={cn(
                "object-cover transition-all duration-500 ease-out",
                isHovered || hoveredVariant ? "scale-150" : "scale-100"
              )}
              style={{
                objectPosition: (isHovered || hoveredVariant) ? 'right center' : 'center center'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Name and Price on same line */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-body text-foreground font-bold text-base flex-1">
              {product.name}
            </h3>
            <p className="font-body text-foreground font-bold text-base ml-2">
              {formatPrice(priceInEur)}
            </p>
          </div>

          {/* Cashback (optional, for related products) */}
          {showCashback && cashbackInEur && cashbackInEur > 0 && (
            <p className="font-body text-primary font-medium text-sm mb-2">
              {formatPrice(cashbackInEur)} cashback
            </p>
          )}

          {/* Color Swatches - Clickable */}
          <div className="flex items-center space-x-1.5 pt-1">
            {product.variants.map((variant) => (
              <button
                key={variant.hex}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVariant(variant);
                  setHoveredVariant(null); // Reset hover on click
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
                  "block h-4 w-4 rounded-full border transition-all cursor-pointer",
                  selectedVariant?.hex === variant.hex
                    ? "border-primary ring-1 ring-primary scale-125"
                    : "border-border/50 hover:scale-110"
                )}
                style={{ backgroundColor: variant.hex }}
                title={variant.name}
                aria-label={`Color: ${variant.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ProductCard);

