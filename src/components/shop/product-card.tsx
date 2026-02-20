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
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import TranslatableText from "@/components/ui/TranslatableText";

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
              "h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5",
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
        <span className="text-sm sm:text-base text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

function ProductCard({ product, onColorClick, priority = false, viewMode = "grid" }: ProductCardProps) {
  const router = useRouter();

  // Guard clause: If product has no variants, don't render the card (prevent crash)
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  const [hoveredVariant, setHoveredVariant] = useState<ProductColorVariant | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
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
  const mainImage = displayVariant?.thumbnail || displayVariant?.images[0] || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check stock before adding to cart
    if (selectedVariant.stock !== undefined && selectedVariant.stock !== null) {
      if (selectedVariant.stock === 0) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock.",
          variant: "destructive",
        });
        return;
      }
    }

    addToCart(product, selectedVariant, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };

  // Check if selected variant is out of stock
  const isOutOfStock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null && selectedVariant.stock === 0;

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
    // Check if selected variant has try-on image
    const variantWithTryOn = product.variants.find(v => v.tryOn) || selectedVariant;
    const variantIndex = product.variants.findIndex(v => v.hex === variantWithTryOn.hex);
    // Navigate to try-on page with product and variant info (using slug)
    router.push(`/try-on?product=${encodeURIComponent(product.slug || '')}&variant=${variantIndex}`);
  };

  // Extract brand name from product name or categories
  const brandName = product.categories?.[0] || "Focus Robin";

  // Ensure we always use a URL-safe slug
  const productSlug = product.slug || product.id;
  const safeSlug = productSlug ? encodeURIComponent(productSlug) : '';

  if (viewMode === "list") {
    return (
      <Link
        href={`/shop/${safeSlug}`}
        prefetch={true}
        className="block"
      >
        <Card className="overflow-hidden group relative border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
          <CardContent className="p-0 flex flex-row h-full">
            {/* Image Section */}
            <div
              className="relative w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 flex-shrink-0 bg-muted/30 overflow-hidden"
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
            <div className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col justify-between">
              <div>
                <p className="text-sm sm:text-base md:text-lg font-medium text-teal-primary uppercase tracking-wide mb-1">
                  {brandName}
                </p>
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-headline text-foreground mb-1 sm:mb-2 line-clamp-1 break-words overflow-hidden text-ellipsis">
                  {product.name}
                </h3>

                {product.averageRating && (
                  <StarRating rating={product.averageRating} count={product.reviewCount} />
                )}

                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    {formatPrice(priceInEur)}
                  </p>
                  {originalPriceInEur && originalPriceInEur !== priceInEur && (
                    <>
                      <p className="text-base sm:text-lg md:text-xl text-muted-foreground line-through">
                        {formatPrice(originalPriceInEur)}
                      </p>
                      {discountPct && (
                        <span className="text-sm sm:text-base font-semibold text-rose-500">
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
                          : "border-border hover:scale-110",
                        variant.textureImageUrl && "bg-cover bg-center"
                      )}
                      style={{
                        backgroundColor: variant.hex,
                        backgroundImage: variant.textureImageUrl ? `url(${variant.textureImageUrl})` : undefined
                      }}
                      title={variant.name}
                    />
                  ))}
                </div>

                {/* Cashback Badge */}
                {cashbackInEur !== null && cashbackInEur > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-sm sm:text-base md:text-lg bg-green-50 text-green-700 border-green-200">
                      🎁 {formatPrice(cashbackInEur)} cashback
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2 mt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white border-0 text-sm sm:text-base md:text-lg px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 h-auto min-h-[36px] sm:min-h-[40px] md:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 mr-1.5 sm:mr-2 md:mr-2.5 flex-shrink-0" />
                  <span className="whitespace-normal break-words">
                    {isOutOfStock ? <TranslatableText text="Out of Stock" /> : <TranslatableText text="Add to Cart" />}
                  </span>
                </Button>
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTryOnClick}
                    className="flex-1 border-teal-primary text-teal-primary hover:bg-teal-primary/10 text-sm sm:text-base md:text-lg px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 h-auto min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
                  >
                    <Glasses className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 mr-1.5 sm:mr-2 md:mr-2.5 flex-shrink-0" />
                    <span className="whitespace-normal break-words"><TranslatableText text="Try-On" /></span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleWishlistToggle}
                    className="border-border/50 h-[32px] w-[32px] sm:h-[36px] sm:w-[36px] md:h-10 md:w-10 flex-shrink-0 p-0"
                  >
                    <Heart className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4", isWishlisted && "fill-red-500 text-red-500")} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={`/shop/${safeSlug}`}
      prefetch={true}
      className="block h-full"
    >
      <Card className="overflow-hidden group relative border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 h-full rounded-xl">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Container */}
          <div
            className="aspect-[4/3] relative bg-muted/30 overflow-hidden rounded-t-xl"
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
                {/* Normal Image - Always Visible */}
                <Image
                  src={mainImage}
                  alt={`${product.name} - ${displayVariant?.name || ''}`}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  className={cn(
                    "object-cover transition-opacity duration-300 ease-in-out",
                    // If we have a tilted image to show, we might want to fade this out, 
                    // or just let the tilted one cover only if opaque.
                    // For simple "change", just keeping it is fine as tilted covers it.
                    // But if tilted has transparency, we might need opacity switch.
                    // Assuming no transparency for now, or standard crossfade behavior.
                  )}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />

                {/* Tilted Hover Image - Pre-rendered but hidden */}
                {!hoveredVariant && selectedVariant?.tilted && (
                  <Image
                    src={selectedVariant.tilted}
                    alt={`${product.name} - Tilted View`}
                    fill
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                  />
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-1.5 sm:p-2 md:p-3 flex flex-col flex-grow">
            {/* Brand Name */}
            <p className="text-xs sm:text-sm md:text-base font-semibold text-teal-primary uppercase tracking-wider mb-0.5">
              {brandName}
            </p>

            {/* Product Name */}
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-headline text-foreground mb-1 line-clamp-1 break-words overflow-hidden text-ellipsis leading-tight">
              {product.name}
            </h3>

            {/* Star Rating */}
            {product.averageRating && (
              <div className="mb-1">
                <StarRating rating={product.averageRating} count={product.reviewCount} />
              </div>
            )}

            {/* Price Section */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                {formatPrice(priceInEur)}
              </p>
              {originalPriceInEur && originalPriceInEur !== priceInEur && (
                <>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground line-through">
                    {formatPrice(originalPriceInEur)}
                  </p>
                  {discountPct && (
                    <span className="text-sm sm:text-base font-semibold text-rose-500">
                      -{discountPct}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 mb-1.5">
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
                    "h-4 w-4 rounded-full border-2 transition-all cursor-pointer",
                    selectedVariant?.hex === variant.hex
                      ? "border-teal-primary ring-1 ring-offset-1 ring-teal-primary/50 scale-110"
                      : "border-border hover:scale-110",
                    variant.textureImageUrl && "bg-cover bg-center"
                  )}
                  style={{
                    backgroundColor: variant.hex,
                    backgroundImage: variant.textureImageUrl ? `url(${variant.textureImageUrl})` : undefined
                  }}
                  title={variant.name}
                />
              ))}
            </div>

            {/* Cashback Badge */}
            <div className="mb-1.5 flex flex-wrap gap-2">
              {cashbackInEur !== null && cashbackInEur > 0 && (
                <Badge variant="outline" className="text-xs sm:text-sm md:text-base bg-green-50 text-green-700 border-green-200 py-0.5 px-1.5 h-6">
                  🎁 {formatPrice(cashbackInEur)} cashback
                </Badge>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-1 mt-auto">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full bg-teal-primary hover:bg-teal-primary/90 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base md:text-lg px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 h-auto min-h-[32px] sm:min-h-[36px] md:min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-normal break-words">
                  {isOutOfStock ? <TranslatableText text="Out of Stock" /> : <TranslatableText text="Add to Cart" />}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={handleTryOnClick}
                className="w-full border-teal-primary text-teal-primary hover:bg-teal-primary/10 font-semibold text-sm sm:text-base md:text-lg px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 h-auto min-h-[32px] sm:min-h-[36px] md:min-h-[40px]"
              >
                <Glasses className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-normal break-words">
                  <span className="hidden sm:inline"><TranslatableText text="Virtual " /></span>
                  <TranslatableText text="Try-On" />
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default memo(ProductCard);
