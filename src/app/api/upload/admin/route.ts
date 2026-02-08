import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToS3 } from "@/lib/s3";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "model/gltf-binary", // For GLB 3D models
  "application/octet-stream", // For GLB files
];

// Allowed folders for organization
const ALLOWED_FOLDERS = [
  "products",
  "categories",
  "hero",
  "instagram",
  "iconic",
  "prescription-glasses",
  "gift-banners",
  "shapes",
  "lens-images",
  "split-banners",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "other";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate folder
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        {
          error: `Invalid folder. Allowed folders: ${ALLOWED_FOLDERS.join(", ")}`,
          allowedFolders: ALLOWED_FOLDERS
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, SVG, GLB",
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

    // Upload to S3 with admin folder structure
    const result = await uploadToS3(
      buffer,
      folder,
      file.name,
      file.type,
      `admin-${session.user.id}` // Use admin user ID for organization
    );

    if (!result) {
      console.error("[Upload] Failed to upload admin image to S3");
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Upload] Admin image uploaded successfully: ${result.url}`);

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      message: "Image uploaded successfully",
    });
  } catch (error: any) {
    console.error("[Upload] Error uploading admin image:", error.message);
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



