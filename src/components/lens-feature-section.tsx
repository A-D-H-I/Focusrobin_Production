export default function LensFeatureSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
        {/* Left side - Text content */}
        <div className="text-left">
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6 text-gray-800">
            Advanced Lens Technology
          </h2>
          <p className="text-base md:text-lg text-gray-700 mb-8 leading-relaxed">
            Our proprietary UV 400 protection system combines multiple layers of cutting-edge technology to deliver unparalleled clarity and protection for your eyes.
          </p>
          
          {/* Bullet points */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-gray-800">UV 400 Protection:</span>
                <span className="text-gray-700"> Blocks 100% of harmful UVA and UVB rays</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-gray-800">Anti-Reflective Coating:</span>
                <span className="text-gray-700"> Reduces glare and enhances visual clarity</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-gray-800">Scratch Resistance:</span>
                <span className="text-gray-700"> Durable hardened coating for long-lasting protection</span>
              </div>
            </li>
          </ul>
        </div>
        
        {/* Right side - Diagram */}
        <div className="relative h-96 w-full flex items-center justify-center pr-40">
          {/* Outermost layer - Scratch Resistant */}
          <div className="absolute w-72 h-72 rounded-full border-4 border-teal-500/30 flex items-center justify-center">
            {/* Label positioned at top-right */}
            <div className="absolute top-14 right-2 translate-x-full">
              <div className="w-12 h-0.5 bg-teal-500 absolute left-0 top-1/2 -translate-y-1/2"></div>
              <div className="ml-14 text-sm font-medium text-teal-600 whitespace-nowrap">
                Scratch Resistant
              </div>
            </div>
          </div>
          
          {/* Middle layer - Anti-Reflective */}
          <div className="absolute w-56 h-56 rounded-full border-4 border-teal-500/40 flex items-center justify-center">
            {/* Label positioned at middle-right */}
            <div className="absolute top-1/2 left-24 translate-x-full -translate-y-1/2">
              <div className="w-14 h-0.5 bg-teal-500 absolute right-28 top-1/2 -translate-y-1/2"></div>
              <div className="ml-12 text-sm font-medium text-teal-600 whitespace-nowrap">
                Anti-Reflective
              </div>
            </div>
          </div>
          
          {/* Innermost layer - UV 400 Core */}
          <div className="absolute w-40 h-40 rounded-full bg-teal-500 flex items-center justify-center">
            {/* Label positioned at bottom-right */}
            <div className="absolute bottom-8 left-24 translate-x-full">
              <div className="w-24 h-0.5 bg-teal-500 absolute right-24 top-1/2 -translate-y-1/2"></div>
              <div className="ml-10 text-sm font-medium text-teal-600 whitespace-nowrap">
                UV 400 Core
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
