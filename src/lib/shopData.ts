// Simple product data structure for shop components
// This maps from productCatalog to a simpler structure for shop pages

import { productCatalog, Product } from "./productData";

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  colors: string[];
  image?: string; // Main product image
  product?: Product; // Full product data
}

// Convert productCatalog to shop products format
export const products: ShopProduct[] = productCatalog.map((product) => ({
  id: product.id,
  name: product.name,
  price: parseFloat(product.price.replace('€', '')),
  colors: product.variants.map(v => v.hex),
  image: product.variants[0]?.images[0] || '',
  product: product,
}));

// Helper to get product by ID
export function getProductById(id: string): Product | undefined {
  return productCatalog.find(p => p.id === id);
}
