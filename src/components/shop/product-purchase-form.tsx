
"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Sun, ParkingCircle, Shield, Droplet, Star, Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";

type ProductPurchaseFormProps = {
  product: Product;
  onVariantChange?: (variant: ProductColorVariant) => void;
  selectedVariant?: ProductColorVariant;
};

const lensFeatures = [
  { icon: Sun, text: "100% UV Protection" },
  { icon: ParkingCircle, text: "Polarized lenses" },
  { icon: Shield, text: "Antiscratch coating" },
  { icon: Droplet, text: "Superhydrophobic" },
];

export default function ProductPurchaseForm({ product, onVariantChange, selectedVariant: externalSelectedVariant }: ProductPurchaseFormProps) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.hex || '#000000');
  const [internalSelectedVariant, setInternalSelectedVariant] = useState(product.variants[0]);
  const selectedVariant = externalSelectedVariant || internalSelectedVariant;
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Check wishlist status when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setIsWishlisted(isInWishlist(product.id, selectedVariant.hex));
    }
  }, [product.id, selectedVariant, isInWishlist]);
  
  // Parse EUR prices from product
  const priceInEur = parseEurPrice(product.price);
  const originalPriceInEur = product.originalPrice ? parseEurPrice(product.originalPrice) : null;
  const cashbackInEur = product.cashback ? parseEurPrice(product.cashback) : null;

  // Sync selectedColor when external variant changes
  useEffect(() => {
    if (externalSelectedVariant) {
      setSelectedColor(externalSelectedVariant.hex);
    }
  }, [externalSelectedVariant]);

  // Update quantity when variant changes to ensure it doesn't exceed stock
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
  }, [selectedVariant]);

  const handleColorSelect = (variant: ProductColorVariant) => {
    if (!externalSelectedVariant) {
      setInternalSelectedVariant(variant);
    }
    setSelectedColor(variant.hex);
    onVariantChange?.(variant);
    // Reset quantity to 1 or max available stock when variant changes
    if (variant.stock !== undefined && variant.stock > 0) {
      setQuantity(1);
    } else if (variant.stock === 0) {
      setQuantity(0);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-brand-h1 font-headline leading-tight sm:leading-normal break-words overflow-hidden">{product.name}</h1>
      
      {/* Virtual Try-On Button - Visible at top on all devices */}
      <Button 
        size="lg" 
        variant="outline" 
        className="h-9 sm:h-10 md:h-12 lg:h-14 text-[11px] sm:text-sm md:text-base lg:text-lg border-2 w-full border-primary px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3"
        onClick={() => {
          if (!selectedVariant) {
            toast({
              title: "Error",
              description: "Please select a color variant.",
              variant: "destructive",
            });
            return;
          }
          // Check if selected variant has try-on image, otherwise find one that does
          const variantWithTryOn = product.variants.find(v => v.tryOn) || selectedVariant;
          const variantIndex = product.variants.findIndex(v => v.hex === variantWithTryOn.hex);
          // Navigate to try-on page with product and variant info
          router.push(`/try-on?product=${encodeURIComponent(product.id)}&variant=${variantIndex}`);
        }}
      >
        <Camera className="mr-1 sm:mr-1.5 md:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
        <span className="whitespace-nowrap truncate">
          <span className="hidden sm:inline">Virtual </span>Try-On
        </span>
      </Button>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold text-primary">{formatPrice(priceInEur)}</p>
          {originalPriceInEur && originalPriceInEur !== priceInEur && (
            <>
              <p className="text-xl text-muted-foreground line-through">{formatPrice(originalPriceInEur)}</p>
              {product.discountPct && (
                <Badge variant="destructive" className="text-sm">
                  -{product.discountPct}%
                </Badge>
              )}
            </>
          )}
        </div>
        {cashbackInEur && cashbackInEur > 0 && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
            🎁 {formatPrice(cashbackInEur)} cashback
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-5 w-5", 
                i < Math.round(product.averageRating || 4) 
                  ? "text-yellow-400 fill-current" 
                  : "text-gray-300"
              )} 
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground hover:underline cursor-pointer">
          ({product.reviewCount || 0} customer review{product.reviewCount !== 1 ? 's' : ''})
        </p>
      </div>

      <div>
          <h3 className="text-brand-h3 font-headline mb-3">Color: <span className="font-normal text-muted-foreground">{selectedVariant?.name || 'Default'}</span></h3>
          <div className="flex items-center gap-2 flex-wrap">
              {product.variants.map((variant, idx) => (
                  <button
                      key={`color-${idx}-${variant.name}`}
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

      <div className="space-y-3">
          <div className="flex items-center gap-4">
              <h3 className="text-brand-h3 font-headline">Quantity:</h3>
              <div className="flex items-center border rounded-md">
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setQuantity(q => Math.max(1, q-1))} 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 touch-manipulation p-0 min-w-[28px] sm:min-w-[32px] md:min-w-[40px]"
                      disabled={quantity <= 1}
                  >
                      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </Button>
                  <span className="w-8 sm:w-10 md:w-12 text-center font-bold text-xs sm:text-sm md:text-base">{quantity}</span>
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                          const maxQuantity = selectedVariant?.stock !== undefined ? selectedVariant.stock : 999;
                          setQuantity(q => Math.min(maxQuantity, q+1));
                      }} 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 touch-manipulation p-0 min-w-[28px] sm:min-w-[32px] md:min-w-[40px]"
                      disabled={selectedVariant?.stock !== undefined && quantity >= selectedVariant.stock}
                  >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </Button>
              </div>
          </div>
          {/* Show stock when below 10 */}
          {selectedVariant?.stock !== undefined && selectedVariant.stock < 10 && (
              <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                      "font-medium",
                      selectedVariant.stock === 0 
                          ? "text-destructive" 
                          : selectedVariant.stock <= 3 
                          ? "text-orange-600" 
                          : "text-amber-600"
                  )}>
                      {selectedVariant.stock === 0 
                          ? "Out of Stock" 
                          : `Only ${selectedVariant.stock} left in stock`}
                  </span>
              </div>
          )}
      </div>
      
      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4">
        <Button 
          size="lg" 
          className="h-9 sm:h-10 md:h-12 lg:h-14 text-[11px] sm:text-sm md:text-base lg:text-lg w-full px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 font-semibold"
          disabled={selectedVariant?.stock !== undefined && (selectedVariant.stock === 0 || quantity > selectedVariant.stock)}
          onClick={() => {
            if (!selectedVariant) {
              toast({
                title: "Error",
                description: "Please select a color variant.",
                variant: "destructive",
              });
              return;
            }
            
            // Check stock availability
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
          }}
        >
          <span className="whitespace-nowrap truncate">{selectedVariant?.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className={cn("h-9 sm:h-10 md:h-12 lg:h-14 text-[11px] sm:text-sm md:text-base lg:text-lg border-2 w-full px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3", isWishlisted && "border-primary")}
          onClick={() => {
            if (!selectedVariant) {
              toast({
                title: "Error",
                description: "Please select a color variant.",
                variant: "destructive",
              });
              return;
            }
            if (isWishlisted) {
              removeFromWishlist(product.id, selectedVariant.hex).then(() => {
                toast({
                  title: "Removed from wishlist",
                  description: `${product.name} has been removed from your wishlist.`,
                });
              }).catch((error) => {
                console.error('Error removing from wishlist:', error);
              });
            } else {
              addToWishlist(product, selectedVariant).then(() => {
                toast({
                  title: "Added to wishlist",
                  description: `${product.name} has been added to your wishlist.`,
                });
              }).catch((error) => {
                console.error('Error adding to wishlist:', error);
              });
            }
          }}
        >
          <Heart className={cn("mr-1 sm:mr-1.5 md:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0", isWishlisted && "fill-red-500 text-red-500")} />
          <span className="whitespace-nowrap truncate">
            {isWishlisted ? (
              <>
                <span className="hidden sm:inline">Remove from </span>Wishlist
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Add to </span>Wishlist
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
}

