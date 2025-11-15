
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDimensions from "./product-dimensions";
import type { Product } from "@/lib/productData";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const packages = [
    { name: "Standard Lenses", price: "+$0", description: "High-quality, scratch-resistant polycarbonate lenses." },
    { name: "Blue Light Filtering", price: "+$49", description: "Reduces eye strain from digital screens. Ideal for office use." },
    { name: "Transitions® Lenses", price: "+$99", description: "Automatically adapts to changing light conditions, from clear indoors to dark outdoors." },
    { name: "Premium Thin Lenses", price: "+$129", description: "Thinner & lighter lenses for stronger prescriptions, providing superior aesthetics and comfort." },
]

export default function ProductDetailsTabs({ product }: { product: Product }) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
        <TabsTrigger value="details">Product Details</TabsTrigger>
        <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
        <TabsTrigger value="lenses">Lens Recommendations</TabsTrigger>
        <TabsTrigger value="story">Design Story</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="py-4 sm:py-8 px-2">
        <div className="space-y-6 sm:space-y-8">
            <ProductDimensions />
            <div>
                <h3 className="font-bold text-foreground font-headline mb-4 text-base sm:text-lg text-center">Specifications</h3>
                <div className="overflow-x-auto">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">SKU</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">GJGX953761-01</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Collection</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Artsy</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Shape</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Geometric</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Materials</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Mixed Acetate & Metal</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Frame Weight</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">26.1g</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Fitting</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Wide Face</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Bridge Fit</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Universal Fit</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Adjustable Nosepads</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">Yes</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium text-center border text-sm sm:text-base">Spring Hinge</TableCell>
                                <TableCell className="text-center border text-sm sm:text-base">No</TableCell>
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

       <TabsContent value="lenses" className="py-4 sm:py-8 px-2">
        <h3 className="font-bold text-foreground font-headline mb-4 sm:mb-6 text-lg sm:text-xl">Choose Your Premium Lens Package</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {packages.map(pkg => (
                <div key={pkg.name} className="border rounded-lg p-4 sm:p-6 flex flex-col text-center items-center hover:shadow-lg hover:border-primary transition-all">
                    <h4 className="font-bold font-headline text-base sm:text-lg mb-2">{pkg.name}</h4>
                    <p className="text-primary font-bold text-lg sm:text-xl mb-3 sm:mb-4">{pkg.price}</p>
                    <p className="text-xs sm:text-sm text-foreground/80 flex-grow">{pkg.description}</p>
                </div>
            ))}
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

