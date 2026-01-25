"use server";

import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client singleton
let s3Client: S3Client | null = null;

/**
 * Get or create S3 client
 */
function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  const region = process.env.AWS_S3_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    console.error("[S3] Missing AWS configuration. Required: AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY");
    return null;
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  console.log("[S3] Client initialized successfully");
  return s3Client;
}

/**
 * Get the S3 bucket name from environment
 */
function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("[S3] AWS_S3_BUCKET_NAME is not set");
  }
  return bucket;
}

/**
 * Generate a unique file key for S3
 * @param folder - The folder/prefix (e.g., "prescriptions", "reviews")
 * @param originalFilename - Original file name
 * @param userId - User ID for organization
 */
function generateFileKey(folder: string, originalFilename: string, userId?: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split(".").pop() || "jpg";
  const safeFileName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  
  if (userId) {
    return `${folder}/${userId}/${timestamp}-${randomSuffix}-${safeFileName}`;
  }
  return `${folder}/${timestamp}-${randomSuffix}-${safeFileName}`;
}

/**
 * Upload a file to S3
 * @param buffer - File buffer
 * @param folder - Folder prefix (e.g., "prescriptions", "reviews")
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param userId - Optional user ID
 * @returns Object with the S3 URL and key
 */
export async function uploadToS3(
  buffer: Buffer,
  folder: string,
  filename: string,
  contentType: string,
  userId?: string
): Promise<{ url: string; key: string } | null> {
  console.log(`[S3] Attempting to upload file: ${filename} to folder: ${folder}`);

  const client = getS3Client();
  if (!client) {
    console.error("[S3] Client not available. Check AWS configuration.");
    return null;
  }

  try {
    const bucket = getBucketName();
    const key = generateFileKey(folder, filename, userId);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Make the file publicly readable
      ACL: "public-read",
      // Add cache control for better performance
      CacheControl: "max-age=31536000", // 1 year cache
    });

    await client.send(command);

    // Construct the public URL
    const region = process.env.AWS_S3_REGION;
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    console.log(`[S3] ✓ File uploaded successfully: ${url}`);

    return { url, key };
  } catch (error: any) {
    console.error("[S3] Error uploading file:", error.message);
    
    if (error.name === "AccessDenied") {
      console.error("[S3] Access denied. Check IAM permissions and bucket policy.");
    } else if (error.name === "NoSuchBucket") {
      console.error("[S3] Bucket does not exist. Check AWS_S3_BUCKET_NAME.");
    }
    
    return null;
  }
}

/**
 * Upload prescription image to S3
 * @param buffer - Image buffer
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param userId - User ID
 * @returns S3 URL or null
 */
export async function uploadPrescriptionImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<string | null> {
  const result = await uploadToS3(buffer, "prescriptions", filename, contentType, userId);
  return result?.url || null;
}

/**
 * Upload review image to S3
 * @param buffer - Image buffer
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param userId - User ID
 * @returns S3 URL or null
 */
export async function uploadReviewImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<string | null> {
  const result = await uploadToS3(buffer, "reviews", filename, contentType, userId);
  return result?.url || null;
}

/**
 * Delete a file from S3
 * @param key - S3 object key
 * @returns true if successful
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  console.log(`[S3] Attempting to delete file: ${key}`);

  const client = getS3Client();
  if (!client) {
    console.error("[S3] Client not available. Check AWS configuration.");
    return false;
  }

  try {
    const bucket = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    console.log(`[S3] ✓ File deleted successfully: ${key}`);
    return true;
  } catch (error: any) {
    console.error("[S3] Error deleting file:", error.message);
    return false;
  }
}

/**
 * Generate a pre-signed URL for uploading (useful for client-side uploads)
 * @param folder - Folder prefix
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param userId - Optional user ID
 * @param expiresIn - URL expiry in seconds (default: 60)
 * @returns Pre-signed URL and key
 */
export async function getPresignedUploadUrl(
  folder: string,
  filename: string,
  contentType: string,
  userId?: string,
  expiresIn: number = 60
): Promise<{ uploadUrl: string; key: string; publicUrl: string } | null> {
  console.log(`[S3] Generating pre-signed upload URL for: ${filename}`);

  const client = getS3Client();
  if (!client) {
    console.error("[S3] Client not available. Check AWS configuration.");
    return null;
  }

  try {
    const bucket = getBucketName();
    const key = generateFileKey(folder, filename, userId);
    const region = process.env.AWS_S3_REGION;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    console.log(`[S3] ✓ Pre-signed URL generated for: ${key}`);

    return { uploadUrl, key, publicUrl };
  } catch (error: any) {
    console.error("[S3] Error generating pre-signed URL:", error.message);
    return null;
  }
}

/**
 * Generate a pre-signed URL for downloading (for private files)
 * @param key - S3 object key
 * @param expiresIn - URL expiry in seconds (default: 3600)
 * @returns Pre-signed download URL
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  console.log(`[S3] Generating pre-signed download URL for: ${key}`);

  const client = getS3Client();
  if (!client) {
    console.error("[S3] Client not available. Check AWS configuration.");
    return null;
  }

  try {
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    console.log(`[S3] ✓ Pre-signed download URL generated for: ${key}`);
    return url;
  } catch (error: any) {
    console.error("[S3] Error generating pre-signed download URL:", error.message);
    return null;
  }
}

/**
 * Check if a file exists in S3
 * @param key - S3 object key
 * @returns true if file exists
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) {
    return false;
  }

  try {
    const bucket = getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      return false;
    }
    console.error("[S3] Error checking file existence:", error.message);
    return false;
  }
}

