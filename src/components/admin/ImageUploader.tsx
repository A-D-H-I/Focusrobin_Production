"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: "products" | "categories" | "hero" | "instagram" | "iconic" | "prescription-glasses" | "gift-banners" | "shapes" | "lens-images" | "split-banners" | "brands" | "color-families" | "other";
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  showPreview?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = "other",
  label = "Image",
  description,
  accept = "image/*",
  maxSizeMB = 10,
  showPreview = true,
  className = "",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File too large. Maximum size: ${maxSizeMB}MB`);
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to S3
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload/admin", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image");
      }

      // Update the value with S3 URL
      onChange(result.url);
      setPreview(result.url);

      toast({
        title: "Image uploaded",
        description: "Image has been uploaded to S3 successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setUploadError(error.message || "Failed to upload image");
      setPreview(null);

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update preview when value changes externally
  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-1">
        <Label htmlFor={`image-upload-${folder}`}>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Preview */}
      {showPreview && preview && (
        <div className="relative border rounded-lg p-4 bg-muted/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="relative w-full max-w-xs h-48 rounded-md overflow-hidden border bg-background">
                {preview.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 break-all">
                {preview}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!preview && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>
      )}

      {/* Replace Image Button */}
      {preview && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Replace Image
            </>
          )}
        </Button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* URL Input (for manual entry or editing) */}
      <div className="space-y-1">
        <Label htmlFor={`image-url-${folder}`}>Or enter image URL</Label>
        <Input
          id={`image-url-${folder}`}
          type="url"
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          placeholder="https://example.com/image.jpg"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

