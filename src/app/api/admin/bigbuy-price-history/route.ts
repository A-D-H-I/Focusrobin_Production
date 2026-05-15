import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await prisma.priceHistory.findMany({
      where: {
        changedAt: { gte: since },
      },
      orderBy: { changedAt: 'desc' },
      take: 200,
      include: {
        Product: {
          select: { name: true, brand: true, slug: true },
        },
      },
    });

    return NextResponse.json({ history, days });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
