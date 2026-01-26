import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadPrescriptionImage } from "@/lib/s3";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload prescription." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "Invalid file type. Allowed types: JPEG, PNG, WebP, HEIC, PDF",
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const url = await uploadPrescriptionImage(
      buffer,
      file.name,
      file.type,
      userId
    );

    if (!url) {
      console.error("[Upload] Failed to upload prescription image to S3");
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Upload] Prescription image uploaded successfully: ${url}`);

    return NextResponse.json({
      success: true,
      url,
      message: "Prescription uploaded successfully",
    });
  } catch (error: any) {
    console.error("[Upload] Error uploading prescription:", error.message);
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



