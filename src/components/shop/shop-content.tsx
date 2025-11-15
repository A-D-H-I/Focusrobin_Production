
"use client";

import { Button } from "@/components/ui/button";
import ProductGrid from "@/components/shop/product-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Glasses } from "lucide-react";
import { products } from "@/lib/shopData";

export default function ShopContent() {
  return (
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
      <ProductGrid />
    </div>
  );
}

