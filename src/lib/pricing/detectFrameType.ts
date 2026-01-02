// Frame type detection utility
// Analyzes product description and frame material to determine frame type

import type { FrameType } from "./rx167";
import type { Product } from "@/lib/productData";

/**
 * Detects frame type from product description and frame material
 * Defaults to FULL_FRAME if no specific indicators are found
 */
export function detectFrameType(product: Product): FrameType {
  const description = (product.description || "").toLowerCase();
  const frameMaterial = (product.frameMaterial || "").toLowerCase();
  const productName = (product.name || "").toLowerCase();

  // Combine all text for analysis
  const searchText = `${description} ${frameMaterial} ${productName}`;

  // Check for Lindberg (premium/complex frames)
  if (searchText.includes("lindberg") || searchText.includes("complex")) {
    return "LINDBERG_COMPLEX";
  }

  // Check for rimless frames
  if (searchText.includes("rimless") || searchText.includes("frameless")) {
    // Try to determine if it's individual mountings or pressing
    // Individual mountings are typically more expensive/complex
    if (searchText.includes("individual") || searchText.includes("mounting")) {
      return "RIMLESS_INDIVIDUAL";
    }
    // Default rimless to pressing (more common)
    return "RIMLESS_PRESSING";
  }

  // Check for nylon frame (semi-rimless with nylon cord)
  if (
    searchText.includes("nylon") ||
    searchText.includes("semi-rimless") ||
    searchText.includes("semi rimless")
  ) {
    return "NYLON_FRAME";
  }

  // Default to full frame (most common for sunglasses)
  return "FULL_FRAME";
}

