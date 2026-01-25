"use client";

import { useInView } from "react-intersection-observer";
import { Glasses, Truck, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import TranslatableText from "@/components/ui/TranslatableText";

const shippingSignals = [
  {
    icon: Glasses,
    text: "Minimalist sunglasses designed in Lithuania for everyday comfort.",
    iconBg: "bg-blue-500",
  },
  {
    icon: Truck,
    text: "Fast delivery of sunglasses to Vilnius, Kaunas, Klaipėda—and across the EU/Schengen.",
    iconBg: "bg-green-500",
  },
  {
    icon: Clock,
    title: "Fast Delivery",
    text: "Delivery within 2 days in Lithuania",
    iconBg: "bg-brand-teal",
    iconColor: "text-teal-primary",
    iconBgLight: "bg-[rgba(77,206,202,0.15)]",
  },
  {
    icon: Package,
    title: "Free Shipping",
    text: "Free shipping on orders over a certain amount",
    iconBg: "bg-brand-blue",
    iconColor: "text-brand-blue",
    iconBgLight: "bg-[rgba(59,130,246,0.15)]",
  },
];

function ShippingSignalCard({ signal, index }: { signal: typeof shippingSignals[0]; index: number }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // All items use vertical centered layout for single row
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 h-full flex flex-col items-center text-center transition-all duration-700 ease-in-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ 
        transitionDelay: `${index * 200}ms`,
        willChange: "transform, opacity",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden"
      }}
    >
      {index < 2 ? (
        // First two items: use solid colored icon background
        <div className={cn("flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4", signal.iconBg)}>
          <signal.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
        </div>
      ) : (
        // Last two items: use light colored icon background
        <div className={cn("flex-shrink-0 p-3 sm:p-4 md:p-5 rounded-full mb-3 sm:mb-4", signal.iconBgLight)}>
          <signal.icon className={cn("h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10", signal.iconColor)} />
        </div>
      )}
      {signal.title && (
        <h3 className="text-xs sm:text-sm md:text-brand-h3 font-headline mb-1 sm:mb-2 text-gray-800"><TranslatableText text={signal.title} /></h3>
      )}
      <p className={cn(
        "text-gray-600 break-words",
        index < 2 ? "text-[10px] sm:text-xs md:text-sm" : "text-[10px] sm:text-xs md:text-sm"
      )}>
        <TranslatableText text={signal.text} />
      </p>
    </div>
  );
}

export default function ShippingSignalsSection() {
  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {shippingSignals.map((signal, index) => (
            <ShippingSignalCard key={index} signal={signal} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

