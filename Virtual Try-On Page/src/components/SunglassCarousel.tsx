import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Sunglass {
  id: number;
  name: string;
  color: string;
  gradient: string;
  frameColor: string;
  lensGradient: string;
  price: number;
  originalPrice?: number;
}

interface SunglassCarouselProps {
  sunglasses: Sunglass[];
  selectedGlass: Sunglass;
  onSelectGlass: (glass: Sunglass) => void;
}

export function SunglassCarousel({ sunglasses, selectedGlass, onSelectGlass }: SunglassCarouselProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-white mb-2">Choose Your Style</h2>
        <p className="text-purple-300">Click to try on</p>
      </motion.div>

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        {sunglasses.map((glass, index) => (
          <motion.div
            key={glass.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              rotateY: hoveredId === glass.id ? [0, 15, -15, 0] : 0,
              z: hoveredId === glass.id ? 50 : 0,
            }}
            transition={{ 
              delay: index * 0.1,
              rotateY: { duration: 0.6, ease: "easeInOut" }
            }}
            whileHover={{ 
              scale: 1.05,
              y: [-5, -10, -5],
              transition: { 
                y: { 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                },
                scale: { duration: 0.2 }
              }
            }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: 1000,
            }}
            onClick={() => onSelectGlass(glass)}
            onMouseEnter={() => setHoveredId(glass.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="cursor-pointer"
          >
            <motion.div
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedGlass.id === glass.id
                  ? 'bg-white/20 border-white shadow-2xl'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              animate={{
                boxShadow: selectedGlass.id === glass.id 
                  ? ['0 0 20px rgba(168, 85, 247, 0.4)', '0 0 40px rgba(168, 85, 247, 0.6)', '0 0 20px rgba(168, 85, 247, 0.4)']
                  : '0 0 0px rgba(168, 85, 247, 0)',
              }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity }
              }}
            >
              {/* 3D floating animation container */}
              <motion.div
                animate={{
                  rotateX: hoveredId === glass.id ? [0, 5, -5, 0] : 0,
                  rotateZ: hoveredId === glass.id ? [0, 3, -3, 0] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredId === glass.id ? Infinity : 0,
                  ease: "easeInOut"
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Sunglasses preview */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="flex-shrink-0"
                    animate={{
                      rotate: hoveredId === glass.id ? [0, 360] : 0,
                    }}
                    transition={{
                      duration: 3,
                      repeat: hoveredId === glass.id ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <svg viewBox="0 0 300 100" className="w-24 h-24 drop-shadow-lg">
                      <defs>
                        <linearGradient id={`grad-${glass.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: glass.color, stopOpacity: 0.6 }} />
                          <stop offset="100%" style={{ stopColor: glass.color, stopOpacity: 0.9 }} />
                        </linearGradient>
                      </defs>
                      
                      {/* Frame */}
                      <path
                        d="M 20 40 Q 20 25 35 25 L 110 25 Q 125 25 125 40 L 125 60 Q 125 75 110 75 L 35 75 Q 20 75 20 60 Z"
                        fill={glass.frameColor}
                        stroke={glass.frameColor}
                        strokeWidth="2"
                      />
                      <path
                        d="M 175 40 Q 175 25 190 25 L 265 25 Q 280 25 280 40 L 280 60 Q 280 75 265 75 L 190 75 Q 175 75 175 60 Z"
                        fill={glass.frameColor}
                        stroke={glass.frameColor}
                        strokeWidth="2"
                      />
                      
                      {/* Lenses */}
                      <ellipse cx="72" cy="50" rx="45" ry="30" fill={`url(#grad-${glass.id})`} />
                      <ellipse cx="228" cy="50" rx="45" ry="30" fill={`url(#grad-${glass.id})`} />
                      
                      {/* Bridge */}
                      <rect x="125" y="45" width="50" height="6" rx="3" fill={glass.frameColor} />
                      
                      {/* Highlights */}
                      <ellipse cx="60" cy="40" rx="15" ry="10" fill="white" opacity="0.5" />
                      <ellipse cx="216" cy="40" rx="15" ry="10" fill="white" opacity="0.5" />
                    </svg>
                  </motion.div>

                  <div className="flex-1">
                    <h3 className="text-white mb-1">{glass.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-300">${glass.price}</span>
                      {glass.originalPrice && (
                        <span className="text-slate-500 line-through text-sm">${glass.originalPrice}</span>
                      )}
                    </div>
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${glass.gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: selectedGlass.id === glass.id ? '100%' : '60%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Particle effects on hover */}
                {hoveredId === glass.id && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        initial={{ 
                          x: '50%', 
                          y: '50%',
                          opacity: 1 
                        }}
                        animate={{
                          x: `${50 + Math.cos(i * Math.PI / 4) * 100}%`,
                          y: `${50 + Math.sin(i * Math.PI / 4) * 100}%`,
                          opacity: 0,
                          scale: [1, 2, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.div>

              {/* Selection indicator */}
              {selectedGlass.id === glass.id && (
                <motion.div
                  className="absolute -right-2 -top-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-white"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}