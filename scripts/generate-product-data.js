// Script to generate product data from image folders
const fs = require('fs');
const path = require('path');

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to parse product name and color from folder name
function parseProductFolder(folderName) {
  const parts = folderName.split(' - ');
  if (parts.length >= 2) {
    return {
      name: parts[0],
      color: parts.slice(1).join(' - ')
    };
  }
  return {
    name: folderName,
    color: 'Default'
  };
}

// Helper function to get hex color from color name (simplified mapping)
function getColorHex(colorName) {
  const colorMap = {
    'Piano Black': '#000000',
    'Midnight Black': '#1C1C1C',
    'Midnight': '#1C1C1C',
    'Tortoise': '#8B4513',
    'Tortoise Amber': '#D2691E',
    'Tortoise Brown': '#A0522D',
    'Ivory': '#FFFFF0',
    'Ivory Tortoise': '#F5DEB3',
    'Ivory Pearl': '#F0E68C',
    'Alabaster': '#F2F0E6',
    'Dame Wood': '#8B7355',
    'Shell Marble': '#E6E6FA',
    'Blush Marble': '#FFB6C1',
    'Ash Marble': '#B2BEB5',
    'Tigers Eye': '#B8860B',
    'Forest Green': '#228B22',
    'Purple Navy': '#4B0082',
    'Tuscan Red': '#7C3030',
    'Classic Rose': '#B76E79',
    'Dark Brown': '#654321',
    'Transparent': '#FFFFFF',
    'Transparent Crystal Blue': '#B0E0E6',
    'Transparent Grey': '#D3D3D3',
    'Transparent Tan': '#D2B48C',
    'Transparent & Tortoise': '#CD853F',
    'Black Temple Milk & Rose Ebony': '#2F2F2F',
    'Milk & Rose Ebony': '#2F2F2F',
    'Old Lace': '#FDF5E6',
    'Ink Tortoise': '#3D2817',
    'Matte Black & Grey-White': '#2F2F2F',
    'Black & Grey Tortoise': '#3D2817',
    'Black & Blue': '#000080',
    'Grey Tortoise': '#808080',
    'Cadet Blue': '#5F9EA0',
  };
  
  return colorMap[colorName] || '#333333';
}

// Read product folders
const adultPath = path.join(__dirname, '../public/ProductDetails/Sunglass Product Images with SizeChart/Sunglass Product Images/Adult Sunglasses');
const kidsPath = path.join(__dirname, '../public/ProductDetails/Sunglass Product Images with SizeChart/Sunglass Product Images/Kids Sunglasses');

function getProductFolders(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

function getImagesForProduct(folderPath) {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(file => /\.(jpg|jpeg|png|JPG|PNG)$/i.test(file))
      .map(file => `/ProductDetails/Sunglass Product Images with SizeChart/Sunglass Product Images/${folderPath.split('Sunglass Product Images')[1].replace(/\\/g, '/')}/${file}`);
    return files;
  } catch (error) {
    console.error(`Error reading images from ${folderPath}:`, error);
    return [];
  }
}

// Get all products
const allAdultProducts = getProductFolders(adultPath);
const allKidsProducts = getProductFolders(kidsPath);

// Group adult products by name (to handle multiple colors)
const adultProductsByName = {};
allAdultProducts.forEach(folder => {
  const { name, color } = parseProductFolder(folder);
  if (!adultProductsByName[name]) {
    adultProductsByName[name] = [];
  }
  adultProductsByName[name].push({ folder, color });
});

// Categorize products (simple heuristic based on name)
const womenNames = ['Agnes', 'Astrid', 'Clara', 'Claudia', 'Colette', 'Daphne', 'Edith', 'Elodie', 'Estelle', 'Evelyn', 'Florence', 'Grace', 'Harlow', 'Lydia', 'Sienna', 'Vera', 'Vivienne'];
const menNames = ['Alfie', 'Ellis', 'Jamie', 'Oscar', 'Rex', 'Riley', 'Rupert', 'Sebastian', 'Theo'];

// Separate into men and women products
const womenProducts = [];
const menProducts = [];
const unisexProducts = [];

Object.keys(adultProductsByName).forEach(name => {
  const variants = adultProductsByName[name];
  if (womenNames.includes(name)) {
    womenProducts.push(...variants);
  } else if (menNames.includes(name)) {
    menProducts.push(...variants);
  } else {
    unisexProducts.push(...variants);
  }
});

// Randomly select 15 for each category
const selectedWomen = shuffleArray(womenProducts).slice(0, 15);
const selectedMen = shuffleArray(menProducts).slice(0, 15);
const selectedKids = shuffleArray(allKidsProducts).slice(0, 15);

// Generate product data
function generateProductData(selectedProducts, category, basePath) {
  const productsByName = {};
  
  selectedProducts.forEach(({ folder, color, name }) => {
    const productName = name || parseProductFolder(folder).name;
    const productColor = color || parseProductFolder(folder).color;
    
    if (!productsByName[productName]) {
      productsByName[productName] = {
        name: productName,
        variants: []
      };
    }
    
    const folderPath = path.join(basePath, folder);
    const images = getImagesForProduct(folderPath);
    
    if (images.length > 0) {
      productsByName[productName].variants.push({
        name: productColor,
        hex: getColorHex(productColor),
        images: images
      });
    }
  });
  
  return Object.values(productsByName);
}

const womenProductsData = generateProductData(selectedWomen, 'Women', adultPath);
const menProductsData = generateProductData(selectedMen, 'Men', adultPath);
const kidsProductsData = generateProductData(
  selectedKids.map(folder => ({ folder, color: parseProductFolder(folder).color, name: parseProductFolder(folder).name })),
  'Kids',
  kidsPath
);

// Combine all products
const allProducts = [
  ...womenProductsData.map((p, idx) => ({
    ...p,
    id: `women-${idx + 1}`,
    categories: ['Sunglass', 'Women'],
    price: (139.99 + Math.random() * 40).toFixed(2),
  })),
  ...menProductsData.map((p, idx) => ({
    ...p,
    id: `men-${idx + 1}`,
    categories: ['Sunglass', 'Men'],
    price: (139.99 + Math.random() * 40).toFixed(2),
  })),
  ...kidsProductsData.map((p, idx) => ({
    ...p,
    id: `kids-${idx + 1}`,
    categories: ['Sunglass', 'Kids'],
    price: (99.99 + Math.random() * 30).toFixed(2),
  }))
];

console.log(`Generated ${allProducts.length} products`);
console.log(`- Women: ${womenProductsData.length}`);
console.log(`- Men: ${menProductsData.length}`);
console.log(`- Kids: ${kidsProductsData.length}`);

// Write to file
const output = {
  products: allProducts
};

fs.writeFileSync(
  path.join(__dirname, '../product-data-output.json'),
  JSON.stringify(output, null, 2)
);

console.log('Product data written to product-data-output.json');

