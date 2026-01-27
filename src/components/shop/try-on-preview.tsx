"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProductColorVariant } from "@/lib/productData";

// =============================================================================
// TYPES
// =============================================================================
interface TryOnPreviewProps {
  variants: ProductColorVariant[];
  selectedVariantIndex: number;
  onVariantChange: (index: number) => void;
  className?: string;
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
export default function TryOnPreview({
  variants,
  selectedVariantIndex,
  onVariantChange,
  className,
}: TryOnPreviewProps) {
  // State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("ready");
  const [statusMessage, setStatusMessage] = useState<string>("");
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
  const previousVariantsRef = useRef<string>('');
  const previousVariantIndexRef = useRef<number>(selectedVariantIndex);
  const landmarkerRef = useRef<any>(null);
  const faceDataRef = useRef<FaceData | null>(null);
  const isDetectingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize MediaPipe FaceLandmarker ONCE
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (landmarkerRef.current) {
        setIsModelReady(true);
        return;
      }

      setStatus("loading");
      setStatusMessage("Loading AI Model...");

      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        if (!mounted) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
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
          setStatus("ready");
          setStatusMessage("");
          setIsModelReady(true);
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
        if (mounted) {
          setStatus("error");
          setStatusMessage("Failed to load AI Model");
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Preload glasses images - clear cache when variants actually change (different product)
  useEffect(() => {
    // Create a unique key for this variants set (using all variant SKUs)
    const variantsKey = variants.map(v => v.sku || v.hex).join('-');

    // Only clear cache if this is a completely different set of variants (new product)
    const isNewProduct = previousVariantsRef.current && previousVariantsRef.current !== variantsKey;
    if (isNewProduct) {
      glassesImagesRef.current.clear();
      // Reset previous variant index when product changes
      previousVariantIndexRef.current = -1;
    }
    previousVariantsRef.current = variantsKey;

    // Load images for all variants, prioritizing the selected variant
    const loadVariantImage = (variant: ProductColorVariant, idx: number) => {
      const imageUrl = variant.tryOn || variant.thumbnail || "";
      if (!imageUrl) {
        return;
      }

      // Check if already loaded - compare by checking if image exists and is complete
      const existingImg = glassesImagesRef.current.get(idx);
      if (existingImg && existingImg.complete && existingImg.naturalWidth > 0) {
        // Verify it's the right image by checking if src contains the imageUrl or vice versa
        const existingSrc = existingImg.src || '';
        const normalizedExisting = existingSrc.split('?')[0]; // Remove query params
        const normalizedNew = imageUrl.split('?')[0];

        if (normalizedExisting.includes(normalizedNew) || normalizedNew.includes(normalizedExisting)) {
          return; // Already loaded with correct URL
        }
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        glassesImagesRef.current.set(idx, img);
        // If this is the selected variant and face is detected, trigger redraw immediately
        if (idx === selectedVariantIndex && isFaceDetected && faceDataRef.current) {
          requestAnimationFrame(() => {
            if (faceDataRef.current && isFaceDetected) {
              drawGlasses();
            }
          });
        }
      };

      img.onerror = (err) => {
        console.error(`Failed to load glasses image for variant ${idx}:`, imageUrl, err);
      };
    };

    // Load selected variant first (if valid), then others
    if (selectedVariantIndex >= 0 && selectedVariantIndex < variants.length) {
      loadVariantImage(variants[selectedVariantIndex], selectedVariantIndex);
    }

    // Load all other variants
    variants.forEach((variant, idx) => {
      if (idx !== selectedVariantIndex) {
        loadVariantImage(variant, idx);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      faceDataRef.current = null;
      setIsFaceDetected(false);
      setImageSrc(url);
      setGlassesOffset({ x: 0, y: 0 }); // Reset position
    }
  };

  // Draw glasses on canvas using CACHED face data and displayed image dimensions
  const drawGlasses = useCallback(() => {
    try {
      const faceData = faceDataRef.current;

      // Validate selectedVariantIndex is within bounds
      if (selectedVariantIndex < 0 || selectedVariantIndex >= variants.length) {
        console.warn(`Invalid selectedVariantIndex: ${selectedVariantIndex}, variants length: ${variants.length}`);
        return;
      }

      const glassesImg = glassesImagesRef.current.get(selectedVariantIndex);
      const canvas = canvasRef.current;
      const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;

      if (!faceData || !glassesImg || !canvas || !userImg) {
        // If glasses image not loaded yet, wait for it
        if (faceData && !glassesImg && variants[selectedVariantIndex]) {
          const variant = variants[selectedVariantIndex];
          const imageUrl = variant.tryOn || variant.thumbnail || "";
          if (imageUrl) {
            // Try to load it immediately
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            img.onload = () => {
              glassesImagesRef.current.set(selectedVariantIndex, img);
              // Retry drawing after image loads
              setTimeout(() => drawGlasses(), 100);
            };
          }
        }
        return;
      }

      if (!glassesImg.complete || glassesImg.naturalWidth === 0 || !userImg.complete) {
        // Wait for image to fully load
        if (!glassesImg.complete) {
          glassesImg.onload = () => {
            drawGlasses();
          };
        }
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get displayed image dimensions
      const rect = userImg.getBoundingClientRect();
      const displayedWidth = rect.width;
      const displayedHeight = rect.height;
      const naturalWidth = userImg.naturalWidth;
      const naturalHeight = userImg.naturalHeight;

      // Calculate scale factor between natural and displayed size
      const scaleX = displayedWidth / naturalWidth;
      const scaleY = displayedHeight / naturalHeight;

      // Set canvas size to match displayed image size exactly
      const dpr = window.devicePixelRatio || 1;
      canvas.width = displayedWidth * dpr;
      canvas.height = displayedHeight * dpr;
      canvas.style.width = `${displayedWidth}px`;
      canvas.style.height = `${displayedHeight}px`;

      ctx.scale(dpr, dpr);

      // Scale face data coordinates to displayed size
      const scaledNx = faceData.nx * scaleX;
      const scaledNy = faceData.ny * scaleY;
      const scaledFaceWidth = faceData.faceWidth * scaleX;

      // Calculate glasses dimensions
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
        -glassesHeight * 0.4, // Default vertical offset
        glassesWidth,
        glassesHeight
      );
      ctx.restore();
    } catch (error) {
      console.error("Error drawing glasses:", error);
    }
  }, [selectedVariantIndex, glassesOffset, variants]);

  // Run face detection ONCE when image is loaded
  const detectFace = useCallback(() => {
    if (isDetectingRef.current || !landmarkerRef.current || !imageSrc) {
      return;
    }

    const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;

    if (!userImg) {
      return;
    }

    if (!userImg.complete || userImg.naturalWidth === 0) {
      userImg.onload = () => detectFace();
      return;
    }

    isDetectingRef.current = true;
    setStatus("detecting");
    setStatusMessage("Detecting face...");

    try {
      const result = landmarkerRef.current.detect(userImg);

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        const w = userImg.naturalWidth;
        const h = userImg.naturalHeight;

        const leftTemple = landmarks[454];
        const rightTemple = landmarks[234];
        const noseBridge = landmarks[168];
        const eyeL = landmarks[33];
        const eyeR = landmarks[263];

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

        setStatus("ready");
        setStatusMessage("");
        setIsFaceDetected(true);
        setGlassesOffset({ x: 0, y: 0 }); // Reset position
        setTimeout(() => drawGlasses(), 50);
      } else {
        setStatus("error");
        setStatusMessage("No face detected. Please try another photo.");
        faceDataRef.current = null;
        setIsFaceDetected(false);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setStatus("error");
      setStatusMessage("Error processing image. Please try again.");
      faceDataRef.current = null;
      setIsFaceDetected(false);
    } finally {
      isDetectingRef.current = false;
    }
  }, [imageSrc, drawGlasses]);

  // Trigger face detection when image changes
  useEffect(() => {
    if (imageSrc && isModelReady) {
      const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;

      if (userImg) {
        const handleImageLoad = () => {
          setTimeout(() => detectFace(), 100);
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
    const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;
    if (!userImg) return;

    const rect = userImg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const scaleX = userImg.clientWidth / userImg.naturalWidth;
    const scaleY = userImg.clientHeight / userImg.naturalHeight;
    const scaledNx = faceDataRef.current.nx * scaleX;
    const scaledNy = faceDataRef.current.ny * scaleY;
    const currentGlassesX = scaledNx + glassesOffset.x;
    const currentGlassesY = scaledNy + glassesOffset.y;

    setDragStart({
      x: mouseX - currentGlassesX,
      y: mouseY - currentGlassesY
    });
  };

  const handleDragMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isFaceDetected || !faceDataRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;
    if (!userImg) return;

    const rect = userImg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const scaleX = userImg.clientWidth / userImg.naturalWidth;
    const scaleY = userImg.clientHeight / userImg.naturalHeight;
    const scaledNx = faceDataRef.current.nx * scaleX;
    const scaledNy = faceDataRef.current.ny * scaleY;

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

  // Reset glasses position when variant changes (separate effect to avoid loops)
  useEffect(() => {
    const variantChanged = previousVariantIndexRef.current !== selectedVariantIndex;
    if (variantChanged && previousVariantIndexRef.current !== -1) {
      setGlassesOffset({ x: 0, y: 0 }); // Reset position for new variant
    }
    previousVariantIndexRef.current = selectedVariantIndex;
  }, [selectedVariantIndex]);

  // Redraw glasses when variant or position changes
  useEffect(() => {
    if (!isFaceDetected || !faceDataRef.current) return;

    // Validate selectedVariantIndex
    if (selectedVariantIndex < 0 || selectedVariantIndex >= variants.length) {
      console.warn(`Invalid selectedVariantIndex: ${selectedVariantIndex}, variants length: ${variants.length}`);
      return;
    }

    const selectedVariant = variants[selectedVariantIndex];
    if (!selectedVariant) {
      console.warn(`No variant found at index ${selectedVariantIndex}`);
      return;
    }

    const attemptDraw = () => {
      const glassesImg = glassesImagesRef.current.get(selectedVariantIndex);

      if (glassesImg && glassesImg.complete && glassesImg.naturalWidth > 0) {
        // Image is loaded, draw immediately
        requestAnimationFrame(() => {
          if (faceDataRef.current && isFaceDetected) {
            drawGlasses();
          }
        });
        return true;
      }
      return false;
    };

    // Try to draw immediately if image is already loaded
    if (!attemptDraw()) {
      // Image not loaded yet, try to load it now
      const imageUrl = selectedVariant.tryOn || selectedVariant.thumbnail || "";
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
          glassesImagesRef.current.set(selectedVariantIndex, img);
          // Draw after image loads
          requestAnimationFrame(() => {
            if (isFaceDetected && faceDataRef.current) {
              drawGlasses();
            }
          });
        };
        img.onerror = (err) => {
          console.error(`Failed to load variant ${selectedVariantIndex} image:`, err);
        };
      }

      // Also set up retries in case the preload effect hasn't finished
      let retryCount = 0;
      const maxRetries = 5;
      const retryInterval = 200;

      const retryTimer = setInterval(() => {
        retryCount++;
        if (attemptDraw() || retryCount >= maxRetries) {
          if (retryCount >= maxRetries) {
            console.warn(`Max retries reached for variant ${selectedVariantIndex}`);
          }
          clearInterval(retryTimer);
        }
      }, retryInterval);

      return () => clearInterval(retryTimer);
    }
  }, [selectedVariantIndex, glassesOffset, isFaceDetected, variants, drawGlasses]);

  // Update canvas on window resize
  useEffect(() => {
    if (!isFaceDetected || !imageSrc) return;

    const handleResize = () => {
      drawGlasses();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFaceDetected, imageSrc, drawGlasses]);

  const tryOnVariants = variants.filter(v => v.tryOn);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Photo Upload Area - Takes available space */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 bg-muted/30 rounded-xl overflow-hidden border border-border/50"
        style={{ maxWidth: '100%' }}
      >
        {imageSrc ? (
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            <img
              id="tryon-user-photo"
              src={imageSrc}
              alt="Your photo"
              className="max-w-full max-h-full object-contain"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />
            {isFaceDetected && (
              <canvas
                ref={canvasRef}
                className="absolute touch-manipulation"
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  pointerEvents: 'auto',
                  display: 'block',
                  maxWidth: '100%'
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
          <div
            className="flex flex-col items-center justify-center h-full text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-16 w-16 mb-4 text-teal-primary" />
            <p className="text-base font-semibold">Upload a photo to try on glasses</p>
            <p className="text-sm mt-2 text-muted-foreground/70">Click here or use the button below</p>
          </div>
        )}

        {/* Status overlay */}
        {(status === "loading" || status === "detecting") && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-primary" />
              <p className="text-sm font-semibold">{statusMessage}</p>
            </div>
          </div>
        )}

        {status === "error" && statusMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground px-4 py-3 rounded-lg text-sm text-center font-medium">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Bottom Controls - Fixed height */}
      <div className="flex-shrink-0 pt-4 space-y-4">
        {/* Upload Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="default"
            className="border-teal-primary text-teal-primary hover:bg-teal-primary/10 flex-shrink-0 h-11 px-4 text-base font-semibold"
          >
            <Upload className="h-5 w-5 mr-2" />
            {imageSrc ? "New Photo" : "Upload Photo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Drag hint */}
          {imageSrc && isFaceDetected && (
            <p className="text-sm text-muted-foreground">
              Drag glasses to adjust position
            </p>
          )}
        </div>

        {/* Variant Selector - Horizontal scroll */}
        {tryOnVariants.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-3 text-foreground">Choose Color</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {tryOnVariants.map((variant) => {
                const originalIndex = variants.findIndex(v => v.hex === variant.hex);
                const isSelected = selectedVariantIndex === originalIndex;

                return (
                  <button
                    key={variant.hex}
                    onClick={() => onVariantChange(originalIndex)}
                    className={cn(
                      "flex-shrink-0 p-2.5 rounded-lg border-2 transition-all w-[100px]",
                      isSelected
                        ? "border-teal-primary shadow-md bg-teal-primary/10"
                        : "border-border/50 hover:border-teal-primary/50 bg-background"
                    )}
                  >
                    <img
                      src={variant.tryOn || variant.thumbnail}
                      alt={variant.name}
                      className="w-full aspect-[3/2] object-contain rounded"
                    />
                    <p className={cn(
                      "text-xs mt-2 font-medium text-center truncate",
                      isSelected ? "text-teal-primary font-semibold" : "text-muted-foreground"
                    )}>
                      {variant.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

