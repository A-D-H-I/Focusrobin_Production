import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { z } from "zod";
import { rateLimit, getIdentifier, rateLimitHeaders } from "@/lib/rate-limit";

// Using Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

// Security headers for API responses
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting (fallback to anonymous)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "anonymous";

    // Check authentication
    const session = await auth();
    const userId = (session?.user as any)?.id;

    // Rate limit chat messages
    const identifier = getIdentifier(ip, userId, "chat-api");
    const rateLimitResult = rateLimit(identifier, "CHAT_MESSAGE");
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: `Too many messages. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...SECURITY_HEADERS,
            ...rateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    // Get Google AI API key from environment
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
    
    // Check for Google AI API key
    if (!apiKey || apiKey.length < 10) {
      console.error("[Chat API] Missing API key. Check .env.local file and restart server.");
      return new Response(
        JSON.stringify({
          error: "AI chatbot is not configured. GOOGLE_GENERATIVE_AI_API_KEY is missing. Please add it to your .env.local file and restart the development server.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }

    // Validate request body
    let messages;
    try {
      const body = await req.json();
      if (!body.messages || !Array.isArray(body.messages)) {
        throw new Error("Invalid request body");
      }
      messages = body.messages;
      
      // Limit message history to prevent abuse
      if (messages.length > 50) {
        messages = messages.slice(-50);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }

    // System prompt
    const systemPrompt = `You are Robin, the helpful support assistant for Focus Robin Eyewear. You are polite, concise, and helpful. Always check order status using tools before asking the user for details. If they ask for a refund, check eligibility first.`;

    // Convert UIMessages to ModelMessages
    const modelMessages = convertToModelMessages(messages);

    // Create Google provider with API key
    const googleProvider = createGoogleGenerativeAI({ apiKey });

    // Stream the response
    const result = streamText({
      model: googleProvider("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        lookupOrders: {
          description: "Fetch the last 5 orders for the logged-in user",
          inputSchema: z.object({}),
          execute: async () => {
            if (!userId) {
              return { error: "Please log in to view your orders" };
            }

            // IDOR Protection: Only fetch orders for authenticated user
            const orders = await prisma.order.findMany({
              where: { userId },
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                items: { take: 3 },
              },
            });

            return {
              orders: orders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                total: Number(order.total).toString(),
                currency: order.currency,
                createdAt: order.createdAt.toISOString(),
                items: order.items.map((item) => ({
                  productName: item.productName,
                  variantName: item.variantName,
                  quantity: item.quantity,
                  price: Number(item.price).toString(),
                })),
              })),
            };
          },
        },

        checkOrderStatus: {
          description: "Check the status and tracking information for a specific order",
          inputSchema: z.object({
            orderId: z.string().max(100).describe("The order ID or order number"),
          }),
          execute: async ({ orderId }: { orderId: string }) => {
            if (!userId) {
              return { error: "Please log in to check order status" };
            }

            // Sanitize input
            const sanitizedOrderId = orderId.trim().slice(0, 100);

            // IDOR Protection: Only fetch orders for authenticated user
            const order = await prisma.order.findFirst({
              where: {
                OR: [{ orderNumber: sanitizedOrderId }, { id: sanitizedOrderId }],
                userId, // IDOR protected
              },
              include: { items: true },
            });

            if (!order) {
              return { error: "Order not found or you don't have permission to view it" };
            }

            return {
              orderNumber: order.orderNumber,
              status: order.status,
              paymentStatus: order.paymentStatus,
              total: Number(order.total).toString(),
              currency: order.currency,
              trackingNumber: order.trackingNumber || "Not yet assigned",
              trackingMessage: order.trackingMessage || null,
              shippingProvider: order.shippingProvider,
              createdAt: order.createdAt.toISOString(),
              shippedAt: order.shippedAt?.toISOString() || null,
              deliveredAt: order.deliveredAt?.toISOString() || null,
              items: order.items.map((item) => ({
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.quantity,
              })),
            };
          },
        },

        checkRefundEligibility: {
          description: "Check if an order is eligible for a refund (must be DELIVERED and less than 14 days old)",
          inputSchema: z.object({
            orderId: z.string().max(100).describe("The order ID or order number"),
          }),
          execute: async ({ orderId }: { orderId: string }) => {
            if (!userId) {
              return { error: "Please log in to check refund eligibility" };
            }

            // Sanitize input
            const sanitizedOrderId = orderId.trim().slice(0, 100);

            // IDOR Protection: Only fetch orders for authenticated user
            const order = await prisma.order.findFirst({
              where: {
                OR: [{ orderNumber: sanitizedOrderId }, { id: sanitizedOrderId }],
                userId, // IDOR protected
              },
            });

            if (!order) {
              return { error: "Order not found or you don't have permission to view it" };
            }

            const now = new Date();
            const orderDate = order.deliveredAt
              ? new Date(order.deliveredAt)
              : new Date(order.createdAt);
            const daysSinceOrder = Math.floor(
              (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isDelivered = order.status === "DELIVERED";
            const isWithin14Days = daysSinceOrder < 14;
            const isEligible = isDelivered && isWithin14Days;

            return {
              orderNumber: order.orderNumber,
              status: order.status,
              isEligible,
              daysSinceOrder,
              reason: isEligible
                ? "Order is eligible for refund"
                : !isDelivered
                ? "Order must be delivered before requesting a refund"
                : `Order is ${daysSinceOrder} days old. Refunds are only available within 14 days of delivery.`,
            };
          },
        },

        getPolicyInfo: {
          description: "Get information about Focus Robin's return, refund, and warranty policies",
          inputSchema: z.object({
            policyType: z
              .enum(["returns", "refunds", "warranty", "shipping"])
              .optional()
              .describe("The type of policy information requested"),
          }),
          execute: async ({ policyType }: { policyType?: "returns" | "refunds" | "warranty" | "shipping" }) => {
            const policies = {
              returns: {
                title: "14-Day Returns Policy",
                description:
                  "You can return any item within 14 days of delivery. Items must be in original condition with all packaging. Return shipping is free.",
              },
              refunds: {
                title: "Refund Policy",
                description:
                  "Refunds are processed within 5-7 business days after we receive your return. Refunds are issued to the original payment method.",
              },
              warranty: {
                title: "1-Year Warranty",
                description:
                  "All Focus Robin eyewear comes with a 1-year warranty covering manufacturing defects. This includes frame breakage, lens defects, and hardware issues under normal use.",
              },
              shipping: {
                title: "Shipping Information",
                description:
                  "We ship worldwide using DHL (or Omniva for Latvia, Lithuania, and Estonia). Standard shipping takes 5-7 business days. Tracking information is provided once your order ships.",
              },
            };

            if (policyType && policies[policyType]) {
              return policies[policyType];
            }

            return {
              policies: Object.values(policies),
              summary:
                "Focus Robin offers a 14-day return policy, 1-year warranty on all products, and worldwide shipping with tracking.",
            };
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      }
    );
  }
}
