/**
 * Compresses an image file to approximately 1MB target size
 * Uses canvas-based compression with quality adjustment
 */
export async function compressImageTo1MB(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions (max 1920px to maintain quality while reducing size)
        const maxDimension = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Binary search for optimal quality to get ~1MB
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestQuality = 0.8;
        let bestBlob: Blob | null = null;
        const targetSize = 1024 * 1024; // 1MB
        
        const compressWithQuality = (quality: number): Promise<Blob> => {
          return new Promise((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              quality
            );
          });
        };
        
        // Binary search for optimal quality
        const findOptimalQuality = async (): Promise<void> => {
          const iterations = 8; // Limit iterations for performance
          
          for (let i = 0; i < iterations; i++) {
            const quality = (minQuality + maxQuality) / 2;
            const blob = await compressWithQuality(quality);
            
            if (blob.size <= targetSize * 1.1) { // Within 10% of target
              bestQuality = quality;
              bestBlob = blob;
              if (blob.size >= targetSize * 0.9) { // Close enough
                break;
              }
              minQuality = quality;
            } else {
              maxQuality = quality;
            }
          }
          
          // If we didn't find a good match, use the best we found
          if (!bestBlob) {
            bestBlob = await compressWithQuality(bestQuality);
          }
          
          // Create a new File from the compressed blob
          const compressedFile = new File(
            [bestBlob],
            file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
            {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }
          );
          
          resolve(compressedFile);
        };
        
        findOptimalQuality().catch(reject);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

