"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Camera } from "lucide-react";
import VirtualTryOn from "@/components/shop/virtual-tryon";
import type { Product } from "@/lib/productData";
import { cn } from "@/lib/utils";

interface TryOnPageClientProps {
  products: Product[];
}

export default function TryOnPageClient({ products }: TryOnPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);

  // Show ALL products in sidebar, but only allow try-on for those with try-on images
  // This way users can see all models available
  const allProducts = products || [];
  const availableProducts = (products || []).filter((product) => {
    const hasTryOn = product.variants && product.variants.some((variant) => variant.tryOn);
    return hasTryOn;
  });

  const handleProductSelect = (product: Product, variantIndex: number = 0) => {
    setSelectedProduct(product);
    setSelectedVariantIndex(variantIndex);
    setIsTryOnOpen(true);
    // Update URL without navigation
    router.push(`/try-on?product=${encodeURIComponent(product.id)}&variant=${variantIndex}`, { scroll: false });
  };

  const handleCloseTryOn = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsTryOnOpen(false);
    setSelectedProduct(null);
    setSelectedVariantIndex(0);
    // Clear URL params to show model selection again
    router.push('/try-on', { scroll: false });
  };

  // Check URL params for product and variant selection, or auto-select first product
  useEffect(() => {
    // Only run if products are loaded
    if (!products || products.length === 0) return;

    const productId = searchParams.get('product');
    const variantIndex = searchParams.get('variant');
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        const variantIdx = variantIndex ? parseInt(variantIndex) : 0;
        setSelectedProduct(product);
        setSelectedVariantIndex(Math.max(0, Math.min(variantIdx, product.variants.length - 1)));
        setIsTryOnOpen(true);
        return;
      }
    }
    
    // Auto-select first product if none selected and products are available
    // Only auto-select if we don't already have a selected product
    if (!selectedProduct && availableProducts.length > 0) {
      const firstProduct = availableProducts[0];
      const firstVariantWithTryOn = firstProduct.variants.findIndex(v => v.tryOn);
      if (firstVariantWithTryOn >= 0) {
        setSelectedProduct(firstProduct);
        setSelectedVariantIndex(firstVariantWithTryOn);
        setIsTryOnOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Show try-on interface with sidebar overlay
  if (isTryOnOpen && selectedProduct) {
    return (
      <>
        {/* Virtual Try-On Modal */}
        <VirtualTryOn
          product={selectedProduct}
          variants={selectedProduct.variants}
          selectedVariantIndex={selectedVariantIndex}
          productName={selectedProduct.name}
          isOpen={true}
          onClose={handleCloseTryOn}
        />

        {/* Sidebar with All Models - Fixed overlay */}
        <div 
          className="fixed right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl overflow-hidden flex flex-col"
          style={{ zIndex: 2147483648 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-brand-h2 font-headline text-foreground">
                All Models ({allProducts.length})
              </h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseTryOn(e);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                type="button"
                aria-label="Close try-on"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {availableProducts.length} available for try-on
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {allProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No models available
                </p>
              ) : (
                allProducts.map((product) => {
                const tryOnVariants = product.variants.filter((v) => v.tryOn);
                const hasTryOn = tryOnVariants.length > 0;
                
                // Use first variant with try-on if available, otherwise use first variant
                const displayVariant = tryOnVariants[0] || product.variants[0];
                if (!displayVariant) return null;
                
                const thumbnail = displayVariant.thumbnail || displayVariant.images[0] || '';
                const isSelected = selectedProduct?.id === product.id;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition-all duration-300 overflow-hidden",
                      isSelected
                        ? "ring-2 ring-teal-primary border-teal-primary shadow-lg"
                        : hasTryOn
                        ? "hover:shadow-md border-border/50"
                        : "opacity-60 border-border/30 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!hasTryOn) return;
                      const variantIndex = product.variants.findIndex(v => v.hex === displayVariant.hex);
                      handleProductSelect(product, variantIndex);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-teal-primary/20 border-2 border-teal-primary" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className={cn(
                          "font-semibold text-sm mb-1 line-clamp-2",
                          isSelected ? "text-teal-primary" : "text-foreground",
                          !hasTryOn && "text-muted-foreground"
                        )}>
                          {product.name}
                          {!hasTryOn && (
                            <span className="ml-1 text-xs text-muted-foreground">(No try-on)</span>
                          )}
                        </h3>
                        {hasTryOn && tryOnVariants.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tryOnVariants.map((variant) => {
                              const variantIndex = product.variants.findIndex(v => v.hex === variant.hex);
                              const isVariantSelected = isSelected && selectedVariantIndex === variantIndex;
                              return (
                                <button
                                  key={variant.hex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProductSelect(product, variantIndex);
                                  }}
                                  className={cn(
                                    "text-xs px-2 py-1 rounded border transition-colors",
                                    isVariantSelected
                                      ? "bg-teal-primary text-white border-teal-primary"
                                      : "hover:bg-teal-primary/10 hover:border-teal-primary border-border text-foreground/70"
                                  )}
                                >
                                  {variant.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }))}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  }

  // Safety check for products
  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            No products available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-brand-h1 font-headline text-foreground mb-3">
          Virtual Try-On
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select a model to try on virtually. Upload your photo and see how our glasses look on you!
        </p>
      </div>

      {availableProducts.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            No products available for try-on at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {availableProducts.map((product) => {
            // Get variants that have try-on images
            const tryOnVariants = product.variants.filter((v) => v.tryOn);
            
            if (tryOnVariants.length === 0) return null;

            const firstVariant = tryOnVariants[0];
            const thumbnail = firstVariant.thumbnail || firstVariant.images[0] || '';

            return (
              <Card
                key={product.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div
                    className="relative aspect-square bg-muted overflow-hidden"
                    onClick={() => handleProductSelect(product, product.variants.findIndex(v => v.hex === firstVariant.hex))}
                  >
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product, product.variants.findIndex(v => v.hex === firstVariant.hex));
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Try On
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-brand-h3 font-headline text-foreground mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tryOnVariants.length} {tryOnVariants.length === 1 ? 'variant' : 'variants'} available
                    </p>
                    {tryOnVariants.length > 1 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tryOnVariants.map((variant, idx) => {
                          const variantIndex = product.variants.findIndex(v => v.hex === variant.hex);
                          return (
                            <button
                              key={variant.hex}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductSelect(product, variantIndex);
                              }}
                              className={cn(
                                "text-xs px-2 py-1 rounded border transition-colors",
                                "hover:bg-teal-primary hover:text-white hover:border-teal-primary",
                                "border-border text-foreground/70"
                              )}
                            >
                              {variant.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
