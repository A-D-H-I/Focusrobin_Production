"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/productData";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  showCashback?: boolean;
}

export default function ProductCard({ product, showCashback = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const firstVariant = product.variants[0];
  const mainImage = firstVariant?.images[0] || "/images/placeholder.jpg";
  const hoverImage = firstVariant?.images[1] || mainImage;
  const hasSecondImage = firstVariant?.images[1] !== undefined;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative">
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

        {/* Product Image with Hover Effect */}
        <div className="aspect-[4/3] relative bg-muted overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                isHovered && hasSecondImage ? "opacity-0" : "opacity-100"
              )}
              priority
            />
            {hasSecondImage && (
              <Image
                src={hoverImage}
                alt={`${product.name} - alternate view`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300 absolute inset-0",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
              />
            )}
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
              {product.price}
            </p>
          </div>

          {/* Cashback (optional, for related products) */}
          {showCashback && (
            <p className="font-body text-primary font-medium text-sm mb-2">
              {product.cashback}
            </p>
          )}

          {/* Color Swatches */}
          <div className="flex items-center space-x-1.5 pt-1">
            {product.variants.map((variant) => (
              <span
                key={variant.hex}
                className="block h-4 w-4 rounded-full border border-border/50 hover:scale-110 transition-transform"
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

