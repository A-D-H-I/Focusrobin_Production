import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { z } from "zod";

// Using Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get Google AI API key from environment
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
    
    // Log for debugging (will show in server console)
    console.log("[Chat API] API Key check:", {
      exists: !!apiKey,
      length: apiKey.length,
      startsWith: apiKey.substring(0, 4),
      nodeEnv: process.env.NODE_ENV,
    });
    
    // Check for Google AI API key
    if (!apiKey || apiKey.length < 10) {
      console.error("[Chat API] Missing API key. Check .env.local file and restart server.");
      return new Response(
        JSON.stringify({
          error: "AI chatbot is not configured. GOOGLE_GENERATIVE_AI_API_KEY is missing. Please add it to your .env.local file and restart the development server.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check authentication
    const session = await auth();
    const userId = (session?.user as any)?.id;

    const { messages } = await req.json();

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
            orderId: z.string().describe("The order ID or order number"),
          }),
          execute: async ({ orderId }: { orderId: string }) => {
            if (!userId) {
              return { error: "Please log in to check order status" };
            }

            const order = await prisma.order.findFirst({
              where: {
                OR: [{ orderNumber: orderId }, { id: orderId }],
                userId,
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
            orderId: z.string().describe("The order ID or order number"),
          }),
          execute: async ({ orderId }: { orderId: string }) => {
            if (!userId) {
              return { error: "Please log in to check refund eligibility" };
            }

            const order = await prisma.order.findFirst({
              where: {
                OR: [{ orderNumber: orderId }, { id: orderId }],
                userId,
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
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
