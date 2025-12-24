# Glasses Image Processing for Virtual Try-On

This script preprocesses glasses images to make them work perfectly with the virtual try-on feature.

## What It Does

1. **Removes Background**: Uses AI (rembg) to automatically remove the background
2. **Makes Lenses Semi-Transparent**: Detects lens areas and makes them see-through (sunglasses effect)
3. **Crops & Centers**: Removes excess transparent padding around the glasses

## Setup

1. Install Python dependencies:
```bash
pip install -r scripts/requirements-glasses.txt
```

## Usage

### Process a Single Image

```bash
python scripts/process-glasses.py input.png output.png
```

### Process Multiple Images

Edit the `glasses_files` list in `process-glasses.py` or run:

```bash
# Process all images in the list
python scripts/process-glasses.py
```

## How It Works

1. **Background Removal**: Uses `rembg` library (AI-powered) to remove backgrounds
2. **Lens Detection**: Identifies lens areas by finding pixels that are:
   - Visible (alpha > 0)
   - Lighter than the frame (brightness > 60)
3. **Transparency**: Sets lens opacity to 160/255 (semi-transparent)
4. **Cropping**: Finds bounding box of visible pixels and crops to fit

## Tips

- **Input Images**: Use high-quality PNG images with clear backgrounds
- **Lens Opacity**: Adjust the `160` value in the script (line ~60) to make lenses more/less transparent
  - Lower value (e.g., 120) = more transparent
  - Higher value (e.g., 200) = less transparent
- **Brightness Threshold**: Adjust the `60` value if lens detection isn't working correctly
  - Lower value = more pixels treated as lenses
  - Higher value = fewer pixels treated as lenses

## Output

Processed images are saved as PNG files with:
- Transparent backgrounds
- Semi-transparent lenses
- Minimal padding (tight crop)

These processed images work best with the virtual try-on component!
