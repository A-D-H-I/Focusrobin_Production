"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Camera, ShoppingCart, ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { cn } from "@/lib/utils";
import TryOnPreview from "@/components/shop/try-on-preview";
import TryOnProductDetails from "@/components/shop/try-on-product-details";
import TryOnRelatedProducts from "@/components/shop/try-on-related-products";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface TryOnPageClientProps {
  products: Product[];
}

export default function TryOnPageClient({ products }: TryOnPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Filter products that have try-on capability
  const availableProducts = (products || []).filter((product) => {
    return product.variants && product.variants.some((variant) => variant.tryOn);
  });

  // Handle product selection
  const handleProductSelect = (product: Product, variantIndex: number = 0) => {
    setSelectedProduct(product);
    setSelectedVariantIndex(variantIndex);
    router.push(`/try-on?product=${encodeURIComponent(product.id)}&variant=${variantIndex}`, { scroll: false });
  };

  // Handle variant change
  const handleVariantChange = (variant: ProductColorVariant) => {
    if (!selectedProduct) return;
    const newIndex = selectedProduct.variants.findIndex((v) => v.hex === variant.hex);
    if (newIndex >= 0) {
      setSelectedVariantIndex(newIndex);
      router.push(`/try-on?product=${encodeURIComponent(selectedProduct.id)}&variant=${newIndex}`, { scroll: false });
    }
  };

  const handleVariantIndexChange = (index: number) => {
    if (!selectedProduct) return;
    setSelectedVariantIndex(index);
    router.push(`/try-on?product=${encodeURIComponent(selectedProduct.id)}&variant=${index}`, { scroll: false });
  };

  // Handle clearing selection (back to product grid)
  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSelectedVariantIndex(0);
    router.push('/try-on', { scroll: false });
  };

  // Handle browser back navigation
  const handleGoBack = () => {
    router.back();
  };

  // Check URL params for product and variant selection
  useEffect(() => {
    if (!products || products.length === 0) return;

    const productId = searchParams.get("product");
    const variantIndex = searchParams.get("variant");

    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        const variantIdx = variantIndex ? parseInt(variantIndex) : 0;
        setSelectedProduct(product);
        setSelectedVariantIndex(Math.max(0, Math.min(variantIdx, product.variants.length - 1)));
        return;
      }
    }

    // Auto-select first available product if none selected
    if (!selectedProduct && availableProducts.length > 0) {
      const firstProduct = availableProducts[0];
      const firstVariantWithTryOn = firstProduct.variants.findIndex((v) => v.tryOn);
      if (firstVariantWithTryOn >= 0) {
        setSelectedProduct(firstProduct);
        setSelectedVariantIndex(firstVariantWithTryOn);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, products]);

  // Handle add to cart from mobile sticky button
  const handleAddToCart = () => {
    if (!selectedProduct || !selectedVariant) return;
    
    if (selectedVariant.stock !== undefined && selectedVariant.stock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    addToCart(selectedProduct, selectedVariant, 1);
    toast({
      title: "Added to cart",
      description: `${selectedProduct.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };

  // No products available
  if (!products || products.length === 0 || availableProducts.length === 0) {
    return (
      <div className="h-[calc(100vh-124px)] flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-headline font-semibold mb-2">Virtual Try-On</h1>
          <p className="text-muted-foreground">
            No products available for try-on at the moment.
          </p>
        </div>
      </div>
    );
  }

  // No product selected yet - show product selection grid (scrollable)
  if (!selectedProduct) {
    return (
      <div className="h-[calc(100vh-124px)] flex flex-col">
        {/* Header with back button */}
        <div className="py-4 px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <div className="text-center mt-2">
            <h1 className="text-2xl md:text-3xl font-headline font-semibold text-foreground mb-1">
              Virtual Try-On
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Select a frame to try on virtually
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
            {availableProducts.map((product) => {
              const tryOnVariant = product.variants.find((v) => v.tryOn) || product.variants[0];
              const variantIndex = product.variants.findIndex((v) => v.hex === tryOnVariant.hex);

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product, variantIndex)}
                  className="group text-left rounded-lg border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 bg-card"
                >
                  <div className="aspect-square bg-muted/50 overflow-hidden relative">
                    {tryOnVariant.thumbnail && (
                      <img
                        src={tryOnVariant.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute bottom-1.5 right-1.5 bg-teal-primary text-white rounded-full p-1">
                      <Camera className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-xs line-clamp-1 group-hover:text-teal-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {product.variants.filter((v) => v.tryOn).length} colors
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const selectedVariant = selectedProduct.variants[selectedVariantIndex] || selectedProduct.variants[0];

  return (
    <>
      {/* DESKTOP LAYOUT - Fixed viewport height, no scroll */}
      <div className="hidden lg:flex h-[calc(100vh-124px)] overflow-hidden">
        <div className="flex w-full gap-3 p-3">
          
          {/* LEFT PANEL - Product Details (Fixed) + Product Image (Scrollable) */}
          <aside className="w-[200px] xl:w-[220px] flex-shrink-0 flex flex-col min-h-0">
            {/* Back Navigation - Fixed */}
            <div className="flex-shrink-0 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                All Frames
              </Button>
            </div>
            
            {/* Product Image - Scrollable */}
            <div className="flex-shrink-0 mb-2">
              <ScrollArea className="h-[120px] xl:h-[140px] rounded-lg border border-border/50 bg-muted/30">
                <div className="p-2">
                  <img
                    src={selectedVariant.thumbnail || selectedVariant.images?.[0]}
                    alt={selectedProduct.name}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
              </ScrollArea>
            </div>
            
            {/* Product Details - Fixed, takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <TryOnProductDetails
                product={selectedProduct}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
                className="h-full overflow-y-auto pr-1"
              />
            </div>
          </aside>

          {/* CENTER PANEL - Try-On Preview */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* Title */}
            <div className="text-center py-1.5 flex-shrink-0">
              <h1 className="text-lg xl:text-xl font-headline font-semibold">Virtual Try-On</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Upload your photo to try on frames</p>
            </div>

            {/* Preview Area - fills remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <TryOnPreview
                variants={selectedProduct.variants}
                selectedVariantIndex={selectedVariantIndex}
                onVariantChange={handleVariantIndexChange}
                className="h-full"
              />
            </div>
          </main>

          {/* RIGHT PANEL - Related Products */}
          <aside className="w-[160px] xl:w-[185px] flex-shrink-0 flex flex-col min-h-0">
            <TryOnRelatedProducts
              products={products}
              currentProductId={selectedProduct.id}
              onProductSelect={handleProductSelect}
              className="h-full"
            />
          </aside>
        </div>
      </div>

      {/* MOBILE/TABLET LAYOUT - Scrollable with sticky footer */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-124px-68px)]">
        {/* Header with back button */}
        <div className="px-4 py-2 flex-shrink-0 border-b border-border/30 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-muted-foreground hover:text-foreground -ml-2 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-headline font-semibold flex-1 text-center pr-8">Virtual Try-On</h1>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4">
            {/* Try-On Preview */}
            <TryOnPreview
              variants={selectedProduct.variants}
              selectedVariantIndex={selectedVariantIndex}
              onVariantChange={handleVariantIndexChange}
            />

            {/* Product Name & Price */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-headline font-semibold line-clamp-2">{selectedProduct.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedVariant.name}</p>
              </div>
              <p className="text-lg font-bold text-primary flex-shrink-0">{selectedProduct.price}</p>
            </div>

            {/* Color Swatches - Mobile */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedProduct.variants.map((variant, idx) => (
                <button
                  key={`mobile-color-${idx}`}
                  onClick={() => handleVariantIndexChange(idx)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    selectedVariantIndex === idx
                      ? "border-primary ring-2 ring-offset-1 ring-primary"
                      : "border-border"
                  )}
                  style={{ backgroundColor: variant.hex }}
                  title={variant.name}
                />
              ))}
            </div>

            {/* Related Products */}
            <div className="pt-4 border-t border-border/50">
              <TryOnRelatedProducts
                products={products}
                currentProductId={selectedProduct.id}
                onProductSelect={handleProductSelect}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Mobile Sticky Add to Cart Button */}
        <div className="flex-shrink-0 p-3 bg-background border-t border-border/50">
          <Button
            onClick={handleAddToCart}
            className="w-full h-11 font-bold text-sm"
            disabled={selectedVariant?.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {selectedVariant?.stock === 0 ? "Out of Stock" : `Add to Cart — ${selectedProduct.price}`}
          </Button>
        </div>
      </div>
    </>
  );
}
