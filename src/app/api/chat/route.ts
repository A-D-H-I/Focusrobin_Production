import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIdentifier, rateLimitHeaders } from "@/lib/rate-limit";

// Using Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

// Security headers for API responses
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

// Intent types for pattern matching
type Intent =
  | "greeting"
  | "orders"
  | "order_status"
  | "refund"
  | "return_policy"
  | "shipping"
  | "warranty"
  | "product_info"
  | "size_guide"
  | "payment"
  | "help"
  | "thanks"
  | "goodbye"
  | "contact"
  | "complaint"
  | "compliment"
  | "unknown";

// Enhanced pattern matching with more variations
const intentPatterns: Record<Intent, RegExp[]> = {
  greeting: [
    /^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|howdy|hola|greetings)[\s!?.]*$/i,
    /^(what'?s\s*up|sup|yo)[\s!?.]*$/i,
    /^how\s*(are\s*you|do\s*you\s*do|is\s*it\s*going)[\s!?.]*$/i,
  ],
  order_status: [
    /\bORD-\d+-\d+/i,
    /\b(check|track|where|what'?s\s*the\s*status|update)\s*.*(order|package|shipment|parcel)/i,
    /\bstatus\s*(of|for)?\s*(order|my\s*order|this\s*order)/i,
    /\border\s*(status|tracking|update|info)/i,
    /\b(tracking|shipment|delivery)\s*(info|status|update|number)/i,
    /\bwhen\s*(will|does|did)\s*(my)?\s*(order|package|parcel)\s*(arrive|come|deliver|ship)/i,
    /\bwhere\s*(is|are)\s*(my)?\s*(order|package|shipment)/i,
    /\bhas\s*(my)?\s*(order|package)\s*(shipped|arrived|delivered)/i,
  ],
  orders: [
    /\b(my|recent|show|view|list|all|previous|past)\s*(orders?|purchases?|buy|bought)\b/i,
    /\b(orders?|purchases?)\s*(history|list|all|recent)/i,
    /\bwhat\s*(did\s*i|have\s*i)\s*(order|buy|purchase|get)/i,
    /\border\s*history\b/i,
    /^(orders?|my\s*orders?|purchases?)$/i,
    /\bsee\s*(my|all)\s*orders/i,
  ],
  refund: [
    /\brefund\s*eligib.*order/i,
    /\b(refund|money\s*back|get\s*refund|request\s*refund|return\s*money)/i,
    /\b(can\s*i|how\s*(to|do\s*i|can))\s*(get\s*a?\s*)?refund/i,
    /\brefund\s*(policy|eligib|request|process)/i,
    /\b(cancel|cancelled|canceling)\s*(order|my\s*order|this\s*order)/i,
    /\bpending\s*refund/i,
    /\bwant\s*(my|a)\s*money\s*back/i,
  ],
  return_policy: [
    /\breturn\s*(policy|item|product|this|something|glasses|frame)/i,
    /\b(can\s*i|how\s*(to|do\s*i|can))\s*return/i,
    /\b(exchange|swap)\s*(policy|item|product|this)?/i,
    /\breturn\s*(window|period|time|deadline)/i,
    /\bhow\s*long\s*(do\s*i\s*have|can\s*i)\s*to\s*return/i,
  ],
  shipping: [
    /\bshipping\s*(info|policy|cost|time|method|option|rate|fee)/i,
    /\b(delivery|ship)\s*(time|cost|method|option|info|policy|date)/i,
    /\bhow\s*long\s*(does|will|do)\s*(shipping|delivery|it\s*take)\s*(take)?/i,
    /\bfree\s*shipping/i,
    /\bwhere\s*do\s*you\s*ship/i,
    /\bshipping\s*(to|for)\s*[a-z\s]+/i,
    /\binternational\s*shipping/i,
    /\bshipping\s*cost/i,
  ],
  warranty: [
    /\bwarranty\s*(info|policy|coverage|claim|period|length)/i,
    /\b(broken|defective|damaged|faulty)\s*(glasses|frame|lens|product)/i,
    /\bhow\s*long\s*(is|does|last)\s*(the)?\s*warranty/i,
    /\bwarranty\s*(claim|request|process)/i,
    /\b(product|item)\s*(broken|defective|damaged)/i,
  ],
  product_info: [
    /\bwhat\s*(are|is)\s*(your|the)\s*(products?|glasses?|frames?|eyewear)/i,
    /\b(product|glasses|frame|eyewear)\s*(info|information|details|spec)/i,
    /\b(material|made\s*of|what'?s\s*it\s*made|composition)/i,
    /\b(price|cost|how\s*much)\s*(are|is|do\s*they|does\s*it)/i,
    /\b(collection|styles?|designs?|models?)/i,
  ],
  size_guide: [
    /\b(size|sizing|fit|fitting|measurement)/i,
    /\bhow\s*(to|do\s*i)\s*(measure|choose|pick|find)\s*(size|fit)/i,
    /\bsize\s*(guide|chart|help)/i,
    /\b(too\s*(big|small|large|tight)|doesn'?t\s*fit)/i,
  ],
  payment: [
    /\b(payment|pay|paid|charge|billing|invoice)/i,
    /\b(payment\s*method|how\s*to\s*pay|accepted\s*payment)/i,
    /\b(refund|money\s*back)\s*(to|on)\s*(card|account|payment)/i,
    /\bwhen\s*(will|do)\s*i\s*(get|receive)\s*(refund|money)/i,
  ],
  help: [
    /\bhelp\s*(me)?$/i,
    /\bwhat\s*can\s*you\s*(do|help|assist)/i,
    /\b(options|menu|commands|what\s*do\s*you\s*do)/i,
    /\bhow\s*can\s*you\s*help/i,
  ],
  thanks: [
    /\b(thank|thanks|thx|ty|appreciate|grateful)/i,
    /\b(thank\s*you|thanks\s*a\s*lot|much\s*appreciated)/i,
  ],
  goodbye: [
    /\b(bye|goodbye|see\s*you|take\s*care|cya|farewell)/i,
    /\b(that'?s\s*all|that'?s\s*it|nothing\s*else|all\s*done)/i,
  ],
  contact: [
    /\b(contact|speak|talk)\s*(to|with)?\s*(support|agent|human|person|someone|team)/i,
    /\b(email|phone|call|reach)\s*(support|you|them|customer\s*service)?/i,
    /\bcustomer\s*(service|support|care)/i,
    /\b(support|help)\s*(email|phone|number|contact)/i,
  ],
  complaint: [
    /\b(problem|issue|wrong|broken|defective|damaged|faulty|bad|terrible|awful|horrible)/i,
    /\b(not\s*working|doesn'?t\s*work|broken|damaged)/i,
    /\b(complaint|complain|unhappy|disappointed|dissatisfied)/i,
    /\b(quality|poor|bad)\s*(quality|product|item)/i,
  ],
  compliment: [
    /\b(love|great|excellent|amazing|wonderful|fantastic|perfect|awesome|beautiful)/i,
    /\b(thank\s*you|thanks)\s*(for|so\s*much)/i,
    /\b(very\s*good|really\s*good|so\s*good)/i,
  ],
  unknown: [],
};

// Knowledge base for common questions
const knowledgeBase: Record<string, string[]> = {
  materials: ["acetate", "titanium", "metal", "plastic", "frame", "lens"],
  products: ["glasses", "sunglasses", "eyewear", "frames", "spectacles"],
  policies: ["return", "refund", "warranty", "shipping", "exchange"],
  order: ["order", "purchase", "buy", "tracking", "delivery", "shipment"],
};

// Extract keywords from message
function extractKeywords(message: string): string[] {
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const keywords: string[] = [];
  for (const [category, terms] of Object.entries(knowledgeBase)) {
    for (const term of terms) {
      if (words.some((w) => w.includes(term) || term.includes(w))) {
        keywords.push(category);
        break;
      }
    }
  }
  return keywords;
}

// Calculate similarity score between two strings (simple Levenshtein-like)
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Simple Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Enhanced intent detection with fuzzy matching
function detectIntent(message: string): { intent: Intent; orderId?: string; confidence: number } {
  const normalizedMessage = message.toLowerCase().trim();

  // Check for order ID in message
  const orderIdMatch = message.match(/\b(ORD-\d+-\d+|FR-[A-Z0-9-]+|[A-F0-9]{8,})\b/i);
  const orderId = orderIdMatch?.[1];

  // Check for refund-related keywords with order ID
  const isRefundRequest = /\b(refund|eligib|money\s*back)/i.test(normalizedMessage);

  // If order ID is found, determine if it's refund or status check
  if (orderId) {
    if (isRefundRequest) {
      return { intent: "refund", orderId, confidence: 0.95 };
    }
    return { intent: "order_status", orderId, confidence: 0.95 };
  }

  // Define intent check order (more specific first)
  const intentOrder: Intent[] = [
    "greeting",
    "refund",
    "order_status",
    "orders",
    "return_policy",
    "shipping",
    "warranty",
    "product_info",
    "size_guide",
    "payment",
    "complaint",
    "compliment",
    "help",
    "thanks",
    "goodbye",
    "contact",
  ];

  let bestMatch: { intent: Intent; confidence: number } | null = null;

  for (const intent of intentOrder) {
    const patterns = intentPatterns[intent];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          const confidence = pattern.source.includes("^") || pattern.source.includes("$") ? 0.9 : 0.7;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { intent, confidence };
          }
        }
      }
    }
  }

  // Fuzzy matching for unknown intents
  if (!bestMatch) {
    const keywords = extractKeywords(message);
    const commonQuestions = [
      { pattern: /what|how|when|where|why|can\s*i/i, intent: "help" as Intent },
      { pattern: /product|glasses|frame|eyewear/i, intent: "product_info" as Intent },
      { pattern: /size|fit|measure/i, intent: "size_guide" as Intent },
    ];

    for (const q of commonQuestions) {
      if (q.pattern.test(normalizedMessage)) {
        bestMatch = { intent: q.intent, confidence: 0.5 };
        break;
      }
    }
  }

  return bestMatch
    ? { intent: bestMatch.intent, orderId, confidence: bestMatch.confidence }
    : { intent: "unknown", orderId, confidence: 0 };
}

// Response generators with variations
const responses = {
  greeting: () => {
    const greetings = [
      "Hello! 👋 I'm Robin, your support assistant for Focus Robin Eyewear. How can I help you today?",
      "Hi there! 👋 I'm Robin, here to help with your Focus Robin Eyewear questions. What can I assist you with?",
      "Hey! 👋 Welcome! I'm Robin, your support assistant. How can I help you today?",
    ];
    return {
      text: `${greetings[Math.floor(Math.random() * greetings.length)]}\n\nI can help you with:\n• View your recent orders\n• Check order status & tracking\n• Refund eligibility\n• Return, shipping & warranty policies\n• Product information`,
    };
  },
  help: () => ({
    text: "Here's what I can help you with:\n\n📦 **Orders** - Type \"my orders\" to see your recent orders\n🔍 **Order Status** - Type \"track order\" or include your order number\n💰 **Refunds** - Type \"refund\" to check eligibility\n📋 **Policies** - Ask about returns, shipping, or warranty\n🛍️ **Products** - Ask about our glasses, frames, or collections\n📏 **Sizing** - Ask about size guides or fitting\n\nJust type your question and I'll do my best to help!",
  }),
  thanks: () => {
    const responses = [
      "You're welcome! 😊 Is there anything else I can help you with?",
      "Happy to help! 😊 Let me know if you need anything else!",
      "Anytime! 😊 Feel free to ask if you have more questions!",
    ];
    return { text: responses[Math.floor(Math.random() * responses.length)] };
  },
  goodbye: () => ({
    text: "Goodbye! Thank you for choosing Focus Robin Eyewear. Have a great day! 👋",
  }),
  contact: () => ({
    text: "You can reach our support team through:\n\n📧 **Email**: support@focusrobin.com\n\nOur team typically responds within 24 hours during business days.\n\nFor urgent matters, please include \"URGENT\" in your subject line.",
  }),
  notLoggedIn: () => ({
    text: "Please log in to your account to view your orders and check order status. You can sign in using the account icon in the navigation bar.",
  }),
  noOrders: () => ({
    text: "You don't have any orders yet. Browse our collection and find the perfect eyewear for you! 🕶️",
  }),
  orderNotFound: () => ({
    text: "I couldn't find that order. Please make sure you've entered the correct order number, or type \"my orders\" to see your recent orders.",
  }),
  returnPolicy: () => ({
    text: "📋 **14-Day Return Policy**\n\nYou can return any item within 14 days of delivery. Here's what you need to know:\n\n✅ Items must be in original condition\n✅ All packaging must be included\n✅ Return shipping is FREE\n✅ Refunds processed within 5-7 business days\n\nTo start a return, please contact our support team at support@focusrobin.com with your order number.",
  }),
  shippingPolicy: () => ({
    text: "🚚 **Shipping Information**\n\nWe ship worldwide using trusted carriers:\n\n• **DHL** - For most international destinations\n• **Omniva** - For Latvia, Lithuania, and Estonia\n\n⏱️ **Delivery Time**: 5-7 business days\n📍 **Tracking**: Provided once your order ships\n💶 **Free Shipping**: Available on orders over €50\n\nTracking information will be sent to your email when your order is dispatched.",
  }),
  warrantyPolicy: () => ({
    text: "🛡️ **1-Year Warranty**\n\nAll Focus Robin eyewear comes with a comprehensive 1-year warranty covering:\n\n✅ Frame breakage (under normal use)\n✅ Lens defects\n✅ Hardware issues (hinges, screws, nose pads)\n✅ Manufacturing defects\n\n❌ Not covered: Accidental damage, scratches from misuse, lost items\n\nTo make a warranty claim, contact support@focusrobin.com with your order number and photos of the issue.",
  }),
  productInfo: () => ({
    text: "🕶️ **Focus Robin Eyewear**\n\nWe offer premium eyewear including:\n\n• **Sunglasses** - UV protection with stylish designs\n• **Prescription Frames** - High-quality frames for your lenses\n• **Multiple Collections** - Various styles and colors\n\nOur frames are made from premium materials including acetate and titanium. Browse our shop to see all available products and styles!\n\nFor specific product questions, please visit our shop or contact support@focusrobin.com",
  }),
  sizeGuide: () => ({
    text: "📏 **Size Guide**\n\nTo find your perfect fit:\n\n1. **Measure your face** - Use a ruler to measure the width of your face at the temples\n2. **Check product specs** - Each product page shows frame dimensions\n3. **Try our virtual try-on** - Use our virtual try-on feature to see how frames look\n\nIf you're unsure about sizing, contact support@focusrobin.com with your measurements and we'll help you choose the right size!",
  }),
  payment: () => ({
    text: "💳 **Payment Information**\n\nWe accept:\n\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• PayPal\n• Bank Transfer (for some regions)\n\nRefunds are processed to the original payment method within 5-7 business days after we receive your return.\n\nFor payment questions, contact support@focusrobin.com",
  }),
  complaint: () => ({
    text: "I'm sorry to hear you're experiencing an issue. 😔\n\nTo help resolve this quickly, please:\n\n1. Contact our support team at support@focusrobin.com\n2. Include your order number (if applicable)\n3. Describe the issue in detail\n4. Attach photos if relevant\n\nOur team will investigate and respond within 24 hours. We're committed to making things right!",
  }),
  compliment: () => ({
    text: "Thank you so much! 😊 We're thrilled you're happy with your Focus Robin experience!\n\nYour feedback means the world to us. Is there anything else I can help you with today?",
  }),
};

// Format order for display
function formatOrder(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total).toFixed(2),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    items:
      order.items?.map((item: any) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        price: Number(item.price).toFixed(2),
      })) || [],
  };
}

// Format order status for display
function formatOrderStatus(order: any) {
  const statusMessages: Record<string, string> = {
    PENDING: "Your order is being processed.",
    CONFIRMED: "Your order has been confirmed and is being prepared.",
    PROCESSING: "Your order is being prepared for shipment.",
    SHIPPED: "Your order is on its way!",
    DELIVERED: "Your order has been delivered.",
    CANCELLED: "This order has been cancelled.",
    REFUNDED: "This order has been refunded.",
  };

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusMessage: statusMessages[order.status] || "Status unknown.",
    trackingNumber: order.trackingNumber || null,
    trackingMessage: order.trackingMessage || null,
    shippingProvider: order.shippingProvider || null,
    createdAt: order.createdAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() || null,
    deliveredAt: order.deliveredAt?.toISOString() || null,
  };
}

// Check refund eligibility
function checkRefundEligibility(order: any) {
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
      ? "This order is eligible for a refund. Please contact support@focusrobin.com to process your refund request."
      : !isDelivered
      ? "Order must be delivered before requesting a refund."
      : `This order is ${daysSinceOrder} days old. Refunds are only available within 14 days of delivery.`,
  };
}

// Smart response generator for unknown queries
function generateSmartResponse(
  message: string,
  intent: Intent,
  confidence: number,
  userId: string | undefined
): string {
  const normalized = message.toLowerCase();
  const keywords = extractKeywords(message);

  // If confidence is very low, provide helpful guidance
  if (confidence < 0.3) {
    return `I'm not entirely sure what you're asking, but I'd be happy to help! 😊\n\nHere's what I can assist with:\n\n• **Orders** - Type "my orders" or "track order"\n• **Refunds** - Type "refund" to check eligibility\n• **Policies** - Ask about returns, shipping, or warranty\n• **Products** - Ask about our eyewear collections\n\nIf your question is about something else, please contact our support team at support@focusrobin.com and they'll be happy to help!`;
  }

  // Try to infer intent from keywords
  if (keywords.includes("product") || keywords.includes("materials")) {
    return responses.productInfo().text;
  }

  if (keywords.includes("order")) {
    if (userId) {
      return "I can help you with your orders! Try:\n\n• \"my orders\" - See your recent orders\n• \"track order\" - Check order status\n• \"refund\" - Check refund eligibility";
    }
    return responses.notLoggedIn().text;
  }

  // Default helpful response
  return `I understand you're asking about "${message}". While I can help with orders, refunds, policies, and product information, for more specific questions about this topic, please contact our support team at support@focusrobin.com.\n\nThey'll be able to provide detailed assistance! 😊`;
}

// Handle pattern-matched response (fast path)
async function handlePatternMatch(
  intent: Intent,
  orderId: string | undefined,
  userId: string | undefined,
  confidence: number
): Promise<{ content: string; data?: any }> {
  let response: { content: string; data?: any } = { content: "" };

  switch (intent) {
    case "greeting":
      response.content = responses.greeting().text;
      break;

    case "help":
      response.content = responses.help().text;
      break;

    case "thanks":
      response.content = responses.thanks().text;
      break;

    case "goodbye":
      response.content = responses.goodbye().text;
      break;

    case "contact":
      response.content = responses.contact().text;
      break;

    case "orders":
      if (!userId) {
        response.content = responses.notLoggedIn().text;
      } else {
        const orders = await prisma.order.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { items: { take: 3 } },
        });

        if (orders.length === 0) {
          response.content = responses.noOrders().text;
        } else {
          response.content = `Here are your recent orders:`;
          response.data = {
            type: "orders",
            orders: orders.map(formatOrder),
          };
        }
      }
      break;

    case "order_status":
      if (!userId) {
        response.content = responses.notLoggedIn().text;
      } else if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [{ orderNumber: orderId }, { id: orderId }],
            userId,
          },
          include: { items: true },
        });

        if (!order) {
          response.content = responses.orderNotFound().text;
        } else {
          response.content = `Here's the status of your order:`;
          response.data = {
            type: "order_status",
            order: formatOrderStatus(order),
          };
        }
      } else {
        const orders = await prisma.order.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: { items: { take: 2 } },
        });

        if (orders.length === 0) {
          response.content = responses.noOrders().text;
        } else {
          response.content =
            "Which order would you like to track? Here are your recent orders:";
          response.data = {
            type: "orders",
            orders: orders.map(formatOrder),
          };
        }
      }
      break;

    case "refund":
      if (!userId) {
        response.content = responses.notLoggedIn().text;
      } else if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [{ orderNumber: orderId }, { id: orderId }],
            userId,
          },
        });

        if (!order) {
          response.content = responses.orderNotFound().text;
        } else {
          const eligibility = checkRefundEligibility(order);
          response.content = eligibility.isEligible
            ? `✅ **Good news!** ${eligibility.reason}`
            : `❌ **Refund Not Available**\n\n${eligibility.reason}`;
          response.data = {
            type: "refund_eligibility",
            eligibility,
          };
        }
      } else {
        const orders = await prisma.order.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: "desc" },
        });

        if (orders.length === 0) {
          response.content = responses.noOrders().text;
        } else {
          response.content =
            "Which order would you like to check for refund eligibility? Here are your recent orders:\n\n(Click an order or type the order number)";
          response.data = {
            type: "orders",
            orders: orders.map(formatOrder),
          };
        }
      }
      break;

    case "return_policy":
      response.content = responses.returnPolicy().text;
      break;

    case "shipping":
      response.content = responses.shippingPolicy().text;
      break;

    case "warranty":
      response.content = responses.warrantyPolicy().text;
      break;

    case "product_info":
      response.content = responses.productInfo().text;
      break;

    case "size_guide":
      response.content = responses.sizeGuide().text;
      break;

    case "payment":
      response.content = responses.payment().text;
      break;

    case "complaint":
      response.content = responses.complaint().text;
      break;

    case "compliment":
      response.content = responses.compliment().text;
      break;

    case "unknown":
      // This will be handled by generateSmartResponse
      response.content = "";
      break;

    default:
      response.content = "";
  }

  return response;
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
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

    // Validate request body
    let messages;
    try {
      const body = await req.json();
      if (!body.messages || !Array.isArray(body.messages)) {
        throw new Error("Invalid request body");
      }
      messages = body.messages;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }

    // Get the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: responses.greeting().text,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }

    // Extract message text
    const messageText =
      typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : lastUserMessage.parts?.find((p: any) => p.type === "text")?.text ||
          lastUserMessage.content?.[0]?.text ||
          "";

    // Detect intent with confidence score
    const { intent, orderId, confidence } = detectIntent(messageText);
    
    // Handle pattern-matched responses
    const patternResponse = await handlePatternMatch(intent, orderId, userId, confidence);

    // If we have a response, return it
    if (patternResponse.content) {
      return new Response(
        JSON.stringify({
          role: "assistant",
          ...patternResponse,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }

    // For unknown intents, generate smart response
    const smartResponse = generateSmartResponse(messageText, intent, confidence, userId);

    return new Response(
      JSON.stringify({
        role: "assistant",
        content: smartResponse,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        role: "assistant",
        content:
          "I'm having trouble processing your request. Please try again or contact support@focusrobin.com for assistance.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      }
    );
  }
}
