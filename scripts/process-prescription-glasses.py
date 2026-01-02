"""
Prescription Glasses Image Processing Script
============================================

This script processes glasses images specifically for prescription display:
1. Removes background using rembg
2. Makes lenses FULLY TRANSPARENT (clear glass effect for prescription)
3. Lightens lens color to simulate clear glass
4. Preserves frame quality completely
5. Crops to bounding box

Requirements:
    pip install rembg opencv-python pillow numpy

Usage:
    python scripts/process-prescription-glasses.py input.png output.png
    
    # Or process all glasses:
    python scripts/process-prescription-glasses.py
"""

import cv2
import numpy as np
from rembg import remove
from PIL import Image
import io
import sys
import os

def process_prescription_glasses(input_path, output_path):
    """
    Process a single glasses image for prescription display:
    - Remove background
    - Make lenses FULLY TRANSPARENT (clear glass)
    - Lighten lens color to white/clear
    - Preserve frame quality
    - Crop to bounding box
    """
    print(f"Processing prescription glasses: {input_path}")
    
    try:
        # 1. Load Image & Remove Background
        with open(input_path, 'rb') as i:
            input_data = i.read()
            # rembg automatically removes the background
            output_data = remove(input_data)
        
        # Convert to OpenCV format
        pil_img = Image.open(io.BytesIO(output_data))
        img = np.array(pil_img)
        
        # Ensure we have RGBA
        if img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2RGBA)
        
        # 2. IMPROVED Lens Detection for Prescription Glasses
        # Use multiple criteria to accurately identify lens areas
        
        alpha_channel = img[:, :, 3]
        brightness = np.mean(img[:, :, :3], axis=2)
        
        # Calculate saturation (lenses are less saturated than frames)
        max_rgb = np.max(img[:, :, :3], axis=2)
        min_rgb = np.min(img[:, :, :3], axis=2)
        saturation = np.where(max_rgb > 0, (max_rgb - min_rgb) / max_rgb, 0)
        
        # IMPROVED Detection Parameters for Prescription
        BRIGHTNESS_MIN = 90   # Lenses are brighter than frames
        BRIGHTNESS_MAX = 220  # But not too bright (not background)
        FRAME_BRIGHTNESS_MAX = 80  # Frames are darker
        SATURATION_MAX = 0.4  # Lenses are less saturated (grayish)
        ALPHA_MIN = 200       # Must be visible
        
        # Create lens mask: bright, low saturation, not frame
        mask_lens = (
            (alpha_channel >= ALPHA_MIN) &           # Visible
            (brightness >= BRIGHTNESS_MIN) &         # Bright enough
            (brightness <= BRIGHTNESS_MAX) &          # Not too bright
            (brightness > FRAME_BRIGHTNESS_MAX) &    # Brighter than frame
            (saturation <= SATURATION_MAX)           # Low saturation (grayish)
        )
        
        # 3. Refine mask: Remove isolated pixels (noise)
        # Use morphological operations to clean up the mask
        mask_uint8 = mask_lens.astype(np.uint8) * 255
        
        # Remove small noise (isolated pixels)
        kernel = np.ones((3, 3), np.uint8)
        mask_cleaned = cv2.morphologyEx(mask_uint8, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Fill small holes in lens areas
        mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Convert back to boolean
        mask_lens_refined = mask_cleaned > 0
        
        # 4. Apply FULL TRANSPARENCY to lenses
        # Make lenses appear as clear glass (very transparent, light color)
        
        # Set lens alpha to very low (almost fully transparent)
        LENS_ALPHA = 20  # 20/255 = ~8% opacity (almost fully transparent)
        img[mask_lens_refined, 3] = LENS_ALPHA
        
        # Lighten lens color to white/clear glass appearance
        # Blend lens pixels towards white while maintaining some structure
        for c in range(3):  # RGB channels
            # Blend original color with white (255) to make it lighter
            # Use 80% white + 20% original for clear glass effect
            img[mask_lens_refined, c] = np.clip(
                img[mask_lens_refined, c] * 0.2 + 255 * 0.8,
                0, 255
            ).astype(np.uint8)
        
        # 5. Crop to bounding box (only visible parts)
        coords = cv2.findNonZero(img[:, :, 3])
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            img = img[y:y+h, x:x+w]
        else:
            print(f"  Warning: No visible content found in {input_path}")
            return False
        
        # 6. Save processed image
        final_pil = Image.fromarray(img)
        final_pil.save(output_path, 'PNG')
        print(f"  ✓ Saved prescription version: {output_path}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error processing {input_path}: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_product_folder(folder_path, output_folder=None):
    """
    Process all PNG images in a product folder for prescription display.
    """
    if output_folder is None:
        output_folder = folder_path
    
    processed = 0
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.png'):
            # Skip already processed files
            if 'prescription' in filename.lower() or 'tryon' in filename.lower():
                continue
                
            input_path = os.path.join(folder_path, filename)
            # Create output with 'prescription-' prefix
            base_name = os.path.splitext(filename)[0]
            output_path = os.path.join(output_folder, f'prescription-{base_name}.png')
            
            if process_prescription_glasses(input_path, output_path):
                processed += 1
    
    return processed


def find_all_product_images(public_dir):
    """Find all product images that need prescription processing"""
    images_to_process = []
    
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            # Only process PNG/JPG files
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Skip already processed files
                if 'prescription' in file.lower() or 'tryon' in file.lower():
                    continue
                
                input_path = os.path.join(root, file)
                
                # Create output path with 'prescription-' prefix
                base_name = os.path.splitext(file)[0]
                output_name = f"prescription-{base_name}.png"
                output_path = os.path.join(root, output_name)
                
                # Skip if already processed
                if os.path.exists(output_path):
                    print(f"  Skipping (already exists): {output_name}")
                    continue
                
                images_to_process.append((input_path, output_path))
    
    return images_to_process


# Run it
if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Process single file
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        
        if not os.path.exists(input_file):
            print(f"Error: File not found: {input_file}")
            sys.exit(1)
        
        if output_file is None:
            # Auto-generate output name
            dir_name = os.path.dirname(input_file)
            base_name = os.path.splitext(os.path.basename(input_file))[0]
            output_file = os.path.join(dir_name, f'prescription-{base_name}.png')
        
        success = process_prescription_glasses(input_file, output_file)
        sys.exit(0 if success else 1)
    else:
        # Batch process all images in public folder
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        public_dir = os.path.join(project_dir, 'public')
        
        if not os.path.exists(public_dir):
            print(f"Error: Public directory not found at {public_dir}")
            sys.exit(1)
        
        print(f"Scanning for product images: {public_dir}")
        print("-" * 60)
        
        images = find_all_product_images(public_dir)
        
        if not images:
            print("No new images to process!")
            print("(Images with 'prescription-' prefix already exist)")
            sys.exit(0)
        
        print(f"Found {len(images)} images to process")
        print("-" * 60)
        
        success_count = 0
        failed_count = 0
        
        for input_path, output_path in images:
            if process_prescription_glasses(input_path, output_path):
                success_count += 1
            else:
                failed_count += 1
        
        print("-" * 60)
        print(f"Done! Success: {success_count}, Failed: {failed_count}")
        print("\nNext steps:")
        print("1. Review the processed images (prescription-*.png)")
        print("2. Add them to your database as PRESCRIPTION_CLEAR assets")
        print("3. Update prescription page to use these images")

