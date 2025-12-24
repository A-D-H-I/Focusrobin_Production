"""
Glasses Image Preprocessing Script for Virtual Try-On
======================================================

This script processes glasses images for virtual try-on:
1. Removes background using rembg
2. Makes lenses semi-transparent (sunglasses effect)
3. Crops to bounding box and centers the image

Requirements:
    pip install rembg opencv-python pillow numpy

Usage:
    python scripts/process-glasses.py input.png output.png
    
    # Or process all glasses (edit the list at bottom):
    python scripts/process-glasses.py
"""

import cv2
import numpy as np
from rembg import remove
from PIL import Image
import io
import sys
import os

def process_glasses(input_path, output_path):
    """
    Process a single glasses image:
    - Remove background
    - Make lenses semi-transparent
    - Crop to bounding box
    """
    # 1. Load Image & Remove Background
    print(f"Processing: {input_path}")
    with open(input_path, 'rb') as i:
        input_data = i.read()
        # rembg automatically removes the solid grey background
        output_data = remove(input_data)
    
    # Convert to OpenCV format (for lens processing)
    pil_img = Image.open(io.BytesIO(output_data))
    img = np.array(pil_img)
    
    # 2. Identify Lenses (The "Tint" Trick)
    # Convert to grayscale to find contours
    gray = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
    
    # Threshold to separate frames from empty space
    # Adjust 10, 255 based on how dark your frames are
    _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    
    # Find contours (shapes)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create a mask for the lenses
    # We assume the lenses are the largest "holes" inside the frame, 
    # but for a simple 2D cutout, we often just lower the alpha of the 'inner' pixels.
    # A simpler production hack: 
    # If a pixel is NOT transparent but is NOT dark (frame), it's a lens.
    
    # Extract Alpha channel
    alpha_channel = img[:, :, 3]
    
    # Define "Frame" vs "Lens" based on color darkness
    # Frames are usually dark (low RGB). Lenses are lighter grey in your photo.
    # We look for pixels that are VISIBLE (alpha > 0) but LIGHTER than the frame.
    
    # Calculate brightness
    brightness = np.mean(img[:, :, :3], axis=2)
    
    # Logic: If pixel is visible AND brightness > 50 (not pure black frame), 
    # make it semi-transparent (150/255 opacity)
    mask_lens = (alpha_channel > 0) & (brightness > 60)
    
    # Apply tint (make lenses see-through)
    img[mask_lens, 3] = 160 # Opacity value (0-255). 160 is good for sunglasses.
    
    # 3. Crop & Center
    # Find bounding box of non-zero alpha pixels
    coords = cv2.findNonZero(img[:, :, 3])
    if coords is None:
        print(f"Warning: No visible content found in {input_path}")
        return
        
    x, y, w, h = cv2.boundingRect(coords)
    
    # Crop
    img_cropped = img[y:y+h, x:x+w]
    
    # Save
    final_pil = Image.fromarray(img_cropped)
    final_pil.save(output_path)
    print(f"✓ Saved to: {output_path}")


def process_product_folder(folder_path, output_folder=None):
    """
    Process all PNG images in a product folder.
    Looks for files that could be try-on images.
    """
    if output_folder is None:
        output_folder = folder_path
    
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.png'):
            input_path = os.path.join(folder_path, filename)
            output_path = os.path.join(output_folder, f'tryon-{filename}')
            process_glasses(input_path, output_path)


# Run it
if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else f'public/glasses-{os.path.basename(input_file)}'
        
        if not os.path.exists(input_file):
            print(f"Error: File not found: {input_file}")
            sys.exit(1)
            
        process_glasses(input_file, output_file)
    else:
        # Example: Process glasses from public folder
        # Edit this list for your specific glasses files
        public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
        
        glasses_files = [
            ('1.png', 'glasses-1.png'),
            ('2.png', 'glasses-2.png'),
            ('3 (1).png', 'glasses-3.png'),
        ]
        
        for input_name, output_name in glasses_files:
            input_path = os.path.join(public_dir, input_name)
            output_path = os.path.join(public_dir, output_name)
            
            if os.path.exists(input_path):
                process_glasses(input_path, output_path)
            else:
                print(f"Skipping (not found): {input_path}")
