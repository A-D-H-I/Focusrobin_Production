// src/lib/productData.ts

export interface ProductColorVariant {
  name: string;
  hex: string;
  thumbnail: string; // Thumbnail image (t.jpg)
  tilted: string; // Tilted version for hover
  images: string[]; // Gallery images (3-4 images)
}

export interface Product {
  id: string;
  name: string;
  price: string;
  cashback: string;
  variants: ProductColorVariant[];
  categories: string[];
  warranty: string;
  description: string;
  lensMaterial: string;
  frameMaterial: string;
  uvProtection: string;
  size: {
    lensWidth: string;
    bridge: string;
    temple: string;
  };
}

// Helper function to generate product ID from name
function generateId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Helper function to get hex color from color name
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
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
  };
  
  return colorMap[colorName] || '#333333';
}

// Import the scanned product data
// Note: This requires the products-new-mapping.json file to be generated first
// Run: node scripts/scan-products-new.js
import productMappingData from './products-new-mapping.json';

const productMapping: any[] = Array.isArray(productMappingData) ? productMappingData : (productMappingData as any).default || [];

// Generate product catalog from the scanned data
function createProductsFromMapping(): Product[] {
  const products: Product[] = [];
  
  productMapping.forEach((productData: any) => {
    const productId = generateId(productData.name);
    
    // Determine category based on product name (simple heuristic)
    const womenNames = ['Agnes', 'Astrid', 'Clara', 'Elodie', 'Estelle', 'Evelyn', 'Florence', 'Grace'];
    const menNames = ['Alfie', 'Ellis'];
    
    let category: 'Men' | 'Women' | 'Kids' = 'Women';
    if (menNames.includes(productData.name)) {
      category = 'Men';
    }
    
    // Generate price (deterministic based on product name for consistency)
    // Use a simple hash of the product name to get a consistent price
    let hash = 0;
    for (let i = 0; i < productData.name.length; i++) {
      hash = ((hash << 5) - hash) + productData.name.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const basePrice = 139.99 + (Math.abs(hash) % 40);
    const price = `€${basePrice.toFixed(2)}`;
    const cashback = `€${(basePrice * 0.05).toFixed(2)} CASHBACK`;
    
    // Create variants from colors
    const variants: ProductColorVariant[] = productData.colors.map((colorData: any) => ({
      name: colorData.name,
      hex: getColorHex(colorData.name),
      thumbnail: colorData.thumbnail || '',
      tilted: colorData.tilted || '',
      images: colorData.images || [],
    }));
    
    products.push({
      id: productId,
      name: productData.name,
      price,
      cashback,
      variants,
      categories: ['Sunglass', category],
    warranty: '1 Year Warranty',
      description: `Premium ${productData.name} sunglasses crafted with attention to detail. Perfect for everyday wear with superior UV protection and stylish design.`,
      lensMaterial: 'Polycarbonate',
    frameMaterial: 'Partially Bio Based Acetate',
    uvProtection: 'UV 400, 100% Protection',
    size: {
      lensWidth: '52mm',
      bridge: '18mm',
      temple: '145mm',
    },
    });
  });
  
  return products;
}

// Only create catalog if we have product mapping data
// Memoize the catalog creation to avoid recalculating on every import
let cachedCatalog: Product[] | null = null;

export const productCatalog: Product[] = (() => {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = productMapping.length > 0 ? createProductsFromMapping() : [];
  return cachedCatalog;
})();

// Helper function to get products by category
export function getProductsByCategory(category: 'Men' | 'Women' | 'Kids'): Product[] {
  return productCatalog.filter(p => p.categories.includes(category));
}

// Helper function to get all products (for shop page)
export function getAllProducts(): Product[] {
  return productCatalog;
}
