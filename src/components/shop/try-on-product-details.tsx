"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Sun, Shield, Droplet, Star, Heart, ShoppingCart, CheckCircle2, Eye, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import Link from "next/link";
import TranslatableText from "@/components/ui/TranslatableText";

interface TryOnProductDetailsProps {
  product: Product;
  selectedVariant: ProductColorVariant;
  onVariantChange: (variant: ProductColorVariant) => void;
  className?: string;
}



export default function TryOnProductDetails({
  product,
  selectedVariant,
  onVariantChange,
  className,
}: TryOnProductDetailsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();

  const priceInEur = parseEurPrice(product.price);
  const originalPriceInEur = product.originalPrice ? parseEurPrice(product.originalPrice) : null;
  const cashbackInEur = product.cashback ? parseEurPrice(product.cashback) : null;

  const isWishlisted = isInWishlist(product.id, selectedVariant.hex);

  // Dynamic features based on product properties
  const dynamicFeatures = [
    ...(product.isUVProtection ? [{ icon: Sun, text: "100% UV Protection" }] : []),
    ...(product.isPolarized ? [{ icon: Eye, text: "Polarized lenses" }] : []),
    ...(product.isAntiScratch ? [{ icon: Shield, text: "Antiscratch coating" }] : []),
    ...(product.isHydrophobic ? [{ icon: Droplet, text: "Superhydrophobic" }] : []),
    ...(product.isBioBased ? [{ icon: Leaf, text: "Bio-based Material" }] : []),
    ...(product.customFeatures?.map(feature => ({ icon: Star, text: feature })) || []),
  ];

  // Update quantity when variant changes
  useEffect(() => {
    if (selectedVariant?.stock !== undefined) {
      if (selectedVariant.stock === 0) {
        setQuantity(0);
      } else if (quantity > selectedVariant.stock) {
        setQuantity(selectedVariant.stock);
      } else if (quantity === 0 && selectedVariant.stock > 0) {
        setQuantity(1);
      }
    }
  }, [selectedVariant, quantity]);

  const handleColorSelect = (variant: ProductColorVariant) => {
    onVariantChange(variant);
    if (variant.stock !== undefined && variant.stock > 0) {
      setQuantity(1);
    } else if (variant.stock === 0) {
      setQuantity(0);
    }
  };

  const handleAddToCart = () => {
    if (selectedVariant.stock !== undefined) {
      if (selectedVariant.stock === 0) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock.",
          variant: "destructive",
        });
        return;
      }
      if (quantity > selectedVariant.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${selectedVariant.stock} item${selectedVariant.stock !== 1 ? 's' : ''} available.`,
          variant: "destructive",
        });
        return;
      }
    }

    addToCart(product, selectedVariant, quantity);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };

  const handleWishlistToggle = () => {
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

  return (
    <div className={cn("space-y-3", className)}>
      {/* Product Name */}
      <div>
        <Link
          href={`/shop/${encodeURIComponent(product.slug || product.id)}`}
          className="text-xs text-teal-primary font-medium uppercase tracking-wide hover:underline"
        >
          View Details
        </Link>
        <h1 className="text-base xl:text-lg font-headline font-semibold leading-tight mt-1 line-clamp-2">
          {product.name}
        </h1>
      </div>

      {/* Price Section */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-lg font-bold text-primary">{formatPrice(priceInEur)}</p>
        {originalPriceInEur && originalPriceInEur !== priceInEur && (
          <>
            <p className="text-xs text-muted-foreground line-through">{formatPrice(originalPriceInEur)}</p>
            {product.discountPct && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
                -{product.discountPct}%
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Cashback */}
      {cashbackInEur !== null && cashbackInEur > 0 && (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-2 py-0.5 h-5">
          🎁 {formatPrice(cashbackInEur)}
        </Badge>
      )}

      {/* Rating */}
      {product.averageRating && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(product.averageRating || 4)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount || 0})
          </span>
        </div>
      )}

      {/* Color Selector */}
      <div>
        <h3 className="text-sm font-semibold mb-2">
          Color: <span className="font-normal text-muted-foreground">{selectedVariant.name}</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap p-1">
          {product.variants.map((variant, idx) => (
            <button
              key={`color-${idx}-${variant.name}`}
              onClick={() => handleColorSelect(variant)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-all",
                selectedVariant.hex === variant.hex
                  ? "border-primary ring-2 ring-offset-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
              style={{ backgroundColor: variant.hex }}
              title={variant.name}
            />
          ))}
        </div>
      </div>

      {/* Lens Features */}
      <div className="rounded border bg-muted/50 p-2">
        <div className="grid grid-cols-1 gap-1">
          {dynamicFeatures.map((feature) => (
            <div key={feature.text} className="flex items-center gap-2">
              <feature.icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs text-foreground/80 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty */}
      <div className="rounded border bg-muted/50 p-2">
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{product.warranty || "2 Years Warranty"}</span>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Qty:</span>
        <div className="flex items-center border rounded">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-7 w-7 p-0"
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-bold text-sm">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const maxQuantity = selectedVariant?.stock !== undefined ? selectedVariant.stock : 999;
              setQuantity((q) => Math.min(maxQuantity, q + 1));
            }}
            className="h-7 w-7 p-0"
            disabled={selectedVariant?.stock !== undefined && quantity >= selectedVariant.stock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {/* Stock indicator */}
        {selectedVariant?.stock !== undefined && selectedVariant.stock < 10 && (
          <span
            className={cn(
              "text-xs font-medium",
              selectedVariant.stock === 0
                ? "text-destructive"
                : selectedVariant.stock <= 3
                  ? "text-orange-600"
                  : "text-amber-600"
            )}
          >
            {selectedVariant.stock === 0 ? "Out" : `${selectedVariant.stock} left`}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleAddToCart}
          className="w-full h-10 font-semibold text-sm"
          disabled={selectedVariant?.stock === 0}
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" />
          {selectedVariant?.stock === 0 ? <TranslatableText text="Out of Stock" /> : <TranslatableText text="Add to Cart" />}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/shop/${product.id}/prescription?product=${encodeURIComponent(product.id)}`);
            }}
            className="flex-1 h-9 text-xs px-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <TranslatableText text="Prescription" />
          </Button>

          <Button
            variant="outline"
            onClick={handleWishlistToggle}
            className={cn("h-9 w-9 p-0", isWishlisted && "border-primary")}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isWishlisted && "fill-red-500 text-red-500"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Shipping Note */}
      <p className="text-xs text-muted-foreground leading-tight">
        <TranslatableText text="Fast EU delivery" />
      </p>
    </div>
  );
}

