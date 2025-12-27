import { Metadata } from 'next';

/**
 * Reusable SEO Component for Page-Level Metadata
 * 
 * This component helps maintain consistent SEO across all pages
 * while allowing page-specific customization.
 * 
 * Usage in page.tsx:
 * 
 * export const metadata: Metadata = generatePageMetadata({
 *   title: 'Shop - Premium Sunglasses',
 *   description: 'Browse our collection of premium polarized sunglasses...',
 *   keywords: ['sunglasses', 'eyewear'],
 *   path: '/shop',
 * });
 */

interface PageSEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

const baseUrl = 'https://focusrobin.com';

// English High-Intent Keywords
const englishKeywords = [
  'Premium sunglasses Lithuania',
  'Polarized sunglasses',
  'Minimalist sunglasses',
  'Sunglasses online Lithuania',
  'Designer sunglasses Lithuania',
  'UV400 sunglasses',
  'Buy sunglasses in Lithuania',
  'Sunglasses in Lithuania',
  'FocusRobin',
  'FocusRobin Lithuania',
  'FocusRobin sunglasses',
];

// Lithuanian High-Intent Keywords
const lithuanianKeywords = [
  'akiniai nuo saulės',
  'saulės akiniai internetu',
  'polarizuoti saulės akiniai',
  'akiniai su UV apsauga',
  'akiniai vyrams',
  'akiniai moterims',
  'saulės akiniai Vilnius',
  'saulės akiniai Kaunas',
  'saulės akiniai Klaipėda',
];

// Geo-Targeting Keywords
const geoKeywords = [
  'sunglasses Vilnius',
  'sunglasses Kaunas',
  'sunglasses Klaipėda',
];

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image,
  noindex = false,
  type = 'website',
}: PageSEOProps): Metadata {
  // Combine all keywords
  const allKeywords = [
    ...englishKeywords,
    ...lithuanianKeywords,
    ...geoKeywords,
    ...keywords,
  ];

  // Build full title with Lithuania targeting
  const fullTitle = title.includes('Lithuania') 
    ? `${title} | FocusRobin` 
    : `${title} | FocusRobin Lithuania`;

  // Default description if not provided
  const metaDescription = description || 
    'Elevate your style with FocusRobin\'s minimalist eyewear. Premium polarized sunglasses designed in Lithuania. Fast shipping to Vilnius, Kaunas, Klaipėda, and EU.';

  // Build canonical URL
  const canonicalUrl = `${baseUrl}${path}`;

  // Default OpenGraph image
  const ogImage = image || `${baseUrl}/Symbol Wide Primary light (Teal).svg`;

  return {
    title: fullTitle,
    description: metaDescription,
    keywords: allKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-IE': canonicalUrl,
        'en': canonicalUrl,
        'lt': canonicalUrl, // Lithuanian locale for future expansion
      },
    },
    openGraph: {
      type,
      locale: 'en_IE',
      url: canonicalUrl,
      siteName: 'FocusRobin',
      title: fullTitle,
      description: metaDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Helper function to generate alt text for product images
 * Includes SEO keywords naturally
 */
export function generateImageAltText(
  productName: string,
  context: 'hero' | 'product' | 'gallery' | 'thumbnail' = 'product'
): string {
  const baseText = `${productName} - FocusRobin Premium Sunglasses`;
  
  const contextText = {
    hero: `${productName} - Premium Polarized Sunglasses Lithuania`,
    product: `${productName} - Designer Sunglasses | FocusRobin Lithuania`,
    gallery: `${productName} - Minimalist Sunglasses Collection`,
    thumbnail: `${productName} - UV400 Sunglasses Lithuania`,
  };

  return contextText[context] || baseText;
}

/**
 * Helper function to generate structured data (JSON-LD) for products
 * Improves SEO with rich snippets
 */
export function generateProductStructuredData(product: {
  name: string;
  slug: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
  inStock?: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Premium polarized sunglasses by FocusRobin Lithuania`,
    image: product.image || `${baseUrl}/Symbol Wide Primary light (Teal).svg`,
    brand: {
      '@type': 'Brand',
      name: 'FocusRobin',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: product.currency || 'EUR',
      price: product.price,
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'FocusRobin',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: '1',
    },
  };
}

/**
 * Helper function to generate Organization structured data
 * For homepage and about page
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FocusRobin',
    url: baseUrl,
    logo: `${baseUrl}/Symbol Wide Primary light (Teal).svg`,
    description: 'Premium minimalist sunglasses and eyewear designed in Lithuania. Elevate your style, enhance your vision.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LT',
      addressLocality: 'Lithuania',
    },
    sameAs: [
      // Add social media links here when available
      // 'https://www.facebook.com/focusrobin',
      // 'https://www.instagram.com/focusrobin',
    ],
  };
}

