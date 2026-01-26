import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadReviewImage } from "@/lib/s3";

// Maximum file size: 5MB per image
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of images per request
const MAX_IMAGES = 5;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload review images." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate number of files
    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { 
          error: `Too many files. Maximum ${MAX_IMAGES} images allowed.`,
          maxImages: MAX_IMAGES
        },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const errors: { filename: string; error: string }[] = [];

    // Process each file
    for (const file of files) {
      // Skip if not a valid file
      if (!file || typeof file === "string") {
        continue;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({
          filename: file.name,
          error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC`
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          filename: file.name,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        });
        continue;
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3
        const url = await uploadReviewImage(
          buffer,
          file.name,
          file.type,
          userId
        );

        if (url) {
          uploadedUrls.push(url);
          console.log(`[Upload] Review image uploaded: ${url}`);
        } else {
          errors.push({
            filename: file.name,
            error: "Failed to upload to storage"
          });
        }
      } catch (uploadError: any) {
        errors.push({
          filename: file.name,
          error: uploadError.message || "Upload failed"
        });
      }
    }

    // Check if any uploads succeeded
    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { 
          error: "No files were uploaded successfully",
          errors
        },
        { status: 400 }
      );
    }

    console.log(`[Upload] ${uploadedUrls.length} review images uploaded successfully`);

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      uploadedCount: uploadedUrls.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} image(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error("[Upload] Error uploading review images:", error.message);
    return NextResponse.json(
      { error: "An error occurred while uploading. Please try again." },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  // Use environment variable for production, fallback to same-origin
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "*";
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}



