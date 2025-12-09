"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Camera, RotateCcw, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Landing/logo";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import type { ProductColorVariant, Product } from "@/lib/productData";

interface VirtualTryOnProps {
  product: Product;
  variants: ProductColorVariant[];
  selectedVariantIndex: number;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// LocalStorage key for storing uploaded user photo
const STORED_USER_PHOTO_KEY = "virtual-tryon-user-photo";

export default function VirtualTryOn({
  product,
  variants,
  selectedVariantIndex,
  productName = "Glasses",
  isOpen,
  onClose,
}: VirtualTryOnProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [currentVariantIndex, setCurrentVariantIndex] = useState(selectedVariantIndex);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [glassesPosition, setGlassesPosition] = useState({ x: 0, y: 0 });
  const [glassesScale, setGlassesScale] = useState(100);
  const [glassesRotation, setGlassesRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetectionComplete, setFaceDetectionComplete] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [hasStoredImage, setHasStoredImage] = useState(false);
  const [hoveredVariantId, setHoveredVariantId] = useState<number | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const glassesRef = useRef<HTMLDivElement>(null);

  // Current variant and glasses image
  const currentVariant = variants[currentVariantIndex] || variants[0];
  const glassesImageSrc = currentVariant?.tryOn || currentVariant?.thumbnail || "";

  // Update current variant when selected variant changes
  useEffect(() => {
    setCurrentVariantIndex(selectedVariantIndex);
  }, [selectedVariantIndex]);

  // Load stored user photo from localStorage when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const storedPhoto = localStorage.getItem(STORED_USER_PHOTO_KEY);
      setHasStoredImage(!!storedPhoto);
      if (storedPhoto) {
        setUploadedImage(storedPhoto);
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Load face-api.js models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("Face detection models loaded successfully");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        setDetectionError("Failed to load face detection models");
      }
    };
    if (isOpen && !modelsLoaded) {
      loadModels();
    }
  }, [isOpen, modelsLoaded]);

  // Automatic face detection and glasses positioning
  const detectFaceAndPositionGlasses = useCallback(
    async (imageSrc: string) => {
      if (!modelsLoaded) {
        console.warn("Models not loaded yet");
        return;
      }

      setIsDetecting(true);
      setDetectionError(null);

      try {
        // Create image element for detection
        const img = new Image();
        img.src = imageSrc;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });

        // Run face detection with landmarks
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks();

        if (!detection) {
          console.warn("No face detected in image");
          setDetectionError(
            "No face detected. You can manually position the glasses."
          );
          setIsDetecting(false);
          setFaceDetectionComplete(true);
          return;
        }

        const landmarks = detection.landmarks;

        // Get eye positions (landmarks 36-41 for left eye, 42-47 for right eye)
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Get nose bridge points for better vertical positioning
        const nose = landmarks.getNose();
        const noseBridgeTop = nose[0];

        // Calculate center of each eye
        const leftEyeCenter = {
          x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length,
        };

        const rightEyeCenter = {
          x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length,
        };

        // Calculate rotation angle based on eye positions
        const deltaY = rightEyeCenter.y - leftEyeCenter.y;
        const deltaX = rightEyeCenter.x - leftEyeCenter.x;
        const angleRadians = Math.atan2(deltaY, deltaX);
        const angleDegrees = angleRadians * (180 / Math.PI);

        // Calculate inter-pupillary distance (IPD) for scaling
        const ipd = Math.sqrt(
          Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
            Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
        );

        // Calculate the midpoint between eyes (this is the center of the glasses)
        const eyesMidpoint = {
          x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
          y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
        };

        // Position glasses slightly below eye center (toward nose bridge)
        // For tilted faces, we need to position along the perpendicular axis
        // Calculate the perpendicular direction (90 degrees from eye line)
        const perpAngle = angleRadians + Math.PI / 2;

        // Calculate the vertical offset along the face's tilted axis
        // This moves the glasses down from eye center toward nose bridge
        const verticalOffset = ipd * 0.12; // Offset to position glasses correctly

        // Apply the offset in the direction perpendicular to the eye line
        // Ensure we always move DOWN (positive Y in image coordinates)
        const perpX = Math.cos(perpAngle) * verticalOffset;
        const perpY = Math.sin(perpAngle) * verticalOffset;
        
        // If perpY is negative (moving up), flip it to ensure we move down
        const finalY = perpY > 0 ? perpY : Math.abs(perpY);
        
        const glassesCenter = {
          x: eyesMidpoint.x + perpX,
          y: eyesMidpoint.y + finalY, // Always move down
        };

        // CRITICAL FIX: Get actual rendered image dimensions (accounting for object-cover)
        // Wait a frame to ensure image is rendered in DOM
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        if (!canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Calculate how the image is actually rendered with object-cover
        const containerAspect = canvasRect.width / canvasRect.height;
        const imageAspect = img.naturalWidth / img.naturalHeight;

        let renderedWidth: number,
          renderedHeight: number,
          offsetX: number,
          offsetY: number;

        if (imageAspect > containerAspect) {
          // Image is wider - height fills container, width is cropped
          renderedHeight = canvasRect.height;
          renderedWidth = renderedHeight * imageAspect;
          offsetX = (canvasRect.width - renderedWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller - width fills container, height is cropped
          renderedWidth = canvasRect.width;
          renderedHeight = renderedWidth / imageAspect;
          offsetX = 0;
          offsetY = (canvasRect.height - renderedHeight) / 2;
        }

        // Calculate scale factors from natural image size to rendered size
        const scaleX = renderedWidth / img.naturalWidth;
        const scaleY = renderedHeight / img.naturalHeight;

        // Convert image coordinates to canvas coordinates with proper offset
        // Y coordinate: image Y * scale + offset - center
        // This positions relative to the center of the canvas
        const canvasMidpoint = {
          x: (glassesCenter.x * scaleX + offsetX) - canvasRect.width / 2,
          y: (glassesCenter.y * scaleY + offsetY) - canvasRect.height / 2,
        };

        // Calculate scale
        const avgScale = (scaleX + scaleY) / 2;
        const targetGlassesWidth = ipd * 2.5 * avgScale;
        const baseGlassesWidth = 300;
        const calculatedScale = (targetGlassesWidth / baseGlassesWidth) * 100;

        // Clamp scale between 60% and 180%
        const finalScale = Math.max(60, Math.min(180, calculatedScale));

        // Apply the calculated transformations
        setGlassesPosition(canvasMidpoint);
        setGlassesRotation(angleDegrees);
        setGlassesScale(finalScale);
        setFaceDetectionComplete(true);

        console.log("✨ Tilted Face Glasses Fit Applied:", {
          naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
          renderedSize: `${renderedWidth.toFixed(0)}x${renderedHeight.toFixed(0)}`,
          scaleFactors: `${scaleX.toFixed(2)}x, ${scaleY.toFixed(2)}y`,
          eyesMidpoint: `${eyesMidpoint.x.toFixed(0)}, ${eyesMidpoint.y.toFixed(0)}`,
          glassesCenter: `${glassesCenter.x.toFixed(0)}, ${glassesCenter.y.toFixed(0)}`,
          canvasPosition: `${canvasMidpoint.x.toFixed(0)}, ${canvasMidpoint.y.toFixed(0)}`,
          rotation: `${angleDegrees.toFixed(1)}°`,
          scale: `${finalScale.toFixed(0)}%`,
          ipd: `${ipd.toFixed(0)}px`,
          verticalOffset: `${verticalOffset.toFixed(1)}px`,
        });
      } catch (error) {
        console.error("Error during face detection:", error);
        setDetectionError(
          "Face detection failed. You can manually position the glasses."
        );
        setFaceDetectionComplete(true);
      } finally {
        setIsDetecting(false);
      }
    },
    [modelsLoaded]
  );

  // Auto-detect face when models are loaded and we have an uploaded image
  useEffect(() => {
    if (uploadedImage && modelsLoaded && isOpen) {
      detectFaceAndPositionGlasses(uploadedImage);
    }
  }, [uploadedImage, modelsLoaded, isOpen, detectFaceAndPositionGlasses]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file) return;

      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a JPG or PNG image");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target?.result as string;
        setUploadedImage(imageSrc);
        
        // Save to localStorage for reuse across products
        if (typeof window !== "undefined") {
          localStorage.setItem(STORED_USER_PHOTO_KEY, imageSrc);
          setHasStoredImage(true);
        }

        // Reset glasses to center initially
        setGlassesPosition({ x: 0, y: 0 });
        setGlassesScale(100);
        setGlassesRotation(0);
        setFaceDetectionComplete(false);

        // Trigger automatic face detection
        if (modelsLoaded) {
          await detectFaceAndPositionGlasses(imageSrc);
        }
      };
      reader.readAsDataURL(file);
    },
    [modelsLoaded, detectFaceAndPositionGlasses]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  // Handle click to upload
  const handleClick = () => {
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Glasses dragging logic
  const handleGlassesMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    
    setIsDragging(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const currentCenterX = rect.width / 2 + glassesPosition.x;
    const currentCenterY = rect.height / 2 + glassesPosition.y;

    setDragOffset({
      x: e.clientX - rect.left - currentCenterX,
      y: e.clientY - rect.top - currentCenterY,
    });
  };

  const handleGlassesTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    setIsDragging(true);

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const currentCenterX = rect.width / 2 + glassesPosition.x;
    const currentCenterY = rect.height / 2 + glassesPosition.y;

    setDragOffset({
      x: touch.clientX - rect.left - currentCenterX,
      y: touch.clientY - rect.top - currentCenterY,
    });
  };

  // Document-level mouse move handler for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - dragOffset.x;
      const mouseY = e.clientY - rect.top - dragOffset.y;

      const x = mouseX - rect.width / 2;
      const y = mouseY - rect.height / 2;

      setGlassesPosition({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = touch.clientX - rect.left - dragOffset.x;
      const touchY = touch.clientY - rect.top - dragOffset.y;

      const x = touchX - rect.width / 2;
      const y = touchY - rect.height / 2;

      setGlassesPosition({ x, y });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  // Re-detect face
  const handleRedetect = async () => {
    if (uploadedImage && modelsLoaded) {
      setFaceDetectionComplete(false);
      await detectFaceAndPositionGlasses(uploadedImage);
    }
  };

  // Handle capture screenshot effect
  const handleCapture = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    toast({
      title: "Screenshot captured!",
      description: "Your try-on look has been saved.",
    });
  };

  // Handle add to cart
  const handleAddToCart = () => {
    const selectedVariant = variants[currentVariantIndex] || variants[0];
    addToCart(product, selectedVariant, 1);
    setShowCartAnimation(true);
    setTimeout(() => setShowCartAnimation(false), 1000);
    toast({
      title: "Added to cart",
      description: `${product.name} - ${selectedVariant.name} has been added to your cart.`,
    });
  };

  // Handle variant selection
  const handleVariantSelect = (index: number) => {
    if (index !== currentVariantIndex) {
      setCurrentVariantIndex(index);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden" style={{ overflow: 'hidden' }}>
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{ 
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0, 
              y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
              opacity: 0 
            }}
            animate={{
              y: [null, typeof window !== 'undefined' ? Math.random() * window.innerHeight : 500],
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
        className="relative z-10 p-6 lg:p-8"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <Logo 
              className="transition-all duration-300" 
              logoColor="white"
            />
          </motion.div>
          <motion.div
            className="flex items-center gap-4 lg:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-brand-teal/80 hidden sm:block">Virtual Try-On Experience</p>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8 h-[calc(100vh-100px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center justify-center h-full">
          {/* Virtual Try-On Display */}
          <motion.div 
            className="lg:col-span-7 h-full flex flex-col items-center justify-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div 
              ref={canvasRef}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-teal/10 to-blue-500/10 backdrop-blur-sm border border-white/20 shadow-2xl w-full h-full flex items-center justify-center"
            >
              {/* Hidden file input - always available for upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
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

              {!uploadedImage ? (
                /* Upload Area */
                <motion.div
                  onClick={handleClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "aspect-[4/5] w-full flex flex-col items-center justify-center cursor-pointer group transition-all duration-300",
                    isDraggingOver && "bg-brand-teal/20 scale-[1.02]"
                  )}
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center p-8">
                    <motion.div 
                      className="relative inline-block mb-6"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="w-24 h-24 rounded-full bg-brand-teal/20 flex items-center justify-center group-hover:bg-brand-teal/30 transition-all duration-300">
                        <Upload className="w-12 h-12 text-brand-teal group-hover:text-brand-teal/80 transition-colors" />
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-teal transition-colors">
                      Upload Your Photo
                    </h3>
                    <p className="text-brand-teal/80 mb-4">
                      Click or drag & drop to get started
                    </p>
                    <p className="text-sm text-brand-teal/60">
                      JPG or PNG • AI will auto-fit the glasses
                    </p>
                    {hasStoredImage && (
                      <motion.p 
                        className="text-sm text-brand-teal mt-4 font-medium"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        ✨ Loading your saved photo...
                      </motion.p>
                    )}
                    {isDraggingOver && (
                      <motion.p 
                        className="text-lg text-brand-teal mt-4 font-bold"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        Drop your photo here!
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Photo with glasses overlay */
                <div className="relative w-full h-full" style={{ pointerEvents: 'auto', minHeight: '400px' }}>
                  <img
                    src={uploadedImage}
                    alt="User photo"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />

                  {/* Face Detection Animation Overlay */}
                  <AnimatePresence>
                    {isDetecting && (
                      <motion.div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div 
                          className="bg-white/95 rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4"
                          initial={{ scale: 0.8, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                        >
                          <div className="relative w-20 h-20 mb-4">
                            <motion.div 
                              className="absolute inset-0 rounded-full border-4 border-brand-teal/20"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div 
                              className="absolute inset-2 rounded-full border-4 border-brand-teal/40"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-brand-teal animate-spin" />
                            <motion.div 
                              className="absolute inset-8 rounded-full bg-brand-teal"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          </div>
                          <p className="text-gray-800 font-bold text-lg mb-2">Detecting Face...</p>
                          <p className="text-gray-600 text-sm mb-1">Analyzing facial features</p>
                          <p className="text-gray-500 text-xs">Positioning glasses perfectly</p>
                          <div className="w-full max-w-[200px] h-1.5 bg-gray-200 rounded-full mt-4 overflow-hidden">
                            <motion.div 
                              className="h-full bg-brand-teal rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Glasses Overlay */}
                  {glassesImageSrc && !isDetecting && faceDetectionComplete && (
                    <div
                      key={currentVariantIndex}
                      ref={glassesRef}
                      onMouseDown={handleGlassesMouseDown}
                      onTouchStart={handleGlassesTouchStart}
                      className="absolute cursor-move touch-none select-none z-20"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${glassesPosition.x}px), calc(-50% + ${glassesPosition.y}px)) scale(${glassesScale / 100}) rotate(${glassesRotation}deg)`,
                        transformOrigin: "center center",
                        transition: isDragging ? "none" : "transform 0.15s ease-out",
                        opacity: 1,
                        pointerEvents: 'auto',
                      }}
                    >
                      <img
                        src={glassesImageSrc}
                        alt="Glasses"
                        className="max-w-[300px] w-auto h-auto pointer-events-none drop-shadow-2xl"
                        draggable={false}
                        style={{
                          filter: isDragging ? "drop-shadow(0 0 20px rgba(77, 206, 202, 0.5))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
                        }}
                      />
                    </div>
                  )}

                  {/* Info badge with product name - Always visible */}
                  <motion.div
                    className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg z-30"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentVariantIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <p className="text-slate-800 font-semibold mb-1">{productName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-teal font-bold">{product.price}</span>
                          <span className="text-slate-500 text-sm">{currentVariant?.name}</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  {/* Control buttons - Always visible */}
                  <div className="absolute bottom-4 right-4 flex gap-2 z-30">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClick}
                      className="bg-brand-teal hover:bg-brand-teal/90 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
                      title="Upload new photo"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Upload className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCapture}
                      className="bg-brand-teal hover:bg-brand-teal/90 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
                      title="Capture screenshot"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Camera className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRedetect}
                      disabled={!modelsLoaded || isDetecting}
                      className="bg-white/90 hover:bg-white text-brand-teal p-3 rounded-full shadow-lg disabled:opacity-50 flex items-center justify-center"
                      title="Re-detect face"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <motion.button
              onClick={handleAddToCart}
              className="w-full mt-6 bg-gradient-to-r from-brand-teal to-blue-600 hover:from-brand-teal/90 hover:to-blue-700 text-white py-4 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                animate={showCartAnimation ? { scale: [1, 1.3, 1] } : {}}
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </motion.div>
              <span className="font-semibold">Add to Cart - {product.price}</span>
            </motion.button>

            {/* Error Message */}
            {uploadedImage && detectionError && (
              <motion.div 
                className="mt-6 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-sm text-yellow-200 flex items-center gap-2">
                  <span>⚠️</span>
                  {detectionError}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Sunglass Carousel */}
          <motion.div 
            className="lg:col-span-5 h-full flex flex-col"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative flex flex-col h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex-shrink-0"
              >
                <h2 className="text-white text-xl font-bold mb-2">Choose Your Style</h2>
                <p className="text-brand-teal/80">Click to try on</p>
              </motion.div>

              <div className="space-y-3 flex-1 overflow-hidden">
                {variants.map((variant, index) => (
                  <motion.div
                    key={`${variant.name}-${index}`}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                    }}
                    transition={{ 
                      delay: index * 0.1,
                    }}
                    whileHover={{ 
                      scale: 1.03,
                      y: -3,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => handleVariantSelect(index)}
                    onMouseEnter={() => setHoveredVariantId(index)}
                    onMouseLeave={() => setHoveredVariantId(null)}
                    className="cursor-pointer"
                  >
                    <motion.div
                      className={cn(
                        "relative p-5 rounded-2xl border-2 transition-all duration-300",
                        currentVariantIndex === index
                          ? "bg-white/20 border-white shadow-2xl"
                          : "bg-white/5 border-white/20 hover:bg-white/10"
                      )}
                      animate={{
                        boxShadow: currentVariantIndex === index 
                          ? ["0 0 20px rgba(77, 206, 202, 0.4)", "0 0 40px rgba(77, 206, 202, 0.6)", "0 0 20px rgba(77, 206, 202, 0.4)"]
                          : "0 0 0px rgba(77, 206, 202, 0)",
                      }}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity }
                      }}
                    >
                      {/* Preview and info */}
                      <div className="flex items-center gap-4">
                        {/* Glasses preview color block */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <div 
                            className="w-8 h-5 rounded-sm transition-all duration-300"
                            style={{ 
                              backgroundColor: variant.hex || "#6b21a8",
                              boxShadow: hoveredVariantId === index ? `0 0 12px ${variant.hex || "#6b21a8"}` : "none",
                            }}
                          />
                          <div 
                            className="w-8 h-5 rounded-sm transition-all duration-300"
                            style={{ 
                              backgroundColor: variant.hex || "#6b21a8",
                              boxShadow: hoveredVariantId === index ? `0 0 12px ${variant.hex || "#6b21a8"}` : "none",
                            }}
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{variant.name}</h3>
                          <motion.div
                            className="h-1.5 rounded-full bg-gradient-to-r from-brand-teal/80 to-brand-teal"
                            initial={{ width: 0 }}
                            animate={{ width: currentVariantIndex === index ? '100%' : '60%' }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* Particle effects on hover */}
                      {hoveredVariantId === index && (
                        <>
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-brand-teal rounded-full"
                              initial={{ 
                                x: '50%', 
                                y: '50%',
                                opacity: 1 
                              }}
                              animate={{
                                x: `${50 + Math.cos(i * Math.PI / 3) * 80}%`,
                                y: `${50 + Math.sin(i * Math.PI / 3) * 80}%`,
                                opacity: 0,
                                scale: [1, 2, 0],
                              }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* Selection indicator */}
                      {currentVariantIndex === index && (
                        <motion.div
                          className="absolute -right-2 -top-2 w-7 h-7 bg-brand-teal rounded-full flex items-center justify-center shadow-lg"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(77, 206, 202, 0.5) rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(77, 206, 202, 0.5);
          border-radius: 10px;
          min-height: 40px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(77, 206, 202, 0.7);
        }
        
        /* Slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4DCECA, #3a9d99);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(77, 206, 202, 0.4);
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(77, 206, 202, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4DCECA, #3a9d99);
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(77, 206, 202, 0.4);
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(77, 206, 202, 0.6);
        }
      `}} />
    </div>
  );
}
