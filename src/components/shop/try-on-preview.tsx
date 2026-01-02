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

  // Controls for fine-tuning
  const [scaleFactor, setScaleFactor] = useState(1.05);
  const [verticalOffset, setVerticalOffset] = useState(0.40);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassesImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
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
        
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });
        
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

  // Preload glasses images
  useEffect(() => {
    variants.forEach((variant, idx) => {
      if (glassesImagesRef.current.has(idx)) return;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = variant.tryOn || variant.thumbnail || "";
      img.onload = () => {
        glassesImagesRef.current.set(idx, img);
      };
    });
  }, [variants]);

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      faceDataRef.current = null;
      setIsFaceDetected(false);
      setImageSrc(url);
      setScaleFactor(1.05);
      setVerticalOffset(0.40);
    }
  };

  // Draw glasses on canvas using CACHED face data
  const drawGlasses = useCallback(() => {
    try {
      const faceData = faceDataRef.current;
      const glassesImg = glassesImagesRef.current.get(selectedVariantIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!faceData || !glassesImg || !canvas || !ctx) {
        return;
      }

      if (!glassesImg.complete || glassesImg.naturalWidth === 0) {
        return;
      }

      canvas.width = faceData.canvasWidth;
      canvas.height = faceData.canvasHeight;

      const glassesWidth = faceData.faceWidth * scaleFactor;
      const imgRatio = glassesImg.height / glassesImg.width;
      const glassesHeight = glassesWidth * imgRatio;

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
  }, [selectedVariantIndex, scaleFactor, verticalOffset]);

  // Run face detection ONCE when image is loaded
  const detectFace = useCallback(() => {
    if (isDetectingRef.current || !landmarkerRef.current || !imageSrc) {
      return;
    }

    const userImg = document.getElementById("tryon-user-photo") as HTMLImageElement;
    const canvas = canvasRef.current;

    if (!userImg || !canvas) {
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
        drawGlasses();
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
      const timer = setTimeout(() => {
        detectFace();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, isModelReady, detectFace]);

  // Redraw glasses when variant or settings change
  useEffect(() => {
    if (isFaceDetected && faceDataRef.current) {
      drawGlasses();
    }
  }, [selectedVariantIndex, scaleFactor, verticalOffset, isFaceDetected, drawGlasses]);

  const tryOnVariants = variants.filter(v => v.tryOn);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Photo Upload Area - Takes available space */}
      <div className="relative flex-1 min-h-0 bg-muted/30 rounded-xl overflow-hidden border border-border/50">
        {imageSrc ? (
          <>
            <img 
              id="tryon-user-photo" 
              src={imageSrc} 
              alt="Your photo" 
              className="w-full h-full object-contain"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none object-contain" 
            />
          </>
        ) : (
          <div 
            className="flex flex-col items-center justify-center h-full text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-10 w-10 mb-3 text-teal-primary" />
            <p className="text-sm font-medium">Upload a photo to try on glasses</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Click here or use the button below</p>
          </div>
        )}
        
        {/* Status overlay */}
        {(status === "loading" || status === "detecting") && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-primary" />
              <p className="text-xs font-medium">{statusMessage}</p>
            </div>
          </div>
        )}
        
        {status === "error" && statusMessage && (
          <div className="absolute bottom-3 left-3 right-3 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-lg text-xs text-center">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Bottom Controls - Fixed height */}
      <div className="flex-shrink-0 pt-3 space-y-3">
        {/* Upload Button + Fine-tune Controls Row */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="border-teal-primary text-teal-primary hover:bg-teal-primary/10 flex-shrink-0"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {imageSrc ? "New Photo" : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          
          {/* Inline Fine-tune Controls */}
          {imageSrc && isFaceDetected && (
            <div className="flex-1 flex items-center gap-4 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Width</label>
                <input
                  type="range"
                  min="0.9"
                  max="1.2"
                  step="0.01"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                  className="accent-teal-primary h-1.5 flex-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Height</label>
                <input
                  type="range"
                  min="0.2"
                  max="0.6"
                  step="0.01"
                  value={verticalOffset}
                  onChange={(e) => setVerticalOffset(parseFloat(e.target.value))}
                  className="accent-teal-primary h-1.5 flex-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Variant Selector - Horizontal scroll */}
        {tryOnVariants.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-2 text-foreground">Choose Color</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {tryOnVariants.map((variant) => {
                const originalIndex = variants.findIndex(v => v.hex === variant.hex);
                const isSelected = selectedVariantIndex === originalIndex;
                
                return (
                  <button
                    key={variant.hex}
                    onClick={() => onVariantChange(originalIndex)}
                    className={cn(
                      "flex-shrink-0 p-1.5 rounded-lg border-2 transition-all w-[72px]",
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
                      "text-[10px] mt-1 font-medium text-center truncate",
                      isSelected ? "text-teal-primary" : "text-muted-foreground"
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

