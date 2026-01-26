"use client";

import TranslatableText from "@/components/ui/TranslatableText";

export default function LensFeatureSection() {
  return (
    <section className="py-8 sm:py-12 md:py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center">
        {/* Left side - Minimalist Wave Design */}
        <div className="flex justify-center relative py-8 sm:py-12">
          <div className="relative w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] mx-auto">
            {/* Wavy circles */}
            <div className="relative w-full aspect-square rounded-full bg-white shadow-2xl p-6 sm:p-8 overflow-visible">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#4DCECA" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#4DCECA" strokeWidth="1" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="#4DCECA" strokeWidth="1" />
                </svg>
              </div>
              
              {/* Center element */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-[60%] aspect-square rounded-full bg-gradient-to-br from-teal-primary to-[#4DCECA] flex items-center justify-center shadow-xl">
                  <div className="w-[66%] aspect-square rounded-full bg-white flex items-center justify-center">
                    <div className="text-center px-1 sm:px-2">
                      <div className="text-teal-primary mb-0.5 sm:mb-1 font-headline font-bold text-[10px] sm:text-xs md:text-sm lg:text-base"><TranslatableText text="UV 400" /></div>
                      <div className="text-teal-primary text-[8px] sm:text-[10px] md:text-xs font-headline font-bold"><TranslatableText text="PROTECTION" /></div>
                    </div>
                  </div>
              </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 md:-top-4 md:-right-4 bg-teal-primary text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full shadow-lg text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap">
              <TranslatableText text="100% Safe" />
            </div>
            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 md:-bottom-4 md:-left-4 bg-white text-teal-primary px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full shadow-lg text-[10px] sm:text-xs md:text-sm font-semibold border-2 border-teal-primary whitespace-nowrap">
              <TranslatableText text="Triple Layer" />
            </div>
          </div>
        </div>
        
        {/* Right side - Clean List Design */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-brand-h2 font-headline text-teal-primary leading-tight break-words">
              <TranslatableText text="UV 400 PROTECTION" />
            </h2>
            <p className="text-slate-700 text-sm sm:text-base md:text-lg">
              <TranslatableText text="Premium lens technology with three protective layers designed for your eye safety." />
            </p>
          </div>

          {/* Features with numbers */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-[rgba(77,206,202,0.15)] flex items-center justify-center text-teal-primary group-hover:bg-teal-primary group-hover:text-white transition-all duration-300 font-bold text-xs sm:text-sm md:text-base">
                  01
                </div>
              </div>
              <div className="flex-1 pt-0.5 sm:pt-1 md:pt-2 min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-brand-h3 font-headline text-gray-800 mb-0.5 sm:mb-1 md:mb-2 leading-tight break-words"><TranslatableText text="Scratch Resistant" /></h3>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">
                  <TranslatableText text="Durable hardened coating for long-lasting protection" />
                </p>
                <div className="mt-1.5 sm:mt-2 md:mt-3 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-[rgba(77,206,202,0.3)] flex items-center justify-center text-teal-primary group-hover:bg-teal-primary group-hover:text-white transition-all duration-300 font-bold text-xs sm:text-sm md:text-base">
                  02
                </div>
              </div>
              <div className="flex-1 pt-0.5 sm:pt-1 md:pt-2 min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-brand-h3 font-headline text-gray-800 mb-0.5 sm:mb-1 md:mb-2 leading-tight break-words"><TranslatableText text="Anti-Reflective" /></h3>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">
                  <TranslatableText text="Reduces glare and enhances visual clarity" />
                </p>
                <div className="mt-1.5 sm:mt-2 md:mt-3 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-5/6 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full" />
                </div>
              </div>
            </div>
              
            <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-teal-primary flex items-center justify-center text-white group-hover:bg-[#3db8b4] transition-all duration-300 shadow-lg font-bold text-xs sm:text-sm md:text-base">
                  03
                </div>
              </div>
              <div className="flex-1 pt-0.5 sm:pt-1 md:pt-2 min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-brand-h3 font-headline text-gray-800 mb-0.5 sm:mb-1 md:mb-2 leading-tight break-words"><TranslatableText text="UV 400 Core" /></h3>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">
                  <TranslatableText text="Blocks 100% of harmful UVA and UVB rays" />
                </p>
                <div className="mt-1.5 sm:mt-2 md:mt-3 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-teal-primary to-[#3db8b4] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
