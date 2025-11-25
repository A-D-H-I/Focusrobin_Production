
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDimensions from "@/components/product/ProductDimensions";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface ProductDetailsTabsProps {
  product: Product;
  selectedVariant?: ProductColorVariant;
}

export default function ProductDetailsTabs({ product, selectedVariant }: ProductDetailsTabsProps) {
  // Use provided selectedVariant or fallback to first variant
  const currentVariant = selectedVariant || product.variants[0];
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
        <TabsTrigger value="details">Product Details</TabsTrigger>
        <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
        <TabsTrigger value="story">Design Story</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="py-4 sm:py-8 px-2">
        <div className="space-y-6 sm:space-y-8">
            <ProductDimensions 
              dimensions={{
                frameWidth: product.frameWidth,
                lensWidth: product.lensWidth,
                lensHeight: product.lensHeight,
                bridgeWidth: product.bridgeWidth,
                templeLength: product.templeLength,
              }}
            />
            <div>
                <h3 className="font-bold text-foreground font-headline mb-4 text-base sm:text-lg text-center">Specifications</h3>
                <div className="overflow-x-auto">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Color</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">
                                  {currentVariant?.name || 'N/A'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Frame Material</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">
                                  {product.frameMaterial || 'N/A'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Lens Material</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">
                                  {product.lensMaterial || 'N/A'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">UV Protection Level</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">
                                  {product.uvProtection || 'N/A'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Frame Weight</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">
                                  {product.weight ? `${product.weight}g` : 'N/A'}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
      </TabsContent>

      <TabsContent value="shipping" className="py-4 sm:py-8 px-2">
        <div className="prose max-w-none text-foreground/80">
            <h3 className="font-bold text-foreground font-headline mb-4 text-base sm:text-lg">Shipping & Returns Policy</h3>
            <p className="text-sm sm:text-base">We offer free standard shipping on all orders. Expedited shipping options are available at checkout. We provide hassle-free returns and exchanges within 14 days of purchase. Frames must be in their original condition.</p>
        </div>
      </TabsContent>

      <TabsContent value="story" className="py-4 sm:py-8 px-2">
        <div className="prose max-w-none text-foreground/80">
            <h3 className="font-bold text-foreground font-headline mb-4 text-base sm:text-lg">Behind the Design</h3>
            <p className="text-sm sm:text-base">The '{product.name}' is inspired by the fusion of classic mid-century aesthetics and modern architectural lines. Our designers aimed to create a frame that feels both timeless and contemporary. Each pair is meticulously handcrafted from premium Italian acetate and lightweight metal, ensuring a perfect balance of style, comfort, and durability for the discerning individual.</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

