import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, frameQuantity, frameSubtotal } = body;

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

    // Check if promo code is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: "This promo code is not active" },
        { status: 400 }
      );
    }

    // Check date validity
    const now = new Date();
    if (promoCode.startDate > now) {
      return NextResponse.json(
        { error: "This promo code is not yet valid" },
        { status: 400 }
      );
    }

    if (promoCode.endDate && promoCode.endDate < now) {
      return NextResponse.json(
        { error: "This promo code has expired" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { error: "This promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check minimum purchase amount
    const purchaseAmount = subtotal || 0;
    if (promoCode.minPurchaseAmount && purchaseAmount < Number(promoCode.minPurchaseAmount)) {
      return NextResponse.json(
        { 
          error: `Minimum purchase amount of ${Number(promoCode.minPurchaseAmount).toFixed(2)}€ required` 
        },
        { status: 400 }
      );
    }

    // Check bulk frame discount requirements
    if (promoCode.applyToFramesOnly) {
      const actualFrameQuantity = frameQuantity || 0;
      const requiredFrameQuantity = promoCode.minFrameQuantity || 0;
      
      if (actualFrameQuantity < requiredFrameQuantity) {
        return NextResponse.json(
          { 
            error: `This promo code requires purchasing at least ${requiredFrameQuantity} frame${requiredFrameQuantity > 1 ? 's' : ''}` 
          },
          { status: 400 }
        );
      }

      // Calculate discount only on frames
      const frameTotal = frameSubtotal || 0;
      let discountAmount = 0;
      
      if (promoCode.bulkFrameDiscountPercentage) {
        discountAmount = (frameTotal * Number(promoCode.bulkFrameDiscountPercentage)) / 100;
      }
      
      // Don't allow discount to exceed frame subtotal
      discountAmount = Math.min(discountAmount, frameTotal);

      return NextResponse.json({
        success: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          description: promoCode.description,
          discountAmount,
          cashbackAmount: 0, // No cashback for frame-only discounts
          discountPercentage: promoCode.bulkFrameDiscountPercentage ? Number(promoCode.bulkFrameDiscountPercentage) : null,
          cashbackPercentage: null,
          applyToFramesOnly: true,
        },
      });
    }

    // Regular discount calculation (applies to entire order)
    let discountAmount = 0;
    if (promoCode.discountPercentage) {
      discountAmount = (purchaseAmount * Number(promoCode.discountPercentage)) / 100;
    } else if (promoCode.discountAmount) {
      discountAmount = Number(promoCode.discountAmount);
    }

    // Don't allow discount to exceed subtotal
    discountAmount = Math.min(discountAmount, purchaseAmount);

    // Calculate cashback
    let cashbackAmount = 0;
    if (promoCode.cashbackPercentage) {
      cashbackAmount = (purchaseAmount * Number(promoCode.cashbackPercentage)) / 100;
    }

    return NextResponse.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountAmount,
        cashbackAmount,
        discountPercentage: promoCode.discountPercentage ? Number(promoCode.discountPercentage) : null,
        cashbackPercentage: promoCode.cashbackPercentage ? Number(promoCode.cashbackPercentage) : null,
        applyToFramesOnly: false,
      },
    });
  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}

