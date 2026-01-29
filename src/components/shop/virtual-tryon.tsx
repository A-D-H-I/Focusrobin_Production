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

  // Free placement position (offset from detected face position)
  const [glassesOffset, setGlassesOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glassesImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const landmarkerRef = useRef<any>(null);
  const faceDataRef = useRef<FaceData | null>(null); // CACHED face detection results
  const isDetectingRef = useRef(false);

  const currentVariant = variants[currentVariantIndex] || variants[0];

  // Setup Portal
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Lock scroll when open with scrollbar compensation
  useEffect(() => {
    if (isOpen) {
      // Calculate and store scrollbar width before hiding overflow
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
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

        // Use the same version as installed package to avoid version mismatches
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
        );

        if (!mounted) return;

        // Try GPU first, fallback to CPU if it fails
        try {
          landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "GPU",
            },
            runningMode: "IMAGE",
            numFaces: 1,
          });
        } catch (gpuError) {
          console.warn("GPU delegate failed, falling back to CPU:", gpuError);
          if (!mounted) return;

          // Fallback to CPU delegate
          landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            numFaces: 1,
          });
        }

        if (mounted) {
          setStatus("Ready");
          setIsModelReady(true);
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
        let errorMessage = "Unknown error";
        
        // Handle different error types
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String(err.message);
        } else if (err && typeof err === 'object' && 'type' in err) {
          // Handle Event objects
          const event = err as Event;
          errorMessage = `Script loading failed: ${event.type}`;
          if (event.target && 'src' in event.target) {
            errorMessage += ` (${(event.target as any).src})`;
          }
        } else {
          errorMessage = String(err);
        }
        
        console.error("Error details:", {
          message: errorMessage,
          error: err,
          type: err?.constructor?.name,
        });
        
        if (mounted) {
          setStatus(`Failed to load AI Model: ${errorMessage.substring(0, 150)}`);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Helper function to proxy S3 URLs through our API to avoid CORS
  const getProxiedImageUrl = (url: string): string => {
    if (!url) return '';
    // If it's an S3 URL, proxy it through our API
    if (url.includes('.s3.') || url.includes('s3.amazonaws.com')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Preload glasses images
  useEffect(() => {
    if (!isOpen) return;

    variants.forEach((variant, idx) => {
      if (glassesImagesRef.current.has(idx)) return; // Already loaded

      const imageUrl = variant.tryOn || variant.thumbnail || "";
      if (!imageUrl) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      // Use proxied URL for S3 images to avoid CORS issues
      img.src = getProxiedImageUrl(imageUrl);
      img.onload = () => {
        glassesImagesRef.current.set(idx, img);
      };
      img.onerror = () => {
        // Try direct URL as fallback if proxy fails
        if (img.src.includes('/api/proxy-image')) {
          console.log(`Retrying with direct URL for variant ${idx}`);
          const directImg = new Image();
          directImg.crossOrigin = "anonymous";
          directImg.src = imageUrl;
          directImg.onload = () => {
            glassesImagesRef.current.set(idx, directImg);
          };
        }
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
      setGlassesOffset({ x: 0, y: 0 }); // Reset position
    }
  };

  // Draw glasses on canvas using CACHED face data and displayed image dimensions
  const drawGlasses = useCallback(() => {
    try {
      const faceData = faceDataRef.current;
      const glassesImg = glassesImagesRef.current.get(currentVariantIndex);
      const canvas = canvasRef.current;
      const userImg = document.getElementById("user-photo") as HTMLImageElement;

      if (!faceData || !glassesImg || !canvas || !userImg) {
        return;
      }

      // Wait for images to load
      if (!glassesImg.complete || glassesImg.naturalWidth === 0 || !userImg.complete) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get displayed image dimensions (not natural dimensions)
      // Use getBoundingClientRect for accurate displayed size
      const rect = userImg.getBoundingClientRect();
      const displayedWidth = rect.width;
      const displayedHeight = rect.height;
      const naturalWidth = userImg.naturalWidth;
      const naturalHeight = userImg.naturalHeight;

      // Calculate scale factor between natural and displayed size
      const scaleX = displayedWidth / naturalWidth;
      const scaleY = displayedHeight / naturalHeight;

      // Set canvas size to match displayed image size exactly
      // Use devicePixelRatio for crisp rendering on high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = displayedWidth * dpr;
      canvas.height = displayedHeight * dpr;

      // Set canvas style to match image exactly
      if (canvas.style) {
        canvas.style.width = `${displayedWidth}px`;
        canvas.style.height = `${displayedHeight}px`;
        canvas.style.maxWidth = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
      }

      // Scale context to match device pixel ratio
      ctx.scale(dpr, dpr);

      // Scale face data coordinates to displayed size
      const scaledNx = faceData.nx * scaleX;
      const scaledNy = faceData.ny * scaleY;
      const scaledFaceWidth = faceData.faceWidth * scaleX;

      // Calculate glasses dimensions (maintain aspect ratio)
      const glassesWidth = scaledFaceWidth * 1.05; // Default scale
      const imgRatio = glassesImg.height / glassesImg.width;
      const glassesHeight = glassesWidth * imgRatio;

      // Draw
      ctx.clearRect(0, 0, displayedWidth, displayedHeight);
      ctx.save();

      // Apply rotation and position with offset
      ctx.translate(scaledNx + glassesOffset.x, scaledNy + glassesOffset.y);
      ctx.rotate(faceData.angle);

      ctx.drawImage(
        glassesImg,
        -glassesWidth / 2,
        -glassesHeight * 0.4, // Default vertical offset (40% up)
        glassesWidth,
        glassesHeight
      );
      ctx.restore();
    } catch (error) {
      console.error("Error drawing glasses:", error);
    }
  }, [currentVariantIndex, glassesOffset]);

  // Run face detection ONCE when image is loaded, then cache results
  const detectFace = useCallback(() => {
    if (isDetectingRef.current || !landmarkerRef.current || !imageSrc) {
      return;
    }

    const userImg = document.getElementById("user-photo") as HTMLImageElement;

    if (!userImg) {
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

        // Calculate and CACHE face data (using natural dimensions)
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
        setGlassesOffset({ x: 0, y: 0 }); // Reset position on new detection
        // Small delay to ensure image is rendered
        setTimeout(() => drawGlasses(), 50);
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
      const userImg = document.getElementById("user-photo") as HTMLImageElement;

      if (userImg) {
        const handleImageLoad = () => {
          // Small delay to ensure image is rendered in DOM
          setTimeout(() => {
            detectFace();
          }, 100);
        };

        if (userImg.complete) {
          handleImageLoad();
        } else {
          userImg.addEventListener('load', handleImageLoad);
          return () => userImg.removeEventListener('load', handleImageLoad);
        }
      }
    }
  }, [imageSrc, isModelReady, detectFace]);

  // Handle drag for free placement
  const handleDragStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isFaceDetected || !faceDataRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    const userImg = document.getElementById("user-photo") as HTMLImageElement;
    if (!userImg) return;

    const rect = userImg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Store initial drag position relative to image
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Calculate current glasses position on screen
    const scaleX = userImg.clientWidth / userImg.naturalWidth;
    const scaleY = userImg.clientHeight / userImg.naturalHeight;
    const scaledNx = faceDataRef.current.nx * scaleX;
    const scaledNy = faceDataRef.current.ny * scaleY;
    const currentGlassesX = scaledNx + glassesOffset.x;
    const currentGlassesY = scaledNy + glassesOffset.y;

    // Store offset from mouse position to glasses position
    setDragStart({
      x: mouseX - currentGlassesX,
      y: mouseY - currentGlassesY
    });
  };

  const handleDragMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isFaceDetected || !faceDataRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const userImg = document.getElementById("user-photo") as HTMLImageElement;
    if (!userImg) return;

    const rect = userImg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate mouse position relative to image
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Calculate face position in displayed coordinates
    const scaleX = userImg.clientWidth / userImg.naturalWidth;
    const scaleY = userImg.clientHeight / userImg.naturalHeight;
    const scaledNx = faceDataRef.current.nx * scaleX;
    const scaledNy = faceDataRef.current.ny * scaleY;

    // Calculate new offset: where mouse is minus face position minus drag offset
    setGlassesOffset({
      x: mouseX - scaledNx - dragStart.x,
      y: mouseY - scaledNy - dragStart.y
    });
  };

  const handleDragEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  // Redraw glasses when variant or position changes (NO face detection!)
  useEffect(() => {
    if (isFaceDetected && faceDataRef.current) {
      drawGlasses();
    }
  }, [currentVariantIndex, glassesOffset, isFaceDetected, drawGlasses]);

  // Update canvas on window resize
  useEffect(() => {
    if (!isFaceDetected || !imageSrc) return;

    const handleResize = () => {
      drawGlasses();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFaceDetected, imageSrc, drawGlasses]);

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
      <div
        className="flex items-center justify-between px-3 py-2.5 sm:p-4 md:p-6 bg-black/30 backdrop-blur-md z-20 flex-shrink-0"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top, 0.625rem))' }}
      >
        <Logo className="w-20 sm:w-24 md:w-28" logoColor="white" />
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 md:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors touch-manipulation"
          aria-label="Close"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-28">
        <div className="max-w-xl mx-auto">
          {/* Title */}
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center text-white"
            style={{ fontFamily: "Chillax, sans-serif" }}
          >
            Virtual Try-On
          </h2>

          {/* Status */}
          {status && status !== "Ready" && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-white/10 rounded-lg text-center">
              <p className="text-white text-xs sm:text-sm">{status}</p>
            </div>
          )}

          {/* COLOR SELECTOR */}
          <div className="mb-4 sm:mb-6">
            <label
              className="block text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-left"
              style={{ color: BRAND_COLORS.smokeWhite, fontFamily: "Chillax, sans-serif" }}
            >
              Choose Color
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {variants.map((variant, idx) => (
                <button
                  key={`variant-${idx}-${variant.name}`}
                  onClick={() => setCurrentVariantIndex(idx)}
                  className={cn(
                    "p-2 sm:p-3 rounded-lg border-2 transition-all touch-manipulation",
                    currentVariantIndex === idx
                      ? "border-[#4DCECA] shadow-lg scale-105"
                      : "border-white/20 active:border-white/40"
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
                    className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium text-center"
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
          <div
            ref={containerRef}
            className="relative w-full bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-[400px] mb-4 sm:mb-6 border border-white/10"
            style={{
              maxWidth: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}
          >
            {imageSrc ? (
              <div
                className="relative w-full flex items-start justify-center"
                style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}
              >
                <img
                  id="user-photo"
                  src={imageSrc}
                  alt="User"
                  className="block max-w-full h-auto"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    margin: '0 auto'
                  }}
                />
                {isFaceDetected && (
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 touch-manipulation"
                    style={{
                      cursor: isDragging ? 'grabbing' : 'grab',
                      pointerEvents: 'auto',
                      display: 'block',
                      maxWidth: '100%',
                      width: '100%',
                      height: 'auto'
                    }}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] md:h-[400px] text-white/40 px-4 w-full">
                <Camera size={40} className="sm:w-12 sm:h-12 mb-3 sm:mb-4" style={{ color: BRAND_COLORS.teal }} />
                <span className="text-xs sm:text-sm text-center" style={{ fontFamily: "Chillax, sans-serif" }}>Upload a photo to start</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 items-center">
            <label
              className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-white cursor-pointer transition-transform active:scale-95 sm:hover:scale-105 shadow-lg touch-manipulation text-xs sm:text-sm"
              style={{ backgroundColor: BRAND_COLORS.teal, fontFamily: "Chillax, sans-serif" }}
            >
              {imageSrc ? "Upload New Photo" : "Upload Photo"}
              <input type="file" onChange={handleUpload} accept="image/*" className="hidden" />
            </label>
          </div>

          {/* Spacer for fixed footer */}
          <div className="h-20 sm:h-24 md:h-28"></div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 px-3 py-2.5 sm:p-4 md:p-6 bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
        style={{
          zIndex: 100000,
          paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0.625rem))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0.75rem))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0.75rem))',
        }}
      >
        <button
          onClick={() => {
            addToCart(product, currentVariant, 1);
            onClose();
          }}
          className="w-full py-3 sm:py-3.5 md:py-4 lg:py-5 rounded-lg sm:rounded-xl md:rounded-2xl text-white font-black text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 shadow-2xl active:scale-[0.97] transition-transform min-h-[48px] sm:min-h-[52px] md:min-h-[56px] px-4 sm:px-5 md:px-6 touch-manipulation"
          style={{ backgroundColor: BRAND_COLORS.teal }}
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
          <span className="whitespace-nowrap truncate text-sm sm:text-base md:text-lg font-semibold">
            <span className="hidden sm:inline">ADD TO CART</span>
            <span className="sm:hidden">CART</span>
            <span className="mx-1.5">—</span>
            {product.price}
          </span>
        </button>
      </div>
    </div>
  );

  if (!portalContainer) return null;
  return createPortal(modalContent, portalContainer);
}
