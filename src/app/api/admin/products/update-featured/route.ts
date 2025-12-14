import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productIds, field } = body;

    if (!Array.isArray(productIds) || !field) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (field !== "isNewlyAdded" && field !== "isUniqueDesign") {
      return NextResponse.json(
        { error: "Invalid field. Must be 'isNewlyAdded' or 'isUniqueDesign'" },
        { status: 400 }
      );
    }

    // First, set all products to false for this field
    await prisma.product.updateMany({
      data: {
        [field]: false,
      },
    });

    // Then, set selected products to true
    // Note: productIds might be slugs (from frontend) or database IDs
    // Try to match by slug first, then by id
    if (productIds.length > 0) {
      // Find products by slug (since frontend uses slug as id)
      const productsBySlug = await prisma.product.findMany({
        where: {
          slug: {
            in: productIds,
          },
        },
        select: {
          id: true,
        },
      });
      
      // Also try to find by id in case some are actual database IDs
      const productsById = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
        },
      });
      
      // Combine and get unique IDs
      const allProductIds = [
        ...productsBySlug.map(p => p.id),
        ...productsById.map(p => p.id)
      ];
      const uniqueProductIds = [...new Set(allProductIds)];
      
      if (uniqueProductIds.length > 0) {
        const updateResult = await prisma.product.updateMany({
          where: {
            id: {
              in: uniqueProductIds,
            },
          },
          data: {
            [field]: true,
          },
        });
        
        console.log(`Updated ${updateResult.count} products with ${field}=true (matched ${uniqueProductIds.length} out of ${productIds.length} requested)`);
      } else {
        console.warn(`No products found matching the provided IDs/slugs: ${productIds.join(', ')}`);
      }
    }

    // Verify the update worked
    const verifyCount = await prisma.product.count({
      where: {
        [field]: true,
      },
    });
    
    console.log(`Verification: ${verifyCount} products now have ${field}=true`);

    return NextResponse.json({ 
      success: true, 
      updated: productIds.length,
      verified: verifyCount 
    });
  } catch (error: any) {
    console.error("Error updating featured products:", error);
    
    // If it's a database schema error (fields don't exist), return helpful message
    if (error?.message?.includes("Unknown column") || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database migration required", 
          message: "Please run: npx prisma migrate dev --name add_featured_product_flags" 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update products", details: error?.message },
      { status: 500 }
    );
  }
}

