"use client";

import { useState, useMemo } from "react";
import * as React from "react";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import FilterSidebar from "@/components/shop/filter-sidebar";
import ProductGrid from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { Filter, Eye, Glasses } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllProducts } from "@/lib/productData";

export default function ShopPage() {
  const [filtersApplied, setFiltersApplied] = useState(0);
  // Memoize products to avoid recalculation on re-renders
  const products = React.useMemo(() => getAllProducts(), []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 py-8">
            <div className="hidden md:block md:w-1/4 lg:w-1/5 self-start sticky top-24">
               <div className="h-[calc(100vh-7rem)] overflow-y-auto">
                <h2 className="text-2xl font-bold font-headline mb-4">
                  Filters ({filtersApplied})
                </h2>
                <FilterSidebar />
              </div>
            </div>
            <div className="w-full md:w-3/4 lg:w-4/5">
              <div className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <div className="w-full sm:w-auto text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold">
                      Best Sellers Glasses
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Results: {products.length}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" className="rounded-r-none border-r text-xs sm:text-sm px-2 sm:px-4">
                        <Glasses className="mr-1 sm:mr-2 h-4 w-4" />
                        Product View
                      </Button>
                      <Button variant="ghost" className="rounded-l-none text-muted-foreground text-xs sm:text-sm px-2 sm:px-4">
                        <Eye className="mr-1 sm:mr-2 h-4 w-4" />
                        Try-On View
                      </Button>
                    </div>
                    <Select defaultValue="recommend">
                      <SelectTrigger className="w-auto sm:w-[180px]">
                        <span className="text-muted-foreground mr-1 hidden sm:inline">Sort by:</span>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recommend">Recommend</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="md:hidden mb-6">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters ({filtersApplied})
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[300px] sm:w-[400px] p-0"
                    >
                      <SheetHeader className="p-6 pb-0">
                        <SheetTitle className="text-2xl font-bold font-headline">
                          Filters ({filtersApplied})
                        </SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100%-4rem)]">
                        <div className="p-6">
                          <FilterSidebar />
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <ProductGrid />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
