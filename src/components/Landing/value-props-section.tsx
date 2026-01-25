"use client";

import { useInView } from "react-intersection-observer";
import { Sparkles, Gem, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import TranslatableText from "@/components/ui/TranslatableText";

const valueProps = [
  {
    icon: Sparkles,
    title: "Fast Delivery Lithuania & EU",
    description: "Fast delivery of FocusRobin sunglasses and prescription glasses to Vilnius, Kaunas, Klaipėda, and across the EU/Schengen. Free shipping in Lithuania.",
  },
  {
    icon: Gem,
    title: "Premium Quality Eyewear",
    description: "FocusRobin glasses are crafted from premium materials with UV400 protection and polarized lenses for superior comfort and durability.",
  },
  {
    icon: ShieldCheck,
    title: "1-Year Warranty",
    description: "Every pair of FocusRobin sunglasses and prescription glasses comes with a comprehensive 1-year warranty. Shop with confidence.",
  },
];

function ValuePropItem({ prop, index }: { prop: typeof valueProps[0]; index: number }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center text-center p-6 transition-all duration-700 ease-in-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ 
        transitionDelay: `${index * 200}ms`,
        willChange: "transform, opacity",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden"
      }}
    >
      <div className="bg-[rgba(77,206,202,0.15)] p-5 rounded-full mb-6">
        <prop.icon className="h-10 w-10 text-teal-primary" />
      </div>
      <h3 className="text-brand-h3 font-headline mb-2 text-gray-800"><TranslatableText text={prop.title} /></h3>
      <p className="text-gray-600"><TranslatableText text={prop.description} /></p>
    </div>
  );
}

export default function ValuePropsSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => (
            <ValuePropItem key={prop.title} prop={prop} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
