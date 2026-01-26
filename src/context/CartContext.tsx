"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Product, ProductColorVariant } from '@/lib/productData';
import { addToCart as addToCartAction, removeFromCart as removeFromCartAction, updateCartItemQuantity as updateCartItemQuantityAction, getCart } from '@/app/actions/user';
import { mapDbCartItemToCartItem, type CartItem } from '@/lib/cart-wishlist-mapper';
import { trackAddToCart } from '@/components/analytics/MetaPixel';
import { trackGA4AddToCart } from '@/components/analytics/GoogleAnalytics';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductColorVariant, quantity?: number, prescriptionData?: any) => Promise<void>;
  removeFromCart: (productId: string, variantHex: string, prescriptionData?: any) => Promise<void>;
  updateQuantity: (productId: string, variantHex: string, quantity: number, prescriptionData?: any) => Promise<void>;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'focusrobin-cart';
const MERGE_FLAG_KEY = 'focusrobin-cart-merged';

// Helper function to compare prescription data objects
function isPrescriptionDataEqual(data1: any, data2: any): boolean {
  // Both null/undefined
  if (!data1 && !data2) return true;
  // One is null/undefined, other is not
  if (!data1 || !data2) return false;
  
  // Deep comparison using sorted JSON stringify
  const normalize = (obj: any): string => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return JSON.stringify(obj.map(normalize));
    
    // Sort object keys and stringify
    const sorted = Object.keys(obj).sort().reduce((acc: any, key: string) => {
      acc[key] = obj[key];
      return acc;
    }, {});
    return JSON.stringify(sorted, Object.keys(sorted).sort());
  };
  
  return normalize(data1) === normalize(data2);
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const isMergingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const isLoadingCartRef = useRef(false);

  // Initial load from localStorage on mount (before session is determined)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    if (typeof window !== 'undefined') {
      console.log('[CART] Initial mount - loading from localStorage');
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const items = Array.isArray(parsed) ? parsed : [];
          if (items.length > 0) {
            console.log('[CART] Initial load: Found', items.length, 'items in localStorage');
            setCartItems(items);
          }
        } catch (error) {
          console.error('[CART] Error parsing localStorage on initial load:', error);
        }
      }
      hasInitializedRef.current = true;
    }
  }, []);

  // Function to merge guest cart using existing addToCart action
  const mergeGuestCartToDatabase = useCallback(async () => {
    if (isMergingRef.current) {
      console.log('[MERGE] Already merging, skipping...');
      return false;
    }
    
    if (!session?.user?.id) {
      console.error('[MERGE] No user session - cannot merge');
      return false;
    }
    
    try {
      const guestCartData = localStorage.getItem(CART_STORAGE_KEY);
      if (!guestCartData) {
        console.log('[MERGE] No guest cart data in localStorage');
        return false;
      }

      let guestCartItems: CartItem[];
      try {
        guestCartItems = JSON.parse(guestCartData);
      } catch (parseError) {
        console.error('[MERGE] Error parsing guest cart:', parseError);
        localStorage.removeItem(CART_STORAGE_KEY);
        return false;
      }

      if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
        console.log('[MERGE] Guest cart is empty or invalid');
        localStorage.removeItem(CART_STORAGE_KEY);
        return false;
      }

      console.log('[MERGE] ========================================');
      console.log('[MERGE] STARTING MERGE');
      console.log('[MERGE] User ID:', session.user.id);
      console.log('[MERGE] Items to merge:', guestCartItems.length);
      console.log('[MERGE] Guest cart items:', JSON.stringify(guestCartItems, null, 2));
      console.log('[MERGE] ========================================');
      
      isMergingRef.current = true;

      let mergedCount = 0;
      const failedItems: CartItem[] = [];

      // Add each item using the existing addToCart action
      for (let i = 0; i < guestCartItems.length; i++) {
        const item = guestCartItems[i];
        try {
          // product.id is the slug in the frontend
          const productSlug = item.product.id;
          // Try variant.sku first, then variant.hex
          const variantIdentifier = item.variant.sku || item.variant.hex;
          
          console.log(`[MERGE] [${i + 1}/${guestCartItems.length}] Attempting to add:`, {
            productSlug,
            variantIdentifier,
            quantity: item.quantity,
            productName: item.product.name,
            variantHex: item.variant.hex,
            variantSku: item.variant.sku
          });
          
          // Call addToCartAction
          const result = await addToCartAction(productSlug, variantIdentifier, item.quantity);
          
          console.log(`[MERGE] [${i + 1}/${guestCartItems.length}] Result:`, result);
          
          if (result?.error) {
            console.error(`[MERGE] [${i + 1}/${guestCartItems.length}] FAILED:`, result.error);
            failedItems.push(item);
          } else if (result?.success) {
            console.log(`[MERGE] [${i + 1}/${guestCartItems.length}] SUCCESS`);
            mergedCount++;
          } else {
            console.warn(`[MERGE] [${i + 1}/${guestCartItems.length}] UNKNOWN RESULT:`, result);
            failedItems.push(item);
          }
        } catch (error) {
          console.error(`[MERGE] [${i + 1}/${guestCartItems.length}] EXCEPTION:`, error);
          failedItems.push(item);
        }
        
        // Small delay between items to avoid rate limiting
        if (i < guestCartItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log('[MERGE] ========================================');
      console.log('[MERGE] MERGE COMPLETE');
      console.log('[MERGE] Successfully merged:', mergedCount, 'items');
      console.log('[MERGE] Failed:', failedItems.length, 'items');
      console.log('[MERGE] ========================================');

      if (mergedCount > 0) {
        // If some items failed, keep them in localStorage
        if (failedItems.length > 0) {
          console.log('[MERGE] Keeping', failedItems.length, 'failed items in localStorage for retry');
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(failedItems));
        } else {
          // All items merged successfully, clear localStorage
          console.log('[MERGE] All items merged successfully, clearing localStorage');
          localStorage.removeItem(CART_STORAGE_KEY);
        }
        return true;
      } else {
        console.error('[MERGE] CRITICAL: No items were merged successfully!');
        console.error('[MERGE] All items failed. Keeping in localStorage.');
        // Don't clear localStorage if merge failed completely
        return false;
      }
    } catch (error) {
      console.error('[MERGE] FATAL ERROR:', error);
      return false;
    } finally {
      isMergingRef.current = false;
    }
  }, [session?.user?.id]);

  // Function to refresh cart from database
  const refreshCart = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('[CART] refreshCart: No user session, skipping');
      return;
    }

    console.log('[CART] refreshCart: Loading cart from database...');
    try {
      const result = await getCart();
      
      console.log('[CART] refreshCart: Got result from getCart:', {
        hasItems: !!result.items,
        itemCount: result.items?.length || 0,
        items: result.items?.map((i: any) => ({
          id: i.id,
          productId: i.productId,
          hasPrescription: !!i.prescriptionData
        }))
      });
      
      if (result.items && result.items.length > 0) {
        console.log('[CART] refreshCart: Mapping', result.items.length, 'items...');
        const mappedItems: CartItem[] = result.items
          .map((item: any, index: number) => {
            console.log(`[CART] refreshCart: Mapping item ${index + 1}/${result.items.length}...`);
            return mapDbCartItemToCartItem(item);
          })
          .filter((item: CartItem | null): item is CartItem => {
            if (item === null) {
              console.warn('[CART] refreshCart: Item mapping returned null');
            }
            return item !== null;
          });
        
        console.log('[CART] refreshCart: Successfully mapped', mappedItems.length, 'items from database');
        console.log('[CART] refreshCart: Mapped items:', mappedItems.map(i => ({
          product: i.product.name,
          variant: i.variant.name,
          quantity: i.quantity,
          hasPrescription: !!i.prescriptionData
        })));
        
        setCartItems(mappedItems);
        setHasLoadedFromDb(true);
        
        // Clear localStorage for logged-in users - database is source of truth
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      } else {
        console.log('[CART] refreshCart: No items in database cart - result:', result);
        setCartItems([]);
        setHasLoadedFromDb(true);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('[CART] refreshCart: Error loading cart:', error);
    }
  }, [session?.user?.id]);

  // Load cart when session changes
  useEffect(() => {
    const loadCart = async () => {
      // Prevent concurrent loads
      if (isLoadingCartRef.current) {
        console.log('[CART] Already loading cart, skipping...');
        return;
      }

      console.log('[CART] Loading cart, status:', status, 'user:', session?.user?.id ? 'yes' : 'no');
      
      // Wait for session to be determined before making decisions
      if (status === 'loading') {
        console.log('[CART] Session still loading, waiting...');
        // Don't clear cart while session is loading
        return;
      }

      isLoadingCartRef.current = true;
      setIsLoading(true);

      try {
        if (session?.user?.id) {
          // User is logged in
          const currentUserId = session.user.id;
          const isNewLogin = lastUserIdRef.current !== currentUserId;
          
          // Update last user ID
          lastUserIdRef.current = currentUserId;
          
          // Check if we need to merge guest cart
          // Merge if:
          // 1. This is a new login (user just logged in)
          // 2. Guest cart exists in localStorage
          const guestCartData = localStorage.getItem(CART_STORAGE_KEY);
          
          if (isNewLogin && guestCartData) {
            console.log('[CART] ========================================');
            console.log('[CART] NEW LOGIN DETECTED - MERGING GUEST CART');
            console.log('[CART] User ID:', currentUserId);
            console.log('[CART] Guest cart exists:', !!guestCartData);
            console.log('[CART] ========================================');
            
            try {
              const guestCartItems = JSON.parse(guestCartData);
              if (guestCartItems && Array.isArray(guestCartItems) && guestCartItems.length > 0) {
                console.log('[CART] Found', guestCartItems.length, 'items in guest cart');
                console.log('[CART] Starting merge process...');
                
                const mergeSuccess = await mergeGuestCartToDatabase();
                
                console.log('[CART] Merge result:', mergeSuccess ? 'SUCCESS' : 'FAILED');
                
                // Wait for database to update
                console.log('[CART] Waiting for database to update...');
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('[CART] Database update wait complete');
              } else {
                console.log('[CART] Guest cart is empty or invalid, clearing');
                localStorage.removeItem(CART_STORAGE_KEY);
              }
            } catch (parseError) {
              console.error('[CART] Error parsing guest cart:', parseError);
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          } else {
            if (!isNewLogin) {
              console.log('[CART] Same user session, no merge needed');
            } else if (!guestCartData) {
              console.log('[CART] No guest cart to merge');
            }
          }

          // Load cart from database
          console.log('[CART] Loading cart from database...');
          const result = await getCart();
          
          console.log('[CART] Database cart result:', {
            hasItems: !!result.items,
            itemCount: result.items?.length || 0,
            rawItems: result.items?.map((i: any) => ({
              id: i.id,
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              hasPrescriptionData: !!i.prescriptionData,
              prescriptionDataType: i.prescriptionData ? typeof i.prescriptionData : 'null',
              productName: i.Product?.name,
            }))
          });
          
          if (result.items && result.items.length > 0) {
            console.log('[CART] Starting to map', result.items.length, 'items...');
            const mappedItems: CartItem[] = result.items
              .map((item: any, index: number) => {
                console.log(`[CART] Mapping item ${index + 1}:`, {
                  id: item.id,
                  productName: item.Product?.name,
                  hasPrescription: !!item.prescriptionData
                });
                const mapped = mapDbCartItemToCartItem(item);
                if (!mapped) {
                  console.error(`[CART] Failed to map item ${index + 1}!`);
                }
                return mapped;
              })
              .filter((item: CartItem | null): item is CartItem => item !== null);
            
            console.log('[CART] Mapped', mappedItems.length, 'items from database');
            console.log('[CART] Mapped items:', mappedItems.map(i => ({
              product: i.product.name,
              variant: i.variant.name,
              quantity: i.quantity,
              hasPrescription: !!i.prescriptionData
            })));
            console.log('[CART] Setting cart items from database...');
            setCartItems(mappedItems);
            setHasLoadedFromDb(true);
            console.log('[CART] Cart items set successfully from database');
            
            // Clear localStorage for logged-in users - database is source of truth
            if (typeof window !== 'undefined') {
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          } else {
            console.log('[CART] No items in database cart - clearing local cart');
            console.log('[CART] Full getCart result:', JSON.stringify(result, null, 2));
            // For logged-in users, database is source of truth
            setCartItems([]);
            setHasLoadedFromDb(true);
            // Also clear localStorage for logged-in users
            if (typeof window !== 'undefined') {
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          }
        } else {
          // User not logged in - load from localStorage
          console.log('[CART] User not logged in, loading guest cart from localStorage');
          
          // Clear merge flags when user logs out (so merge can happen again on next login)
          if (lastUserIdRef.current !== null) {
            console.log('[CART] User logged out, clearing merge flags');
            localStorage.removeItem(MERGE_FLAG_KEY);
            localStorage.removeItem('focusrobin-last-merged-user');
            lastUserIdRef.current = null;
          }

          setHasLoadedFromDb(false);

          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const items = Array.isArray(parsed) ? parsed : [];
              console.log('[CART] Loaded', items.length, 'items from localStorage');
              setCartItems(items);
            } catch (error) {
              console.error('[CART] Error parsing localStorage:', error);
              localStorage.removeItem(CART_STORAGE_KEY);
              setCartItems([]);
            }
          } else {
            console.log('[CART] No guest cart in localStorage');
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('[CART] Error loading cart:', error);
      } finally {
        setIsLoading(false);
        isLoadingCartRef.current = false;
      }
    };

    loadCart();
  }, [session?.user?.id, status, mergeGuestCartToDatabase]);

  // Save to localStorage when cart changes (ONLY for guest users, not logged-in users)
  // For logged-in users, database is the source of truth - localStorage should be cleared
  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitializedRef.current) {
      if (!session?.user) {
        // Guest user - save to localStorage
        try {
          const cartData = JSON.stringify(cartItems);
          localStorage.setItem(CART_STORAGE_KEY, cartData);
          console.log('[CART] Saved', cartItems.length, 'items to localStorage (guest)');
        } catch (error) {
          console.error('[CART] Error saving to localStorage:', error);
        }
      } else {
        // Logged-in user - clear localStorage (database is source of truth)
        if (localStorage.getItem(CART_STORAGE_KEY)) {
          localStorage.removeItem(CART_STORAGE_KEY);
          console.log('[CART] Cleared localStorage for logged-in user (database is source of truth)');
        }
      }
    }
  }, [cartItems, session?.user]);

  const addToCart = async (product: Product, variant: ProductColorVariant, quantity: number = 1, prescriptionData?: any) => {
    console.log('[CART] addToCart called:', { 
      product: product.name, 
      variant: variant.name, 
      quantity, 
      hasPrescriptionData: !!prescriptionData,
      isLoggedIn: !!session?.user 
    });
    
    // Calculate updated items first (before state update)
    const updatedItems: CartItem[] = (() => {
      // Find existing item with same product, variant, AND prescription data
      const existingItemIndex = cartItems.findIndex(
        (item) => {
          const productMatch = item.product.id === product.id && item.variant.hex === variant.hex;
          if (!productMatch) return false;
          
          // Check prescription data match using deep comparison
          if (prescriptionData) {
            return item.prescriptionData && isPrescriptionDataEqual(item.prescriptionData, prescriptionData);
          } else {
            // No prescription - match items without prescription
            return !item.prescriptionData;
          }
        }
      );

      if (existingItemIndex >= 0) {
        console.log('[CART] Found existing item, updating quantity');
        const items = [...cartItems];
        items[existingItemIndex] = {
          ...items[existingItemIndex],
          quantity: items[existingItemIndex].quantity + quantity,
        };
        return items;
      } else {
        console.log('[CART] Adding new item to cart');
        return [...cartItems, { product, variant, quantity, prescriptionData }];
      }
    })();

    console.log('[CART] Updated items count:', updatedItems.length);
    
    // Update local state (optimistic update)
    setCartItems(updatedItems);

    // Track AddToCart event with Meta Pixel and GA4
    try {
      const price = parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const category = product.gender?.join(', ') || 'Sunglasses';
      
      // Meta Pixel
      trackAddToCart(product.slug || product.id, product.name, category, price * quantity, 'EUR');
      
      // GA4
      trackGA4AddToCart({
        item_id: product.slug || product.id,
        item_name: product.name,
        price: price,
        quantity: quantity,
        currency: 'EUR',
        item_category: category,
      });
    } catch (trackError) {
      console.error('[CART] Analytics tracking error:', trackError);
    }

    if (session?.user) {
      // User is logged in - save to database
      console.log('[CART] User is logged in, saving to database...');
      try {
        // Use product.slug (URL slug) for finding the product, and variant.sku
        // product.id might be the database ID, so use slug for consistency
        const productIdentifier = product.slug || product.id;
        console.log('[CART] Using product identifier:', productIdentifier, 'variant:', variant.sku || variant.hex);
        const result = await addToCartAction(productIdentifier, variant.sku || variant.hex, quantity, prescriptionData);
        console.log('[CART] Database save result:', result);
        
        // Handle undefined or null result - keep optimistic update
        if (!result) {
          console.error('[CART] Server action returned undefined/null - keeping optimistic update');
          return;
        }
        
        if (result.error) {
          console.error('[CART] Error adding to cart:', result.error);
          console.warn('[CART] Keeping optimistic update despite error');
          return;
        }
        
        // Success! Reload cart from database to ensure sync
        console.log('[CART] Database save successful, reloading cart...');
        await refreshCart();
      } catch (error) {
        // Server action threw an exception - keep the optimistic update
        console.error('[CART] Exception in server action:', error);
        console.warn('[CART] Keeping optimistic update despite exception');
      }
    } else {
      // Guest user - save to localStorage immediately
      console.log('[CART] Guest user, saving to localStorage...');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
          console.log('[CART] Saved', updatedItems.length, 'items to localStorage (guest)');
        } catch (error) {
          console.error('[CART] Error saving to localStorage:', error);
        }
      }
    }
    
    console.log('[CART] addToCart completed');
  };

  const removeFromCart = async (productId: string, variantHex: string, prescriptionData?: any) => {
    // Find the item to get variant SKU - consider prescription data for matching
    const item = cartItems.find(
      (item) => {
        const productMatch = item.product.id === productId && item.variant.hex === variantHex;
        if (!productMatch) return false;
        
        // If prescription data is provided, match it using deep comparison
        if (prescriptionData !== undefined) {
          if (prescriptionData) {
            return item.prescriptionData && isPrescriptionDataEqual(item.prescriptionData, prescriptionData);
          } else {
            return !item.prescriptionData;
          }
        }
        // If no prescription data argument, only match items without prescription data
        return !item.prescriptionData;
      }
    );

    // Update local state first (optimistic update)
    setCartItems((prevItems) => {
      const indexToRemove = prevItems.findIndex((prevItem) => {
        const productMatch = prevItem.product.id === productId && prevItem.variant.hex === variantHex;
        if (!productMatch) return false;
        
        if (prescriptionData !== undefined) {
          if (prescriptionData) {
            return prevItem.prescriptionData && isPrescriptionDataEqual(prevItem.prescriptionData, prescriptionData);
          } else {
            return !prevItem.prescriptionData;
          }
        }
        // If no prescription data argument, only match items without prescription data
        return !prevItem.prescriptionData;
      });
      
      if (indexToRemove === -1) return prevItems;
      
      const newItems = [...prevItems];
      newItems.splice(indexToRemove, 1);
      return newItems;
    });

    if (session?.user && item) {
      // User is logged in - remove from database
      try {
        const result = await removeFromCartAction(productId, item.variant.sku || variantHex, prescriptionData);
        if (result.error) {
          console.error('Error removing from cart:', result.error);
        }
        // Always reload cart from database to ensure sync
        await refreshCart();
      } catch (error) {
        console.error('Error removing from cart:', error);
        await refreshCart();
      }
    }
  };

  const updateQuantity = async (productId: string, variantHex: string, quantity: number, prescriptionData?: any) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variantHex, prescriptionData);
      return;
    }

    // Find the item to get variant SKU - consider prescription data for matching
    const item = cartItems.find(
      (item) => {
        const productMatch = item.product.id === productId && item.variant.hex === variantHex;
        if (!productMatch) return false;
        
        if (prescriptionData !== undefined) {
          if (prescriptionData) {
            return item.prescriptionData && isPrescriptionDataEqual(item.prescriptionData, prescriptionData);
          } else {
            return !item.prescriptionData;
          }
        }
        return true;
      }
    );

    // Update local state first (optimistic update)
    setCartItems((prevItems) => {
      let updated = false;
      return prevItems.map((prevItem) => {
        if (updated) return prevItem;
        
        const productMatch = prevItem.product.id === productId && prevItem.variant.hex === variantHex;
        if (!productMatch) return prevItem;
        
        let shouldUpdate = false;
        if (prescriptionData !== undefined) {
          if (prescriptionData) {
            shouldUpdate = prevItem.prescriptionData && isPrescriptionDataEqual(prevItem.prescriptionData, prescriptionData);
          } else {
            shouldUpdate = !prevItem.prescriptionData;
          }
        } else {
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          updated = true;
          return { ...prevItem, quantity };
        }
        return prevItem;
      });
    });

    if (session?.user && item) {
      // User is logged in - update in database
      try {
        const result = await updateCartItemQuantityAction(productId, item.variant.sku || variantHex, quantity, prescriptionData);
        if (result.error) {
          console.error('Error updating cart quantity:', result.error);
        }
        // Always reload cart from database to ensure sync
        await refreshCart();
      } catch (error) {
        console.error('Error updating cart quantity:', error);
        await refreshCart();
      }
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined' && !session?.user) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const framePrice = parseFloat(item.product.price.replace(/[^\d.,]/g, '').replace(',', '.'));
      
      // If item has prescription data, use prescription total price (frame + lenses)
      if (item.prescriptionData?.rxPriceBreakdown?.totalNet) {
        const prescriptionPrice = item.prescriptionData.rxPriceBreakdown.totalNet;
        return total + prescriptionPrice * item.quantity;
      }
      
      // Otherwise use frame price only
      return total + framePrice * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isLoading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
