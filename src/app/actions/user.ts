"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Cart Actions
export async function addToCart(productSlugOrId: string, variantSkuOrId: string, quantity: number = 1) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in to add items to cart" };
  }

  try {
    // Find product by slug (frontend uses slug as id) or by ID
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      include: {
        ProductVariant: {
          select: { id: true, sku: true },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        include: {
          ProductVariant: {
            select: { id: true, sku: true },
          },
        },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const actualProductId = product.id;

    // Find variant by SKU or ID
    let variant = product.ProductVariant.find(
      (v) => v.sku === variantSkuOrId || v.id === variantSkuOrId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    const actualVariantId = variant.id;

    // Get or create user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: actualProductId,
          variantId: actualVariantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: actualProductId,
          variantId: actualVariantId,
          quantity,
        },
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { error: "Failed to add item to cart" };
  }
}

export async function removeFromCart(productSlugOrId: string, variantSkuOrId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  try {
    // Find product by slug or ID
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      include: {
        ProductVariant: {
          select: { id: true, sku: true },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        include: {
          ProductVariant: {
            select: { id: true, sku: true },
          },
        },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const actualProductId = product.id;

    // Find variant by SKU or ID
    let variant = product.ProductVariant.find(
      (v) => v.sku === variantSkuOrId || v.id === variantSkuOrId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    const actualVariantId = variant.id;

    // Verify the cart item belongs to the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return { error: "Cart not found" };
    }

    const item = cart.items.find(
      (i) => i.productId === actualProductId && i.variantId === actualVariantId
    );
    if (!item) {
      return { error: "Item not found in cart" };
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { error: "Failed to remove item from cart" };
  }
}

export async function updateCartItemQuantity(productSlugOrId: string, variantSkuOrId: string, quantity: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  if (quantity <= 0) {
    return removeFromCart(productSlugOrId, variantSkuOrId);
  }

  try {
    // Find product by slug or ID
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      include: {
        ProductVariant: {
          select: { id: true, sku: true },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        include: {
          ProductVariant: {
            select: { id: true, sku: true },
          },
        },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const actualProductId = product.id;

    // Find variant by SKU or ID
    let variant = product.ProductVariant.find(
      (v) => v.sku === variantSkuOrId || v.id === variantSkuOrId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    const actualVariantId = variant.id;

    // Verify the cart item belongs to the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return { error: "Cart not found" };
    }

    const item = cart.items.find(
      (i) => i.productId === actualProductId && i.variantId === actualVariantId
    );
    if (!item) {
      return { error: "Item not found in cart" };
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { error: "Failed to update cart item" };
  }
}

export async function getCart() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { items: [] };
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                discountPct: true,
                cashbackAmount: true,
                ProductVariant: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { items: [] };
    }

    return {
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        Product: item.Product,
      })),
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { items: [] };
  }
}

export async function getCartOld() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { items: [], total: 0 };
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            Product: {
              include: {
                ProductVariant: {
                  include: {
                    ProductAsset: true,
                  },
                },
                Category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { items: [], total: 0 };
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      const price = Number(item.Product.basePrice);
      return sum + price * item.quantity;
    }, 0);

    return {
      items: cart.items,
      total,
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { items: [], total: 0 };
  }
}

// Wishlist Actions
export async function toggleWishlist(productSlugOrId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "You must be logged in to manage wishlist" };
  }

  try {
    // First, find the product by slug (since frontend uses slug as id)
    // If it's already a database ID (cuid format), it will fail and we'll try as ID
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      select: { id: true },
    });

    // If not found by slug, try as ID (in case it's already a database ID)
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        select: { id: true },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const actualProductId = product.id;

    // Check if item is already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: actualProductId,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      revalidatePath("/wishlist");
      return { success: true, added: false };
    } else {
      // Add to wishlist
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId: actualProductId,
        },
      });
      revalidatePath("/wishlist");
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return { error: "Failed to update wishlist" };
  }
}

export async function getWishlist() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { items: [] };
  }

  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        Product: {
          include: {
            ProductVariant: {
              include: {
                ProductAsset: true,
              },
            },
            Category: true,
          },
        },
      },
    });

    return { items: wishlistItems };
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return { items: [] };
  }
}

export async function isInWishlist(productSlugOrId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return false;
  }

  try {
    // First, find the product by slug (since frontend uses slug as id)
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      select: { id: true },
    });

    // If not found by slug, try as ID
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        select: { id: true },
      });
    }

    if (!product) {
      return false;
    }

    const actualProductId = product.id;

    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: actualProductId,
        },
      },
    });

    return !!item;
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

// Wallet Actions
export async function getWalletBalance() {
  const session = await auth();
  if (!session?.user?.id) {
    return { balance: 0 };
  }

  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0 },
      });
    }

    return { balance: Number(wallet.balance) };
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return { balance: 0 };
  }
}

export async function getWalletTransactions() {
  const session = await auth();
  if (!session?.user?.id) {
    return { transactions: [] };
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 transactions
        },
      },
    });

    if (!wallet) {
      return { transactions: [] };
    }

    return {
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return { transactions: [] };
  }
}

// Address Actions
export async function getAddresses() {
  const session = await auth();
  if (!session?.user?.id) {
    return { addresses: [] };
  }

  try {
    const addresses = await (prisma as any).address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      addresses: addresses.map((addr) => ({
        id: addr.id,
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return { addresses: [] };
  }
}

export async function addAddress(data: {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to add addresses" };
  }

  try {
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await (prisma as any).address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await (prisma as any).address.create({
      data: {
        userId: session.user.id,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state || null,
        postalCode: data.postalCode,
        country: data.country || "Ireland",
        isDefault: data.isDefault || false,
      },
    });

    revalidatePath("/account");
    return { success: true, address };
  } catch (error) {
    console.error("Error adding address:", error);
    return { error: "Failed to add address" };
  }
}

export async function updateAddress(
  addressId: string,
  data: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  try {
    // Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });

    if (!existingAddress) {
      return { error: "Address not found" };
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await (prisma as any).address.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await (prisma as any).address.update({
      where: { id: addressId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state || null,
        postalCode: data.postalCode,
        country: data.country || "Ireland",
        isDefault: data.isDefault !== undefined ? data.isDefault : existingAddress.isDefault,
      },
    });

    revalidatePath("/account");
    return { success: true, address };
  } catch (error) {
    console.error("Error updating address:", error);
    return { error: "Failed to update address" };
  }
}

export async function deleteAddress(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  try {
    // Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });

    if (!existingAddress) {
      return { error: "Address not found" };
    }

    await (prisma as any).address.delete({
      where: { id: addressId },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error deleting address:", error);
    return { error: "Failed to delete address" };
  }
}

export async function setDefaultAddress(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  try {
    // Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });

    if (!existingAddress) {
      return { error: "Address not found" };
    }

    // Unset all other defaults
    await (prisma as any).address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set this address as default
    await (prisma as any).address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Error setting default address:", error);
    return { error: "Failed to set default address" };
  }
}

// Account Deletion Action
export async function deleteMyAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  try {
    const userId = session.user.id;

    // Fetch all user data before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        sessions: true,
        cart: {
          include: {
            items: {
              include: {
                Product: {
                  include: {
                    ProductVariant: {
                      include: {
                        ProductAsset: true,
                      },
                    },
                    Category: true,
                  },
                },
              },
            },
          },
        },
        wishlist: {
          include: {
            Product: {
              include: {
                ProductVariant: {
                  include: {
                    ProductAsset: true,
                  },
                },
                Category: true,
              },
            },
          },
        },
        wallet: {
          include: {
            transactions: true,
          },
        },
        Review: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        addresses: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Archive all user data to DeletedUser table (REQUIRED - don't delete if archiving fails)
    try {
      const archiveResult = await (prisma as any).deletedUser.create({
        data: {
          originalUserId: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          userData: JSON.parse(JSON.stringify(user)),
          accountsData: JSON.parse(JSON.stringify(user.accounts)),
          sessionsData: JSON.parse(JSON.stringify(user.sessions)),
          cartData: user.cart ? JSON.parse(JSON.stringify(user.cart)) : null,
          wishlistData: JSON.parse(JSON.stringify(user.wishlist)),
          walletData: user.wallet ? JSON.parse(JSON.stringify(user.wallet)) : null,
          reviewsData: JSON.parse(JSON.stringify(user.Review)),
          addressesData: JSON.parse(JSON.stringify(user.addresses)),
        },
      });
      console.log("✅ User data archived successfully:", archiveResult.id);
    } catch (archiveError: any) {
      console.error("❌ Error archiving user data:", archiveError);
      console.error("Archive error details:", {
        code: archiveError?.code,
        message: archiveError?.message,
        meta: archiveError?.meta,
      });
      
      // If archiving fails, DO NOT delete the user - return error instead
      if (archiveError?.code === 'P2001' || archiveError?.message?.includes('model') || archiveError?.message?.includes('DeletedUser') || archiveError?.message?.includes('does not exist')) {
        return { 
          error: "Database schema not updated. Please run 'npx prisma generate' and restart the server. Account was NOT deleted." 
        };
      }
      
      // For any other archiving error, don't proceed with deletion
      return { 
        error: `Failed to archive user data: ${archiveError?.message || 'Unknown error'}. Account was NOT deleted to prevent data loss.` 
      };
    }

    // Now delete the actual user (cascade will delete all related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    
    // Provide more specific error messages
    if (error?.code === 'P2003') {
      return { error: "Cannot delete account: related data exists. Please contact support." };
    }
    if (error?.code === 'P2025') {
      return { error: "User not found or already deleted." };
    }
    if (error?.message?.includes('model') || error?.message?.includes('DeletedUser')) {
      return { 
        error: "Database schema not updated. Please run 'npx prisma generate' and restart the server." 
      };
    }
    
    return { error: `Failed to delete account: ${error?.message || 'Unknown error'}` };
  }
}

