"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Star, Glasses } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import VirtualTryOn from "@/components/shop/virtual-tryon";

type ProductCardProps = {
  product: Product;
  onColorClick?: (variant: ProductColorVariant) => void;
  priority?: boolean;
  viewMode?: "grid" | "list";
};

// Badge types with their styles
const badgeStyles: Record<string, { bg: string; text: string }> = {
  bestseller: { bg: "bg-orange-500", text: "Best Seller" },
  new: { bg: "bg-teal-primary", text: "New" },
  toprated: { bg: "bg-teal-primary", text: "Top Rated" },
  limited: { bg: "bg-gradient-to-r from-gray-600 to-gray-800", text: "Limited Edition" },
};

// Determine badge type based on product properties
function getBadgeType(product: Product): string | null {
  if (product.averageRating && product.averageRating >= 4.5) return "toprated";
  if (product.reviewCount && product.reviewCount > 200) return "bestseller";
  // Check if product was created in last 30 days (simplified check)
  return null;
}

// Star rating component
function StarRating({ rating, count }: { rating: number; count?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < fullStars
                ? "fill-amber-400 text-amber-400"
                : i === fullStars && hasHalfStar
                ? "fill-amber-400/50 text-amber-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

function ProductCard({ product, onColorClick, priority = false, viewMode = "grid" }: ProductCardProps) {
  const [hoveredVariant, setHoveredVariant] = useState<ProductColorVariant | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();
  
  const priceInEur = parseEurPrice(product.price);
  const originalPriceInEur = product.originalPrice ? parseEurPrice(product.originalPrice) : null;
  const cashbackInEur = product.cashback ? parseEurPrice(product.cashback) : null;
  
  const isWishlisted = isInWishlist(product.id, selectedVariant.hex);
  const badgeType = getBadgeType(product);
  
  // Calculate discount percentage
  const discountPct = originalPriceInEur && priceInEur < originalPriceInEur
    ? Math.round(((originalPriceInEur - priceInEur) / originalPriceInEur) * 100)
    : product.discountPct;
  
  // Determine which image to display
  const displayVariant = hoveredVariant || selectedVariant;
  let mainImage = '';
  if (hoveredVariant) {
    mainImage = hoveredVariant.thumbnail || hoveredVariant.images[0] || '';
  } else if (isImageHovered && selectedVariant?.tilted) {
    mainImage = selectedVariant.tilted;
  } else {
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
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
  };

  const handleTryOnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTryOnOpen(true);
  };

  // Extract brand name from product name or categories
  const brandName = product.categories?.[0] || "Focus Robin";
  
  if (viewMode === "list") {
    return (
      <Link 
        href={`/products/${encodeURIComponent(product.slug || product.id)}`} 
        prefetch={true} 
        className="block"
      >
        <Card className="overflow-hidden group relative border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
          <CardContent className="p-0 flex flex-row h-full">
            {/* Image Section */}
            <div 
              className="relative w-48 h-48 flex-shrink-0 bg-muted/30 overflow-hidden"
              onMouseEnter={() => !hoveredVariant && setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
            >
              {badgeType && (
                <span className={cn(
                  "absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-semibold text-white",
                  badgeStyles[badgeType].bg
                )}>
                  {badgeStyles[badgeType].text}
                </span>
              )}
              
              {mainImage && (
                <Image
                  src={mainImage}
                  alt={`${product.name} - ${displayVariant?.name || ''}`}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  className="object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
                  sizes="200px"
                />
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-teal-primary uppercase tracking-wide mb-1">
                  {brandName}
                </p>
                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                  {product.name}
                </h3>
                
                {product.averageRating && (
                  <StarRating rating={product.averageRating} count={product.reviewCount} />
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-lg font-bold text-foreground">
                    {formatPrice(priceInEur)}
                  </p>
                  {originalPriceInEur && originalPriceInEur !== priceInEur && (
                    <>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(originalPriceInEur)}
                      </p>
                      {discountPct && (
                        <span className="text-xs font-semibold text-rose-500">
                          -{discountPct}%
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 mt-3">
                  {product.variants.slice(0, 4).map((variant) => (
                    <button
                      key={variant.hex}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariant(variant);
                        setHoveredVariant(null);
                        onColorClick?.(variant);
                      }}
                      onMouseEnter={() => setHoveredVariant(variant)}
                      onMouseLeave={() => setHoveredVariant(null)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-all cursor-pointer",
                        selectedVariant?.hex === variant.hex 
                          ? "border-teal-primary ring-2 ring-offset-1 ring-teal-primary/50 scale-110" 
                          : "border-border hover:scale-110"
                      )}
                      style={{ backgroundColor: variant.hex }}
                      title={variant.name}
                    />
                  ))}
                </div>

                {/* Cashback Badge */}
                {cashbackInEur && cashbackInEur > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      🎁 {formatPrice(cashbackInEur)} cashback
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={handleAddToCart}
                  className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white border-0"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTryOnClick}
                    className="flex-1 border-teal-primary text-teal-primary hover:bg-teal-primary/10"
                  >
                    <Glasses className="h-4 w-4 mr-2" />
                    Try-On
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleWishlistToggle}
                    className="border-border/50"
                  >
                    <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Virtual Try-On Modal */}
        <VirtualTryOn
          product={product}
          variants={product.variants}
          selectedVariantIndex={product.variants.findIndex(v => v.hex === selectedVariant?.hex) || 0}
          productName={product.name}
          isOpen={isTryOnOpen}
          onClose={() => setIsTryOnOpen(false)}
        />
      </Link>
    );
  }
  
  return (
    <Link 
      href={`/products/${encodeURIComponent(product.slug || product.id)}`} 
      prefetch={true} 
      className="block h-full"
    >
      <Card className="overflow-hidden group relative border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 h-full rounded-xl">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Container */}
          <div 
            className="aspect-square relative bg-muted/30 overflow-hidden rounded-t-xl"
            onMouseEnter={() => !hoveredVariant && setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            {/* Badge */}
            {badgeType && (
              <span className={cn(
                "absolute top-3 left-3 z-10 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-md",
                badgeStyles[badgeType].bg
              )}>
                ✨ {badgeStyles[badgeType].text}
              </span>
            )}
            
            {/* Wishlist Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full h-9 w-9 hover:bg-white shadow-sm border border-border/30"
              onClick={handleWishlistToggle}
            >
              <Heart className={cn("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600")} />
            </Button>
            
            {mainImage && (
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  key={`${displayVariant?.hex || 'default'}-${isImageHovered && !hoveredVariant && selectedVariant?.tilted ? 'tilted' : 'normal'}`}
                  src={mainImage}
                  alt={`${product.name} - ${displayVariant?.name || ''}`}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  className="object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Brand Name */}
            <p className="text-xs font-semibold text-teal-primary uppercase tracking-wider mb-1">
              {brandName}
            </p>
            
            {/* Product Name */}
            <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-1">
              {product.name}
            </h3>
            
            {/* Star Rating */}
            {product.averageRating && (
              <div className="mb-2">
                <StarRating rating={product.averageRating} count={product.reviewCount} />
              </div>
            )}
            
            {/* Price Section */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-lg font-bold text-foreground">
                {formatPrice(priceInEur)}
              </p>
              {originalPriceInEur && originalPriceInEur !== priceInEur && (
                <>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(originalPriceInEur)}
                  </p>
                  {discountPct && (
                    <span className="text-xs font-semibold text-rose-500">
                      -{discountPct}%
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Color Swatches */}
            <div className="flex items-center gap-2 mb-3">
              {product.variants.slice(0, 5).map((variant) => (
                <button
                  key={variant.hex}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(variant);
                    setHoveredVariant(null);
                    onColorClick?.(variant);
                  }}
                  onMouseEnter={() => setHoveredVariant(variant)}
                  onMouseLeave={() => setHoveredVariant(null)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-all cursor-pointer",
                    selectedVariant?.hex === variant.hex 
                      ? "border-teal-primary ring-2 ring-offset-1 ring-teal-primary/50 scale-110" 
                      : "border-border hover:scale-110"
                  )}
                  style={{ backgroundColor: variant.hex }}
                  title={variant.name}
                />
              ))}
            </div>

            {/* Cashback Badge */}
            {cashbackInEur && cashbackInEur > 0 && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  🎁 {formatPrice(cashbackInEur)} cashback
                </Badge>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                variant="outline"
                onClick={handleTryOnClick}
                className="w-full border-teal-primary text-teal-primary hover:bg-teal-primary/10 font-semibold"
              >
                <Glasses className="h-4 w-4 mr-2" />
                Virtual Try-On
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Try-On Modal */}
      <VirtualTryOn
        product={product}
        variants={product.variants}
        selectedVariantIndex={product.variants.findIndex(v => v.hex === selectedVariant?.hex) || 0}
        productName={product.name}
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
      />
    </Link>
  );
}

export default memo(ProductCard);
