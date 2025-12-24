"""
Batch Process All Glasses Images for Virtual Try-On
====================================================

This script:
1. Scans all product variant images in the public folder
2. Processes each image (removes background, makes lenses transparent)
3. Saves processed images with a consistent naming convention

Run this script ONCE before deployment, not at runtime!

Requirements:
    pip install rembg opencv-python pillow numpy

Usage:
    python scripts/process-all-glasses.py
"""

import cv2
import numpy as np
from rembg import remove
from PIL import Image
import io
import os
import sys

def process_glasses(input_path, output_path):
    """
    Process a single glasses image:
    - Remove background
    - Make lenses semi-transparent
    - Crop to bounding box
    """
    print(f"Processing: {input_path}")
    
    try:
        # 1. Load Image & Remove Background
        with open(input_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
        
        # Convert to OpenCV format
        pil_img = Image.open(io.BytesIO(output_data))
        img = np.array(pil_img)
        
        # Ensure we have RGBA
        if img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2RGBA)
        
        # 2. Make lenses semi-transparent
        gray = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
        alpha_channel = img[:, :, 3]
        brightness = np.mean(img[:, :, :3], axis=2)
        
        # Pixels that are visible and lighter than frame = lens
        mask_lens = (alpha_channel > 0) & (brightness > 60)
        img[mask_lens, 3] = 160  # Semi-transparent
        
        # 3. Crop to bounding box
        coords = cv2.findNonZero(img[:, :, 3])
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            img = img[y:y+h, x:x+w]
        
        # 4. Save
        final_pil = Image.fromarray(img)
        final_pil.save(output_path, 'PNG')
        print(f"  ✓ Saved: {output_path}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def find_product_images(public_dir):
    """Find all potential glasses images in product folders"""
    images_to_process = []
    
    # Look for product folders (they usually contain variant images)
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            # Only process PNG/JPG files
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Skip already processed files
                if 'tryon' in file.lower() or 'processed' in file.lower():
                    continue
                    
                input_path = os.path.join(root, file)
                
                # Create output path with 'tryon-' prefix
                output_name = f"tryon-{os.path.splitext(file)[0]}.png"
                output_path = os.path.join(root, output_name)
                
                # Skip if already processed
                if os.path.exists(output_path):
                    print(f"  Skipping (already exists): {output_name}")
                    continue
                
                images_to_process.append((input_path, output_path))
    
    return images_to_process


def main():
    # Find the public directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    public_dir = os.path.join(project_dir, 'public')
    
    if not os.path.exists(public_dir):
        print(f"Error: Public directory not found at {public_dir}")
        sys.exit(1)
    
    print(f"Scanning: {public_dir}")
    print("-" * 50)
    
    # Find all images to process
    images = find_product_images(public_dir)
    
    if not images:
        print("No new images to process!")
        print("(Images with 'tryon-' prefix already exist)")
        return
    
    print(f"Found {len(images)} images to process")
    print("-" * 50)
    
    # Process each image
    success = 0
    failed = 0
    
    for input_path, output_path in images:
        if process_glasses(input_path, output_path):
            success += 1
        else:
            failed += 1
    
    print("-" * 50)
    print(f"Done! Processed: {success}, Failed: {failed}")
    print("\nNext steps:")
    print("1. Update your product data to use 'tryon-*.png' images for try-on")
    print("2. Or update the ProductAsset records in your database")


if __name__ == "__main__":
    main()
