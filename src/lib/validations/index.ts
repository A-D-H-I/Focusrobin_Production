/**
 * Enterprise-Grade Input Validation Schemas
 * Using Zod for strict runtime type checking and sanitization
 */

import { z } from "zod";

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

/**
 * Sanitize string: trim whitespace, enforce max length
 */
const sanitizedString = (maxLength: number = 255) =>
  z.string().trim().max(maxLength, `Maximum ${maxLength} characters allowed`);

/**
 * Strict ID validation (CUID format)
 */
const cuidSchema = z
  .string()
  .trim()
  .min(1, "ID is required")
  .max(30, "Invalid ID format")
  .regex(/^[a-z0-9]+$/i, "Invalid ID format");

/**
 * Safe slug validation
 */
const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(100, "Slug too long")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

/**
 * Email validation with sanitization
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(255, "Email too long");

/**
 * Phone number validation
 */
const phoneSchema = z
  .string()
  .trim()
  .min(5, "Phone number too short")
  .max(20, "Phone number too long")
  .regex(/^[+]?[\d\s()-]+$/, "Invalid phone number format");

/**
 * URL validation (for assets)
 */
const urlSchema = z
  .string()
  .trim()
  .max(2048, "URL too long")
  .refine(
    (url) => url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://"),
    "Invalid URL format"
  );

/**
 * Positive number validation
 */
const positiveNumber = z.number().positive("Must be a positive number");

/**
 * Non-negative number validation
 */
const nonNegativeNumber = z.number().nonnegative("Cannot be negative");

/**
 * Quantity validation (1-99)
 */
const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Minimum quantity is 1")
  .max(99, "Maximum quantity is 99");

// ============================================================================
// USER & AUTH SCHEMAS
// ============================================================================

export const userProfileSchema = z.object({
  name: sanitizedString(100).optional(),
  email: emailSchema.optional(),
});

export const addressSchema = z.object({
  fullName: sanitizedString(100).min(2, "Name is required"),
  phone: phoneSchema,
  addressLine1: sanitizedString(200).min(5, "Address is required"),
  addressLine2: sanitizedString(200).optional(),
  city: sanitizedString(100).min(2, "City is required"),
  state: sanitizedString(100).optional(),
  postalCode: sanitizedString(20).min(3, "Postal code is required"),
  country: sanitizedString(100).min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const productBaseSchema = z.object({
  name: sanitizedString(200).min(2, "Product name is required"),
  slug: slugSchema,
  description: sanitizedString(5000).min(10, "Description must be at least 10 characters"),
  basePrice: positiveNumber.max(100000, "Price cannot exceed €100,000"),
  discountPct: z.number().int().min(0).max(99).optional().default(0),
  cashbackAmount: nonNegativeNumber.max(1000).optional().default(0),
  frameMaterial: sanitizedString(100).min(2, "Frame material is required"),
  lensMaterial: sanitizedString(100).optional().default("Polycarbonate"),
  uvProtection: sanitizedString(50).min(2, "UV protection info is required"),
  frameWidth: positiveNumber.optional(),
  lensWidth: positiveNumber.optional(),
  lensHeight: positiveNumber.optional(),
  bridgeWidth: positiveNumber.optional(),
  templeLength: positiveNumber.optional(),
  weightBg: positiveNumber.optional(),
  tags: z.array(sanitizedString(50)).max(20).optional().default([]),
});

export const productVariantSchema = z.object({
  name: sanitizedString(100).min(1, "Variant name is required"),
  sku: sanitizedString(50).min(1, "SKU is required"),
  colorName: sanitizedString(50).min(1, "Color name is required"),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  lensColor: sanitizedString(50).min(1, "Lens color is required"),
  stock: z.number().int().nonnegative().max(10000).optional().default(0),
  price: positiveNumber.optional(),
  asset_nobg: urlSchema.optional(),
  asset_glb: urlSchema.optional(),
  asset_tryon: urlSchema.optional(),
  asset_hover: urlSchema.optional(),
  asset_gallery: z.string().max(10000).optional(), // Comma-separated URLs
});

export type ProductBaseInput = z.infer<typeof productBaseSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;

// ============================================================================
// CART & ORDER SCHEMAS
// ============================================================================

export const addToCartSchema = z.object({
  productSlugOrId: sanitizedString(100).min(1, "Product ID is required"),
  variantSkuOrId: sanitizedString(100).min(1, "Variant ID is required"),
  quantity: quantitySchema.optional().default(1),
});

export const updateCartItemSchema = z.object({
  productSlugOrId: sanitizedString(100).min(1, "Product ID is required"),
  variantSkuOrId: sanitizedString(100).min(1, "Variant ID is required"),
  quantity: z.number().int().min(0).max(99, "Maximum quantity is 99"),
});

export const shippingAddressSchema = z.object({
  name: sanitizedString(100).min(2, "Name is required"),
  phone: phoneSchema,
  addressLine1: sanitizedString(200).min(5, "Address is required"),
  addressLine2: sanitizedString(200).optional(),
  city: sanitizedString(100).min(2, "City is required"),
  state: sanitizedString(100).optional(),
  postalCode: sanitizedString(20).min(3, "Postal code is required"),
  country: sanitizedString(100).min(2, "Country is required"),
});

export const createOrderSchema = z.object({
  paymentMethod: z.enum([
    "card",
    "paypal", 
    "wallet", 
    "bank-transfer",
    "cod",
    "apple-pay",
    "google-pay",
    "revolut-pay"
  ]),
  walletAmount: nonNegativeNumber.optional().default(0),
  shippingProvider: z.string().optional(),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// CHAT SCHEMAS
// ============================================================================

export const sendMessageSchema = z.object({
  message: sanitizedString(5000).min(1, "Message cannot be empty"),
  userEmail: emailSchema.optional(),
  userName: sanitizedString(100).optional(),
  userId: cuidSchema.optional(),
  chatId: cuidSchema.optional(),
});

export const adminReplySchema = z.object({
  chatId: cuidSchema,
  message: sanitizedString(5000).min(1, "Message cannot be empty"),
});

export const blockUserSchema = z.object({
  userId: cuidSchema.optional(),
  userEmail: emailSchema.optional(),
  blockDurationHours: z.number().int().min(1).max(8760).default(24), // Max 1 year
  reason: sanitizedString(500).optional(),
}).refine((data) => data.userId || data.userEmail, {
  message: "Either userId or userEmail must be provided",
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const createReviewSchema = z.object({
  productId: cuidSchema,
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  title: sanitizedString(200).optional(),
  comment: sanitizedString(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

export const contactSubmissionSchema = z.object({
  name: sanitizedString(100).min(2, "Name is required"),
  email: emailSchema,
  subject: sanitizedString(200).min(2, "Subject is required"),
  message: sanitizedString(5000).min(10, "Message must be at least 10 characters"),
  phone: phoneSchema.optional(),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const updateOrderStatusSchema = z.object({
  orderId: cuidSchema,
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});

export const updatePaymentStatusSchema = z.object({
  orderId: cuidSchema,
  paymentStatus: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]),
});

export const updateTrackingSchema = z.object({
  orderId: cuidSchema,
  trackingNumber: sanitizedString(100).optional(),
  trackingMessage: sanitizedString(500).optional(),
});

export const updateChatStatusSchema = z.object({
  chatId: cuidSchema,
  status: z.enum(["OPEN", "CLOSED", "PENDING", "FORCE_CLOSED"]),
});

// ============================================================================
// IMAGE/BANNER SCHEMAS (Admin)
// ============================================================================

export const imageUploadSchema = z.object({
  url: urlSchema,
  altText: sanitizedString(200).optional(),
  title: sanitizedString(200).optional(),
  link: urlSchema.optional(),
  position: z.number().int().nonnegative().max(100).optional(),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Parse and validate input, returning a result object
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Return first error message
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError?.message || "Validation failed",
  };
}

/**
 * Parse and validate, throwing on error (for server actions)
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = safeValidate(schema, data);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

