import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promoAvailabilityError, toPromoRules } from "@/lib/promo";

export const dynamic = "force-dynamic";

/**
 * Public coupons: active promo codes the admin marked "show as coupon".
 * Shown on eligible products as "Save X% with coupon".
 */
export async function GET() {
  try {
    const now = new Date();
    const rows = await prisma.promoCode.findMany({
      where: {
        showAsCoupon: true,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    const coupons = rows.filter((row) => !promoAvailabilityError(row, now)).map(toPromoRules);

    return NextResponse.json(
      { coupons },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Error loading coupons:", error);
    return NextResponse.json({ coupons: [] }, { status: 500 });
  }
}
