import { mapPrismaProductToProduct } from './prisma-product-mapper';
import type { Product, ProductColorVariant } from './productData';

export interface CartItem {
  product: Product;
  variant: ProductColorVariant;
  quantity: number;
  prescriptionData?: any; // Prescription data if item has prescription lenses
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
    console.log('[MAPPER] Mapping cart item:', {
      id: dbItem.id,
      productId: dbItem.productId,
      variantId: dbItem.variantId,
      quantity: dbItem.quantity,
      hasPrescriptionData: !!dbItem.prescriptionData,
      prescriptionDataKeys: dbItem.prescriptionData ? Object.keys(dbItem.prescriptionData) : [],
    });

    if (!dbItem.Product) {
      console.error('[MAPPER] No Product found in dbItem:', dbItem);
      return null;
    }

    const product = mapPrismaProductToProduct(dbItem.Product);
    
    // Find the variant that matches the variantId from database
    const dbVariant = dbItem.Product.ProductVariant.find(
      (pv: any) => pv.id === dbItem.variantId
    );
    
    if (!dbVariant) {
      console.warn('[MAPPER] Variant not found for variantId:', dbItem.variantId);
      // Fallback to first variant if variant not found
      const variant = product.variants[0];
      if (!variant) {
        console.error('[MAPPER] No variants found for product:', product.name);
        return null;
      }
      console.log('[MAPPER] Using fallback variant:', variant.name);
      return { product, variant, quantity: dbItem.quantity, prescriptionData: dbItem.prescriptionData || undefined };
    }

    // Find matching variant by SKU
    const variant = product.variants.find(
      (v) => v.sku === dbVariant.sku
    ) || product.variants[0];

    if (!variant) {
      console.error('[MAPPER] No matching variant found for SKU:', dbVariant.sku);
      return null;
    }

    // Update variant with current stock from database (may have changed since product was loaded)
    const variantWithStock: ProductColorVariant = {
      ...variant,
      stock: dbVariant.stock !== null && dbVariant.stock !== undefined ? Number(dbVariant.stock) : variant.stock,
    };

    const result = {
      product,
      variant: variantWithStock,
      quantity: dbItem.quantity,
      prescriptionData: dbItem.prescriptionData || undefined,
    };

    console.log('[MAPPER] Successfully mapped cart item:', {
      product: product.name,
      variant: variant.name,
      quantity: result.quantity,
      hasPrescription: !!result.prescriptionData
    });

    return result;
  } catch (error) {
    console.error('[MAPPER] Error mapping cart item:', error, 'dbItem:', dbItem);
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

