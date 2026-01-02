"use client";

import { Camera, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import Link from "next/link";

interface TryOnRelatedProductsProps {
  products: Product[];
  currentProductId: string;
  onProductSelect: (product: Product, variantIndex: number) => void;
  className?: string;
}

export default function TryOnRelatedProducts({
  products,
  currentProductId,
  onProductSelect,
  className,
}: TryOnRelatedProductsProps) {
  const { formatPrice, parseEurPrice } = usePrice();

  // Filter products that have try-on capability and are not the current product
  const relatedProducts = products.filter(
    (product) =>
      product.id !== currentProductId &&
      product.variants.some((v) => v.tryOn)
  );

  if (relatedProducts.length === 0) {
    return (
      <div className={cn("flex flex-col overflow-hidden", className)}>
        <h2 className="text-[10px] font-headline font-semibold mb-2 flex-shrink-0">Other Frames</h2>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[9px] text-center p-2">
          <p>No other frames available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h2 className="text-[10px] font-headline font-semibold">Other Frames</h2>
        <span className="text-[8px] text-muted-foreground">
          {relatedProducts.length}
        </span>
      </div>

      {/* Desktop: Scrollable grid of thumbnails */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-1.5 pr-1">
            {relatedProducts.map((product) => {
              const tryOnVariant = product.variants.find((v) => v.tryOn) || product.variants[0];
              const variantIndex = product.variants.findIndex((v) => v.hex === tryOnVariant.hex);
              const priceInEur = parseEurPrice(product.price);

              return (
                <button
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden group rounded border border-border/50 bg-card text-left"
                  onClick={() => onProductSelect(product, variantIndex)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-muted/50 overflow-hidden">
                    {tryOnVariant.thumbnail && (
                      <img
                        src={tryOnVariant.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute bottom-0.5 right-0.5 bg-teal-primary text-white rounded-full p-0.5">
                      <Camera className="h-2 w-2" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-1">
                    <h3 className="text-[8px] font-semibold text-foreground line-clamp-1 group-hover:text-teal-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[9px] font-bold text-foreground">
                      {formatPrice(priceInEur)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* View All Link - Desktop */}
        <div className="flex-shrink-0 pt-1.5 border-t border-border/50 mt-1.5">
          <Link href="/shop">
            <Button variant="ghost" size="sm" className="w-full text-teal-primary hover:text-teal-primary hover:bg-teal-primary/10 h-6 text-[9px]">
              View All
              <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile/Tablet: Horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {relatedProducts.slice(0, 10).map((product) => {
            const tryOnVariant = product.variants.find((v) => v.tryOn) || product.variants[0];
            const variantIndex = product.variants.findIndex((v) => v.hex === tryOnVariant.hex);
            const priceInEur = parseEurPrice(product.price);

            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden flex-shrink-0 w-[120px] snap-start"
                onClick={() => onProductSelect(product, variantIndex)}
              >
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-muted/50 overflow-hidden">
                    {tryOnVariant.thumbnail && (
                      <img
                        src={tryOnVariant.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1.5 right-1.5 bg-teal-primary text-white rounded-full p-1">
                      <Camera className="h-2.5 w-2.5" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-1.5">
                    <h3 className="text-[10px] font-semibold text-foreground line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {formatPrice(priceInEur)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* View All Link - Mobile */}
        <div className="pt-2">
          <Link href="/shop">
            <Button variant="ghost" size="sm" className="w-full text-teal-primary hover:text-teal-primary hover:bg-teal-primary/10 h-8 text-xs">
              View All Frames
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

