import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

/**
 * GET /api/currency/rates
 * Returns all exchange rates from database (with automatic refresh if stale)
 */
export async function GET() {
  try {
    const rates = await getExchangeRates();
    
    return NextResponse.json({
      success: true,
      rates,
      baseCurrency: 'EUR',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch currency rates',
        // Return default rates as fallback
        rates: {
          EUR: { code: 'EUR', rate: 1.0, symbol: '€', name: 'Euro' },
          USD: { code: 'USD', rate: 1.08, symbol: '$', name: 'US Dollar' },
          GBP: { code: 'GBP', rate: 0.86, symbol: '£', name: 'British Pound' },
        },
      },
      { status: 500 }
    );
  }
}

