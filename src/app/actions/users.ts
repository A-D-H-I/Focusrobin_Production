"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const userIdSchema = z.string().min(1).max(30);
const roleSchema = z.enum(["USER", "ADMIN"]);
const ratingSchema = z.number().int().min(1).max(5);
const amountSchema = z.number();
const positiveAmountSchema = z.number().positive();
const nonNegativeAmountSchema = z.number().nonnegative();

// ============================================================================
// USER MANAGEMENT (Admin Only)
// ============================================================================

export async function updateUserRole(userId: string, newRole: string) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    // Validate inputs
    const validatedUserId = userIdSchema.safeParse(userId);
    const validatedRole = roleSchema.safeParse(newRole);

    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }
    if (!validatedRole.success) {
      return { error: "Invalid role. Must be USER or ADMIN" };
    }

    await prisma.user.update({
      where: { id: validatedUserId.data },
      data: { role: validatedRole.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

export async function updateUserDetails(userId: string, name: string | null, email: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedUserId = userIdSchema.safeParse(userId);
    const emailSchema = z.string().email().max(255);
    const nameSchema = z.string().max(100).nullable();

    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }

    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      return { error: "Invalid email address" };
    }

    const validatedName = nameSchema.safeParse(name);
    if (!validatedName.success) {
      return { error: "Invalid name" };
    }

    await prisma.user.update({
      where: { id: validatedUserId.data },
      data: { 
        name: validatedName.data,
        email: validatedEmail.data,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

export async function deleteUser(userId: string) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    // Validate input
    const validatedUserId = userIdSchema.safeParse(userId);
    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }

    // Prevent self-deletion
    if (validatedUserId.data === session.user.id) {
      return { error: "You cannot delete your own account" };
    }

    await prisma.user.delete({
      where: { id: validatedUserId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// CART MANAGEMENT (Admin Only)
// ============================================================================

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedId = userIdSchema.safeParse(cartItemId);
    const quantitySchema = z.number().int().min(1).max(99);
    const validatedQuantity = quantitySchema.safeParse(quantity);

    if (!validatedId.success) {
      return { error: "Invalid cart item ID" };
    }
    if (!validatedQuantity.success) {
      return { error: "Quantity must be between 1 and 99" };
    }

    await prisma.cartItem.update({
      where: { id: validatedId.data },
      data: { quantity: validatedQuantity.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

export async function deleteCartItem(cartItemId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = userIdSchema.safeParse(cartItemId);
    if (!validatedId.success) {
      return { error: "Invalid cart item ID" };
    }

    await prisma.cartItem.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// WISHLIST MANAGEMENT (Admin Only)
// ============================================================================

export async function deleteWishlistItem(wishlistItemId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = userIdSchema.safeParse(wishlistItemId);
    if (!validatedId.success) {
      return { error: "Invalid wishlist item ID" };
    }

    await prisma.wishlist.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// REVIEW MANAGEMENT (Admin Only)
// ============================================================================

export async function updateReview(reviewId: string, rating: number, title: string, comment: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedId = userIdSchema.safeParse(reviewId);
    const validatedRating = ratingSchema.safeParse(rating);
    const titleSchema = z.string().trim().max(200);
    const commentSchema = z.string().trim().max(2000);

    if (!validatedId.success) {
      return { error: "Invalid review ID" };
    }
    if (!validatedRating.success) {
      return { error: "Rating must be between 1 and 5" };
    }

    const validatedTitle = titleSchema.safeParse(title);
    const validatedComment = commentSchema.safeParse(comment);

    if (!validatedTitle.success || !validatedComment.success) {
      return { error: "Invalid title or comment" };
    }

    await prisma.review.update({
      where: { id: validatedId.data },
      data: { 
        rating: validatedRating.data,
        title: validatedTitle.data,
        comment: validatedComment.data,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

export async function deleteReview(reviewId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = userIdSchema.safeParse(reviewId);
    if (!validatedId.success) {
      return { error: "Invalid review ID" };
    }

    await prisma.review.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// SESSION MANAGEMENT (Admin Only)
// ============================================================================

export async function deleteSession(sessionId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = userIdSchema.safeParse(sessionId);
    if (!validatedId.success) {
      return { error: "Invalid session ID" };
    }

    await prisma.session.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// ACCOUNT MANAGEMENT (Admin Only)
// ============================================================================

export async function deleteAccount(accountId: string) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    const validatedId = userIdSchema.safeParse(accountId);
    if (!validatedId.success) {
      return { error: "Invalid account ID" };
    }

    // Get the account to check if it belongs to the current admin
    const account = await prisma.account.findUnique({
      where: { id: validatedId.data },
      select: { userId: true },
    });

    if (!account) {
      return { error: "Account not found" };
    }

    // Prevent self-deletion of OAuth account
    if (account.userId === session.user.id) {
      return { error: "You cannot delete your own OAuth account" };
    }

    await prisma.account.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    return { success: true };
  });
}

// ============================================================================
// WALLET MANAGEMENT (Admin Only)
// ============================================================================

export async function updateWalletBalance(userId: string, amount: number, description: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedUserId = userIdSchema.safeParse(userId);
    const validatedAmount = amountSchema.safeParse(amount);
    const descriptionSchema = z.string().trim().max(500);
    const validatedDescription = descriptionSchema.safeParse(description);

    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }
    if (!validatedAmount.success) {
      return { error: "Invalid amount" };
    }
    if (amount === 0) {
      return { error: "Amount cannot be zero" };
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: validatedUserId.data },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: validatedUserId.data, balance: 0 },
      });
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      return { error: "Insufficient wallet balance" };
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: Math.abs(amount),
        type: amount > 0 ? 'CREDIT' : 'DEBIT',
        description: validatedDescription.success ? validatedDescription.data : (amount > 0 ? 'Admin credit' : 'Admin deduction'),
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/account");
    return { success: true, newBalance };
  });
}

export async function getWalletDetails(userId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedUserId = userIdSchema.safeParse(userId);
    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: validatedUserId.data },
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
  });
}

export async function revokeWalletTransaction(transactionId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = userIdSchema.safeParse(transactionId);
    if (!validatedId.success) {
      return { error: "Invalid transaction ID" };
    }

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id: validatedId.data },
      include: { Wallet: true },
    });

    if (!transaction) {
      return { error: "Transaction not found" };
    }

    const wallet = transaction.Wallet;
    const currentBalance = Number(wallet.balance);
    const transactionAmount = Number(transaction.amount);
    
    const adjustment = transaction.type === 'CREDIT' ? -transactionAmount : transactionAmount;
    const newBalance = currentBalance + adjustment;

    if (newBalance < 0) {
      return { error: "Cannot revoke transaction: would result in negative balance" };
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    await prisma.walletTransaction.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/users");
    revalidatePath("/account");
    return { success: true, newBalance };
  });
}

export async function updateWalletTransaction(
  transactionId: string,
  amount: number,
  type: 'CREDIT' | 'DEBIT',
  description: string
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedId = userIdSchema.safeParse(transactionId);
    const validatedAmount = positiveAmountSchema.safeParse(amount);
    const typeSchema = z.enum(['CREDIT', 'DEBIT']);
    const validatedType = typeSchema.safeParse(type);
    const descriptionSchema = z.string().trim().max(500);
    const validatedDescription = descriptionSchema.safeParse(description);

    if (!validatedId.success) {
      return { error: "Invalid transaction ID" };
    }
    if (!validatedAmount.success) {
      return { error: "Amount must be positive" };
    }
    if (!validatedType.success) {
      return { error: "Invalid transaction type" };
    }

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id: validatedId.data },
      include: { Wallet: true },
    });

    if (!transaction) {
      return { error: "Transaction not found" };
    }

    const wallet = transaction.Wallet;
    const currentBalance = Number(wallet.balance);
    const oldAmount = Number(transaction.amount);
    const oldType = transaction.type;
    
    const oldAdjustment = oldType === 'CREDIT' ? -oldAmount : oldAmount;
    const newAdjustment = validatedType.data === 'CREDIT' ? validatedAmount.data : -validatedAmount.data;
    const totalAdjustment = oldAdjustment + newAdjustment;
    const newBalance = currentBalance + totalAdjustment;

    if (newBalance < 0) {
      return { error: "Cannot update transaction: would result in negative balance" };
    }

    await prisma.walletTransaction.update({
      where: { id: validatedId.data },
      data: {
        amount: validatedAmount.data,
        type: validatedType.data,
        description: validatedDescription.success ? validatedDescription.data : transaction.description,
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    revalidatePath("/admin/users");
    revalidatePath("/account");
    return { success: true, newBalance };
  });
}

export async function setWalletBalance(userId: string, newBalance: number, description: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate inputs
    const validatedUserId = userIdSchema.safeParse(userId);
    const validatedBalance = nonNegativeAmountSchema.safeParse(newBalance);
    const descriptionSchema = z.string().trim().max(500);
    const validatedDescription = descriptionSchema.safeParse(description);

    if (!validatedUserId.success) {
      return { error: "Invalid user ID" };
    }
    if (!validatedBalance.success) {
      return { error: "Balance cannot be negative" };
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: validatedUserId.data },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: validatedUserId.data, balance: validatedBalance.data },
      });
    } else {
      const currentBalance = Number(wallet.balance);
      const difference = validatedBalance.data - currentBalance;

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: validatedBalance.data },
      });

      if (difference !== 0) {
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: Math.abs(difference),
            type: difference > 0 ? 'CREDIT' : 'DEBIT',
            description: validatedDescription.success 
              ? validatedDescription.data 
              : `Admin balance adjustment to €${validatedBalance.data.toFixed(2)}`,
          },
        });
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/account");
    return { success: true, newBalance: validatedBalance.data };
  });
}

// ============================================================================
// SETTINGS MANAGEMENT (Admin Only)
// ============================================================================

export async function getWelcomeBonusAmount() {
  return safeAction(async () => {
    await requireAdmin();

    const setting = await (prisma as any).settings.findUnique({
      where: { key: 'welcome_bonus_amount' },
    });

    return { 
      amount: setting ? parseFloat(setting.value) : 10.00,
    };
  });
}

export async function updateWelcomeBonusAmount(amount: number) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedAmount = nonNegativeAmountSchema.safeParse(amount);
    if (!validatedAmount.success) {
      return { error: "Amount cannot be negative" };
    }

    await (prisma as any).settings.upsert({
      where: { key: 'welcome_bonus_amount' },
      update: { value: validatedAmount.data.toString() },
      create: { key: 'welcome_bonus_amount', value: validatedAmount.data.toString() },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { success: true };
  });
}

// ============================================================================
// DELETED USERS MANAGEMENT (Admin Only)
// ============================================================================

export async function getDeletedUsers() {
  return safeAction(async () => {
    await requireAdmin();

    try {
      const deletedUsers = await (prisma as any).deletedUser.findMany({
        orderBy: {
          deletedAt: 'desc',
        },
      });

      return { deletedUsers };
    } catch (error: any) {
      if (error?.message?.includes('model') || error?.message?.includes('DeletedUser') || error?.message?.includes('does not exist')) {
        return { 
          error: "Database schema not updated. Please run 'npx prisma generate' and restart the server.",
          deletedUsers: [] 
        };
      }
      throw error;
    }
  });
}

export async function permanentlyDeleteUser(deletedUserId: string) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    const validatedId = userIdSchema.safeParse(deletedUserId);
    if (!validatedId.success) {
      return { error: "Invalid deleted user ID" };
    }

    // Get the deleted user to check if it's the current admin's archived account
    const deletedUser = await (prisma as any).deletedUser.findUnique({
      where: { id: validatedId.data },
      select: { originalUserId: true },
    });

    if (!deletedUser) {
      return { error: "Deleted user not found" };
    }

    // Prevent self-deletion of archived account
    if (deletedUser.originalUserId === session.user.id) {
      return { error: "You cannot permanently delete your own archived account" };
    }

    await (prisma as any).deletedUser.delete({
      where: { id: validatedId.data },
    });

    revalidatePath("/admin/deleted-users");
    return { success: true };
  });
}
