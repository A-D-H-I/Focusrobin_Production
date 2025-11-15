
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Leaf, Diamond, Hourglass, BrainCircuit } from 'lucide-react';

const features = [
    {
        id: "feature-polarized",
        title: "POLARIZED LENSES:",
        description: "Our sunglasses feature polarized lenses designed to reduce reflections and enhance your visual comfort.",
        imageHint: "new york"
    },
    {
        id: "feature-cat3",
        title: "CAT3 (UV400):",
        description: "Dark lenses are primarily designed to reduce eyestrain and minimize glare in moderate-to-bright conditions. Whether you need sunglasses for outdoor activities or everyday use, these are a great choice.",
        imageHint: "sunglasses side"
    },
    {
        id: "feature-layers",
        title: "ANTISCRATCH & HYDROPHOBIC:",
        description: "The anti-scratch coating last longer by resisting scratches, while hydrophobic coating prevent water and fog from sticking to the surface for better vision.",
        imageHint: "lens diagram"
    },
];

const bioFeatures = [
    { icon: Leaf, text: "RENEWABLE ENERGY" },
    { icon: Diamond, text: "HIGH QUALITY" },
    { icon: Hourglass, text: "DURABLE GLASSES" },
    { icon: BrainCircuit, text: "SUSTAINABLE DEVELOPMENT" },
]

export default function ThingsToKnow() {
    return (
        <section className="w-full">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold font-headline">THINGS TO KNOW BEFORE YOU <span className="text-primary">BUY OUR PRODUCTS</span></h2>
                    <p className="text-muted-foreground mt-2">SOME OF THE MOST IMPORTANT FEATURES OF OUR GLASSES.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map(feature => {
                    const image = PlaceHolderImages.find(img => img.id === feature.id);
                    return (
                        <div key={feature.id} className="text-center">
                            {image && (
                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4 shadow-lg">
                                    <Image 
                                        src={image.imageUrl} 
                                        alt={feature.title} 
                                        fill
                                        className="object-cover"
                                        data-ai-hint={image.imageHint}
                                    />
                                </div>
                            )}
                            <h3 className="font-bold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    )
                })}
                 <div className="text-center">
                    <div className="grid grid-cols-2 gap-y-6 mb-4">
                        {bioFeatures.map(f => (
                             <div key={f.text} className="flex flex-col items-center">
                                <f.icon className="h-10 w-10 text-primary mb-2"/>
                                <p className="text-xs font-bold">{f.text}</p>
                            </div>
                        ))}
                    </div>
                    <h3 className="font-bold mb-2">BIOBASED & EARTH-FRIENDLY:</h3>
                    <p className="text-sm text-muted-foreground">Our sunglasses are crafted using biodegradable acetate and partially biodegradable materials, offering a stylish look with a minimal environmental footprint. Each pair is thoughtfully packaged in biodegradable and recycled materials, supporting a cleaner planet.</p>
                </div>
            </div>
            </div>
        </section>
    );
}

