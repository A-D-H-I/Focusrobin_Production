"use client";

import { useInView } from "react-intersection-observer";
import { Sparkles, Gem, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const valueProps = [
  {
    icon: Sparkles,
    title: "Crystal Clarity",
    description: "Our lenses provide unparalleled sharpness and color accuracy.",
  },
  {
    icon: Gem,
    title: "Premium Quality",
    description: "Crafted from the finest materials for durability and comfort.",
  },
  {
    icon: ShieldCheck,
    title: "1-Year Warranty",
    description: "We stand by our products with a comprehensive warranty.",
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
      <div className="bg-primary/10 p-5 rounded-full mb-6">
        <prop.icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-headline mb-2">{prop.title}</h3>
      <p className="text-foreground/70">{prop.description}</p>
    </div>
  );
}

export default function ValuePropsSection() {
  return (
    <section className="py-16 sm:py-24">
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
