// Script to copy product images to a new organized folder
const fs = require('fs');
const path = require('path');

// Products we're using (from productData.ts)
const productsToCopy = {
  women: [
    { name: 'Agnes', colors: ['Dame Wood', 'Midnight', 'Shell Marble'] },
    { name: 'Astrid', colors: ['Ivory', 'Tigers Eye'] },
    { name: 'Clara', colors: ['Black Temple Milk & Rose Ebony', 'Old Lace'] },
    { name: 'Claudia', colors: ['Piano Black', 'Tortoise'] },
    { name: 'Colette', colors: ['Milk & Rose Ebony', 'Tigers Eye'] },
    { name: 'Daphne', colors: ['Ink Tortoise', 'Tortoise Amber', 'Tortoise Brown'] },
    { name: 'Edith', colors: ['Blush Marble', 'Piano Black'] },
    { name: 'Elodie', colors: ['Tortoise', 'Transparent & Tortoise', 'Transparent Tan'] },
    { name: 'Estelle', colors: ['Tortoise'] },
    { name: 'Evelyn', colors: ['Forest Green', 'Midnight Black'] },
    { name: 'Florence', colors: ['Tigers Eye', 'Tortoise'] },
    { name: 'Grace', colors: ['Classic Rose', 'Tortoise'] },
    { name: 'Harlow', colors: ['Ash Marble'] },
    { name: 'Lydia', colors: ['Midnight Black'] },
    { name: 'Sienna', colors: ['Antique White', 'Midnight Black'] },
  ],
  men: [
    { name: 'Alfie', colors: ['Piano Black', 'Tortoise', 'Tuscan Red'] },
    { name: 'Ellis', colors: ['Alabaster'] },
    { name: 'Jamie', colors: ['Purple Navy', 'Tortoise'] },
    { name: 'Oscar', colors: ['Ivory Tortoise', 'Midnight Black', 'Transparent', 'Transparent Crystal Blue', 'Transparent Grey'] },
    { name: 'Rex', colors: ['Midnight Black'] },
    { name: 'Riley', colors: ['Tortoise'] },
    { name: 'Rupert', colors: ['Tortoise'] },
    { name: 'Sebastian', colors: ['Cadet Blue'] },
    { name: 'Theo', colors: ['Midnight Black'] },
    { name: 'Vera', colors: ['Ivory Pearl', 'Piano Black', 'Tortoise'] },
    { name: 'Vivienne', colors: ['Dark Brown', 'Midnight Black'] },
  ],
  kids: [
    { name: 'Elton', colors: ['Piano Black'] },
    { name: 'Finley', colors: ['Tortoise'] },
    { name: 'Lenny', colors: ['Piano Black', 'Tortoise'] },
    { name: 'Marnie', colors: ['Matte Black & Grey-White'] },
    { name: 'Nico', colors: ['Black & Grey Tortoise'] },
    { name: 'Poppy', colors: ['Black & Blue'] },
    { name: 'Rudy', colors: ['Tortoise'] },
    { name: 'Toby', colors: ['Grey Tortoise'] },
  ]
};

const sourceBasePath = path.join(__dirname, '../public/ProductDetails/Sunglass Product Images with SizeChart/Sunglass Product Images');
const destBasePath = path.join(__dirname, '../public/products');

// Create destination directory
if (!fs.existsSync(destBasePath)) {
  fs.mkdirSync(destBasePath, { recursive: true });
}

// Function to get product images (excluding charts/diagrams)
function getProductImages(folderPath) {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(file => {
        // Exclude chart/diagram files and system files
        const lowerFile = file.toLowerCase();
        return !lowerFile.includes('group') && 
               !lowerFile.includes('chart') &&
               !lowerFile.includes('dimension') &&
               !lowerFile.includes('.ds_store') &&
               /\.(jpg|jpeg|png|webp)$/i.test(file);
      })
      .sort((a, b) => {
        // Sort: prefer files that don't start with numbers or special codes
        // Put actual product photos first
        const aIsProduct = !/^[A-Z0-9]+/.test(a);
        const bIsProduct = !/^[A-Z0-9]+/.test(b);
        if (aIsProduct !== bIsProduct) return aIsProduct ? -1 : 1;
        return a.localeCompare(b);
      });
    
    // If no filtered files, get all image files except Group files
    if (files.length === 0) {
      return fs.readdirSync(folderPath)
        .filter(file => {
          const lowerFile = file.toLowerCase();
          return !lowerFile.includes('group') && 
                 !lowerFile.includes('.ds_store') &&
                 /\.(jpg|jpeg|png|webp)$/i.test(file);
        })
        .sort();
    }
    
    return files;
  } catch (error) {
    console.error(`Error reading images from ${folderPath}:`, error.message);
    return [];
  }
}

// Function to copy images
function copyProductImages(category, productName, colorName) {
  const categoryFolder = category === 'kids' ? 'Kids Sunglasses' : 'Adult Sunglasses';
  const sourceFolder = path.join(sourceBasePath, categoryFolder, `${productName} - ${colorName}`);
  const destFolder = path.join(destBasePath, category, productName.toLowerCase().replace(/\s+/g, '-'), colorName.toLowerCase().replace(/\s+/g, '-'));
  
  if (!fs.existsSync(sourceFolder)) {
    console.warn(`Source folder not found: ${sourceFolder}`);
    return [];
  }
  
  const images = getProductImages(sourceFolder);
  
  if (images.length === 0) {
    console.warn(`No images found in: ${sourceFolder}`);
    return [];
  }
  
  // Create destination folder
  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
  }
  
  const copiedImages = [];
  
  // Copy up to 4 images per variant
  const maxImages = Math.min(images.length, 4);
  
  for (let index = 0; index < maxImages; index++) {
    const imageFile = images[index];
    const sourcePath = path.join(sourceFolder, imageFile);
    const ext = path.extname(imageFile);
    const newFileName = `${index + 1}${ext}`;
    const destPath = path.join(destFolder, newFileName);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      copiedImages.push(`/products/${category}/${productName.toLowerCase().replace(/\s+/g, '-')}/${colorName.toLowerCase().replace(/\s+/g, '-')}/${newFileName}`);
      console.log(`Copied: ${imageFile} -> ${newFileName}`);
    } catch (error) {
      console.error(`Error copying ${imageFile}:`, error.message);
    }
  }
  
  return copiedImages;
}

// Process all products
console.log('Starting image copy process...\n');

const allCopiedImages = {};

Object.keys(productsToCopy).forEach(category => {
  console.log(`\nProcessing ${category} products...`);
  allCopiedImages[category] = {};
  
  productsToCopy[category].forEach(({ name, colors }) => {
    allCopiedImages[category][name] = {};
    
    colors.forEach(color => {
      const images = copyProductImages(category, name, color);
      if (images.length > 0) {
        allCopiedImages[category][name][color] = images;
      }
    });
  });
});

// Write image mapping to file
const mappingPath = path.join(__dirname, '../product-images-mapping.json');
fs.writeFileSync(
  mappingPath,
  JSON.stringify(allCopiedImages, null, 2)
);

console.log(`\n\nImage copy complete!`);
console.log(`Mapping saved to: ${mappingPath}`);
console.log(`\nCopied images are in: ${destBasePath}`);

