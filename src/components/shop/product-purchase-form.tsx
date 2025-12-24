
"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Sun, ParkingCircle, Shield, Droplet, Star, Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import VirtualTryOn from "@/components/shop/virtual-tryon";

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
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.hex || '#000000');
  const [internalSelectedVariant, setInternalSelectedVariant] = useState(product.variants[0]);
  const selectedVariant = externalSelectedVariant || internalSelectedVariant;
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  
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
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold font-headline">{product.name}</h1>
      
      {/* Virtual Try-On Button - Visible at top on all devices */}
      <Button 
        size="lg" 
        variant="outline" 
        className="h-14 text-lg border-2 w-full border-primary"
        onClick={() => {
          if (!selectedVariant) {
            toast({
              title: "Error",
              description: "Please select a color variant.",
              variant: "destructive",
            });
            return;
          }
          setIsTryOnOpen(true);
        }}
      >
        <Camera className="mr-2 h-5 w-5" />
        Virtual Try-On
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
          <h3 className="text-md font-semibold mb-3">Color: <span className="font-normal text-muted-foreground">{selectedVariant?.name || 'Default'}</span></h3>
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
              <h3 className="text-md font-semibold">Quantity:</h3>
              <div className="flex items-center border rounded-md">
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setQuantity(q => Math.max(1, q-1))} 
                      className="h-10 w-10"
                      disabled={quantity <= 1}
                  >
                      <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-bold">{quantity}</span>
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                          const maxQuantity = selectedVariant?.stock !== undefined ? selectedVariant.stock : 999;
                          setQuantity(q => Math.min(maxQuantity, q+1));
                      }} 
                      className="h-10 w-10"
                      disabled={selectedVariant?.stock !== undefined && quantity >= selectedVariant.stock}
                  >
                      <Plus className="h-4 w-4" />
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
      
      <div className="grid grid-cols-1 gap-4">
        <Button 
          size="lg" 
          className="h-14 text-lg w-full"
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
          {selectedVariant?.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className={cn("h-14 text-lg border-2 w-full", isWishlisted && "border-primary")}
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
          <Heart className={cn("mr-2 h-5 w-5", isWishlisted && "fill-red-500 text-red-500")} />
          {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        </Button>
      </div>

      {/* Virtual Try-On Modal */}
      <VirtualTryOn
        product={product}
        variants={product.variants}
        selectedVariantIndex={product.variants.findIndex(v => v.hex === selectedVariant?.hex) || 0}
        productName={product.name}
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  );
}

