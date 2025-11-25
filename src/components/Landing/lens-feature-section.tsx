export default function LensFeatureSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 md:gap-16 items-center overflow-x-hidden">
        {/* Left side - Text content */}
        <div className="text-left overflow-hidden">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-6 text-gray-800 break-words">
            Advanced Lens Technology
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-8 leading-relaxed break-words">
            Our proprietary UV 400 protection system combines multiple layers of cutting-edge technology to deliver unparalleled clarity and protection for your eyes.
          </p>
          
          {/* Bullet points */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-primary mt-2 flex-shrink-0"></div>
              <div className="min-w-0 flex-1 break-words">
                <span className="font-semibold text-gray-800">UV 400 Protection:</span>
                <span className="text-gray-700"> Blocks 100% of harmful UVA and UVB rays</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-primary mt-2 flex-shrink-0"></div>
              <div className="min-w-0 flex-1 break-words">
                <span className="font-semibold text-gray-800">Anti-Reflective Coating:</span>
                <span className="text-gray-700"> Reduces glare and enhances visual clarity</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-primary mt-2 flex-shrink-0"></div>
              <div className="min-w-0 flex-1 break-words">
                <span className="font-semibold text-gray-800">Scratch Resistance:</span>
                <span className="text-gray-700"> Durable hardened coating for long-lasting protection</span>
              </div>
            </li>
          </ul>
        </div>
        
        {/* Right side - Diagram */}
        <div className="relative h-64 md:h-80 lg:h-96 w-full flex items-center justify-center overflow-visible">
          <div className="relative w-full max-w-full h-full">
            {/* Circles container - centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* Outermost layer - Scratch Resistant */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full border-4 border-[rgba(77,206,202,0.3)]"></div>
              
              {/* Middle layer - Anti-Reflective */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full border-4 border-[rgba(77,206,202,0.4)]"></div>
              
              {/* Innermost layer - UV 400 Core */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-teal-primary"></div>
            </div>
            
            {/* Labels container - ensures all labels align to the same right edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-2 sm:pr-3 md:pr-4 lg:pr-6">
              {/* Scratch Resistant Label - aligns with top-right of outermost circle */}
              <div className="absolute -top-[96px] md:-top-[128px] lg:-top-[144px] right-0 flex items-center">
                <div className="w-8 sm:w-10 md:w-12 lg:w-16 h-0.5 bg-teal-primary mr-2 sm:mr-2.5 md:mr-3 lg:mr-4 flex-shrink-0"></div>
                <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary whitespace-nowrap">
                  Scratch Resistant
                </div>
              </div>
              
              {/* Anti-Reflective Label - aligns with right-middle of middle circle */}
              <div className="absolute top-0 right-0 flex items-center">
                <div className="w-8 sm:w-10 md:w-12 lg:w-16 h-0.5 bg-teal-primary mr-2 sm:mr-2.5 md:mr-3 lg:mr-4 flex-shrink-0"></div>
                <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary whitespace-nowrap">
                  Anti-Reflective
                </div>
              </div>
              
              {/* UV 400 Core Label - aligns with bottom-right of innermost circle */}
              <div className="absolute top-[56px] md:top-[72px] lg:top-[80px] right-0 flex items-center">
                <div className="w-8 sm:w-10 md:w-12 lg:w-16 h-0.5 bg-teal-primary mr-2 sm:mr-2.5 md:mr-3 lg:mr-4 flex-shrink-0"></div>
                <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary whitespace-nowrap">
                  UV 400 Core
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
