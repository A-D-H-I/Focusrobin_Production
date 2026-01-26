"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface GalleryImageUploaderProps {
  value?: string;
  onChange: (urls: string) => void;
  folder?: "products" | "categories" | "hero" | "instagram" | "iconic" | "prescription-glasses" | "gift-banners" | "shapes" | "lens-images" | "other";
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function GalleryImageUploader({
  value,
  onChange,
  folder = "products",
  label = "Gallery Images",
  description,
  accept = "image/*",
  maxSizeMB = 10,
  className = "",
}: GalleryImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Parse comma-separated URLs from value
  const imageUrls = value
    ? value.split(',').map(url => url.trim()).filter(url => url.length > 0)
    : [];

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

      // Add the new URL to the existing list
      const newUrls = [...imageUrls, result.url];
      const updatedValue = newUrls.join(', ');
      onChange(updatedValue);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded to S3 successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setUploadError(error.message || "Failed to upload image");
      
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

  const handleRemoveImage = (indexToRemove: number) => {
    const newUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    const updatedValue = newUrls.join(', ');
    onChange(updatedValue);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Upload Button */}
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

      {/* Image Previews */}
      {imageUrls.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Uploaded Images ({imageUrls.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative border rounded-lg p-2 bg-muted/50">
                <div className="relative w-full aspect-square rounded-md overflow-hidden border bg-background">
                  {url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                    <Image
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate flex-1 mr-2">
                    {index === 0 && <span className="font-semibold text-primary">Primary</span>}
                    {index === 0 && url.length > 0 && ' • '}
                    {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* URL Textarea */}
      <div className="space-y-1">
        <Label>Image URLs (comma-separated)</Label>
        <Textarea
          value={value || ""}
          onChange={handleTextareaChange}
          placeholder="/images/products/gallery1.jpg, /images/products/gallery2.jpg, /images/products/gallery3.jpg"
          rows={3}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          URLs are automatically updated when you upload images. You can also edit manually. First image will be marked as primary.
        </p>
      </div>
    </div>
  );
}

