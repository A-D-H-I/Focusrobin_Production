import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PUT - Update promo code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (required in Next.js 15)
    const { id } = await params;
    
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
    } = body;

    // Check if code already exists (excluding current promo code)
    if (code) {
      const existing = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase().trim() },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "A promo code with this code already exists" },
          { status: 400 }
        );
      }
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(discountPercentage !== undefined && {
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        }),
        ...(discountAmount !== undefined && {
          discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        }),
        ...(cashbackPercentage !== undefined && {
          cashbackPercentage: cashbackPercentage ? parseFloat(cashbackPercentage) : null,
        }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(usageLimit !== undefined && {
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
        }),
        ...(minPurchaseAmount !== undefined && {
          minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
        }),
      },
    });

    return NextResponse.json(promoCode);
  } catch (error: any) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update promo code" },
      { status: 500 }
    );
  }
}

// DELETE - Delete promo code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (required in Next.js 15)
    const { id } = await params;
    
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}

