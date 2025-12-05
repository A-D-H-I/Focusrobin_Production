"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin, verifyOwnership, safeAction } from "@/lib/security";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";
import {
  addToCartSchema,
  updateCartItemSchema,
  addressSchema,
} from "@/lib/validations";

// ============================================================================
// CART ACTIONS (User-scoped)
// ============================================================================

export async function addToCart(productSlugOrId: string, variantSkuOrId: string, quantity: number = 1) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    
    // Rate limit cart operations
    const rateLimitResult = rateLimit(
      getIdentifier(null, session.user.id, "cart"),
      "CART_OPERATIONS"
    );
    if (!rateLimitResult.success) {
      return { error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.` };
    }

    // Validate input
    const validatedInput = addToCartSchema.safeParse({ productSlugOrId, variantSkuOrId, quantity });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const { productSlugOrId: slug, variantSkuOrId: variantId, quantity: qty } = validatedInput.data;

    // Find product by slug or ID
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        ProductVariant: {
          select: { id: true, sku: true },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: slug },
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
    const variant = product.ProductVariant.find(
      (v) => v.sku === variantId || v.id === variantId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    const actualVariantId = variant.id;

    // Get or create user's cart (IDOR protected - uses session.user.id)
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
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: Math.min(existingItem.quantity + qty, 99) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: actualProductId,
          variantId: actualVariantId,
          quantity: qty,
        },
      });
    }

    revalidatePath("/cart");
    return { success: true };
  });
}

export async function removeFromCart(productSlugOrId: string, variantSkuOrId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input
    const schema = z.object({
      productSlugOrId: z.string().min(1).max(100),
      variantSkuOrId: z.string().min(1).max(100),
    });
    const validatedInput = schema.safeParse({ productSlugOrId, variantSkuOrId });
    if (!validatedInput.success) {
      return { error: "Invalid input" };
    }

    // Find product
    let product = await prisma.product.findUnique({
      where: { slug: validatedInput.data.productSlugOrId },
      include: { ProductVariant: { select: { id: true, sku: true } } },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: validatedInput.data.productSlugOrId },
        include: { ProductVariant: { select: { id: true, sku: true } } },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const variant = product.ProductVariant.find(
      (v) => v.sku === validatedInput.data.variantSkuOrId || v.id === validatedInput.data.variantSkuOrId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    // IDOR Protection: Only get cart owned by current user
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return { error: "Cart not found" };
    }

    const item = cart.items.find(
      (i) => i.productId === product!.id && i.variantId === variant.id
    );
    if (!item) {
      return { error: "Item not found in cart" };
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    revalidatePath("/cart");
    return { success: true };
  });
}

export async function updateCartItemQuantity(productSlugOrId: string, variantSkuOrId: string, quantity: number) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input
    const validatedInput = updateCartItemSchema.safeParse({ productSlugOrId, variantSkuOrId, quantity });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    if (validatedInput.data.quantity <= 0) {
      return removeFromCart(productSlugOrId, variantSkuOrId);
    }

    // Find product
    let product = await prisma.product.findUnique({
      where: { slug: validatedInput.data.productSlugOrId },
      include: { ProductVariant: { select: { id: true, sku: true } } },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: validatedInput.data.productSlugOrId },
        include: { ProductVariant: { select: { id: true, sku: true } } },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    const variant = product.ProductVariant.find(
      (v) => v.sku === validatedInput.data.variantSkuOrId || v.id === validatedInput.data.variantSkuOrId
    );

    if (!variant) {
      return { error: "Product variant not found" };
    }

    // IDOR Protection: Only get cart owned by current user
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return { error: "Cart not found" };
    }

    const item = cart.items.find(
      (i) => i.productId === product!.id && i.variantId === variant.id
    );
    if (!item) {
      return { error: "Item not found in cart" };
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: validatedInput.data.quantity },
    });

    revalidatePath("/cart");
    return { success: true };
  });
}

export async function getCart() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { items: [] };
  }

  const userId = (session.user as any)?.id;

  try {
    // IDOR Protection: Only fetch cart for current user
    const cart = await prisma.cart.findUnique({
      where: { userId },
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
                gender: true,
                frameMaterial: true,
                lensMaterial: true,
                uvProtection: true,
                description: true,
                frameWidth: true,
                lensWidth: true,
                lensHeight: true,
                bridgeWidth: true,
                templeLength: true,
                weightBg: true,
                averageRating: true,
                reviewCount: true,
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
      return { items: [] };
    }

    return {
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        Product: {
          ...item.Product,
          cashbackAmount: item.Product.cashbackAmount ? Number(item.Product.cashbackAmount) : 0,
          basePrice: Number(item.Product.basePrice),
          ProductVariant: item.Product.ProductVariant.map((variant: any) => ({
            ...variant,
            price: variant.price ? Number(variant.price) : null,
          })),
        },
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

  const userId = (session.user as any)?.id;

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
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

// ============================================================================
// WISHLIST ACTIONS (User-scoped)
// ============================================================================

export async function toggleWishlist(productSlugOrId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input
    const schema = z.string().min(1).max(100);
    const validatedInput = schema.safeParse(productSlugOrId);
    if (!validatedInput.success) {
      return { error: "Invalid product ID" };
    }

    // Find product
    let product = await prisma.product.findUnique({
      where: { slug: validatedInput.data },
      select: { id: true },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: validatedInput.data },
        select: { id: true },
      });
    }

    if (!product) {
      return { error: "Product not found" };
    }

    // IDOR Protection: Only check/modify wishlist for current user
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      revalidatePath("/wishlist");
      return { success: true, added: false };
    } else {
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId: product.id,
        },
      });
      revalidatePath("/wishlist");
      return { success: true, added: true };
    }
  });
}

export async function getWishlist() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { items: [] };
  }

  const userId = (session.user as any)?.id;

  try {
    // IDOR Protection: Only fetch wishlist for current user
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
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

    return {
      items: wishlistItems.map((item) => ({
        ...item,
        Product: {
          ...item.Product,
          basePrice: Number(item.Product.basePrice),
          cashbackAmount: item.Product.cashbackAmount ? Number(item.Product.cashbackAmount) : 0,
          ProductVariant: item.Product.ProductVariant.map((variant) => ({
            ...variant,
            price: variant.price ? Number(variant.price) : null,
          })),
        },
      })),
    };
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

  const userId = (session.user as any)?.id;

  try {
    let product = await prisma.product.findUnique({
      where: { slug: productSlugOrId },
      select: { id: true },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productSlugOrId },
        select: { id: true },
      });
    }

    if (!product) {
      return false;
    }

    // IDOR Protection: Only check wishlist for current user
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: product.id,
        },
      },
    });

    return !!item;
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

// ============================================================================
// WALLET ACTIONS (User-scoped)
// ============================================================================

export async function getWalletBalance() {
  const session = await auth();
  if (!session?.user?.id) {
    return { balance: 0 };
  }

  const userId = (session.user as any)?.id;

  try {
    // IDOR Protection: Only fetch wallet for current user
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
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

  const userId = (session.user as any)?.id;

  try {
    // IDOR Protection: Only fetch wallet for current user
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
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

// ============================================================================
// ADDRESS ACTIONS (User-scoped)
// ============================================================================

export async function getAddresses() {
  const session = await auth();
  if (!session?.user?.id) {
    return { addresses: [] };
  }

  const userId = (session.user as any)?.id;

  try {
    // IDOR Protection: Only fetch addresses for current user
    const addresses = await (prisma as any).address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      addresses: addresses.map((addr: any) => ({
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
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input with Zod
    const validatedInput = addressSchema.safeParse(data);
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const validData = validatedInput.data;

    // If this is set as default, unset other defaults
    if (validData.isDefault) {
      await (prisma as any).address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await (prisma as any).address.create({
      data: {
        userId: session.user.id,
        fullName: validData.fullName,
        phone: validData.phone,
        addressLine1: validData.addressLine1,
        addressLine2: validData.addressLine2 || null,
        city: validData.city,
        state: validData.state || null,
        postalCode: validData.postalCode,
        country: validData.country || "Ireland",
        isDefault: validData.isDefault || false,
      },
    });

    revalidatePath("/account");
    return { success: true, address };
  });
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
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate address ID
    const idSchema = z.string().min(1).max(30);
    const validatedId = idSchema.safeParse(addressId);
    if (!validatedId.success) {
      return { error: "Invalid address ID" };
    }

    // Validate input data
    const validatedInput = addressSchema.safeParse(data);
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const validData = validatedInput.data;

    // IDOR Protection: Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: validatedId.data, userId: session.user.id },
    });

    if (!existingAddress) {
      return { error: "Address not found" };
    }

    // If this is set as default, unset other defaults
    if (validData.isDefault) {
      await (prisma as any).address.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: validatedId.data } },
        data: { isDefault: false },
      });
    }

    const address = await (prisma as any).address.update({
      where: { id: validatedId.data },
      data: {
        fullName: validData.fullName,
        phone: validData.phone,
        addressLine1: validData.addressLine1,
        addressLine2: validData.addressLine2 || null,
        city: validData.city,
        state: validData.state || null,
        postalCode: validData.postalCode,
        country: validData.country || "Ireland",
        isDefault: validData.isDefault !== undefined ? validData.isDefault : existingAddress.isDefault,
      },
    });

    revalidatePath("/account");
    return { success: true, address };
  });
}

export async function deleteAddress(addressId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(addressId);
    if (!validatedId.success) {
      return { error: "Invalid address ID" };
    }

    // IDOR Protection: Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: validatedId.data, userId: session.user.id },
    });

    if (!existingAddress) {
      return { error: "Address not found" };
    }

    await (prisma as any).address.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/account");
    return { success: true };
  });
}

export async function setDefaultAddress(addressId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(addressId);
    if (!validatedId.success) {
      return { error: "Invalid address ID" };
    }

    // IDOR Protection: Verify address belongs to user
    const existingAddress = await (prisma as any).address.findFirst({
      where: { id: validatedId.data, userId: session.user.id },
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
      where: { id: validatedId.data },
      data: { isDefault: true },
    });

    revalidatePath("/account");
    return { success: true };
  });
}

// ============================================================================
// ACCOUNT DELETION (User-scoped)
// ============================================================================

export async function deleteMyAccount() {
  return safeAction(async () => {
    const { session } = await requireAuth();

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

    // Archive all user data to DeletedUser table
    try {
      await (prisma as any).deletedUser.create({
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
    } catch (archiveError: any) {
      console.error("Error archiving user data:", archiveError);
      
      if (archiveError?.code === 'P2001' || archiveError?.message?.includes('model') || archiveError?.message?.includes('DeletedUser') || archiveError?.message?.includes('does not exist')) {
        return { 
          error: "Database schema not updated. Please run 'npx prisma generate' and restart the server. Account was NOT deleted." 
        };
      }
      
      return { 
        error: `Failed to archive user data: ${archiveError?.message || 'Unknown error'}. Account was NOT deleted to prevent data loss.` 
      };
    }

    // Delete the user (cascade will delete related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  });
}
