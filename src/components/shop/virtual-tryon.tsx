"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Landing/logo";
import { useCart } from "@/context/CartContext";
import type { ProductColorVariant, Product } from "@/lib/productData";

// =============================================================================
// BRAND CONFIGURATION
// =============================================================================
const BRAND_COLORS = {
  jetBlue: "#1C3142",
  teal: "#4DCECA",
  warning: "#F56278",
  smokeWhite: "#EFFAFA",
};

// =============================================================================
// TYPES
// =============================================================================
interface VirtualTryOnProps {
  product: Product;
  variants: ProductColorVariant[];
  selectedVariantIndex: number;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Cached face data to avoid re-running detection
interface FaceData {
  nx: number;  // nose x
  ny: number;  // nose y
  angle: number;
  faceWidth: number;
  canvasWidth: number;
  canvasHeight: number;
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function VirtualTryOn({
  product,
  variants,
  selectedVariantIndex,
  isOpen,
  onClose,
}: VirtualTryOnProps) {
  const { addToCart } = useCart();

  // State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState("Upload a photo to start");
  const [currentVariantIndex, setCurrentVariantIndex] = useState(selectedVariantIndex);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  // Controls for fine-tuning
  const [scaleFactor, setScaleFactor] = useState(1.05);
  const [verticalOffset, setVerticalOffset] = useState(0.40);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassesImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const landmarkerRef = useRef<any>(null);
  const faceDataRef = useRef<FaceData | null>(null); // CACHED face detection results
  const isDetectingRef = useRef(false);

  const currentVariant = variants[currentVariantIndex] || variants[0];

  // Setup Portal
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Initialize MediaPipe FaceLandmarker ONCE
  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    
    const init = async () => {
      if (landmarkerRef.current) {
        setIsModelReady(true);
        return; // Already initialized
      }
      
      setStatus("Loading AI Model...");
      
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        
        if (!mounted) return;
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        if (!mounted) return;
        
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });
        
        if (mounted) {
          setStatus("Ready");
          setIsModelReady(true);
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
        if (mounted) {
          setStatus("Failed to load AI Model");
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Preload glasses images
  useEffect(() => {
    if (!isOpen) return;
    
    variants.forEach((variant, idx) => {
      if (glassesImagesRef.current.has(idx)) return; // Already loaded
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = variant.tryOn || variant.thumbnail || "";
      img.onload = () => {
        glassesImagesRef.current.set(idx, img);
      };
    });
  }, [isOpen, variants]);

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      faceDataRef.current = null; // Clear cached face data
      setIsFaceDetected(false);
      setImageSrc(url);
      setScaleFactor(1.05);
      setVerticalOffset(0.40);
    }
  };

  // Draw glasses on canvas using CACHED face data (fast!)
  const drawGlasses = useCallback(() => {
    try {
      const faceData = faceDataRef.current;
      const glassesImg = glassesImagesRef.current.get(currentVariantIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!faceData || !glassesImg || !canvas || !ctx) {
        return;
      }

      // Wait for glasses image to load
      if (!glassesImg.complete || glassesImg.naturalWidth === 0) {
        return; // Don't set onload to avoid potential loops
      }

      // Set canvas size
      canvas.width = faceData.canvasWidth;
      canvas.height = faceData.canvasHeight;

      // Calculate glasses dimensions
      const glassesWidth = faceData.faceWidth * scaleFactor;
      const imgRatio = glassesImg.height / glassesImg.width;
      const glassesHeight = glassesWidth * imgRatio;

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(faceData.nx, faceData.ny);
      ctx.rotate(faceData.angle);
      ctx.drawImage(
        glassesImg,
        -glassesWidth / 2,
        -glassesHeight * verticalOffset,
        glassesWidth,
        glassesHeight
      );
      ctx.restore();
    } catch (error) {
      console.error("Error drawing glasses:", error);
    }
  }, [currentVariantIndex, scaleFactor, verticalOffset]);

  // Run face detection ONCE when image is loaded, then cache results
  const detectFace = useCallback(() => {
    if (isDetectingRef.current || !landmarkerRef.current || !imageSrc) {
      return;
    }

    const userImg = document.getElementById("user-photo") as HTMLImageElement;
    const canvas = canvasRef.current;

    if (!userImg || !canvas) {
      return;
    }

    // Wait for user image to load
    if (!userImg.complete || userImg.naturalWidth === 0) {
      userImg.onload = () => detectFace();
      return;
    }

    isDetectingRef.current = true;
    setStatus("Detecting face...");

    try {
      const result = landmarkerRef.current.detect(userImg);

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        const w = userImg.naturalWidth;
        const h = userImg.naturalHeight;

        // Get face landmarks
        const leftTemple = landmarks[454];
        const rightTemple = landmarks[234];
        const noseBridge = landmarks[168];
        const eyeL = landmarks[33];
        const eyeR = landmarks[263];

        // Calculate and CACHE face data
        const lx = leftTemple.x * w;
        const ly = leftTemple.y * h;
        const rx = rightTemple.x * w;
        const ry = rightTemple.y * h;
        const angle = Math.atan2(
          eyeR.y * h - eyeL.y * h,
          eyeR.x * w - eyeL.x * w
        );

        faceDataRef.current = {
          nx: noseBridge.x * w,
          ny: noseBridge.y * h,
          angle,
          faceWidth: Math.hypot(rx - lx, ry - ly),
          canvasWidth: w,
          canvasHeight: h,
        };

        setStatus("");
        setIsFaceDetected(true);
        drawGlasses(); // Draw immediately after detection
      } else {
        setStatus("No face detected. Please try again.");
        faceDataRef.current = null;
        setIsFaceDetected(false);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setStatus("Error processing image. Please try again.");
      faceDataRef.current = null;
      setIsFaceDetected(false);
    } finally {
      isDetectingRef.current = false;
    }
  }, [imageSrc, drawGlasses]);

  // Trigger face detection when image changes
  useEffect(() => {
    if (imageSrc && isModelReady) {
      // Small delay to ensure image is rendered in DOM
      const timer = setTimeout(() => {
        detectFace();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, isModelReady, detectFace]);

  // Redraw glasses when variant or settings change (NO face detection!)
  useEffect(() => {
    if (isFaceDetected && faceDataRef.current) {
      drawGlasses();
    }
  }, [currentVariantIndex, scaleFactor, verticalOffset, isFaceDetected, drawGlasses]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: BRAND_COLORS.jetBlue,
        fontFamily: "Chillax, sans-serif",
        zIndex: 2147483647,
        touchAction: "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-black/30 backdrop-blur-md z-20 flex-shrink-0">
        <Logo className="w-24 md:w-28" logoColor="white" />
        <button
          onClick={onClose}
          className="p-2 md:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-xl mx-auto">
          {/* Title */}
          <h2
            className="text-2xl md:text-3xl font-bold mb-6 text-center text-white"
            style={{ fontFamily: "Chillax, sans-serif" }}
          >
            Virtual Try-On
          </h2>

          {/* Status */}
          {status && status !== "Ready" && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg text-center">
              <p className="text-white text-sm">{status}</p>
            </div>
          )}

          {/* COLOR SELECTOR */}
          <div className="mb-6">
            <label
              className="block text-sm font-bold mb-3 text-left"
              style={{ color: BRAND_COLORS.smokeWhite, fontFamily: "Chillax, sans-serif" }}
            >
              Choose Color
            </label>
            <div className="grid grid-cols-3 gap-3">
              {variants.map((variant, idx) => (
                <button
                  key={`variant-${idx}-${variant.name}`}
                  onClick={() => setCurrentVariantIndex(idx)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    currentVariantIndex === idx
                      ? "border-[#4DCECA] shadow-lg scale-105"
                      : "border-white/20 hover:border-white/40"
                  )}
                  style={{
                    backgroundColor:
                      currentVariantIndex === idx ? "rgba(77, 206, 202, 0.2)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <img
                    src={variant.tryOn || variant.thumbnail}
                    alt={variant.name}
                    className="w-full h-auto rounded"
                  />
                  <p
                    className="text-xs mt-2 font-medium text-center"
                    style={{
                      color: currentVariantIndex === idx ? BRAND_COLORS.teal : BRAND_COLORS.smokeWhite,
                      fontFamily: "Chillax, sans-serif",
                    }}
                  >
                    {variant.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload Area */}
          <div className="relative w-full bg-slate-800 rounded-2xl overflow-hidden min-h-[300px] md:min-h-[400px] mb-6 border border-white/10">
            {imageSrc ? (
              <>
                <img id="user-photo" src={imageSrc} alt="User" className="w-full h-auto block" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] md:h-[400px] text-white/40">
                <Camera size={48} className="mb-4" style={{ color: BRAND_COLORS.teal }} />
                <span style={{ fontFamily: "Chillax, sans-serif" }}>Upload a photo to start</span>
              </div>
            )}
          </div>

          {/* Fine-tune Controls */}
          {imageSrc && isFaceDetected && (
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex flex-col text-left">
                <label className="text-sm font-bold mb-2" style={{ color: BRAND_COLORS.smokeWhite, fontFamily: "Chillax, sans-serif" }}>
                  Width Adjustment
                </label>
                <input
                  type="range" min="0.9" max="1.2" step="0.01"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                  className="accent-[#4DCECA] h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col text-left">
                <label className="text-sm font-bold mb-2" style={{ color: BRAND_COLORS.smokeWhite, fontFamily: "Chillax, sans-serif" }}>
                  Height Position
                </label>
                <input
                  type="range" min="0.2" max="0.6" step="0.01"
                  value={verticalOffset}
                  onChange={(e) => setVerticalOffset(parseFloat(e.target.value))}
                  className="accent-[#4DCECA] h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mb-6 flex flex-col gap-3 items-center">
            <label
              className="inline-block px-6 py-3 rounded-full font-bold text-white cursor-pointer transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: BRAND_COLORS.teal, fontFamily: "Chillax, sans-serif" }}
            >
              {imageSrc ? "Upload New Photo" : "Upload Photo"}
              <input type="file" onChange={handleUpload} accept="image/*" className="hidden" />
            </label>
          </div>

          {/* Spacer */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
        style={{ zIndex: 100000 }}
      >
        <button
          onClick={() => {
            addToCart(product, currentVariant, 1);
            onClose();
          }}
          className="w-full py-2 sm:py-3 md:py-4 lg:py-5 rounded-xl md:rounded-2xl text-white font-black text-[11px] sm:text-sm md:text-base lg:text-lg flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 shadow-2xl active:scale-[0.98] transition-transform min-h-[36px] sm:min-h-[44px] md:min-h-[48px] lg:min-h-[56px] px-3 sm:px-4 md:px-6"
          style={{ backgroundColor: BRAND_COLORS.teal }}
        >
          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
          <span className="whitespace-nowrap truncate text-[10px] sm:text-[11px] md:text-sm lg:text-base">
            <span className="hidden sm:inline">ADD TO CART</span>
            <span className="sm:hidden">CART</span>
            <span className="mx-1">—</span>
            {product.price}
          </span>
        </button>
      </div>
    </div>
  );

  if (!portalContainer) return null;
  return createPortal(modalContent, portalContainer);
}
