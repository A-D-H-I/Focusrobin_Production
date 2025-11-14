"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { productCatalog } from "@/lib/productData";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import ProductCard from "@/components/ui/ProductCard";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Find the product by ID
  const product = productCatalog.find((p) => p.id === id);

  // If product not found, show error message
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist.
            </p>
            <Link href="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get the first color variant's images for the gallery
  const firstVariant = product.variants[0];
  const galleryImages = firstVariant?.images || [];

  // Get related products (first 4 products excluding current)
  const relatedProducts = productCatalog
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left Column - Image Gallery */}
            <div>
              {galleryImages.length > 0 ? (
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {galleryImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={image}
                            alt={`${product.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {galleryImages.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  <Image
                    src="/images/placeholder.jpg"
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-headline font-bold mb-4">
                  {product.name}
                </h1>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {product.price}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {product.cashback}
                </p>
              </div>

              {/* Color Swatches */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Color</h3>
                <div className="flex items-center space-x-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.hex}
                      className="relative group"
                      aria-label={`Select ${variant.name} color`}
                    >
                      <span
                        className="block h-10 w-10 rounded-full border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: variant.hex }}
                        title={variant.name}
                      />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {variant.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-4">
                <Button size="lg" className="w-full sm:w-auto min-w-[200px]">
                  Add to cart
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mb-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="additional">Additional Information</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </TabsContent>

              <TabsContent value="additional" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Size</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Lens Width: {product.size.lensWidth}</li>
                      <li>Bridge: {product.size.bridge}</li>
                      <li>Temple: {product.size.temple}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Lens Material</h4>
                    <p className="text-muted-foreground">{product.lensMaterial}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Frame Material</h4>
                    <p className="text-muted-foreground">{product.frameMaterial}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">UV Protection</h4>
                    <p className="text-muted-foreground">{product.uvProtection}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Warranty</h4>
                    <p className="text-muted-foreground">{product.warranty}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this product!
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Things to Know Section */}
          <div className="mb-16 bg-muted/50 rounded-lg p-6 sm:p-8">
            <h2 className="text-2xl font-headline font-bold mb-6">
              Things to Know
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  We offer free shipping on all orders over €50. Standard delivery takes 3-5 business days.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">
                  Not satisfied? Return your purchase within 30 days for a full refund. No questions asked.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Quality Guarantee</h3>
                <p className="text-sm text-muted-foreground">
                  All our products come with a quality guarantee. If you experience any defects, we'll replace them free of charge.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Prescription Lenses</h3>
                <p className="text-sm text-muted-foreground">
                  Need prescription lenses? We can add them to any frame. Contact us for more information.
                </p>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  showCashback={true}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

