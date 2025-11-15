"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Product, ProductColorVariant } from '@/lib/productData';

export interface CartItem {
  product: Product;
  variant: ProductColorVariant;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductColorVariant, quantity?: number) => void;
  removeFromCart: (productId: string, variantHex: string) => void;
  updateQuantity: (productId: string, variantHex: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, variant: ProductColorVariant, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.variant.hex === variant.hex
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { product, variant, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string, variantHex: string) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.variant.hex === variantHex)
      )
    );
  };

  const updateQuantity = (productId: string, variantHex: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantHex);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.variant.hex === variantHex
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
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

