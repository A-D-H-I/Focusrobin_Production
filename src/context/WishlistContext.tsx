"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Product, ProductColorVariant } from '@/lib/productData';
import { toggleWishlist as toggleWishlistAction, getWishlist, isInWishlist as isInWishlistAction } from '@/app/actions/user';
import { mapDbWishlistItemToWishlistItem, type WishlistItem } from '@/lib/cart-wishlist-mapper';
import { trackMetaEvent } from '@/components/analytics/MetaPixel';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Product, variant: ProductColorVariant) => Promise<void>;
  removeFromWishlist: (productId: string, variantHex: string) => Promise<void>;
  isInWishlist: (productId: string, variantHex: string) => boolean;
  clearWishlist: () => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'focusrobin-wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());

  // Load wishlist on mount and when session changes
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        if (session?.user) {
          // User is logged in - load from database
          const result = await getWishlist();
          if (result.items && result.items.length > 0) {
            // Map database items to WishlistItem format
            const mappedItems: WishlistItem[] = result.items
              .map((item: any) => mapDbWishlistItemToWishlistItem(item))
              .filter((item: WishlistItem | null): item is WishlistItem => item !== null);
            setWishlistItems(mappedItems);
            // Store product slugs (frontend IDs) for quick lookup
            const productIds = new Set(mappedItems.map((item) => item.product.id));
            setWishlistProductIds(productIds);
          } else {
            setWishlistItems([]);
            setWishlistProductIds(new Set());
          }
        } else {
          // User is not logged in - load from localStorage
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            if (stored) {
              const items = JSON.parse(stored);
              setWishlistItems(items);
              const productIds = new Set(items.map((item: WishlistItem) => item.product.id));
              setWishlistProductIds(productIds);
            }
          }
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [session]);

  // Save to localStorage when wishlist changes (only for guests)
  useEffect(() => {
    if (!session?.user && typeof window !== 'undefined') {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  }, [wishlistItems, session]);

  const addToWishlist = async (product: Product, variant: ProductColorVariant) => {
    // Update local state first (optimistic update)
    setWishlistItems((prevItems) => {
      const exists = prevItems.some(
        (item) => item.product.id === product.id && item.variant.hex === variant.hex
      );
      if (exists) {
        return prevItems;
      }
      return [...prevItems, { product, variant }];
    });
    setWishlistProductIds(prev => new Set([...prev, product.id]));

    // Track AddToWishlist event with Meta Pixel
    try {
      const price = parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const category = product.gender?.join(', ') || 'Sunglasses';
      trackMetaEvent('AddToWishlist', {
        content_ids: [product.slug || product.id],
        content_name: product.name,
        content_category: category,
        value: price,
        currency: 'EUR',
      });
    } catch (trackError) {
      console.error('[Wishlist] Meta Pixel tracking error:', trackError);
    }

    if (session?.user) {
      // User is logged in - save to database
      try {
        const result = await toggleWishlistAction(product.id);
        if (result.error) {
          console.error('Error adding to wishlist:', result.error);
          // Revert optimistic update on error
          setWishlistItems((prevItems) =>
            prevItems.filter(
              (item) => !(item.product.id === product.id && item.variant.hex === variant.hex)
            )
          );
          setWishlistProductIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.id);
            return newSet;
          });
        } else {
          // Reload wishlist from database to ensure sync
          const wishlistResult = await getWishlist();
          if (wishlistResult.items && wishlistResult.items.length > 0) {
            const mappedItems: WishlistItem[] = wishlistResult.items
              .map((item: any) => mapDbWishlistItemToWishlistItem(item))
              .filter((item: WishlistItem | null): item is WishlistItem => item !== null);
            setWishlistItems(mappedItems);
            const productIds = new Set(mappedItems.map((item) => item.product.id));
            setWishlistProductIds(productIds);
          } else {
            setWishlistItems([]);
            setWishlistProductIds(new Set());
          }
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        // Revert optimistic update on error
        setWishlistItems((prevItems) =>
          prevItems.filter(
            (item) => !(item.product.id === product.id && item.variant.hex === variant.hex)
          )
        );
        setWishlistProductIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }
    }
  };

  const removeFromWishlist = async (productId: string, variantHex: string) => {
    // Update local state first (optimistic update)
    const hadItem = wishlistItems.some(
      (item) => item.product.id === productId && item.variant.hex === variantHex
    );
    setWishlistItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.variant.hex === variantHex)
      )
    );
    if (hadItem) {
      setWishlistProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }

    if (session?.user) {
      // User is logged in - remove from database
      try {
        const result = await toggleWishlistAction(productId);
        if (result.error) {
          console.error('Error removing from wishlist:', result.error);
        }
        // Always reload wishlist from database to ensure sync
        const wishlistResult = await getWishlist();
        if (wishlistResult.items && wishlistResult.items.length > 0) {
          const mappedItems: WishlistItem[] = wishlistResult.items
            .map((item: any) => mapDbWishlistItemToWishlistItem(item))
            .filter((item: WishlistItem | null): item is WishlistItem => item !== null);
          setWishlistItems(mappedItems);
          const productIds = new Set(mappedItems.map((item) => item.product.id));
          setWishlistProductIds(productIds);
        } else {
          setWishlistItems([]);
          setWishlistProductIds(new Set());
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        // Reload wishlist from database on error
        try {
          const wishlistResult = await getWishlist();
          if (wishlistResult.items && wishlistResult.items.length > 0) {
            const mappedItems: WishlistItem[] = wishlistResult.items
              .map((item: any) => mapDbWishlistItemToWishlistItem(item))
              .filter((item: WishlistItem | null): item is WishlistItem => item !== null);
            setWishlistItems(mappedItems);
            const productIds = new Set(mappedItems.map((item) => item.product.id));
            setWishlistProductIds(productIds);
          } else {
            setWishlistItems([]);
            setWishlistProductIds(new Set());
          }
        } catch (reloadError) {
          console.error('Error reloading wishlist:', reloadError);
        }
      }
    }
  };

  const isInWishlist = (productId: string, variantHex: string): boolean => {
    // Check local state (both for logged in and guest users)
    // For logged in users, we sync the productIds from database on load
    return wishlistProductIds.has(productId) || wishlistItems.some(
      (item) => item.product.id === productId && item.variant.hex === variantHex
    );
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    setWishlistProductIds(new Set());
    if (typeof window !== 'undefined' && !session?.user) {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        isLoading,
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
