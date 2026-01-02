import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/checkout/',
          '/account/',
          '/cart/',
          '/wishlist/',
          '/chat/',
          '/try-on/',
        ],
      },
    ],
    sitemap: 'https://focusrobin.lt/sitemap.xml',
  };
}

