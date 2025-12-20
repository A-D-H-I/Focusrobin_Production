/**
 * Converts Google Drive share link to direct image URL
 * Example: https://drive.google.com/file/d/FILE_ID/view -> https://lh3.googleusercontent.com/d/FILE_ID
 */
function convertGoogleDriveLink(url: string): string {
  // Match Google Drive file links
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    const fileId = driveFileMatch[1];
    // Use googleusercontent.com for better direct image embedding
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // Match Google Drive open links
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    const fileId = driveOpenMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // Match uc?export=view format and convert to googleusercontent
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    const fileId = ucMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // If already a googleusercontent URL, return as is
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  
  return url;
}

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 * Converts absolute Windows paths to relative paths starting with /
 * Also handles Google Drive links by converting them to direct image URLs
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), check if it's a Google Drive link
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Convert Google Drive share links to direct image URLs
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }
  
  // Handle Windows absolute paths
  // Convert G:\Dev\...\public\image.jpg to /image.jpg
  // Or C:\...\public\images\product.jpg to /images/product.jpg
  
  // First, try to match paths with "public" folder (case-insensitive)
  // This handles both forward and backslashes
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    // Normalize path separators and ensure it starts with /
    const normalized = '/' + publicPathMatch[1].replace(/\\/g, '/');
    return normalized;
  }
  
  // Handle Windows absolute paths (starts with drive letter like C:, D:, G:)
  if (/^[A-Z]:[\\/]/i.test(url)) {
    // Split by both backslash and forward slash
    const parts = url.split(/[\\/]/);
    const publicIndex = parts.findIndex(p => p.toLowerCase() === 'public');
    
    if (publicIndex >= 0 && publicIndex < parts.length - 1) {
      // Found public folder, use everything after it
      const afterPublic = parts.slice(publicIndex + 1).join('/');
      return '/' + afterPublic;
    }
    
    // If no public folder found, try to extract just the filename
    // and assume it's in the root of public folder
    const lastPart = parts[parts.length - 1];
    if (lastPart && /\.(jpg|jpeg|png|gif|webp|svg|glb)$/i.test(lastPart)) {
      return '/' + lastPart;
    }
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


