import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import type { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET endpoint for product search suggestions
 * Returns up to 8 product suggestions based on search query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    // Optimized search - prioritize name matches first for faster results
    const products = await prisma.product.findMany({
      where: {
        OR: [
          // Prioritize name matches (most common search)
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            Category: {
              name: {
                contains: searchTerm,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
          {
            ProductVariant: {
              some: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        Category: {
          select: {
            name: true,
          },
        },
        ProductVariant: {
          select: {
            ProductAsset: {
              where: { isPrimary: true },
              take: 1,
              select: {
                url: true,
              },
            },
          },
          take: 1,
        },
      },
      take: 8, // Limit to 8 suggestions
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format suggestions
    const suggestions = products.map((product) => {
      const variant = product.ProductVariant[0];
      const rawImage = variant?.ProductAsset[0]?.url || null;
      const image = rawImage ? normalizeImageUrl(rawImage) : null;
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.Category?.name || null,
        image: image,
        price: Number(product.basePrice),
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}

