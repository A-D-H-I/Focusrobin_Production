"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Product, ProductColorVariant } from '@/lib/productData';
import { addToCart as addToCartAction, removeFromCart as removeFromCartAction, updateCartItemQuantity as updateCartItemQuantityAction, getCart } from '@/app/actions/user';
import { mapDbCartItemToCartItem, type CartItem } from '@/lib/cart-wishlist-mapper';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductColorVariant, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, variantHex: string) => Promise<void>;
  updateQuantity: (productId: string, variantHex: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'focusrobin-cart';
const MERGE_FLAG_KEY = 'focusrobin-cart-merged';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMergingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

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

  // Load cart when session changes
  useEffect(() => {
    const loadCart = async () => {
      console.log('[CART] Loading cart, status:', status, 'user:', session?.user?.id ? 'yes' : 'no');
      
      // Don't wait for session to load - if not logged in, use localStorage immediately
      if (status === 'loading' && !session?.user?.id) {
        // While session is loading and we don't have a user, keep localStorage cart
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const items = Array.isArray(parsed) ? parsed : [];
            if (items.length > 0 && cartItems.length === 0) {
              console.log('[CART] Session loading - keeping localStorage cart:', items.length, 'items');
              setCartItems(items);
            }
          } catch (error) {
            console.error('[CART] Error parsing localStorage while session loading:', error);
          }
        }
        return;
      }

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
            console.log('[CART] Previous User ID:', lastUserIdRef.current);
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
                await new Promise(resolve => setTimeout(resolve, 1000));
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
            itemCount: result.items?.length || 0
          });
          
          if (result.items && result.items.length > 0) {
            const mappedItems: CartItem[] = result.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            
            console.log('[CART] Mapped', mappedItems.length, 'items from database');
            console.log('[CART] Setting cart items in state...');
            setCartItems(mappedItems);
            console.log('[CART] Cart items set successfully');
          } else {
            console.log('[CART] No items in database cart');
            setCartItems([]);
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

          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const items = Array.isArray(parsed) ? parsed : [];
              console.log('[CART] Loaded', items.length, 'items from localStorage');
              console.log('[CART] Guest cart items:', items);
              
              // Only update if we have items or if current cart is empty
              if (items.length > 0 || cartItems.length === 0) {
                setCartItems(items);
              }
            } catch (error) {
              console.error('[CART] Error parsing localStorage:', error);
              localStorage.removeItem(CART_STORAGE_KEY);
              // Only clear cart if we can't parse - don't clear if localStorage is valid
              if (cartItems.length === 0) {
                setCartItems([]);
              }
            }
          } else {
            console.log('[CART] No guest cart in localStorage');
            // Only clear cart if localStorage is actually empty
            if (cartItems.length > 0) {
              console.log('[CART] localStorage empty but cart has items - keeping cart items');
            } else {
              setCartItems([]);
            }
          }
        }
      } catch (error) {
        console.error('[CART] Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [session?.user?.id, status, mergeGuestCartToDatabase]);

  // Save to localStorage when cart changes (only for guests)
  useEffect(() => {
    if (!session?.user && typeof window !== 'undefined' && hasInitializedRef.current) {
      try {
        const cartData = JSON.stringify(cartItems);
        localStorage.setItem(CART_STORAGE_KEY, cartData);
        console.log('[CART] Saved', cartItems.length, 'items to localStorage');
        
        // Verify it was saved
        const verify = localStorage.getItem(CART_STORAGE_KEY);
        if (verify) {
          const verifiedItems = JSON.parse(verify);
          console.log('[CART] Verified: localStorage contains', verifiedItems.length, 'items');
          
          // If verification fails, try to restore
          if (verifiedItems.length !== cartItems.length) {
            console.warn('[CART] Verification mismatch! Restoring...');
            localStorage.setItem(CART_STORAGE_KEY, cartData);
          }
        }
      } catch (error) {
        console.error('[CART] Error saving to localStorage:', error);
        // Try to save again
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (retryError) {
          console.error('[CART] Retry save also failed:', retryError);
        }
      }
    }
  }, [cartItems, session]);

  const addToCart = async (product: Product, variant: ProductColorVariant, quantity: number = 1) => {
    // Update local state first (optimistic update)
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.variant.hex === variant.hex
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      } else {
        return [...prevItems, { product, variant, quantity }];
      }
    });

    if (session?.user) {
      // User is logged in - save to database
      try {
        // Use product.id (which is slug) and variant.sku
        const result = await addToCartAction(product.id, variant.sku || variant.hex, quantity);
        if (result.error) {
          console.error('Error adding to cart:', result.error);
          // Revert optimistic update on error
          setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
              (item) => item.product.id === product.id && item.variant.hex === variant.hex
            );
            if (existingItemIndex >= 0) {
              const updatedItems = [...prevItems];
              const newQuantity = updatedItems[existingItemIndex].quantity - quantity;
              if (newQuantity <= 0) {
                return updatedItems.filter((_, idx) => idx !== existingItemIndex);
              }
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: newQuantity,
              };
              return updatedItems;
            }
            return prevItems;
          });
        } else {
          // Reload cart from database to ensure sync
          try {
            const cartResult = await getCart();
            if (cartResult.items && cartResult.items.length > 0) {
              const mappedItems: CartItem[] = cartResult.items
                .map((item: any) => mapDbCartItemToCartItem(item))
                .filter((item: CartItem | null): item is CartItem => item !== null);
              
              // Only update if we successfully mapped items
              if (mappedItems.length > 0) {
                setCartItems(mappedItems);
              } else {
                // If mapping failed, keep the optimistic update to prevent cart from disappearing
                console.warn('Cart mapping failed, keeping optimistic update');
              }
            }
          } catch (reloadError) {
            // If reload fails, keep the optimistic update
            console.error('Error reloading cart:', reloadError);
          }
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Revert optimistic update on error
        setCartItems((prevItems) => {
          const existingItemIndex = prevItems.findIndex(
            (item) => item.product.id === product.id && item.variant.hex === variant.hex
          );
          if (existingItemIndex >= 0) {
            const updatedItems = [...prevItems];
            const newQuantity = updatedItems[existingItemIndex].quantity - quantity;
            if (newQuantity <= 0) {
              return updatedItems.filter((_, idx) => idx !== existingItemIndex);
            }
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: newQuantity,
            };
            return updatedItems;
          }
          return prevItems;
        });
      }
    }
  };

  const removeFromCart = async (productId: string, variantHex: string) => {
    // Find the item to get variant SKU
    const item = cartItems.find(
      (item) => item.product.id === productId && item.variant.hex === variantHex
    );

    // Update local state first (optimistic update)
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.variant.hex === variantHex)
      )
    );

    if (session?.user && item) {
      // User is logged in - remove from database
      try {
        const result = await removeFromCartAction(productId, item.variant.sku || variantHex);
        if (result.error) {
          console.error('Error removing from cart:', result.error);
          // Reload cart from database on error
          const cartResult = await getCart();
          if (cartResult.items && cartResult.items.length > 0) {
            const mappedItems: CartItem[] = cartResult.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        } else {
          // Reload cart from database to ensure sync
          const cartResult = await getCart();
          if (cartResult.items && cartResult.items.length > 0) {
            const mappedItems: CartItem[] = cartResult.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }
  };

  const updateQuantity = async (productId: string, variantHex: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variantHex);
      return;
    }

    // Find the item to get variant SKU
    const item = cartItems.find(
      (item) => item.product.id === productId && item.variant.hex === variantHex
    );

    // Update local state first (optimistic update)
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.variant.hex === variantHex
          ? { ...item, quantity }
          : item
      )
    );

    if (session?.user && item) {
      // User is logged in - update in database
      try {
        const result = await updateCartItemQuantityAction(productId, item.variant.sku || variantHex, quantity);
        if (result.error) {
          console.error('Error updating cart quantity:', result.error);
          // Reload cart from database on error
          const cartResult = await getCart();
          if (cartResult.items && cartResult.items.length > 0) {
            const mappedItems: CartItem[] = cartResult.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        } else {
          // Reload cart from database to ensure sync
          const cartResult = await getCart();
          if (cartResult.items && cartResult.items.length > 0) {
            const mappedItems: CartItem[] = cartResult.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('Error updating cart quantity:', error);
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
      const price = parseFloat(item.product.price.replace(/[^\d.,]/g, '').replace(',', '.'));
      return total + price * item.quantity;
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
