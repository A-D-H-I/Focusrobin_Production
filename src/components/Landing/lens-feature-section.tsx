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
        <div className="relative h-64 md:h-80 lg:h-96 w-full flex items-center justify-center">
          <div className="relative w-full max-w-full overflow-visible">
            {/* Outermost layer - Scratch Resistant */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full border-4 flex items-center justify-center border-[rgba(77,206,202,0.3)]">
              {/* Label positioned at top-right */}
              <div className="absolute top-8 md:top-12 lg:top-14 left-full md:left-[calc(100%+0.5rem)] lg:left-[calc(100%+0.5rem)] ml-2 md:ml-0">
                <div className="w-6 md:w-10 lg:w-12 h-0.5 bg-teal-primary absolute left-0 top-1/2 -translate-y-1/2"></div>
                <div className="ml-8 md:ml-12 lg:ml-14 text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary break-words max-w-[80px] md:max-w-none md:whitespace-nowrap">
                  Scratch Resistant
                </div>
              </div>
            </div>
            
            {/* Middle layer - Anti-Reflective */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full border-4 flex items-center justify-center border-[rgba(77,206,202,0.4)]">
              {/* Label positioned at middle-right */}
              <div className="absolute top-1/2 left-full md:left-[calc(100%+0.5rem)] lg:left-[calc(100%+0.5rem)] translate-y-[-50%] ml-2 md:ml-0">
                <div className="w-6 md:w-10 lg:w-14 h-0.5 bg-teal-primary absolute left-0 top-1/2 -translate-y-1/2"></div>
                <div className="ml-8 md:ml-10 lg:ml-12 text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary break-words max-w-[80px] md:max-w-none md:whitespace-nowrap">
                  Anti-Reflective
                </div>
              </div>
            </div>
            
            {/* Innermost layer - UV 400 Core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-teal-primary flex items-center justify-center">
              {/* Label positioned at bottom-right */}
              <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 left-full md:left-[calc(100%+0.5rem)] lg:left-[calc(100%+0.5rem)] ml-2 md:ml-0">
                <div className="w-6 md:w-16 lg:w-24 h-0.5 bg-teal-primary absolute left-0 top-1/2 -translate-y-1/2"></div>
                <div className="ml-8 md:ml-9 lg:ml-10 text-[10px] md:text-xs lg:text-sm font-medium text-teal-primary break-words max-w-[80px] md:max-w-none md:whitespace-nowrap">
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
