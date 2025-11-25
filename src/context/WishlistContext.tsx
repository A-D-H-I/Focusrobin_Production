"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product, ProductColorVariant } from '@/lib/productData';

export interface WishlistItem {
  product: Product;
  variant: ProductColorVariant;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Product, variant: ProductColorVariant) => void;
  removeFromWishlist: (productId: string, variantHex: string) => void;
  isInWishlist: (productId: string, variantHex: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'focusrobin-wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (stored) {
          setWishlistItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  }, [wishlistItems]);

  const addToWishlist = (product: Product, variant: ProductColorVariant) => {
    setWishlistItems((prevItems) => {
      const exists = prevItems.some(
        (item) => item.product.id === product.id && item.variant.hex === variant.hex
      );
      if (exists) {
        return prevItems; // Already in wishlist
      }
      return [...prevItems, { product, variant }];
    });
  };

  const removeFromWishlist = (productId: string, variantHex: string) => {
    setWishlistItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.variant.hex === variantHex)
      )
    );
  };

  const isInWishlist = (productId: string, variantHex: string): boolean => {
    return wishlistItems.some(
      (item) => item.product.id === productId && item.variant.hex === variantHex
    );
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

