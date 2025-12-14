"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, RotateCcw, ShoppingCart, Check, User, CircleDot, ArrowDown } from "lucide-react";
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

// LocalStorage key for storing camera captured photo
const STORED_USER_PHOTO_KEY = "virtual-tryon-user-photo";
// LocalStorage key for tracking if user has seen instructions
const INSTRUCTIONS_SEEN_KEY = "virtual-tryon-instructions-seen";

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
  const detectionInProgress = useRef(false); // Prevent multiple detections
  const [hoveredVariantId, setHoveredVariantId] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isFaceStraight, setIsFaceStraight] = useState(false);
  const [faceCheckMessage, setFaceCheckMessage] = useState<string>("");
  const [showInstructions, setShowInstructions] = useState(true); // Show instructions on open
  const canvasRef = useRef<HTMLDivElement>(null);
  const glassesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      if (storedPhoto) {
        setUploadedImage(storedPhoto);
        setShowInstructions(false); // Don't show instructions if they have a photo
      } else {
        // Always show instructions when no photo is saved
        setShowInstructions(true);
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
    if (typeof window === "undefined") return;
    
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
        setModelsLoaded(false);
      }
    };
    if (isOpen && !modelsLoaded) {
      loadModels();
    }
  }, [isOpen, modelsLoaded]);

  // Automatic face detection and glasses positioning
  const detectFaceAndPositionGlasses = useCallback(
    async (imageSrc: string) => {
      // Prevent multiple simultaneous detections
      if (detectionInProgress.current) {
        console.log("Detection already in progress, skipping");
        return;
      }
      
      if (!modelsLoaded) {
        console.warn("Models not loaded yet");
        // Just show glasses at center without detection
        setFaceDetectionComplete(true);
        return;
      }

      detectionInProgress.current = true;
      setIsDetecting(true);
      setDetectionError(null);

      // Set a global timeout - detection must complete within 8 seconds
      const timeoutId = setTimeout(() => {
        if (detectionInProgress.current) {
          console.warn("Face detection timeout - showing glasses at center");
          setDetectionError("Detection took too long. You can drag the glasses to position them.");
          setGlassesPosition({ x: 0, y: 0 });
          setGlassesScale(100);
          setGlassesRotation(0);
          setFaceDetectionComplete(true);
          setIsDetecting(false);
          detectionInProgress.current = false;
        }
      }, 8000);

      try {
        // Create image element for detection
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error("Image load timeout")), 5000);
        });

        // Run face detection with landmarks
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.3 // Lower threshold for better detection
          }))
          .withFaceLandmarks();

        if (!detection) {
          clearTimeout(timeoutId);
          console.warn("No face detected in image");
          // Still show glasses at center so user can manually position
          setDetectionError(
            "No face detected. You can drag the glasses to position them."
          );
          setGlassesPosition({ x: 0, y: 0 });
          setGlassesScale(100);
          setGlassesRotation(0);
          setFaceDetectionComplete(true);
          setIsDetecting(false);
          detectionInProgress.current = false;
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

        if (!canvasRef.current) {
          clearTimeout(timeoutId);
          setFaceDetectionComplete(true);
          setIsDetecting(false);
          detectionInProgress.current = false;
          return;
        }
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
        setIsDetecting(false);
        detectionInProgress.current = false;
        clearTimeout(timeoutId);

        console.log("✨ Face detection complete");
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error during face detection:", error);
        // Still show glasses so user can manually position
        setDetectionError(
          "Face detection failed. You can drag the glasses to position them."
        );
        setGlassesPosition({ x: 0, y: 0 });
        setGlassesScale(100);
        setGlassesRotation(0);
        setFaceDetectionComplete(true);
        setIsDetecting(false);
        detectionInProgress.current = false;
      }
    },
    [modelsLoaded]
  );

  // Start camera
  const startCamera = useCallback(async () => {
    console.log("startCamera called, checking environment...");
    if (typeof window === "undefined") {
      console.error("Window is undefined - server side?");
      return;
        }

    try {
      // Check if we're on HTTPS or localhost (required for camera on mobile)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      
      console.log("Secure context check:", { protocol: window.location.protocol, hostname: window.location.hostname, isSecure });
      
      if (!isSecure) {
        console.error("Not a secure context");
        toast({
          title: "HTTPS Required",
          description: "Camera access requires a secure connection (HTTPS). Please access this site via HTTPS.",
          variant: "destructive",
        });
        return;
      }

      // Check if mediaDevices is available
      if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Check for legacy getUserMedia (older mobile browsers)
        const legacyGetUserMedia = (navigator as any)?.getUserMedia || 
                                  (navigator as any)?.webkitGetUserMedia || 
                                  (navigator as any)?.mozGetUserMedia ||
                                  (navigator as any)?.msGetUserMedia;
        
        if (!legacyGetUserMedia) {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        toast({
          title: "Camera Not Available",
            description: isMobile 
              ? "Your mobile browser doesn't support camera access. Please use Chrome, Safari, or Firefox on your mobile device."
              : "Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Edge.",
          variant: "destructive",
        });
        return;
        } else {
          // Use legacy API with promise wrapper
          const legacyStream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(
              navigator,
              { video: { facingMode: "user" } },
              resolve,
              reject
            );
          });
          
          // Set state - useEffect will handle attaching to video element
          setCameraStream(legacyStream);
          setIsCameraActive(true);
          console.log("Legacy stream obtained, waiting for video element...");
          return;
        }
      }

      // Stop any existing camera stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log("Is mobile device:", isMobile);
      
      // Mobile-friendly constraints
      const videoConstraints: MediaTrackConstraints = isMobile
        ? {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        : {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 4/5 }
          };

      console.log("Requesting camera with constraints:", videoConstraints);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });
      
      console.log("Camera stream obtained:", stream);
      // Set state first - this will trigger the video element to render
      setCameraStream(stream);
      setIsCameraActive(true);
      
      // Don't try to attach stream here - let the useEffect handle it
      // This prevents race conditions where the video element isn't rendered yet
      console.log("Camera stream obtained, waiting for video element to render...");
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Unable to access camera. Please check permissions.";
      
      // Detect mobile for better error messages
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        if (isMobile) {
          errorMessage = "Camera permission denied. Please:\n1. Allow camera access in your browser settings\n2. Make sure you're using HTTPS\n3. Try refreshing the page";
        } else {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings and refresh the page.";
        }
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        if (isMobile) {
          errorMessage = "No camera found. Please make sure your device has a front-facing camera and it's not being used by another app.";
        } else {
        errorMessage = "No camera found. Please connect a camera device.";
        }
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        if (isMobile) {
          errorMessage = "Camera is in use. Please close other apps (like Camera, Instagram, Snapchat) that might be using the camera.";
        } else {
          errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
        }
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported. Trying with default settings...";
        // Try again with simpler constraints - even simpler for mobile
        try {
          const simpleConstraints = isMobile 
            ? { video: { facingMode: "user" } }
            : { video: { facingMode: "user" } };
          
          const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
          // Set state - useEffect will handle attaching to video element
          setCameraStream(stream);
          setIsCameraActive(true);
          console.log("Fallback stream obtained, waiting for video element...");
          return;
        } catch (retryError) {
          if (isMobile) {
            errorMessage = "Unable to access camera. Please try:\n1. Using Chrome or Safari browser\n2. Making sure you're on HTTPS\n3. Checking camera permissions in browser settings";
          } else {
            errorMessage = "Unable to access camera with any settings.";
          }
        }
      } else if (isMobile) {
        // Generic mobile error
        errorMessage = `Camera error: ${error.message || error.name}. Please ensure:\n1. You're using HTTPS\n2. Camera permissions are allowed\n3. No other app is using the camera`;
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsCameraActive(false);
    }
  }, [toast, cameraStream]);

  // Stop camera
  const stopCamera = useCallback(() => {
    console.log("stopCamera called");
    if (cameraStream) {
      console.log("Stopping camera stream tracks");
      cameraStream.getTracks().forEach((track) => {
        console.log("Stopping track:", track.label);
        track.stop();
      });
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsFaceStraight(false);
    setFaceCheckMessage("");
    if (videoRef.current) {
      console.log("Clearing video srcObject");
      videoRef.current.srcObject = null as any;
    }
  }, [cameraStream]);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    console.log("Stream attachment useEffect triggered:", { isCameraActive, hasCameraStream: !!cameraStream });
    
    if (!isCameraActive || !cameraStream) {
      console.log("Skipping stream attachment - camera not active or no stream");
      return;
    }
    
    // Wait for video element to render, then attach stream
    const attachStream = async () => {
      console.log("Starting stream attachment process...");
      let retries = 0;
      const maxRetries = 30; // Increased retries
      
      // Wait for video element to be rendered in DOM
      while (!videoRef.current && retries < maxRetries) {
        console.log(`Waiting for video element... attempt ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!videoRef.current) {
        console.error("Video element not found after waiting");
        toast({
          title: "Camera Error",
          description: "Video element not found. Please close and reopen the try-on.",
          variant: "destructive",
        });
        setIsCameraActive(false);
        return;
      }
      
      console.log("Video element found, attaching stream...");
      
      try {
        // Attach stream
        videoRef.current.srcObject = cameraStream;
        console.log("Stream attached to video element, waiting for canplay...");
        
        // Wait for video to be ready using canplay event
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            console.error("Video element lost after attaching stream");
            reject(new Error("Video element lost"));
            return;
          }
          
          const video = videoRef.current;
          
          const onCanPlay = () => {
            console.log("Video canplay event fired");
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            console.error("Video error event:", e);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            reject(new Error("Video error"));
          };
          
          video.addEventListener('canplay', onCanPlay, { once: true });
          video.addEventListener('error', onError, { once: true });
          
          // Fallback timeout
          setTimeout(() => {
            console.log("Canplay timeout reached, resolving anyway");
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            resolve(); // Resolve anyway to continue
          }, 3000);
          
          // Try to play
          console.log("Attempting to play video...");
          video.play().catch(err => {
            console.warn("Video play error (will retry):", err);
          });
        });
        
        // Ensure video is playing
        if (videoRef.current && videoRef.current.paused) {
          console.log("Video is paused, attempting to play again...");
          try {
            await videoRef.current.play();
            console.log("Video playing successfully");
          } catch (playError) {
            console.error("Failed to play video:", playError);
          }
        }
        
        console.log("Stream attached and playing successfully!");
      } catch (error) {
        console.error("Error attaching stream to video:", error);
        toast({
          title: "Camera Error",
          description: "Failed to display camera feed. Please try again.",
          variant: "destructive",
        });
        // Don't set isCameraActive to false here - let user retry
        }
    };
    
    attachStream();
  }, [isCameraActive, cameraStream, toast]);

  // Simplified camera face checking - just allow capture after a delay
  useEffect(() => {
    if (!isCameraActive) {
      setIsFaceStraight(false);
      setFaceCheckMessage("");
      return;
    }

    // After camera is active for 1.5 seconds, allow capture
    setFaceCheckMessage("Position your face in the frame...");
    const timer = setTimeout(() => {
      setIsFaceStraight(true);
      setFaceCheckMessage("✓ Ready to capture!");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isCameraActive]);

  // Cleanup camera on unmount or close
  useEffect(() => {
    console.log("Cleanup effect triggered:", { isOpen });
    if (!isOpen) {
      console.log("Modal closed, stopping camera");
      stopCamera();
    }
    
    return () => {
      console.log("Cleanup effect unmounting, stopping camera");
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen, not stopCamera to avoid recreating

  // Capture photo from camera - simplified
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) {
      toast({
        title: "Camera Error",
        description: "Camera not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const videoWidth = videoRef.current.videoWidth || 640;
      const videoHeight = videoRef.current.videoHeight || 480;

      const canvas = document.createElement("canvas");
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context failed");
      }

      ctx.drawImage(videoRef.current, 0, 0);
      const imageSrc = canvas.toDataURL("image/jpeg", 0.8);

      if (!imageSrc || imageSrc === "data:,") {
        throw new Error("Failed to generate image data");
      }

      // Stop camera
      stopCamera();

      // Set the captured image
      setUploadedImage(imageSrc);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORED_USER_PHOTO_KEY, imageSrc);
      }

      // Reset glasses position - detection will happen via useEffect
      setGlassesPosition({ x: 0, y: 0 });
      setGlassesScale(100);
      setGlassesRotation(0);
      setFaceDetectionComplete(false);

      toast({
        title: "Photo Captured",
        description: "Positioning glasses...",
      });
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  }, [stopCamera, toast]);

  // Auto-detect face when models are loaded and we have an uploaded image
  // Only run once when image is first uploaded
  useEffect(() => {
    if (uploadedImage && isOpen && !isCameraActive && !faceDetectionComplete && !detectionInProgress.current) {
      // Wait for models to load or skip detection if they're not ready
      const timer = setTimeout(() => {
        if (modelsLoaded) {
      detectFaceAndPositionGlasses(uploadedImage);
        } else {
          // Show glasses anyway so user can manually position
          setFaceDetectionComplete(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [uploadedImage, modelsLoaded, isOpen, isCameraActive, faceDetectionComplete, detectFaceAndPositionGlasses]);

  // Close instructions and start camera
  const handleStartCamera = useCallback(() => {
    console.log("handleStartCamera called");
    setShowInstructions(false);
        if (typeof window !== "undefined") {
      localStorage.setItem(INSTRUCTIONS_SEEN_KEY, "true");
    }
    // Start camera after a small delay to allow modal to close and state to update
    setTimeout(() => {
      console.log("Starting camera...");
      startCamera().catch(err => {
        console.error("Error starting camera:", err);
        toast({
          title: "Camera Error",
          description: "Failed to start camera. Please check your permissions and try again.",
          variant: "destructive",
        });
      });
    }, 300); // Increased delay to ensure modal is closed
  }, [startCamera, toast]);

  // Retake photo - clear current photo and start camera
  const handleRetakePhoto = useCallback(() => {
    console.log("handleRetakePhoto called");
    setUploadedImage(null);
        setFaceDetectionComplete(false);
    setDetectionError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORED_USER_PHOTO_KEY);
    }
    setTimeout(() => {
      console.log("Starting camera for retake...");
      startCamera().catch(err => {
        console.error("Error starting camera for retake:", err);
        toast({
          title: "Camera Error",
          description: "Failed to start camera. Please check your permissions and try again.",
          variant: "destructive",
        });
      });
    }, 300);
  }, [startCamera, toast]);

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
    if (uploadedImage && modelsLoaded && !detectionInProgress.current) {
      detectionInProgress.current = false; // Reset to allow new detection
      setFaceDetectionComplete(false);
      setDetectionError(null);
      await detectFaceAndPositionGlasses(uploadedImage);
    }
  };

  // Capture screenshot of the try-on result
  const handleCapture = async () => {
    if (!canvasRef.current || !uploadedImage) return;

    try {
      // Create a canvas to capture the try-on result
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvasRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Create image from uploaded photo
      const img = new Image();
      img.src = uploadedImage;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          // Draw the background image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Draw glasses if visible
          if (glassesRef.current && glassesImageSrc && faceDetectionComplete) {
            const glassesImg = new Image();
            glassesImg.src = glassesImageSrc;
            glassesImg.onload = () => {
              const glassesRect = glassesRef.current!.getBoundingClientRect();
              const scale = glassesScale / 100;
              const width = glassesRect.width * scale;
              const height = glassesRect.height * scale;
              const x = rect.width / 2 + glassesPosition.x - width / 2;
              const y = rect.height / 2 + glassesPosition.y - height / 2;

              ctx.save();
              ctx.translate(x + width / 2, y + height / 2);
              ctx.rotate((glassesRotation * Math.PI) / 180);
              ctx.drawImage(glassesImg, -width / 2, -height / 2, width, height);
              ctx.restore();
            };
          }

          resolve();
        };
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `try-on-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);

        toast({
          title: "Screenshot Captured",
          description: "Your try-on result has been saved!",
        });
      }, "image/png");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast({
        title: "Capture Error",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="fixed inset-0 z-[150] overflow-y-auto overflow-x-hidden">
      {/* Animated gradient background */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Simple background gradient overlay - no particles for better performance */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-20 p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900/95 to-transparent backdrop-blur-sm"
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
              className="transition-all duration-300 w-24 sm:w-auto" 
              logoColor="white"
            />
          </motion.div>
          <motion.div
            className="flex items-center gap-2 sm:gap-4 lg:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-brand-teal/80 hidden md:block text-sm lg:text-base">Virtual Try-On Experience</p>
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start lg:items-center">
          {/* Virtual Try-On Display */}
          <motion.div 
            className="lg:col-span-7 w-full flex flex-col items-center justify-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div 
              ref={canvasRef}
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-brand-teal/10 to-blue-500/10 backdrop-blur-sm border border-white/20 shadow-2xl w-full aspect-[4/5] max-h-[500px] sm:max-h-[600px] flex items-center justify-center"
            >
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

              {!uploadedImage && !isCameraActive ? (
                /* Start Camera Area - Camera Only */
                <motion.div
                  className="aspect-[4/5] w-full flex flex-col items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center p-8 w-full">
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
                      <div className="w-24 h-24 rounded-full bg-brand-teal/20 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-brand-teal" />
                      </div>
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      Virtual Try-On
                    </h3>
                    <p className="text-brand-teal/80 mb-4 sm:mb-6 text-sm sm:text-base">
                      Take a photo to try on glasses
                    </p>
                      <motion.button
                      onClick={handleStartCamera}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl font-semibold flex items-center gap-2 sm:gap-3 shadow-lg mx-auto text-sm sm:text-base"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      Start Camera
                      </motion.button>
                    <p className="text-xs sm:text-sm text-brand-teal/60 mt-4 sm:mt-6">
                      Position your face straight in the center
                    </p>
                  </div>
                </motion.div>
              ) : isCameraActive && !uploadedImage ? (
                /* Camera Preview */
                <div className="relative aspect-[4/5] w-full max-h-[500px] sm:max-h-[600px] flex flex-col items-center justify-center">
                  <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ 
                        transform: 'scaleX(-1)', // Mirror the video for better UX
                      }}
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded:", {
                          videoWidth: videoRef.current?.videoWidth,
                          videoHeight: videoRef.current?.videoHeight,
                          readyState: videoRef.current?.readyState
                        });
                      }}
                      onError={(e) => {
                        console.error("Video error:", e);
                        toast({
                          title: "Camera Error",
                          description: "Failed to display camera feed. Please try again.",
                          variant: "destructive",
                        });
                        stopCamera();
                      }}
                    />
                    {/* Face detection overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        {/* Face guide frame */}
                        <div className="w-48 h-64 sm:w-64 sm:h-80 border-2 border-dashed rounded-lg"
                          style={{
                            borderColor: isFaceStraight ? '#4ECDC4' : 'rgba(255, 255, 255, 0.5)',
                            transition: 'border-color 0.3s'
                          }}
                        />
                        {/* Status indicator */}
                        <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2">
                          <div
                            className={cn(
                              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md",
                              isFaceStraight
                                ? "bg-green-500/90 text-white"
                                : "bg-yellow-500/90 text-white"
                            )}
                          >
                            {faceCheckMessage || "Position your face"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Camera controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                    <motion.button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={capturePhoto}
                      disabled={!isFaceStraight}
                      className={cn(
                        "px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg",
                        isFaceStraight
                          ? "bg-brand-teal hover:bg-brand-teal/90 text-white"
                          : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                      )}
                      whileHover={isFaceStraight ? { scale: 1.05 } : {}}
                      whileTap={isFaceStraight ? { scale: 0.95 } : {}}
                    >
                      <Camera className="w-5 h-5" />
                      Capture
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* Photo with glasses overlay */
                <div className="relative w-full h-full" style={{ pointerEvents: 'auto', minHeight: '400px' }}>
                  <img
                    src={uploadedImage || undefined}
                    alt="User photo"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    style={{ willChange: 'transform' }}
                  />

                  {/* Face Detection Loading Overlay - Simple version */}
                    {isDetecting && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="bg-white/95 rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-teal animate-spin" />
                          </div>
                          <p className="text-gray-800 font-bold text-lg mb-2">Detecting Face...</p>
                        <p className="text-gray-500 text-sm">Positioning glasses</p>
                          </div>
                    </div>
                    )}

                  {/* Glasses Overlay - Show when detection is complete OR after a timeout */}
                  {glassesImageSrc && faceDetectionComplete && (
                    <div
                      key={currentVariantIndex}
                      ref={glassesRef}
                      onMouseDown={handleGlassesMouseDown}
                      onTouchStart={handleGlassesTouchStart}
                      className="absolute cursor-move touch-none select-none z-20"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate3d(calc(-50% + ${glassesPosition.x}px), calc(-50% + ${glassesPosition.y}px), 0) scale(${glassesScale / 100}) rotate(${glassesRotation}deg)`,
                        transformOrigin: "center center",
                        transition: isDragging ? "none" : "transform 0.15s ease-out",
                        opacity: 1,
                        pointerEvents: 'auto',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        perspective: '1000px',
                      }}
                    >
                      <img
                        src={glassesImageSrc}
                        alt="Glasses"
                        className="max-w-[300px] w-auto h-auto pointer-events-none drop-shadow-2xl"
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        style={{
                          filter: isDragging ? "drop-shadow(0 0 20px rgba(77, 206, 202, 0.5))" : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))",
                          willChange: 'transform',
                          transform: 'translateZ(0)', // GPU acceleration
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
                      onClick={handleRetakePhoto}
                      className="bg-brand-teal hover:bg-brand-teal/90 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
                      title="Retake photo"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Camera className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCapture}
                      className="bg-white/90 hover:bg-white text-brand-teal p-3 rounded-full shadow-lg flex items-center justify-center"
                      title="Save screenshot"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <ArrowDown className="w-5 h-5" />
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
              className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-brand-teal to-blue-600 hover:from-brand-teal/90 hover:to-blue-700 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-xl flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                animate={showCartAnimation ? { scale: [1, 1.3, 1] } : {}}
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </motion.div>
              <span className="font-semibold">Add to Cart - {product.price}</span>
            </motion.button>

            {/* Error Message */}
            {uploadedImage && detectionError && (
              <motion.div 
                className="mt-4 sm:mt-6 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-xs sm:text-sm text-yellow-200 flex items-center gap-2">
                  <span>⚠️</span>
                  {detectionError}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Sunglass Carousel */}
          <motion.div 
            className="lg:col-span-5 w-full flex flex-col mt-6 lg:mt-0"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative flex flex-col w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex-shrink-0"
              >
                <h2 className="text-white text-lg sm:text-xl font-bold mb-2">Choose Your Style</h2>
                <p className="text-brand-teal/80 text-sm sm:text-base">Click to try on</p>
              </motion.div>

              <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] pr-2">
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
                        "relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300",
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
                          <h3 className="text-white font-medium mb-1 text-sm sm:text-base">{variant.name}</h3>
                          <motion.div
                            className="h-1 sm:h-1.5 rounded-full bg-gradient-to-r from-brand-teal/80 to-brand-teal"
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

      {/* Instructions Popup Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-gradient-to-br from-slate-900 via-teal-900/80 to-slate-900 rounded-3xl p-4 sm:p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              {/* Title */}
              <motion.div
                className="text-center mb-6 sm:mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-teal/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-brand-teal" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">How to Take Your Photo</h2>
                <p className="text-brand-teal/80 text-sm sm:text-base">Follow these steps for best results</p>
              </motion.div>

              {/* Instructions */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {/* Step 1 */}
                <motion.div
                  className="flex items-start gap-3 sm:gap-4 bg-white/5 rounded-xl p-3 sm:p-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-teal flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Face the Camera Straight</h3>
                    <p className="text-brand-teal/70 text-xs sm:text-sm">Look directly at the camera. Don&apos;t tilt your head left or right.</p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  className="flex items-start gap-3 sm:gap-4 bg-white/5 rounded-xl p-3 sm:p-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-teal flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Center Your Face</h3>
                    <p className="text-brand-teal/70 text-xs sm:text-sm">Position your face in the center of the dashed frame on screen.</p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  className="flex items-start gap-3 sm:gap-4 bg-white/5 rounded-xl p-3 sm:p-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-teal flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Good Lighting</h3>
                    <p className="text-brand-teal/70 text-xs sm:text-sm">Make sure your face is well-lit. Avoid strong backlighting.</p>
                  </div>
                </motion.div>

                {/* Visual Guide */}
                <motion.div
                  className="flex justify-center mt-4 sm:mt-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="relative">
                    {/* Face outline */}
                    <div className="w-20 h-28 sm:w-24 sm:h-32 border-2 border-dashed border-brand-teal rounded-xl flex items-center justify-center">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-brand-teal/50" />
                    </div>
                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <CircleDot className="w-5 h-5 sm:w-6 sm:h-6 text-brand-teal" />
                    </div>
                    {/* Checkmark */}
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={handleStartCamera}
                className="w-full py-3 sm:py-4 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                Got It! Start Camera
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
