import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import type { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET endpoint for product search suggestions
 * Returns up to 8 product suggestions based on search query
 * Searches both sunglasses (Product) and prescription glasses (PrescriptionGlasses)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchTerm = query.trim();

    // Search both sunglasses and prescription glasses in parallel
    const [sunglassesProducts, prescriptionProducts] = await Promise.all([
      // Sunglasses (Product model)
      prisma.product.findMany({
        where: {
          ProductVariant: { some: { stock: { gt: 0 } } },
          OR: [
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
                  stock: { gt: 0 },
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
        take: 5, // Take 5 from sunglasses to leave room for prescription
        orderBy: {
          createdAt: 'desc',
        },
      }),

      // Prescription Glasses (PrescriptionGlasses model)
      prisma.prescriptionGlasses.findMany({
        where: {
          PrescriptionGlassesVariant: { some: { stock: { gt: 0 } } },
          OR: [
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
              PrescriptionGlassesVariant: {
                some: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                  stock: { gt: 0 },
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
          PrescriptionGlassesVariant: {
            select: {
              PrescriptionGlassesAsset: {
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
        take: 5, // Take 5 from prescription glasses
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Format sunglasses suggestions
    const sunglassesSuggestions = sunglassesProducts.map((product) => {
      const variant = product.ProductVariant[0];
      const rawImage = variant?.ProductAsset[0]?.url || null;
      const image = rawImage ? normalizeImageUrl(rawImage) : null;
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.Category?.name || 'Sunglasses',
        image: image,
        price: Number(product.basePrice),
        productType: 'sunglasses' as const,
      };
    });

    // Format prescription glasses suggestions
    const prescriptionSuggestions = prescriptionProducts.map((product) => {
      const variant = product.PrescriptionGlassesVariant[0];
      const rawImage = variant?.PrescriptionGlassesAsset[0]?.url || null;
      const image = rawImage ? normalizeImageUrl(rawImage) : null;
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.Category?.name || 'Eyeglasses',
        image: image,
        price: Number(product.basePrice),
        productType: 'eyeglasses' as const,
      };
    });

    // Combine and limit to 8 total suggestions
    const allSuggestions = [...sunglassesSuggestions, ...prescriptionSuggestions]
      .slice(0, 8);

    return NextResponse.json({ suggestions: allSuggestions });
  } catch (error: any) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}

