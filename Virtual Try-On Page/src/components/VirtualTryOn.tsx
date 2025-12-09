import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SunglassCarousel } from './SunglassCarousel';
import { Sparkles, Camera, RotateCcw, ShoppingCart } from 'lucide-react';

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

const sunglasses: Sunglass[] = [
  {
    id: 1,
    name: 'Ocean Wave',
    color: '#1e40af',
    gradient: 'from-blue-400 to-blue-600',
    frameColor: '#1e3a8a',
    lensGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.8))',
    price: 299,
    originalPrice: 399
  },
  {
    id: 2,
    name: 'Sunset Blaze',
    color: '#dc2626',
    gradient: 'from-orange-400 to-red-600',
    frameColor: '#991b1b',
    lensGradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.6), rgba(220, 38, 38, 0.8))',
    price: 349,
    originalPrice: 449
  },
  {
    id: 3,
    name: 'Midnight Black',
    color: '#0f172a',
    gradient: 'from-slate-700 to-slate-900',
    frameColor: '#020617',
    lensGradient: 'linear-gradient(135deg, rgba(51, 65, 85, 0.7), rgba(15, 23, 42, 0.9))',
    price: 279,
  },
  {
    id: 4,
    name: 'Emerald Dream',
    color: '#059669',
    gradient: 'from-emerald-400 to-emerald-700',
    frameColor: '#065f46',
    lensGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.6), rgba(5, 150, 105, 0.8))',
    price: 329,
    originalPrice: 429
  },
  {
    id: 5,
    name: 'Rose Gold',
    color: '#be185d',
    gradient: 'from-pink-400 to-rose-600',
    frameColor: '#9f1239',
    lensGradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.6), rgba(190, 24, 93, 0.8))',
    price: 399,
    originalPrice: 499
  },
  {
    id: 6,
    name: 'Purple Haze',
    color: '#7c3aed',
    gradient: 'from-purple-400 to-purple-700',
    frameColor: '#5b21b6',
    lensGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.6), rgba(124, 58, 237, 0.8))',
    price: 359,
  }
];

export function VirtualTryOn() {
  const [selectedGlass, setSelectedGlass] = useState<Sunglass>(sunglasses[0]);
  const [showFlash, setShowFlash] = useState(false);
  const [cartItems, setCartItems] = useState<Sunglass[]>([]);
  const [showCartAnimation, setShowCartAnimation] = useState(false);

  const handleCapture = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
  };

  const handleAddToCart = () => {
    setCartItems([...cartItems, selectedGlass]);
    setShowCartAnimation(true);
    setTimeout(() => setShowCartAnimation(false), 1000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 p-8"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-white">VISIONIX</h1>
          </motion.div>
          <motion.div
            className="flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-purple-300">Virtual Try-On Experience</p>
            {/* Cart Icon */}
            <motion.button
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={showCartAnimation ? { scale: [1, 1.3, 1] } : {}}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {cartItems.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  {cartItems.length}
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Virtual Try-On Display */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              {/* Camera flash effect */}
              <AnimatePresence>
                {showFlash && (
                  <motion.div
                    className="absolute inset-0 bg-white z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Model image */}
              <div className="relative aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"
                  alt="Model"
                  className="w-full h-full object-cover"
                />
                
                {/* Sunglasses overlay */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedGlass.id}
                    className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[45%]"
                    initial={{ scale: 0, rotateY: -180, opacity: 0 }}
                    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                    exit={{ scale: 0, rotateY: 180, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 20 
                    }}
                  >
                    <svg viewBox="0 0 300 100" className="w-full drop-shadow-2xl">
                      {/* Left lens */}
                      <defs>
                        <linearGradient id={`lensGrad-${selectedGlass.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: selectedGlass.color, stopOpacity: 0.6 }} />
                          <stop offset="100%" style={{ stopColor: selectedGlass.color, stopOpacity: 0.85 }} />
                        </linearGradient>
                        <filter id="gloss">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                          <feOffset dx="1" dy="1" result="offsetblur" />
                          <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3" />
                          </feComponentTransfer>
                          <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Frame */}
                      <path
                        d="M 20 40 Q 20 25 35 25 L 110 25 Q 125 25 125 40 L 125 60 Q 125 75 110 75 L 35 75 Q 20 75 20 60 Z"
                        fill={selectedGlass.frameColor}
                        stroke={selectedGlass.frameColor}
                        strokeWidth="3"
                      />
                      <path
                        d="M 175 40 Q 175 25 190 25 L 265 25 Q 280 25 280 40 L 280 60 Q 280 75 265 75 L 190 75 Q 175 75 175 60 Z"
                        fill={selectedGlass.frameColor}
                        stroke={selectedGlass.frameColor}
                        strokeWidth="3"
                      />
                      
                      {/* Lenses with gradient */}
                      <ellipse
                        cx="72"
                        cy="50"
                        rx="45"
                        ry="30"
                        fill={`url(#lensGrad-${selectedGlass.id})`}
                        filter="url(#gloss)"
                      />
                      <ellipse
                        cx="228"
                        cy="50"
                        rx="45"
                        ry="30"
                        fill={`url(#lensGrad-${selectedGlass.id})`}
                        filter="url(#gloss)"
                      />
                      
                      {/* Bridge */}
                      <rect
                        x="125"
                        y="45"
                        width="50"
                        height="6"
                        rx="3"
                        fill={selectedGlass.frameColor}
                      />
                      
                      {/* Glossy highlights */}
                      <ellipse
                        cx="60"
                        cy="40"
                        rx="15"
                        ry="10"
                        fill="white"
                        opacity="0.4"
                      />
                      <ellipse
                        cx="216"
                        cy="40"
                        rx="15"
                        ry="10"
                        fill="white"
                        opacity="0.4"
                      />
                    </svg>
                  </motion.div>
                </AnimatePresence>

                {/* Info badge with price */}
                <motion.div
                  className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGlass.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-slate-800 mb-1">{selectedGlass.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">${selectedGlass.price}</span>
                        {selectedGlass.originalPrice && (
                          <span className="text-slate-400 line-through text-sm">${selectedGlass.originalPrice}</span>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Control buttons */}
              <div className="absolute bottom-6 right-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCapture}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg"
                >
                  <Camera className="w-6 h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/90 hover:bg-white text-purple-600 p-4 rounded-full shadow-lg"
                >
                  <RotateCcw className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.button
              onClick={handleAddToCart}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Add to Cart - ${selectedGlass.price}</span>
              {selectedGlass.originalPrice && (
                <motion.span
                  className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm"
                  animate={{ rotate: [-3, 3, -3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Save ${selectedGlass.originalPrice - selectedGlass.price}
                </motion.span>
              )}
            </motion.button>
          </motion.div>

          {/* Sunglass Carousel */}
          <motion.div 
            className="lg:col-span-4"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <SunglassCarousel
              sunglasses={sunglasses}
              selectedGlass={selectedGlass}
              onSelectGlass={setSelectedGlass}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}