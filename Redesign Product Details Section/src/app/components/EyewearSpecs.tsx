import { motion } from 'motion/react';

export function EyewearSpecs() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-16">
      {/* Frame Width View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-20"
      >
        {/* Frame Width Label */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-1">Frame width</p>
          <p className="text-3xl font-semibold text-gray-900">144.6mm</p>
        </div>

        {/* Frame Width Indicator Line */}
        <div className="relative mb-12 max-w-[592px] mx-auto">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-800 flex-shrink-0"></div>
            <div className="flex-1 h-[2px] border-t-2 border-dashed border-gray-400"></div>
            <div className="w-3 h-3 rounded-full bg-gray-800 flex-shrink-0"></div>
          </div>
        </div>

        {/* Glasses Front View */}
        <div className="relative flex items-center justify-center gap-6 mt-24">
          {/* Left Lens */}
          <div className="relative">
            <div className="w-44 h-32 border-4 border-gray-800 rounded-full relative">
              {/* Lens Width Indicator Line */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-2 h-2 rounded-full bg-gray-800 flex-shrink-0"></div>
                <div className="flex-1 h-[2px] border-t-2 border-dashed border-gray-400"></div>
                <div className="w-2 h-2 rounded-full bg-gray-800 flex-shrink-0"></div>
              </div>
              
              {/* Lens Width Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
                <p className="text-xs text-gray-500 mb-0.5">Lens width</p>
                <p className="text-lg font-semibold text-gray-900">54mm</p>
              </div>
              
              {/* Bridge Line Indicator (left side) */}
              <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800"></div>
            </div>
            
            {/* Temple Arm Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
              <div className="w-8 h-1 bg-gray-800"></div>
              <div className="w-2 h-2 bg-gray-800 rounded-sm -ml-1 -mt-0.5"></div>
            </div>
          </div>

          {/* Bridge */}
          <div className="relative">
            <div className="w-20 h-1 bg-gray-800"></div>
            {/* Bridge Label */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <p className="text-xs text-gray-500 mb-0.5">Bridge</p>
              <p className="text-lg font-semibold text-gray-900">18mm</p>
            </div>
          </div>

          {/* Right Lens */}
          <div className="relative">
            <div className="w-44 h-32 border-4 border-gray-800 rounded-full relative">
              {/* Lens Height Indicator - Top Segment */}
              <div className="absolute top-2 left-4 flex flex-col items-center h-10">
                <div className="w-2 h-2 rounded-full bg-gray-800 flex-shrink-0"></div>
                <div className="flex-1 w-[2px] border-l-2 border-dashed border-gray-400"></div>
              </div>
              
              {/* Lens Height Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xs text-gray-500 mb-0.5 whitespace-nowrap">Lens height</p>
                <p className="text-lg font-semibold text-gray-900">32.9mm</p>
              </div>

              {/* Lens Height Indicator - Bottom Segment */}
              <div className="absolute bottom-2 left-4 flex flex-col items-center h-10">
                <div className="flex-1 w-[2px] border-l-2 border-dashed border-gray-400"></div>
                <div className="w-2 h-2 rounded-full bg-gray-800 flex-shrink-0"></div>
              </div>

              {/* Bridge Line Indicator (right side) */}
              <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800"></div>
            </div>
            
            {/* Temple Arm Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-2 h-2 bg-gray-800 rounded-sm -mr-1 -mt-0.5"></div>
              <div className="w-8 h-1 bg-gray-800"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Temple Length View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="border-t border-gray-200 pt-16"
      >
        <div className="max-w-md mx-auto">
          {/* Temple Label */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-gray-900">145mm</p>
          </div>

          {/* Temple Arm Illustration */}
          <div className="relative">
            <svg viewBox="0 0 400 80" className="w-full h-auto">
              {/* Measurement Line */}
              <line x1="50" y1="20" x2="350" y2="20" stroke="#9ca3af" strokeWidth="2" />
              <line x1="50" y1="15" x2="50" y2="25" stroke="#1f2937" strokeWidth="2" />
              <line x1="350" y1="15" x2="350" y2="25" stroke="#1f2937" strokeWidth="2" />
              
              {/* Temple Arm Shape */}
              <path
                d="M 50 45 L 280 45 Q 320 45 340 55 L 355 65"
                fill="none"
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Hinge */}
              <rect x="45" y="40" width="10" height="10" fill="#1f2937" rx="1" />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}