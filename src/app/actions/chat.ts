"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  detectLanguage,
  translateToEnglish,
  translateToUserLanguage,
} from "@/lib/translate";
import { revalidatePath } from "next/cache";
import { requireAdmin, safeAction, optionalAuth } from "@/lib/security";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { sendMessageSchema, adminReplySchema, blockUserSchema, updateChatStatusSchema } from "@/lib/validations";
import { z } from "zod";

/**
 * Check if user is blocked
 */
async function isUserBlocked(userId?: string, userEmail?: string): Promise<{ blocked: boolean; blockedUntil?: Date; reason?: string }> {
  try {
    const now = new Date();
    
    if (userId) {
      const block = await prisma.userBlock.findFirst({
        where: {
          userId: userId,
          blockedUntil: {
            gt: now,
          },
        },
        orderBy: {
          blockedUntil: "desc",
        },
      });

      if (block) {
        return {
          blocked: true,
          blockedUntil: block.blockedUntil,
          reason: block.reason || undefined,
        };
      }
    }

    if (userEmail) {
      const block = await prisma.userBlock.findFirst({
        where: {
          userEmail: userEmail,
          blockedUntil: {
            gt: now,
          },
        },
        orderBy: {
          blockedUntil: "desc",
        },
      });

      if (block) {
        return {
          blocked: true,
          blockedUntil: block.blockedUntil,
          reason: block.reason || undefined,
        };
      }
    }

    return { blocked: false };
  } catch (error) {
    console.error("Error checking user block:", error);
    return { blocked: false };
  }
}

/**
 * Send a message from user (rate limited)
 */
export async function sendUserMessage(
  message: string,
  userEmail?: string,
  userName?: string,
  userId?: string,
  chatId?: string
) {
  return safeAction(async () => {
    // Validate input
    const validatedInput = sendMessageSchema.safeParse({ message, userEmail, userName, userId, chatId });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const { message: msg, userEmail: email, userName: name, userId: uid, chatId: cid } = validatedInput.data;

    // Rate limit chat messages
    const identifier = uid || email || "anonymous";
    const rateLimitResult = rateLimit(
      getIdentifier(null, identifier, "chat"),
      "CHAT_MESSAGE"
    );
    if (!rateLimitResult.success) {
      return { error: `Too many messages. Please wait ${rateLimitResult.retryAfter} seconds.` };
    }

    // Check if user is blocked
    const blockCheck = await isUserBlocked(uid, email);
    if (blockCheck.blocked) {
      const untilDate = blockCheck.blockedUntil 
        ? new Date(blockCheck.blockedUntil).toLocaleString()
        : "indefinitely";
      return {
        error: `You are temporarily blocked from sending messages. ${blockCheck.reason ? `Reason: ${blockCheck.reason}. ` : ""}Block expires: ${untilDate}`,
      };
    }

    // If chatId exists, check if it's force closed
    if (cid) {
      const existingChat = await prisma.chat.findUnique({
        where: { id: cid },
      });

      if (existingChat?.forceClosed) {
        return {
          error: "This chat has been permanently closed. Please start a new conversation if your issue is not resolved.",
        };
      }
    }

    // Detect the language of the user's message
    const detectedLanguage = await detectLanguage(msg);

    // Translate to English for admin
    const translatedToEnglish = await translateToEnglish(msg, detectedLanguage);

    let chat;

    if (cid) {
      const existingChat = await prisma.chat.findUnique({
        where: { id: cid },
      });

      if (existingChat?.forceClosed) {
        return {
          error: "This chat has been permanently closed. Please start a new conversation if your issue is not resolved.",
        };
      }

      chat = await prisma.chat.update({
        where: { id: cid },
        data: {
          lastMessageAt: new Date(),
          status: existingChat?.status === "CLOSED" ? "OPEN" : existingChat?.status || "OPEN",
        },
      });
    } else {
      const session = await auth();
      const finalUserId = uid || (session?.user as any)?.id;
      const finalUserEmail = email || session?.user?.email || "anonymous@example.com";
      const finalUserName = name || session?.user?.name || "Anonymous User";

      chat = await prisma.chat.create({
        data: {
          userId: finalUserId,
          userEmail: finalUserEmail,
          userName: finalUserName,
          userLanguage: detectedLanguage,
          status: "OPEN",
        },
      });
    }

    // Create message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        sender: "USER",
        originalText: msg,
        translatedText: translatedToEnglish,
        language: detectedLanguage,
      },
    });

    revalidatePath("/contact");
    revalidatePath("/chat");
    revalidatePath("/admin/chats");

    return {
      success: true,
      chatId: chat.id,
    };
  });
}

/**
 * Get all chats for the current user
 */
export async function getUserChats() {
  return safeAction(async () => {
    const authResult = await optionalAuth();
    
    if (authResult?.session?.user) {
      const userId = authResult.session.user.id;
      const userEmail = authResult.session.user.email;

      if (userId) {
        const chats = await prisma.chat.findMany({
          where: {
            userId: userId,
          },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: {
            lastMessageAt: "desc",
          },
        });

        return {
          success: true,
          chats: chats.map((chat) => ({
            id: chat.id,
            status: chat.status,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt,
            lastMessage: chat.messages[0]
              ? {
                  text: chat.messages[0].originalText,
                  sender: chat.messages[0].sender.toLowerCase() as "user" | "admin",
                  timestamp: chat.messages[0].createdAt,
                }
              : null,
          })),
        };
      }
    }

    return {
      success: true,
      chats: [],
    };
  });
}

/**
 * Get user chats by email (for anonymous users)
 */
export async function getUserChatsByEmail(email: string) {
  return safeAction(async () => {
    // Validate email
    const schema = z.string().email().max(255);
    const validatedEmail = schema.safeParse(email);
    if (!validatedEmail.success) {
      return { error: "Invalid email" };
    }

    const chats = await prisma.chat.findMany({
      where: {
        userEmail: validatedEmail.data,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return {
      success: true,
      chats: chats.map((chat) => ({
        id: chat.id,
        status: chat.status,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
        lastMessage: chat.messages[0]
          ? {
              text: chat.messages[0].originalText,
              sender: chat.messages[0].sender.toLowerCase() as "user" | "admin",
              timestamp: chat.messages[0].createdAt,
            }
          : null,
      })),
    };
  });
}

/**
 * Get messages for a chat (user view)
 */
export async function getUserChatMessages(chatId: string) {
  return safeAction(async () => {
    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(chatId);
    if (!validatedId.success) {
      return { error: "Invalid chat ID" };
    }

    const chat = await prisma.chat.findUnique({
      where: { id: validatedId.data },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    const messages = await Promise.all(
      chat.messages.map(async (msg) => ({
        id: msg.id,
        text:
          msg.sender === "USER"
            ? msg.originalText
            : await translateToUserLanguage(
                msg.translatedText,
                chat.userLanguage
              ),
        sender: msg.sender.toLowerCase() as "user" | "admin",
        timestamp: msg.createdAt,
      }))
    );

    return {
      success: true,
      messages,
      userLanguage: chat.userLanguage,
      status: chat.status,
      forceClosed: chat.forceClosed,
    };
  });
}

/**
 * Get all chats for admin (Admin only)
 */
export async function getAdminChats() {
  return safeAction(async () => {
    await requireAdmin();

    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return {
      success: true,
      chats: chats.map((chat) => ({
        id: chat.id,
        userEmail: chat.userEmail,
        userName: chat.userName || chat.User?.name || "Anonymous",
        status: chat.status,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
        lastMessage: chat.messages[0]
          ? {
              text: chat.messages[0].translatedText,
              sender: chat.messages[0].sender,
              timestamp: chat.messages[0].createdAt,
            }
          : null,
      })),
    };
  });
}

/**
 * Get messages for a specific chat (Admin only)
 */
export async function getAdminChatMessages(chatId: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(chatId);
    if (!validatedId.success) {
      return { error: "Invalid chat ID" };
    }

    const chat = await prisma.chat.findUnique({
      where: { id: validatedId.data },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    const messages = chat.messages.map((msg) => ({
      id: msg.id,
      text: msg.translatedText,
      originalText: msg.originalText,
      sender: msg.sender.toLowerCase() as "user" | "admin",
      timestamp: msg.createdAt,
      language: msg.language,
    }));

    return {
      success: true,
      messages,
      chat: {
        id: chat.id,
        userEmail: chat.userEmail,
        userName: chat.userName || chat.User?.name || "Anonymous",
        userLanguage: chat.userLanguage,
        status: chat.status,
        forceClosed: chat.forceClosed,
        forceClosedAt: chat.forceClosedAt,
      },
    };
  });
}

/**
 * Admin sends a reply to a chat (Admin only)
 */
export async function sendAdminReply(chatId: string, message: string) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    // Validate input
    const validatedInput = adminReplySchema.safeParse({ chatId, message });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const chat = await prisma.chat.findUnique({
      where: { id: validatedInput.data.chatId },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    if (chat.forceClosed) {
      return { error: "Cannot send reply to a force-closed chat" };
    }

    const translatedToUserLanguage = await translateToUserLanguage(
      validatedInput.data.message,
      chat.userLanguage
    );

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        sender: "ADMIN",
        originalText: validatedInput.data.message,
        translatedText: translatedToUserLanguage,
        language: "en",
      },
    });

    await prisma.chat.update({
      where: { id: validatedInput.data.chatId },
      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${validatedInput.data.chatId}`);

    return {
      success: true,
    };
  });
}

/**
 * Update chat status (Admin only)
 */
export async function updateChatStatus(chatId: string, status: "OPEN" | "CLOSED" | "PENDING" | "FORCE_CLOSED") {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    // Validate input
    const validatedInput = updateChatStatusSchema.safeParse({ chatId, status });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const adminId = session.user.id;

    await prisma.chat.update({
      where: { id: validatedInput.data.chatId },
      data: {
        status: validatedInput.data.status,
        forceClosed: validatedInput.data.status === "FORCE_CLOSED",
        forceClosedAt: validatedInput.data.status === "FORCE_CLOSED" ? new Date() : null,
        forceClosedBy: validatedInput.data.status === "FORCE_CLOSED" ? adminId : null,
      },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${validatedInput.data.chatId}`);
    revalidatePath("/chat");

    return {
      success: true,
    };
  });
}

/**
 * Block a user from sending messages (Admin only)
 */
export async function blockUser(
  userId?: string,
  userEmail?: string,
  blockDurationHours: number = 24,
  reason?: string
) {
  return safeAction(async () => {
    const { session } = await requireAdmin();

    // Validate input
    const validatedInput = blockUserSchema.safeParse({ userId, userEmail, blockDurationHours, reason });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const adminId = session.user.id;
    const blockedUntil = new Date();
    blockedUntil.setHours(blockedUntil.getHours() + validatedInput.data.blockDurationHours);

    const whereClause: any = {
      blockedUntil: { gt: new Date() },
    };

    if (validatedInput.data.userId) {
      whereClause.userId = validatedInput.data.userId;
    } else if (validatedInput.data.userEmail) {
      whereClause.userEmail = validatedInput.data.userEmail;
    }

    const existingBlock = await prisma.userBlock.findFirst({
      where: whereClause,
      orderBy: {
        blockedUntil: "desc",
      },
    });

    if (existingBlock) {
      await prisma.userBlock.update({
        where: { id: existingBlock.id },
        data: {
          blockedUntil,
          reason: validatedInput.data.reason || existingBlock.reason,
          blockedBy: adminId,
        },
      });
    } else {
      const blockData: any = {
        blockedUntil,
        reason: validatedInput.data.reason || null,
        blockedBy: adminId,
      };

      if (validatedInput.data.userId) {
        blockData.userId = validatedInput.data.userId;
      }
      if (validatedInput.data.userEmail) {
        blockData.userEmail = validatedInput.data.userEmail;
      }

      await prisma.userBlock.create({
        data: blockData,
      });
    }

    revalidatePath("/admin/chats");
    revalidatePath("/chat");

    return {
      success: true,
      blockedUntil,
    };
  });
}

/**
 * Unblock a user (Admin only)
 */
export async function unblockUser(userId?: string, userEmail?: string) {
  return safeAction(async () => {
    await requireAdmin();

    if (!userId && !userEmail) {
      return { error: "Either userId or userEmail must be provided" };
    }

    const now = new Date();

    if (userId) {
      await prisma.userBlock.updateMany({
        where: {
          userId: userId,
          blockedUntil: { gt: now },
        },
        data: {
          blockedUntil: now,
        },
      });
    }

    if (userEmail) {
      await prisma.userBlock.updateMany({
        where: {
          userEmail: userEmail,
          blockedUntil: { gt: now },
        },
        data: {
          blockedUntil: now,
        },
      });
    }

    revalidatePath("/admin/chats");

    return {
      success: true,
    };
  });
}

/**
 * Check if user is currently blocked
 */
export async function checkUserBlockStatus(userId?: string, userEmail?: string) {
  try {
    const blockCheck = await isUserBlocked(userId, userEmail);
    return {
      success: true,
      ...blockCheck,
    };
  } catch (error) {
    console.error("Error checking user block status:", error);
    return {
      success: true,
      blocked: false,
    };
  }
}
