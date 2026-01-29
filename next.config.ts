import type { NextConfig } from 'next';

/**
 * Enterprise-Grade Next.js Configuration
 * Includes security headers and CSP configuration
 */

// Content Security Policy configuration
// Adjust these based on your actual external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://*.google-analytics.com https://apis.google.com https://connect.facebook.net https://www.clarity.ms https://*.clarity.ms https://cdn.jsdelivr.net https://storage.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https: http:;
  connect-src 'self' https://api.stripe.com https://*.google-analytics.com https://www.googletagmanager.com https://api.exchangerate-api.com https://*.googleapis.com https://storage.googleapis.com https://ipapi.co https://connect.facebook.net https://*.facebook.com https://www.clarity.ms https://*.clarity.ms https://*.bing.com https://cdn.jsdelivr.net wss: ws:;
  worker-src 'self' blob: https://cdn.jsdelivr.net;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com https://www.facebook.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  // Strict Transport Security - Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // XSS Protection (for older browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Permissions Policy - Control browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  // Prevent DNS prefetching
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
];

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Standalone output for VPS deployment
// Disabled on Windows due to symlink permission issues (EPERM)
// Enable via NEXT_STANDALONE=true environment variable
const shouldUseStandalone = process.env.NEXT_STANDALONE === 'true' || process.platform !== 'win32';

const nextConfig: NextConfig = {
  // Standalone output for VPS deployment
  // This creates a minimal server.js file with only necessary dependencies
  ...(shouldUseStandalone ? { output: 'standalone' as const } : {}),

  // Security headers applied to all routes
  // In development, we apply CSP with MediaPipe support
  async headers() {
    // In development, still apply CSP but ensure MediaPipe works
    if (isDev) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: ContentSecurityPolicy,
            },
            ...securityHeaders.filter(h => h.key !== 'Content-Security-Policy'),
          ],
        },
      ];
    }

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          ...securityHeaders,
          // Cache-Control for static assets (images, fonts, etc.)
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // HTML pages - short cache for SSR content
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // API routes - no cache
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // Static assets (Next.js generated)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Images
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Optimize for faster navigation
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // TypeScript and ESLint configuration
  // Note: In production, consider enabling these checks
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image domains configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.theglasswarehouse.co.uk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'focusrobin.s3.eu-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow unoptimized images for local file paths and network access
    // This ensures images work when accessing via network IP
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Powered by header removal (security through obscurity)
  poweredByHeader: false,
};

export default nextConfig;
