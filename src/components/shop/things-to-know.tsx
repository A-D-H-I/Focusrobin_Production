
"use client";

import Image from "next/image";
import { Leaf, Diamond, Hourglass, BrainCircuit } from 'lucide-react';

const features = [
    {
        id: "feature-polarized",
        title: "POLARIZED LENSES:",
        description: "Our sunglasses feature polarized lenses designed to reduce reflections and enhance your visual comfort.",
        image: "/produc_ spec/polarized-2.webp"
    },
    {
        id: "feature-cat3",
        title: "CAT3 (UV400):",
        description: "Dark lenses are primarily designed to reduce eyestrain and minimize glare in moderate-to-bright conditions. Whether you need sunglasses for outdoor activities or everyday use, these are a great choice.",
        image: "/produc_ spec/cat-1.webp"
    },
    {
        id: "feature-layers",
        title: "ANTISCRATCH & HYDROPHOBIC:",
        description: "The anti-scratch coating last longer by resisting scratches, while hydrophobic coating prevent water and fog from sticking to the surface for better vision.",
        image: "/produc_ spec/coating-2.webp"
    },
];



import { Product } from "@/lib/productData";

interface ThingsToKnowProps {
    product?: Product;
}

export default function ThingsToKnow({ product }: ThingsToKnowProps) {
    if (product && product.brand && product.brand.trim().toLowerCase() !== 'focusrobin') {
        return null;
    }

    const showDynamic = product?.showHighlights && product.highlights && product.highlights.length > 0;
    const highlights = product?.highlights || [];

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h2 className="text-brand-h2 font-headline">THINGS TO KNOW BEFORE YOU <span className="text-primary">BUY OUR PRODUCTS</span></h2>
                    <p className="text-muted-foreground mt-2">SOME OF THE MOST IMPORTANT FEATURES OF OUR GLASSES.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {showDynamic ? (
                        highlights.map((highlight, index) => (
                            <div key={highlight.id || index} className="text-center">
                                <div className="relative w-full rounded-lg overflow-hidden mb-4 shadow-lg bg-muted flex items-center justify-center">
                                    <Image
                                        src={highlight.imageUrl}
                                        alt={highlight.title}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-auto aspect-[4/3]"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                </div>
                                <h3 className="font-bold mb-2 uppercase">{highlight.title}</h3>
                                <p className="text-sm text-muted-foreground">{highlight.description}</p>
                            </div>
                        ))
                    ) : (
                        <>
                            {features.map(feature => (
                                <div key={feature.id} className="text-center">
                                    <div className="relative w-full rounded-lg overflow-hidden mb-4 shadow-lg bg-muted flex items-center justify-center">
                                        <Image
                                            src={feature.image}
                                            alt={feature.title}
                                            width={400}
                                            height={300}
                                            className="object-contain w-full h-auto"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            priority
                                        />
                                    </div>
                                    <h3 className="font-bold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            ))}
                            <div className="text-center">
                                <div className="relative w-full rounded-lg overflow-hidden mb-4 shadow-lg bg-muted flex items-center justify-center">
                                    <Image
                                        src="/produc_ spec/bio-based.webp"
                                        alt="Bio-based & Earth-friendly"
                                        width={400}
                                        height={300}
                                        className="object-contain w-full h-auto"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        priority
                                    />
                                </div>

                                <h3 className="font-bold mb-2">BIOBASED & EARTH-FRIENDLY:</h3>
                                <p className="text-sm text-muted-foreground">Our sunglasses are crafted using biodegradable acetate and partially biodegradable materials, offering a stylish look with a minimal environmental footprint. Each pair is thoughtfully packaged in biodegradable and recycled materials, supporting a cleaner planet.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

