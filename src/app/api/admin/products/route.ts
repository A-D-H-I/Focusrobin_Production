import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import { auth } from "@/auth";

// GET endpoint for fetching products with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isNewlyAdded = searchParams.get("isNewlyAdded") === "true";
    const isUniqueDesign = searchParams.get("isUniqueDesign") === "true";

    const where: any = {};
    
    // Build where clause based on requested filters
    if (isNewlyAdded) {
      where.isNewlyAdded = true;
    }
    if (isUniqueDesign) {
      where.isUniqueDesign = true;
    }

    let prismaProducts;
    
    try {
      // Try to query with filters
      prismaProducts = (await prisma.product.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          ProductVariant: {
            include: {
              ProductAsset: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to prevent huge responses
      })) as any;
    } catch (dbError: any) {
      // If schema fields don't exist (migration not run), return all products without filter
      if (dbError?.message?.includes("Unknown column") || 
          dbError?.message?.includes("does not exist") ||
          dbError?.code === "P2001") {
        console.warn("Database schema may need migration. Returning all products without filter.");
        prismaProducts = (await prisma.product.findMany({
          include: {
            ProductVariant: {
              include: {
                ProductAsset: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        })) as any;
      } else {
        throw dbError; // Re-throw if it's a different error
      }
    }

    const products = prismaProducts.map(mapPrismaProductToProduct);

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    
    // If it's a database schema error (fields don't exist), return empty array
    if (error?.message?.includes("Unknown column") || error?.message?.includes("does not exist")) {
      console.warn("Database schema may need migration. Returning empty array.");
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch products", details: error?.message },
      { status: 500 }
    );
  }
}

