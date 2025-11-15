// Script to scan Products_new folder and generate product data
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../public/Products_new');

// Get all product folders
const folders = fs.readdirSync(sourcePath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`Found ${folders.length} product folders\n`);

// Parse folder names and organize by product
const productsMap = {};

folders.forEach(folder => {
  // Parse "ProductName - Color" format
  const parts = folder.split(' - ');
  if (parts.length >= 2) {
    const productName = parts[0];
    const colorName = parts.slice(1).join(' - '); // Handle colors with " - " in them
    
    if (!productsMap[productName]) {
      productsMap[productName] = {
        name: productName,
        colors: []
      };
    }
    
    // Get images from this folder
    const folderPath = path.join(sourcePath, folder);
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(file => {
        const lower = file.toLowerCase();
        return !lower.includes('.ds_store') && 
               /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
      })
      .sort();
    
    // Find thumbnail (file named "t" or starts with "t.")
    const thumbnail = files.find(f => {
      const name = path.parse(f).name.toLowerCase();
      return name === 't' || name.startsWith('t.');
    });
    
    // Exclude Group files (dimension charts) and thumbnail
    const productImages = files.filter(f => {
      const name = path.parse(f).name.toLowerCase();
      const lower = f.toLowerCase();
      return name !== 't' && 
             !name.startsWith('t.') && 
             !lower.includes('group');
    });
    
    // Find tilted version - usually the first product image (after excluding Group files)
    // Or look for files with "tilt", "angled", "side" in name
    let tilted = productImages.find(f => {
      const lower = f.toLowerCase();
      return lower.includes('tilt') || 
             lower.includes('angled') ||
             lower.includes('side');
    });
    
    // If no explicit tilted file, use the first product image as tilted
    // (often the first image after thumbnail is the tilted/angled view)
    if (!tilted && productImages.length > 0) {
      tilted = productImages[0];
    }
    
    // Get other images for gallery (excluding thumbnail)
    // Include tilted version in gallery, plus other images (3-4 images total)
    const galleryImages = [];
    if (tilted) {
      galleryImages.push(tilted);
    }
    // Add remaining images (excluding tilted if already added)
    const remaining = productImages.filter(f => f !== tilted);
    galleryImages.push(...remaining.slice(0, 3)); // Total 4 images max
    const otherImages = galleryImages.slice(0, 4);
    
    productsMap[productName].colors.push({
      name: colorName,
      folder: folder,
      thumbnail: thumbnail ? `/Products_new/${folder}/${thumbnail}` : null,
      tilted: tilted ? `/Products_new/${folder}/${tilted}` : null,
      images: otherImages.map(img => `/Products_new/${folder}/${img}`),
      allImages: files.map(img => `/Products_new/${folder}/${img}`)
    });
  }
});

// Convert to array
const products = Object.values(productsMap);

// Output summary
console.log('Products found:');
products.forEach(p => {
  console.log(`\n${p.name}:`);
  p.colors.forEach(c => {
    console.log(`  - ${c.name}: ${c.images.length} images, thumbnail: ${c.thumbnail ? 'yes' : 'no'}, tilted: ${c.tilted ? 'yes' : 'no'}`);
  });
});

// Write to JSON file
const outputPath = path.join(__dirname, '../products-new-mapping.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(products, null, 2)
);

console.log(`\n\nMapping saved to: ${outputPath}`);

