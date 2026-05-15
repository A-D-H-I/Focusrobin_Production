
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDimensions from "@/components/product/ProductDimensions";
import type { Product, ProductColorVariant } from "@/lib/productData";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import TranslatableText from "@/components/ui/TranslatableText";

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
        <TabsTrigger value="details"><TranslatableText text="Specifications" /></TabsTrigger>
        <TabsTrigger value="description"><TranslatableText text="Description" /></TabsTrigger>
        <TabsTrigger value="shipping"><TranslatableText text="Shipping & Returns" /></TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="py-4 sm:py-8 px-2">
        <div className="space-y-6 sm:space-y-8">

          {/* Only show dimension diagram for FocusRobin products with real measurements */}
          {product.frameWidth > 0 && (
          <ProductDimensions
            dimensions={{
              frameWidth: product.frameWidth,
              lensWidth: product.lensWidth,
              lensHeight: product.lensHeight,
              bridgeWidth: product.bridgeWidth,
              templeLength: product.templeLength,
            }}
          />
          )}
          {/* Only show Specifications table for FocusRobin products with real data */}
          {product.frameMaterial !== 'Unknown' && (
          <div>
            <h3 className="text-brand-h3 font-headline text-foreground mb-4 text-center"><TranslatableText text="Specifications" /></h3>
            <div className="overflow-x-auto">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-center border text-sm sm:text-base"><TranslatableText text="Color" /></TableCell>
                    <TableCell className="text-center border text-sm sm:text-base">
                      {currentVariant?.name || 'N/A'}
                    </TableCell>
                  </TableRow>
                  {product.frameMaterial && product.frameMaterial !== 'N/A' && (
                    <TableRow>
                      <TableCell className="font-medium text-center border text-sm sm:text-base"><TranslatableText text="Frame Material" /></TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">
                        {product.frameMaterial}
                      </TableCell>
                    </TableRow>
                  )}
                  {product.lensMaterial && product.lensMaterial !== 'N/A' && (
                    <TableRow>
                      <TableCell className="font-medium text-center border text-sm sm:text-base"><TranslatableText text="Lens Material" /></TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">
                        {product.lensMaterial}
                      </TableCell>
                    </TableRow>
                  )}
                  {product.uvProtection && product.uvProtection !== 'N/A' && (
                    <TableRow>
                      <TableCell className="font-medium text-center border text-sm sm:text-base"><TranslatableText text="UV Protection Level" /></TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">
                        {product.uvProtection}
                      </TableCell>
                    </TableRow>
                  )}
                  {product.weight ? (
                    <TableRow>
                      <TableCell className="font-medium text-center border text-sm sm:text-base"><TranslatableText text="Frame Weight" /></TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">
                        {product.weight}g
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="description" className="py-4 sm:py-8 px-2">
        <div className="space-y-6 sm:space-y-8">
          {product.description ? (
            <div className="prose max-w-none text-foreground/80">
              <h3 className="text-brand-h3 font-headline text-foreground mb-4"><TranslatableText text="Description" /></h3>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center"><TranslatableText text="No description available." /></p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="shipping" className="py-4 sm:py-8 px-2">
        <div className="prose max-w-none text-foreground/80 space-y-6">
          <div>
            <h3 className="text-brand-h3 font-headline text-foreground mb-4"><TranslatableText text="Shipping Policy" /></h3>
            <p className="text-sm sm:text-base mb-4"><TranslatableText text="We offer free standard shipping on all orders. Expedited shipping options are available at checkout." /></p>

            <h4 className="text-lg font-semibold text-foreground mt-6 mb-3"><TranslatableText text="Estimated Delivery Times" /></h4>

            <div className="mb-4">
              <h5 className="text-base font-semibold text-foreground mb-2"><TranslatableText text="Prescription Glasses" /></h5>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Brand</TableHead>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Country</TableHead>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Standard Shipping</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">FocusRobin</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">Lithuania</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">4-7 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">FocusRobin</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">Other Countries</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">9-14 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">Other Brands</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">All Countries</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">7-15 days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-base font-semibold text-foreground mb-2"><TranslatableText text="Sunglasses (Non-Prescription)" /></h5>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Brand</TableHead>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Country</TableHead>
                      <TableHead className="font-medium text-center border text-sm sm:text-base">Standard Shipping</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">FocusRobin</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">Lithuania</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">2-4 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">FocusRobin</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">Other Countries</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">4-7 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center border text-sm sm:text-base">Other Brands</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">All Countries</TableCell>
                      <TableCell className="text-center border text-sm sm:text-base">7-9 days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mt-3">
              <strong>Note:</strong> If your order contains both prescription glasses and sunglasses, the delivery time will be calculated based on prescription glasses (longer delivery time) as all items ship together.
            </p>
          </div>

          <div>
            <h3 className="text-brand-h3 font-headline text-foreground mb-4">Returns Policy</h3>
            <p className="text-sm sm:text-base mb-3">
              We accept returns and exchanges only if there is a defect from our side or an error in the order.
              Returns must be initiated within 14 days of purchase and frames must be in their original condition with all packaging and accessories.
            </p>
            <p className="text-sm sm:text-base">
              <strong>Eligible for return:</strong> Manufacturing defects, damaged items received, wrong item shipped, or items not matching the description.
            </p>
          </div>
        </div>
      </TabsContent>


    </Tabs>
  );
}

