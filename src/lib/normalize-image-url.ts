/**
 * Normalizes image URLs to relative paths for Next.js Image component
 * Converts absolute Windows paths to relative paths starting with /
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Handle Windows absolute paths
  // Convert G:\Dev\...\public\image.jpg to /image.jpg
  // Or C:\...\public\images\product.jpg to /images/product.jpg
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    // Normalize path separators and ensure it starts with /
    return '/' + publicPathMatch[1].replace(/\\/g, '/');
  }
  
  // If it doesn't match any pattern, try to extract just the filename
  // and assume it's in the root of public folder
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  // Fallback: return as is (might be a relative path without leading /)
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}


