"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, ShoppingCart, ExternalLink } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { usePrice } from "@/hooks/usePrice";
import Product3DViewer from "@/components/shop/product-3d-viewer";
import type { Product } from "@/lib/productData";

// Extend HTMLElement to include model-viewer types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src?: string;
        alt?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'touch-action'?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<any>;
      };
    }
  }
}

interface Products3DSectionProps {
  products: Product[];
}

export default function Products3DSection({ products }: Products3DSectionProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { formatPrice, parseEurPrice } = usePrice();
  const [open3DViewer, setOpen3DViewer] = useState<{ product: Product | null; isOpen: boolean }>({
    product: null,
    isOpen: false,
  });
  const modelViewerRefs = useRef<(any | null)[]>([]);

  // Use the same 3D model for all products
  const model3DUrl = `/sunglasses3D.glb`;

  // Initialize refs array
  useEffect(() => {
    modelViewerRefs.current = modelViewerRefs.current.slice(0, products.length);
  }, [products.length]);

  if (products.length === 0) {
    return null;
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the first available variant
    const firstVariant = product.variants?.[0];
    if (!firstVariant) {
      toast({
        title: "Error",
        description: "No variants available for this product.",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, firstVariant, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleVirtualTryOn = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen3DViewer({ product, isOpen: true });
  };

  // Parse price from product (price is on product level, not variant)
  const getPrice = (product: Product) => {
    if (product.price) {
      return parseEurPrice(product.price);
    }
    return 0;
  };

  return (
    <>
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-foreground mb-6">
              Explore Our Collection
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience our products in stunning 3D. Interact with them directly on this page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {products.map((product, index) => {
              const price = getPrice(product);

              return (
                <Link
                  key={`${product.id}-${index}`}
                  href={`/products/${product.id}`}
                  className="group relative block"
                >
                  <div className="relative bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border/50">
                    {/* 3D Model Container - Interactive */}
                    <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                      {typeof window !== 'undefined' && customElements.get('model-viewer') ? (
                        <model-viewer
                          ref={(el) => {
                            modelViewerRefs.current[index] = el;
                            // Ensure auto-rotate is always on
                            if (el) {
                              setTimeout(() => {
                                el.autoRotate = true;
                                el.cameraControls = false;
                              }, 100);
                            }
                          }}
                          src={model3DUrl}
                          alt={product.name}
                          camera-orbit="45deg 55deg 2.5m"
                          field-of-view="45deg"
                          auto-rotate={true}
                          auto-rotate-delay="0"
                          camera-controls={false}
                          touch-action="none"
                          interaction-policy="none"
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* View Details Badge */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium">
                          <ExternalLink className="h-3 w-3" />
                          View Details
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <h3 className="font-headline font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex-1"
                          size="sm"
                          variant="default"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        
                        <Button
                          onClick={(e) => handleVirtualTryOn(e, product)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Try-On
                        </Button>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-2xl transition-colors duration-300 pointer-events-none" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3D Viewer Modal */}
      {open3DViewer.product && (
        <Product3DViewer
          modelUrl={model3DUrl}
          productName={open3DViewer.product.name}
          isOpen={open3DViewer.isOpen}
          onClose={() => setOpen3DViewer({ product: null, isOpen: false })}
        />
      )}
    </>
  );
}
