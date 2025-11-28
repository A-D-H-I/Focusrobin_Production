"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart on mount and when session changes
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (session?.user) {
          // User is logged in - load from database
          const result = await getCart();
          if (result.items && result.items.length > 0) {
            // Map database items to CartItem format
            const mappedItems: CartItem[] = result.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        } else {
          // User is not logged in - load from localStorage
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
              setCartItems(JSON.parse(stored));
            }
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [session]);

  // Save to localStorage when cart changes (only for guests)
  useEffect(() => {
    if (!session?.user && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
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
          const cartResult = await getCart();
          if (cartResult.items && cartResult.items.length > 0) {
            const mappedItems: CartItem[] = cartResult.items
              .map((item: any) => mapDbCartItemToCartItem(item))
              .filter((item: CartItem | null): item is CartItem => item !== null);
            setCartItems(mappedItems);
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
