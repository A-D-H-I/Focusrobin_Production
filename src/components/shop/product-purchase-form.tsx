"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Sun, Shield, Droplet, Star, Heart, Camera, CheckCircle2, Eye, ShoppingCart, Truck, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import TranslatableText from "@/components/ui/TranslatableText";

type ProductPurchaseFormProps = {
  product: Product;
  onVariantChange?: (variant: ProductColorVariant) => void;
  selectedVariant?: ProductColorVariant;
};



export default function ProductPurchaseForm({ product, onVariantChange, selectedVariant: externalSelectedVariant }: ProductPurchaseFormProps) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.hex || '#000000');
  const [internalSelectedVariant, setInternalSelectedVariant] = useState(product.variants[0]);
  const selectedVariant = externalSelectedVariant || internalSelectedVariant;
  const isFocusRobin = (product.brand || 'FocusRobin').trim().toLowerCase() === 'focusrobin';
  const showTryOn = isFocusRobin;
  const [quantity, setQuantity] = useState(1);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Dynamic features based on product properties
  const dynamicFeatures = [
    ...(product.isUVProtection ? [{ icon: Sun, text: "100% UV Protection" }] : []),
    ...(product.isPolarized ? [{ icon: Eye, text: "Polarized lenses" }] : []),
    ...(product.isAntiScratch ? [{ icon: Shield, text: "Antiscratch coating" }] : []),
    ...(product.isHydrophobic ? [{ icon: Droplet, text: "Superhydrophobic" }] : []),
    ...(product.isBioBased ? [{ icon: Leaf, text: "Bio-based Material" }] : []),
    ...(product.customFeatures?.map(feature => ({ icon: Star, text: feature })) || []),
  ];

  // Check if product is sunglasses (prescription option is not available for sunglasses)
  const isPrescription = product.productType === 'eyeglasses' || 
    (product.categories || []).some(c => c.toLowerCase().includes('prescription'));
  const isSunglasses = !isPrescription;

  // Load prescription data from sessionStorage
  useEffect(() => {
    const loadPrescriptionData = () => {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(`prescription_${product.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setPrescriptionData(parsed);
          } catch (error) {
            console.error('Error parsing prescription data:', error);
            setPrescriptionData(null);
          }
        } else {
          setPrescriptionData(null);
        }
      }
    };

    loadPrescriptionData();

    const handlePrescriptionSaved = () => {
      loadPrescriptionData();
    };

    window.addEventListener('prescription-saved', handlePrescriptionSaved);

    const handleFocus = () => {
      loadPrescriptionData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('prescription-saved', handlePrescriptionSaved);
      window.removeEventListener('focus', handleFocus);
    };
  }, [product.id]);

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
    if (variant.stock !== undefined && variant.stock > 0) {
      setQuantity(1);
    } else if (variant.stock === 0) {
      setQuantity(0);
    }
  };

  const handleTryOn = () => {
    if (!selectedVariant) {
      toast({
        title: "Error",
        description: "Please select a color variant.",
        variant: "destructive",
      });
      return;
    }
    const variantWithTryOn = product.variants.find(v => v.tryOn) || selectedVariant;
    const variantIndex = product.variants.findIndex(v => v.hex === variantWithTryOn.hex);
    router.push(`/try-on?product=${encodeURIComponent(product.slug || product.id)}&variant=${variantIndex}`);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast({
        title: "Error",
        description: "Please select a color variant.",
        variant: "destructive",
      });
      return;
    }

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

    addToCart(product, selectedVariant, quantity, prescriptionData);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };

  const handleWishlist = () => {
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
  };

  const isOutOfStock = selectedVariant?.stock === 0;
  const isLowStock = selectedVariant?.stock !== undefined && selectedVariant.stock > 0 && selectedVariant.stock < 10;

  return (
    <div className="space-y-3 overflow-hidden w-full">
      {/* Product Name */}
      <div className="overflow-hidden">
        <h1 className="text-3xl lg:text-4xl font-headline tracking-tight truncate">{product.name}</h1>
      </div>

      {/* Price Section */}
      <div className="flex items-center gap-2 flex-wrap overflow-hidden">
        <span className="text-2xl font-semibold text-primary">{formatPrice(priceInEur)}</span>
        {originalPriceInEur && originalPriceInEur !== priceInEur && (
          <>
            <span className="text-base text-muted-foreground line-through">{formatPrice(originalPriceInEur)}</span>
            {product.discountPct ? (
              <Badge className="bg-red-500 hover:bg-red-500 text-white text-sm px-2 py-0 h-6">
                -{product.discountPct}%
              </Badge>
            ) : null}
          </>
        )}
        {cashbackInEur !== null && cashbackInEur > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-2 py-0 h-6">
            🎁 {formatPrice(cashbackInEur)} cashback
          </Badge>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < Math.round((product.reviewCount && product.reviewCount > 0) ? (product.averageRating || 0) : 0)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          ({product.reviewCount || 0} <TranslatableText text={(product.reviewCount || 0) !== 1 ? "customer reviews" : "customer review"} />)
        </span>
      </div>

      {/* Color Selection - Only for FocusRobin products */}
      {isFocusRobin && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium">
              <TranslatableText text="Color" />: {selectedVariant?.name || 'Default'}
            </span>
          </div>
          <div className="flex gap-2 p-1">
            {product.variants.map((variant, idx) => (
              <button
                key={`color-${idx}-${variant.name}`}
                onClick={() => handleColorSelect(variant)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all bg-cover bg-center",
                  selectedColor === variant.hex
                    ? "border-foreground scale-110 shadow-md ring-1 ring-offset-1 ring-primary/50"
                    : "border-border hover:border-muted-foreground hover:scale-105"
                )}
                style={{
                  backgroundColor: variant.hex,
                  backgroundImage: variant.textureImageUrl ? `url(${variant.textureImageUrl})` : undefined
                }}
                title={variant.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Features Grid - Combined with Warranty and Fast Delivery */}
      <div className="rounded-lg border bg-muted/30 p-2.5 sm:p-3 overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          {dynamicFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm text-foreground/80 truncate">{feature.text}</span>
            </div>
          ))}
          {/* Warranty */}
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm text-foreground/80 truncate">{product.warranty || "2 Years Warranty"}</span>
          </div>
          {/* Fast Delivery */}
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm text-foreground/80 truncate">Fast Delivery</span>
          </div>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium">Quantity:</span>
          <div className="flex items-center border border-border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-medium text-base">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const maxQuantity = selectedVariant?.stock !== undefined ? selectedVariant.stock : 999;
                setQuantity(q => Math.min(maxQuantity, q + 1));
              }}
              disabled={selectedVariant?.stock !== undefined && quantity >= selectedVariant.stock}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stock Status */}
        {isOutOfStock && (
          <span className="text-sm font-medium text-destructive"><TranslatableText text="Out of Stock" /></span>
        )}
        {isLowStock && (
          <span className={cn(
            "text-sm font-medium",
            (selectedVariant?.stock || 0) <= 3 ? "text-orange-600" : "text-amber-600"
          )}>
            <TranslatableText text="Only" /> {selectedVariant?.stock || 0} <TranslatableText text="left in stock" />
          </span>
        )}
      </div>

      {/* Tags Details */}
      <div className="pt-2 flex flex-col gap-1">
        {product.tags && product.tags.length > 0 && (
          <p className="text-sm text-muted-foreground m-0 flex flex-wrap gap-1 items-center">
            <span className="font-medium min-w-[40px]"><TranslatableText text="Tags" />:</span>
            <span className="flex flex-wrap gap-1">
              {product.tags.map(tag => (
                <span key={tag} className="font-semibold text-foreground bg-muted/50 px-1.5 py-0.5 rounded text-xs">{tag}</span>
              ))}
            </span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 overflow-hidden">
        {/* Virtual Try-On and Add to Cart - Two buttons in a row */}
        <div className={cn("grid gap-2", showTryOn ? "grid-cols-2" : "grid-cols-1")}>
          {showTryOn && (
            <Button
              variant="outline"
              className="h-10 text-sm border overflow-hidden"
              onClick={handleTryOn}
            >
              <Camera className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate"><TranslatableText text="Virtual Try-On" /></span>
            </Button>
          )}

          {(!isSunglasses && !prescriptionData) ? (
            <Button
              className="h-10 text-sm font-semibold overflow-hidden"
              disabled={isOutOfStock}
              asChild
            >
              <Link href={`/shop/${product.id}/prescription?product=${encodeURIComponent(product.id)}`}>
                <span className="truncate"><TranslatableText text="Choose Lenses" /></span>
              </Link>
            </Button>
          ) : (
            <Button
              className="h-10 text-sm font-semibold overflow-hidden"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {isOutOfStock ? <TranslatableText text="Out of Stock" /> : <TranslatableText text="Add to Cart" />}
              </span>
            </Button>
          )}
        </div>

        {/* Prescription Section - Only show for non-sunglasses products */}
        {!isSunglasses && prescriptionData ? (
          <div className="space-y-2">
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Prescription Added</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sessionStorage.removeItem(`prescription_${product.id}`);
                    setPrescriptionData(null);
                  }}
                  className="h-8 text-sm"
                  disabled={isOutOfStock}
                >
                  Remove
                </Button>
              </div>

              <div className="space-y-2 text-sm overflow-x-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium text-muted-foreground mb-0.5 text-sm">OD (Right)</p>
                    <p className="text-foreground text-sm">
                      SPH: {prescriptionData.od.sph} | CYL: {prescriptionData.od.cyl} | AXIS: {prescriptionData.od.axis}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-0.5 text-sm">OS (Left)</p>
                    <p className="text-foreground text-sm">
                      SPH: {prescriptionData.os.sph} | CYL: {prescriptionData.os.cyl} | AXIS: {prescriptionData.os.axis}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-muted-foreground mb-0.5 text-sm">PD (Pupillary Distance)</p>
                  <p className="text-foreground text-sm">{prescriptionData.pd} mm</p>
                </div>

                {prescriptionData.rxConfig && (
                  <div className="pt-1.5 border-t space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Lens Type:</span>
                      <span className="font-medium text-sm">
                        {prescriptionData.rxConfig.lensType === 'CLEAR'
                          ? 'Clear'
                          : prescriptionData.rxConfig.lensType === 'TINTED'
                            ? 'Tinted'
                            : prescriptionData.rxConfig.lensType === 'PHOTOCHROMIC_SOLIS'
                              ? 'Photochromic (Solis II)'
                              : 'Polarized (NuPolar)'}
                      </span>
                    </div>
                    {prescriptionData.rxConfig.lensIndex && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Lens Index:</span>
                        <span className="font-medium text-sm">{prescriptionData.rxConfig.lensIndex}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Coating:</span>
                      <span className="font-medium text-sm">
                        {prescriptionData.rxConfig.coating === 'UC' ? 'Uncoated (UC)' :
                          prescriptionData.rxConfig.coating === 'SERICUM_UV' ? 'UV Protection' :
                            'Blue PRO'}
                      </span>
                    </div>
                    {prescriptionData.rxConfig.lensType === 'TINTED' && prescriptionData.rxConfig.tintType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Tint:</span>
                        <span className="font-medium text-sm">
                          {prescriptionData.rxConfig.tintType === 'FULL_TINT_CATALOG' ? 'Full Tint (Catalog)' : 'Gradient Tint'}
                          {prescriptionData.rxConfig.tintColor && ` - ${prescriptionData.rxConfig.tintColor}`}
                          {prescriptionData.rxConfig.tintType === 'FULL_TINT_CATALOG' && prescriptionData.rxConfig.tintShadePercent && ` ${prescriptionData.rxConfig.tintShadePercent}%`}
                          {prescriptionData.rxConfig.tintType === 'GRADIENT' && prescriptionData.rxConfig.tintRecipe && ` (${prescriptionData.rxConfig.tintRecipe})`}
                        </span>
                      </div>
                    )}
                    {prescriptionData.rxConfig.photochromicColor && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Photochromic Color:</span>
                        <span className="font-medium text-sm">{prescriptionData.rxConfig.photochromicColor}</span>
                      </div>
                    )}
                    {prescriptionData.rxConfig.polarizedColor && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Polarized Color:</span>
                        <span className="font-medium text-sm">{prescriptionData.rxConfig.polarizedColor}</span>
                      </div>
                    )}
                  </div>
                )}

                {prescriptionData.rxPriceBreakdown && (
                  <div className="pt-1.5 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Total with Rx:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(prescriptionData.rxPriceBreakdown.totalNet)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Frame + Rx lenses ({formatPrice(prescriptionData.rxPriceBreakdown.rxRetailNet)} add-on)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-10 text-base"
              disabled={isOutOfStock}
              asChild
            >
              <Link href={`/shop/${product.id}/prescription?product=${encodeURIComponent(product.id)}`}>
                Edit Prescription
              </Link>
            </Button>

            <Button
              className="w-full h-10 text-base"
              disabled={isOutOfStock}
              asChild
            >
              <Link href={`/shop/${product.id}/prescription?product=${encodeURIComponent(product.id)}&step=3`}>
                Change Lens Options
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={cn("w-full h-10 text-sm overflow-hidden", isWishlisted && "border-primary")}
              onClick={handleWishlist}
            >
              <Heart className={cn("w-4 h-4 mr-1.5 flex-shrink-0", isWishlisted && "fill-red-500 text-red-500")} />
              <span className="truncate">{isWishlisted ? "In Wishlist" : "Add to Wishlist"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Shipping Info */}
      <p className="text-xs sm:text-sm text-muted-foreground">
        Designed in Lithuania. Fast delivery across EU/Schengen.
      </p>
    </div>
  );
}
