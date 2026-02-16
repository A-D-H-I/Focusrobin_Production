/**
 * Client-side S3 utilities
 * These are pure JavaScript functions that can be used in client components
 */

/**
 * Get the public URL format for an S3 key
 * @param key - S3 object key
 * @param bucket - S3 bucket name
 * @param region - S3 region
 * @returns Public URL
 */
export function getS3PublicUrl(key: string, bucket: string, region: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Extract the S3 key from a full S3 URL
 * @param url - Full S3 URL
 * @returns S3 object key
 */
export function extractKeyFromS3Url(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle both formats:
    // https://bucket.s3.region.amazonaws.com/key
    // https://s3.region.amazonaws.com/bucket/key
    
    if (urlObj.hostname.includes("s3.") && urlObj.hostname.includes("amazonaws.com")) {
      // Remove leading slash
      return urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is an S3 URL
 * @param url - URL to check
 * @returns true if URL is S3
 */
export function isS3Url(url: string): boolean {
  try {
    return url.includes('s3.') && url.includes('amazonaws.com');
  } catch {
    return false;
  }
}

/**
 * Get bucket and region from S3 URL
 * @param url - S3 URL
 * @returns Object with bucket and region, or null
 */
export function parseS3Url(url: string): { bucket: string; region: string; key: string } | null {
  try {
    const urlObj = new URL(url);
    
    // Format: https://bucket.s3.region.amazonaws.com/key
    if (urlObj.hostname.includes('s3.')) {
      const parts = urlObj.hostname.split('.');
      const bucket = parts[0];
      const region = parts[2]; // s3.REGION.amazonaws.com
      const key = urlObj.pathname.substring(1); // Remove leading slash
      
      return { bucket, region, key };
    }
    
    return null;
  } catch {
    return null;
  }
}















