"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update user roles" };
  }

  if (newRole !== "USER" && newRole !== "ADMIN") {
    return { error: "Invalid role. Must be USER or ADMIN" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }
}

export async function updateUserDetails(userId: string, name: string | null, email: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update user details" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name || null,
        email: email,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user details:", error);
    return { error: "Failed to update user details" };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete users" };
  }

  // Prevent deleting yourself
  if (userId === session.user.id) {
    return { error: "You cannot delete your own account" };
  }

  try {
    // Prisma will cascade delete cart, wishlist, reviews, etc.
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user" };
  }
}

// Cart Management Actions
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update cart items" };
  }

  if (quantity <= 0) {
    return { error: "Quantity must be greater than 0" };
  }

  try {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { error: "Failed to update cart item" };
  }
}

export async function deleteCartItem(cartItemId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete cart items" };
  }

  try {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return { error: "Failed to delete cart item" };
  }
}

// Wishlist Management Actions
export async function deleteWishlistItem(wishlistItemId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete wishlist items" };
  }

  try {
    await prisma.wishlist.delete({
      where: { id: wishlistItemId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    return { error: "Failed to delete wishlist item" };
  }
}

// Review Management Actions
export async function updateReview(reviewId: string, rating: number, title: string, comment: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update reviews" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: { 
        rating,
        title,
        comment,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating review:", error);
    return { error: "Failed to update review" };
  }
}

export async function deleteReview(reviewId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete reviews" };
  }

  try {
    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { error: "Failed to delete review" };
  }
}

// Session Management Actions
export async function deleteSession(sessionId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete sessions" };
  }

  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { error: "Failed to delete session" };
  }
}

// Account Management Actions
export async function deleteAccount(accountId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete accounts" };
  }

  try {
    await prisma.account.delete({
      where: { id: accountId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }
}

// Wallet Management Actions (Admin Only)
export async function updateWalletBalance(userId: string, amount: number, description: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update wallet balances" };
  }

  if (amount === 0) {
    return { error: "Amount cannot be zero" };
  }

  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    // Calculate new balance
    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      return { error: "Insufficient wallet balance" };
    }

    // Update wallet balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: Math.abs(amount),
        type: amount > 0 ? 'CREDIT' : 'DEBIT',
        description: description || (amount > 0 ? 'Admin credit' : 'Admin deduction'),
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/account");
    return { success: true, newBalance };
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    return { error: "Failed to update wallet balance" };
  }
}

export async function getWalletDetails(userId: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can view wallet details" };
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!wallet) {
      return { balance: 0, transactions: [] };
    }

    return {
      balance: Number(wallet.balance),
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    return { error: "Failed to fetch wallet details" };
  }
}

// Settings Management Actions (Admin Only)
export async function getWelcomeBonusAmount() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can view settings" };
  }

  try {
    const setting = await (prisma as any).settings.findUnique({
      where: { key: 'welcome_bonus_amount' },
    });

    return { 
      amount: setting ? parseFloat(setting.value) : 10.00, // Default to €10
    };
  } catch (error) {
    console.error("Error fetching welcome bonus amount:", error);
    return { error: "Failed to fetch welcome bonus amount" };
  }
}

export async function updateWelcomeBonusAmount(amount: number) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update settings" };
  }

  if (amount < 0) {
    return { error: "Welcome bonus amount cannot be negative" };
  }

  if (isNaN(amount)) {
    return { error: "Invalid amount" };
  }

  try {
    await (prisma as any).settings.upsert({
      where: { key: 'welcome_bonus_amount' },
      update: { value: amount.toString() },
      create: { key: 'welcome_bonus_amount', value: amount.toString() },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating welcome bonus amount:", error);
    return { error: `Failed to update welcome bonus amount: ${error?.message || 'Unknown error'}` };
  }
}

// Deleted Users Management Actions (Admin Only)
export async function getDeletedUsers() {
  const session = await auth();
  
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const deletedUsers = await (prisma as any).deletedUser.findMany({
      orderBy: {
        deletedAt: 'desc',
      },
    });

    console.log(`✅ Found ${deletedUsers.length} deleted users`);
    return { deletedUsers };
  } catch (error: any) {
    console.error("❌ Error fetching deleted users:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });
    
    // If the model doesn't exist, provide helpful error message
    if (error?.message?.includes('model') || error?.message?.includes('DeletedUser') || error?.message?.includes('does not exist')) {
      return { 
        error: "Database schema not updated. Please run 'npx prisma generate' and restart the server.",
        deletedUsers: [] 
      };
    }
    
    return { 
      error: `Failed to fetch deleted users: ${error?.message || 'Unknown error'}`,
      deletedUsers: [] 
    };
  }
}

export async function permanentlyDeleteUser(deletedUserId: string) {
  const session = await auth();
  
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await (prisma as any).deletedUser.delete({
      where: { id: deletedUserId },
    });

    revalidatePath("/admin/deleted-users");
    return { success: true };
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    return { error: "Failed to permanently delete user" };
  }
}
