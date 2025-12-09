import { NextRequest, NextResponse } from 'next/server';
import { getCurrencyForCountry } from '@/lib/country-currency';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to detect user's location from IP address
 * Returns the suggested currency based on country
 * 
 * Uses free IP geolocation services:
 * 1. ipapi.co (primary)
 * 2. ip-api.com (fallback)
 */
export async function GET(request: NextRequest) {
  try {
    // TEST MODE: Allow testing with ?testCountry=XX query parameter (development only)
    const { searchParams } = new URL(request.url);
    const testCountry = searchParams.get('testCountry');
    
    if (testCountry && process.env.NODE_ENV === 'development') {
      const currency = getCurrencyForCountry(testCountry);
      return NextResponse.json({
        country: testCountry.toUpperCase(),
        countryName: `Test Country (${testCountry})`,
        currency,
        ip: 'test-mode',
        source: 'test-mode',
      });
    }
    
    // Get client IP from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Extract IP address (handle comma-separated list in x-forwarded-for)
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    // If no IP found in headers, try to get from request
    if (!clientIp || clientIp === 'unknown') {
      try {
        clientIp = (request as any).ip || 'unknown';
      } catch {
        clientIp = 'unknown';
      }
    }
    
    // For localhost/private IPs, we'll call the geolocation API without specifying IP
    // The API will automatically detect the caller's public IP (works with VPN)
    const isLocalhost = !clientIp || clientIp === 'unknown' || clientIp === 'localhost' || 
                       clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || 
                       clientIp.startsWith('10.') || clientIp.startsWith('172.');
    
    // If localhost, we'll use the API's auto-detection (call without IP parameter)
    // This allows VPN to work even when server sees localhost
    
    // Try ipapi.co first (free tier: 1000 requests/day)
    // If localhost, call without IP to auto-detect caller's IP (works with VPN)
    try {
      const ipapiUrl = isLocalhost 
        ? 'https://ipapi.co/json/'  // Auto-detect caller's IP
        : `https://ipapi.co/${clientIp}/json/`;  // Use detected IP
      
      const ipapiResponse = await fetch(ipapiUrl, {
        headers: {
          'User-Agent': 'FocusRobin/1.0',
        },
        cache: 'no-store', // Don't cache in API routes
      });
      
      if (ipapiResponse.ok) {
        const data = await ipapiResponse.json();
        
        if (data.error) {
          throw new Error(data.reason || 'IP API error');
        }
        
        const countryCode = data.country_code || data.country;
        const currency = getCurrencyForCountry(countryCode);
        const detectedIp = data.ip || clientIp || 'unknown';
        
        return NextResponse.json({
          country: countryCode,
          countryName: data.country_name,
          currency,
          ip: detectedIp,
          source: 'ipapi.co',
        });
      }
    } catch (ipapiError) {
      console.log('ipapi.co failed, trying fallback:', ipapiError);
    }
    
    // Fallback to ip-api.com (free tier: 45 requests/minute)
    // If localhost, call without IP to auto-detect caller's IP
    try {
      const ipApiUrl = isLocalhost
        ? 'http://ip-api.com/json?fields=status,message,country,countryCode,query'
        : `http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode`;
      
      const ipApiResponse = await fetch(ipApiUrl, {
        cache: 'no-store', // Don't cache in API routes
      });
      
      if (ipApiResponse.ok) {
        const data = await ipApiResponse.json();
        
        if (data.status === 'success' && data.countryCode) {
          const currency = getCurrencyForCountry(data.countryCode);
          const detectedIp = data.query || clientIp || 'unknown';
          
          return NextResponse.json({
            country: data.countryCode,
            countryName: data.country,
            currency,
            ip: detectedIp,
            source: 'ip-api.com',
          });
        }
      }
    } catch (ipApiError) {
      console.log('ip-api.com failed:', ipApiError);
    }
    
    // If all services fail, return EUR as default
    return NextResponse.json({
      country: null,
      currency: 'EUR',
      ip: clientIp,
      source: 'fallback',
      error: 'Could not determine location',
    });
    
  } catch (error) {
    console.error('Error detecting location:', error);
    
    // Return EUR as safe default
    return NextResponse.json({
      country: null,
      currency: 'EUR',
      ip: 'unknown',
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

