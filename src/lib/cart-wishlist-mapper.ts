import { mapPrismaProductToProduct } from './prisma-product-mapper';
import type { Product, ProductColorVariant } from './productData';

export interface CartItem {
  product: Product;
  variant: ProductColorVariant;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  variant: ProductColorVariant;
}

/**
 * Maps database cart items to frontend CartItem format
 */
export function mapDbCartItemToCartItem(dbItem: any): CartItem | null {
  try {
    const product = mapPrismaProductToProduct(dbItem.Product);
    
    // Find the variant that matches the variantId from database
    const dbVariant = dbItem.Product.ProductVariant.find(
      (pv: any) => pv.id === dbItem.variantId
    );
    
    if (!dbVariant) {
      // Fallback to first variant if variant not found
      const variant = product.variants[0];
      if (!variant) return null;
      return { product, variant, quantity: dbItem.quantity };
    }

    // Find matching variant by SKU
    const variant = product.variants.find(
      (v) => v.sku === dbVariant.sku
    ) || product.variants[0];

    if (!variant) {
      return null;
    }

    return {
      product,
      variant,
      quantity: dbItem.quantity,
    };
  } catch (error) {
    console.error('Error mapping cart item:', error);
    return null;
  }
}

/**
 * Maps database wishlist items to frontend WishlistItem format
 */
export function mapDbWishlistItemToWishlistItem(dbItem: any): WishlistItem | null {
  try {
    const product = mapPrismaProductToProduct(dbItem.Product);
    
    // Use the first variant (or you could store variant preference)
    const variant = product.variants[0];

    if (!variant) {
      return null;
    }

    return {
      product,
      variant,
    };
  } catch (error) {
    console.error('Error mapping wishlist item:', error);
    return null;
  }
}

