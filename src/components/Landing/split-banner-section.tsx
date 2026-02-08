"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface SplitBannerData {
    id: string;
    title: string;
    leftImageUrl: string;
    leftLink: string;
    leftButtonText: string;
    rightImageUrl: string;
    rightLink: string;
    rightButtonText: string;
    isActive: boolean;
}

interface SplitBannerSectionProps {
    banner: SplitBannerData | null;
}

export default function SplitBannerSection({ banner }: SplitBannerSectionProps) {
    if (!banner || !banner.isActive) return null;

    return (
        <section className="container mx-auto px-4 py-8 md:py-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 font-headline">
                {banner.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-7xl mx-auto">
                {/* Left Section (e.g., Women) */}
                <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/3]">
                    <Image
                        src={normalizeImageUrl(banner.leftImageUrl)}
                        alt={banner.leftButtonText}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                    />
                    <div className="absolute inset-x-0 bottom-8 md:bottom-12 flex justify-center z-10">
                        <Link href={banner.leftLink} className="inline-block transition-transform duration-300 hover:scale-105">
                            <Button
                                className="rounded-full px-8 py-6 text-lg font-medium bg-white text-black hover:bg-white/90 shadow-lg border-none"
                            >
                                {banner.leftButtonText}
                            </Button>
                        </Link>
                    </div>
                    {/* Subtle overlay gradient at bottom for text readability if needed */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Right Section (e.g., Men) */}
                <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/3]">
                    <Image
                        src={normalizeImageUrl(banner.rightImageUrl)}
                        alt={banner.rightButtonText}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                    />
                    <div className="absolute inset-x-0 bottom-8 md:bottom-12 flex justify-center z-10">
                        <Link href={banner.rightLink} className="inline-block transition-transform duration-300 hover:scale-105">
                            <Button
                                className="rounded-full px-8 py-6 text-lg font-medium bg-white text-black hover:bg-white/90 shadow-lg border-none"
                            >
                                {banner.rightButtonText}
                            </Button>
                        </Link>
                    </div>
                    {/* Subtle overlay gradient at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
            </div>
        </section>
    );
}
