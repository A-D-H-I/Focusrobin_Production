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
    router.push(`/try-on?product=${encodeURIComponent(product.slug)}&variant=${variantIndex}`, { scroll: false });
  };

  // Handle variant change
  const handleVariantChange = (variant: ProductColorVariant) => {
    if (!selectedProduct) return;
    const newIndex = selectedProduct.variants.findIndex((v) => v.hex === variant.hex);
    if (newIndex >= 0) {
      setSelectedVariantIndex(newIndex);
      router.push(`/try-on?product=${encodeURIComponent(selectedProduct.slug)}&variant=${newIndex}`, { scroll: false });
    }
  };

  const handleVariantIndexChange = (index: number) => {
    if (!selectedProduct) return;
    setSelectedVariantIndex(index);
    router.push(`/try-on?product=${encodeURIComponent(selectedProduct.slug)}&variant=${index}`, { scroll: false });
  };

  // Handle going back to product page
  const handleBackToProduct = () => {
    if (selectedProduct) {
      router.push(`/shop/${encodeURIComponent(selectedProduct.slug)}`);
    } else {
      router.push('/shop');
    }
  };

  // Handle browser back navigation (when no product selected, go to shop)
  const handleGoBack = () => {
    router.push('/shop');
  };

  // Check URL params for product and variant selection
  useEffect(() => {
    if (!products || products.length === 0) return;

    const productSlug = searchParams.get("product");
    const variantIndex = searchParams.get("variant");
    
    if (productSlug) {
      // Find product by slug first, then fallback to id for backwards compatibility
      const product = products.find((p) => p.slug === productSlug) || products.find((p) => p.id === productSlug);
      if (product) {
        const variantIdx = variantIndex ? parseInt(variantIndex) : 0;
        setSelectedProduct(product);
        setSelectedVariantIndex(Math.max(0, Math.min(variantIdx, product.variants.length - 1)));
        return;
      }
    }
    
    // If no product in URL, redirect to shop
    // Users should access try-on from product pages, not directly
    if (!productSlug) {
      router.push('/shop');
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

  // No product selected - redirect to shop
  if (!selectedProduct) {
  return (
      <div className="h-[calc(100vh-124px)] flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Redirecting to shop...</p>
        </div>
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
          <aside className="w-[280px] xl:w-[320px] 2xl:w-[360px] flex-shrink-0 flex flex-col min-h-0">
            {/* Back Navigation - Fixed */}
            <div className="flex-shrink-0 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToProduct}
                className="text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                Back to Product
              </Button>
            </div>
            
            {/* Product Image - Fixed (no scroll) */}
            <div className="flex-shrink-0 mb-3">
              <div className="h-[160px] xl:h-[180px] rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden">
                <div className="p-3 w-full h-full flex items-center justify-center">
                  <img
                    src={selectedVariant.thumbnail || selectedVariant.images?.[0]}
                    alt={selectedProduct.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Product Details - Fixed, takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <TryOnProductDetails
                product={selectedProduct}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
                className="h-full overflow-hidden pr-1"
              />
            </div>
          </aside>

          {/* CENTER PANEL - Try-On Preview */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 max-w-[550px] mx-auto">
            {/* Title */}
            <div className="text-center py-3 flex-shrink-0">
              <h1 className="text-2xl xl:text-3xl font-headline font-semibold">Virtual Try-On</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Upload your photo to try on frames</p>
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
          <aside className="w-[200px] xl:w-[240px] flex-shrink-0 flex flex-col min-h-0">
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
        <div className="px-4 py-3 flex-shrink-0 border-b border-border/30 flex items-center">
          <Button
            variant="ghost"
            size="default"
            onClick={handleBackToProduct}
            className="text-muted-foreground hover:text-foreground -ml-2 mr-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-headline font-semibold flex-1 text-center pr-8">Virtual Try-On</h1>
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
                <h2 className="text-xl font-headline font-semibold line-clamp-2">{selectedProduct.name}</h2>
                <p className="text-base text-muted-foreground mt-1">{selectedVariant.name}</p>
              </div>
              <p className="text-2xl font-bold text-primary flex-shrink-0">{selectedProduct.price}</p>
            </div>

            {/* Color Swatches - Mobile */}
            <div className="flex items-center gap-3 flex-wrap">
              {selectedProduct.variants.map((variant, idx) => (
                <button
                  key={`mobile-color-${idx}`}
                  onClick={() => handleVariantIndexChange(idx)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-all",
                    selectedVariantIndex === idx
                      ? "border-primary ring-2 ring-offset-2 ring-primary"
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
        <div className="flex-shrink-0 p-4 bg-background border-t border-border/50">
          <Button
            onClick={handleAddToCart}
            className="w-full h-14 font-bold text-base"
            disabled={selectedVariant?.stock === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {selectedVariant?.stock === 0 ? "Out of Stock" : `Add to Cart — ${selectedProduct.price}`}
          </Button>
        </div>
    </div>
    </>
  );
}
