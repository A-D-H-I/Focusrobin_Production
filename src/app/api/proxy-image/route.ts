import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route to serve S3 images and bypass CORS issues
 * Usage: /api/proxy-image?url=https://focusrobin.s3.eu-central-1.amazonaws.com/...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate that the URL is from S3 (security check)
    const allowedDomains = [
      'focusrobin.s3.eu-central-1.amazonaws.com',
      'focusrobin.s3.amazonaws.com',
      '.s3.eu-central-1.amazonaws.com',
      '.s3.amazonaws.com',
    ];

    const urlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Invalid image URL domain' },
        { status: 403 }
      );
    }

    // Fetch the image from S3
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









