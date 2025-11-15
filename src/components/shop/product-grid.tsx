import { getAllProducts } from "@/lib/productData";
import ProductCard from "./product-card";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const AdCard = () => (
    <Card className="overflow-hidden group relative border-none aspect-[1/1] flex flex-col justify-center items-center text-center">
        <Image src="/506.jpg" alt="Summer Sale" fill className="object-cover"/>
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <CardContent className="relative z-20 p-6 text-white">
            <p className="font-bold text-sm drop-shadow-lg">5% OFF</p>
            <h3 className="text-2xl font-bold font-headline my-2 drop-shadow-lg">On First Orders</h3>
            <Button variant="secondary" className="mt-4">Shop Now</Button>
        </CardContent>
    </Card>
)

export default function ProductGrid() {
    const allProducts = getAllProducts();
    const allItems = [...allProducts];
    // Insert ad at position 2 (index 2)
    const itemsWithAd = [...allItems.slice(0, 2), 'ad', ...allItems.slice(2)];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {itemsWithAd.map((item, index) => {
        if (item === 'ad') {
            return <AdCard key="ad" />
        }
        // Only prioritize first 6 images (above the fold)
        return <ProductCard key={item.id} product={item} priority={index < 6} />
      })}
    </div>
  );
}

