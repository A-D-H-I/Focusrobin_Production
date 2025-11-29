"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  detectLanguage,
  translateToEnglish,
  translateToUserLanguage,
} from "@/lib/translate";
import { revalidatePath } from "next/cache";

/**
 * Check if user is blocked
 */
async function isUserBlocked(userId?: string, userEmail?: string): Promise<{ blocked: boolean; blockedUntil?: Date; reason?: string }> {
  try {
    const now = new Date();
    
    // Check by userId
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

    // Check by email
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
 * Send a message from user (can be authenticated or anonymous)
 */
export async function sendUserMessage(
  message: string,
  userEmail?: string,
  userName?: string,
  userId?: string,
  chatId?: string
) {
  try {
    // Check if user is blocked
    const blockCheck = await isUserBlocked(userId, userEmail);
    if (blockCheck.blocked) {
      const untilDate = blockCheck.blockedUntil 
        ? new Date(blockCheck.blockedUntil).toLocaleString()
        : "indefinitely";
      return {
        error: `You are temporarily blocked from sending messages. ${blockCheck.reason ? `Reason: ${blockCheck.reason}. ` : ""}Block expires: ${untilDate}`,
      };
    }

    // If chatId exists, check if it's force closed
    if (chatId) {
      const existingChat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (existingChat?.forceClosed) {
        return {
          error: "This chat has been permanently closed. Please start a new conversation if your issue is not resolved.",
        };
      }
    }

    // Detect the language of the user's message
    const detectedLanguage = await detectLanguage(message);

    // Translate to English for admin
    const translatedToEnglish = await translateToEnglish(
      message,
      detectedLanguage
    );

    let chat;

    if (chatId) {
      // Check if chat is force closed
      const existingChat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (existingChat?.forceClosed) {
        return {
          error: "This chat has been permanently closed. Please start a new conversation if your issue is not resolved.",
        };
      }

      // Update existing chat (reopen if closed but not force closed)
      chat = await prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: new Date(),
          status: existingChat?.status === "CLOSED" ? "OPEN" : existingChat?.status || "OPEN",
        },
      });
    } else {
      // Create new chat
      const session = await auth();
      const finalUserId = userId || (session?.user as any)?.id;
      const finalUserEmail =
        userEmail || session?.user?.email || "anonymous@example.com";
      const finalUserName = userName || session?.user?.name || "Anonymous User";

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
        originalText: message,
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
  } catch (error) {
    console.error("Error sending user message:", error);
    return {
      error: "Failed to send message. Please try again.",
    };
  }
}

/**
 * Get all chats for the current user
 */
export async function getUserChats() {
  try {
    const session = await auth();
    
    // For logged-in users, get chats by userId
    // For anonymous users, we'll need to use email or other identifier
    if (session?.user) {
      const userId = (session.user as any)?.id;
      const userEmail = session.user.email;

      if (userId) {
        // Get chats by userId
        const chats = await prisma.chat.findMany({
          where: {
            userId: userId,
          },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1, // Get last message for preview
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

    // For anonymous users, try to get chats by email if provided
    // This would require passing email as parameter
    return {
      success: true,
      chats: [],
    };
  } catch (error) {
    console.error("Error getting user chats:", error);
    return {
      error: "Failed to load chats. Please try again.",
    };
  }
}

/**
 * Get user chats by email (for anonymous users)
 */
export async function getUserChatsByEmail(email: string) {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        userEmail: email,
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
  } catch (error) {
    console.error("Error getting user chats by email:", error);
    return {
      error: "Failed to load chats. Please try again.",
    };
  }
}

/**
 * Get messages for a chat (user view)
 */
export async function getUserChatMessages(chatId: string) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    // For user view, show original text for user messages and translated text for admin messages
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
  } catch (error) {
    console.error("Error getting user chat messages:", error);
    return {
      error: "Failed to load messages. Please try again.",
    };
  }
}

/**
 * Get all chats for admin
 */
export async function getAdminChats() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can view chats" };
    }

    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get last message for preview
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
              text: chat.messages[0].translatedText, // Show English translation for admin
              sender: chat.messages[0].sender,
              timestamp: chat.messages[0].createdAt,
            }
          : null,
      })),
    };
  } catch (error) {
    console.error("Error getting admin chats:", error);
    return {
      error: "Failed to load chats. Please try again.",
    };
  }
}

/**
 * Get messages for a specific chat (admin view)
 */
export async function getAdminChatMessages(chatId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can view chat messages" };
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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

    // For admin view, show translated text (English) for all messages
    const messages = chat.messages.map((msg) => ({
      id: msg.id,
      text: msg.translatedText, // Always show English translation
      originalText: msg.originalText, // Also include original for reference
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
  } catch (error) {
    console.error("Error getting admin chat messages:", error);
    return {
      error: "Failed to load messages. Please try again.",
    };
  }
}

/**
 * Admin sends a reply to a chat
 */
export async function sendAdminReply(chatId: string, message: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can send replies" };
    }

    // Get chat to find user's language
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    if (chat.forceClosed) {
      return { error: "Cannot send reply to a force-closed chat" };
    }

    // Admin message is in English, translate to user's language
    const translatedToUserLanguage = await translateToUserLanguage(
      message,
      chat.userLanguage
    );

    // Create message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        sender: "ADMIN",
        originalText: message, // Admin's English message
        translatedText: translatedToUserLanguage, // Translated to user's language
        language: "en", // Admin always writes in English
      },
    });

    // Update chat
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${chatId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error sending admin reply:", error);
    return {
      error: "Failed to send reply. Please try again.",
    };
  }
}

/**
 * Update chat status (e.g., close chat)
 */
export async function updateChatStatus(chatId: string, status: "OPEN" | "CLOSED" | "PENDING" | "FORCE_CLOSED") {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update chat status" };
    }

    const adminId = (session.user as any)?.id;

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        status,
        forceClosed: status === "FORCE_CLOSED",
        forceClosedAt: status === "FORCE_CLOSED" ? new Date() : null,
        forceClosedBy: status === "FORCE_CLOSED" ? adminId : null,
      },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${chatId}`);
    revalidatePath("/chat");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating chat status:", error);
    return {
      error: "Failed to update chat status. Please try again.",
    };
  }
}

/**
 * Block a user from sending messages for a certain period
 */
export async function blockUser(
  userId?: string,
  userEmail?: string,
  blockDurationHours: number = 24,
  reason?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can block users" };
    }

    if (!userId && !userEmail) {
      return { error: "Either userId or userEmail must be provided" };
    }

    const adminId = (session.user as any)?.id;
    
    // Validate adminId exists
    if (!adminId) {
      return { error: "Admin ID not found" };
    }

    const blockedUntil = new Date();
    blockedUntil.setHours(blockedUntil.getHours() + blockDurationHours);

    // Build where clause for finding existing blocks
    const whereClause: any = {
      blockedUntil: { gt: new Date() },
    };

    if (userId) {
      whereClause.userId = userId;
    } else if (userEmail) {
      whereClause.userEmail = userEmail;
    }

    // Check if user is already blocked
    const existingBlock = await prisma.userBlock.findFirst({
      where: whereClause,
      orderBy: {
        blockedUntil: "desc",
      },
    });

    if (existingBlock) {
      // Update existing block
      await prisma.userBlock.update({
        where: { id: existingBlock.id },
        data: {
          blockedUntil,
          reason: reason || existingBlock.reason,
          blockedBy: adminId,
        },
      });
    } else {
      // Create new block
      const blockData: any = {
        blockedUntil,
        reason: reason || null,
        blockedBy: adminId,
      };

      if (userId) {
        blockData.userId = userId;
      }
      if (userEmail) {
        blockData.userEmail = userEmail;
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
  } catch (error: any) {
    console.error("Error blocking user:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });
    const errorMessage = error?.message || "Failed to block user. Please try again.";
    return {
      error: errorMessage,
    };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId?: string, userEmail?: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can unblock users" };
    }

    const now = new Date();

    if (userId) {
      await prisma.userBlock.updateMany({
        where: {
          userId: userId,
          blockedUntil: { gt: now },
        },
        data: {
          blockedUntil: now, // Set to now to expire immediately
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
  } catch (error) {
    console.error("Error unblocking user:", error);
    return {
      error: "Failed to unblock user. Please try again.",
    };
  }
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

