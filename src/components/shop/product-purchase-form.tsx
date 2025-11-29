
"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Sun, ParkingCircle, Shield, Droplet, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Check wishlist status when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setIsWishlisted(isInWishlist(product.id, selectedVariant.hex));
    }
  }, [product.id, selectedVariant, isInWishlist]);
  
  // Use the final price (already includes discount if applicable)
  const price = parseFloat(product.price.replace('€', '').replace(',', ''));

  // Sync selectedColor when external variant changes
  useEffect(() => {
    if (externalSelectedVariant) {
      setSelectedColor(externalSelectedVariant.hex);
    }
  }, [externalSelectedVariant]);

  const handleColorSelect = (variant: ProductColorVariant) => {
    if (!externalSelectedVariant) {
      setInternalSelectedVariant(variant);
    }
    setSelectedColor(variant.hex);
    onVariantChange?.(variant);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold font-headline">{product.name}</h1>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold text-primary">{product.price}</p>
          {product.originalPrice && product.originalPrice !== product.price && (
            <>
              <p className="text-xl text-muted-foreground line-through">{product.originalPrice}</p>
              {product.discountPct && (
                <Badge variant="destructive" className="text-sm">
                  -{product.discountPct}%
                </Badge>
              )}
            </>
          )}
        </div>
        {product.cashback && (
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
            🎁 {product.cashback} cashback
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
        <Button 
          size="lg" 
          className="h-14 text-lg w-full"
          onClick={() => {
            if (!selectedVariant) {
              toast({
                title: "Error",
                description: "Please select a color variant.",
                variant: "destructive",
              });
              return;
            }
            addToCart(product, selectedVariant, quantity);
            toast({
              title: "Added to cart",
              description: `${product.name} (${selectedVariant.name}) has been added to your cart.`,
            });
          }}
        >
          Add to Cart
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
    </div>
  );
}

