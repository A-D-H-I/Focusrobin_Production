export default function LensFeatureSection() {
  return (
    <section className="py-12 sm:py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        {/* Left side - Minimalist Wave Design */}
        <div className="flex justify-center relative py-8 sm:py-12">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] mx-auto">
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
                    <div className="text-center px-2">
                      <div className="text-teal-primary mb-0.5 sm:mb-1 font-headline font-bold text-xs sm:text-sm md:text-base">UV 400</div>
                      <div className="text-teal-primary text-[10px] sm:text-xs font-headline font-bold">PROTECTION</div>
                    </div>
                  </div>
              </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-teal-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
              100% Safe
            </div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-white text-teal-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-semibold border-2 border-teal-primary whitespace-nowrap">
              Triple Layer
            </div>
          </div>
        </div>
        
        {/* Right side - Clean List Design */}
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-teal-primary leading-tight">UV 400 PROTECTION</h2>
            <p className="text-slate-700 text-base sm:text-lg">
              Premium lens technology with three protective layers designed for your eye safety.
            </p>
          </div>

          {/* Features with numbers */}
          <div className="space-y-5 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4 md:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[rgba(77,206,202,0.15)] flex items-center justify-center text-teal-primary group-hover:bg-teal-primary group-hover:text-white transition-all duration-300 font-bold text-sm sm:text-base">
                  01
                </div>
              </div>
              <div className="flex-1 pt-1 sm:pt-2">
                <h3 className="text-gray-800 mb-1 sm:mb-2 font-bold text-base sm:text-lg">Scratch Resistant</h3>
                <p className="text-gray-700 text-sm sm:text-base">
                  Durable hardened coating for long-lasting protection
                </p>
                <div className="mt-2 sm:mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 sm:gap-4 md:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[rgba(77,206,202,0.3)] flex items-center justify-center text-teal-primary group-hover:bg-teal-primary group-hover:text-white transition-all duration-300 font-bold text-sm sm:text-base">
                  02
                </div>
              </div>
              <div className="flex-1 pt-1 sm:pt-2">
                <h3 className="text-gray-800 mb-1 sm:mb-2 font-bold text-base sm:text-lg">Anti-Reflective</h3>
                <p className="text-gray-700 text-sm sm:text-base">
                  Reduces glare and enhances visual clarity
                </p>
                <div className="mt-2 sm:mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-5/6 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full" />
                </div>
                </div>
              </div>
              
            <div className="flex gap-3 sm:gap-4 md:gap-6 items-start group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-primary flex items-center justify-center text-white group-hover:bg-[#3db8b4] transition-all duration-300 shadow-lg font-bold text-sm sm:text-base">
                  03
                </div>
              </div>
              <div className="flex-1 pt-1 sm:pt-2">
                <h3 className="text-gray-800 mb-1 sm:mb-2 font-bold text-base sm:text-lg">UV 400 Core</h3>
                <p className="text-gray-700 text-sm sm:text-base">
                  Blocks 100% of harmful UVA and UVB rays
                </p>
                <div className="mt-2 sm:mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
