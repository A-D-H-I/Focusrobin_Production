import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promoAvailabilityError, toPromoRules } from "@/lib/promo";

/**
 * Look up a promo code and return its rules. Whether it applies to the cart
 * (minimum spend, brand/category scope, bulk frames) is computed with
 * computePromoDiscount from src/lib/promo.ts, in the browser for display and
 * again on the server when the order is created.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 404 }
      );
    }

    const availabilityError = promoAvailabilityError(promoCode);
    if (availabilityError) {
      return NextResponse.json({ error: availabilityError }, { status: 400 });
    }

    return NextResponse.json({ success: true, promoCode: toPromoRules(promoCode) });
  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
