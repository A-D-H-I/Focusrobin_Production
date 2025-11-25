"use client";

import { useState, useRef, useEffect } from "react";
import { X, RotateCcw, ZoomIn, ZoomOut, Move3d } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Extend HTMLElement to include model-viewer types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src?: string;
        alt?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'camera-target'?: string;
        'auto-rotate'?: boolean;
        'auto-rotate-delay'?: string;
        'interaction-policy'?: string;
        'camera-controls'?: boolean;
        'touch-action'?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
        'environment-image'?: string;
        style?: React.CSSProperties;
        onLoad?: () => void;
        onMouseDown?: () => void;
        onMouseUp?: () => void;
        ref?: React.Ref<any>;
      };
    }
  }
}

type Product3DViewerProps = {
  modelUrl: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function Product3DViewer({ modelUrl, productName, isOpen, onClose }: Product3DViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraOrbit, setCameraOrbit] = useState("45deg 55deg 2.5m");
  const [fieldOfView, setFieldOfView] = useState("45deg");

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      // Check if model-viewer is loaded
      if (customElements.get('model-viewer')) {
        setIsLoading(false);
      } else {
        // Wait for model-viewer to be available
        const checkModelViewer = setInterval(() => {
          if (customElements.get('model-viewer')) {
            setIsLoading(false);
            clearInterval(checkModelViewer);
          }
        }, 100);
        
        return () => clearInterval(checkModelViewer);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  const resetCamera = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = "45deg 55deg 2.5m";
      modelViewerRef.current.fieldOfView = "45deg";
      setCameraOrbit("45deg 55deg 2.5m");
      setFieldOfView("45deg");
    }
  };

  const zoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modelViewerRef.current) {
      const currentFov = parseFloat(fieldOfView);
      const newFov = Math.max(10, currentFov - 10);
      setFieldOfView(`${newFov}deg`);
      modelViewerRef.current.fieldOfView = `${newFov}deg`;
    }
  };

  const zoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modelViewerRef.current) {
      const currentFov = parseFloat(fieldOfView);
      const newFov = Math.min(120, currentFov + 10);
      setFieldOfView(`${newFov}deg`);
      modelViewerRef.current.fieldOfView = `${newFov}deg`;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close 3D viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Control Buttons */}
      <div 
        className="absolute top-4 left-4 z-50 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={resetCamera}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          title="Reset Camera"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Instructions */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/10 text-white text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Move3d className="h-4 w-4" />
          <span>Click and drag to rotate • Scroll to zoom</span>
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div 
        className="w-full h-full max-w-7xl max-h-[90vh] mx-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-lg">Loading 3D model...</div>
          </div>
        ) : (
          <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={productName}
            camera-orbit={cameraOrbit}
            field-of-view={fieldOfView}
            camera-target="0m 0m 0m"
            auto-rotate={true}
            auto-rotate-delay="3000"
            camera-controls={true}
            touch-action="none"
            ar={true}
            ar-modes="webxr scene-viewer quick-look"
            shadow-intensity="1"
            exposure="1"
            environment-image="neutral"
            tabIndex={0}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              cursor: "grab",
              pointerEvents: "auto",
              outline: "none",
            }}
            onLoad={() => {
              setIsLoading(false);
              // Focus the model-viewer to enable interactions
              if (modelViewerRef.current) {
                modelViewerRef.current.focus();
              }
            }}
            onMouseDown={() => {
              if (modelViewerRef.current) {
                modelViewerRef.current.autoRotate = false;
                modelViewerRef.current.style.cursor = "grabbing";
              }
            }}
            onMouseUp={() => {
              if (modelViewerRef.current) {
                modelViewerRef.current.style.cursor = "grab";
                setTimeout(() => {
                  if (modelViewerRef.current) {
                    modelViewerRef.current.autoRotate = true;
                  }
                }, 3000);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

