import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Fetch all promo codes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promoCodes);
  } catch (error: any) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

// POST - Create new promo code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountPercentage,
      discountAmount,
      cashbackPercentage,
      isActive,
      startDate,
      endDate,
      usageLimit,
      minPurchaseAmount,
      minFrameQuantity,
      bulkFrameDiscountPercentage,
      applyToFramesOnly,
    } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A promo code with this code already exists" },
        { status: 400 }
      );
    }

    // Validate that at least one discount or cashback is provided
    const hasRegularDiscount = discountPercentage || discountAmount || cashbackPercentage;
    const hasBulkFrameDiscount = bulkFrameDiscountPercentage && minFrameQuantity;
    
    if (!hasRegularDiscount && !hasBulkFrameDiscount) {
      return NextResponse.json(
        { error: "At least one discount type must be provided (regular discount/cashback OR bulk frame discount)" },
        { status: 400 }
      );
    }

    // Validate bulk frame discount requirements
    if (applyToFramesOnly && (!minFrameQuantity || !bulkFrameDiscountPercentage)) {
      return NextResponse.json(
        { error: "Minimum frame quantity and bulk frame discount percentage are required when applying to frames only" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        cashbackPercentage: cashbackPercentage ? parseFloat(cashbackPercentage) : null,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
        minFrameQuantity: minFrameQuantity ? parseInt(minFrameQuantity) : null,
        bulkFrameDiscountPercentage: bulkFrameDiscountPercentage ? parseFloat(bulkFrameDiscountPercentage) : null,
        applyToFramesOnly: applyToFramesOnly || false,
      },
    });

    return NextResponse.json(promoCode);
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create promo code" },
      { status: 500 }
    );
  }
}

