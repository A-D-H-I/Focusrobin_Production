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

const baseUrl = 'https://focusrobin.lt';

// English High-Intent Keywords - Sunglasses
const englishSunglassesKeywords = [
  'Premium sunglasses Lithuania',
  'Polarized sunglasses Lithuania',
  'Minimalist sunglasses',
  'Sunglasses online Lithuania',
  'Designer sunglasses Lithuania',
  'UV400 sunglasses Lithuania',
  'Buy sunglasses in Lithuania',
  'Buy sunglasses online Lithuania',
  'Sunglasses shop Lithuania',
  'Best sunglasses Lithuania',
  'Affordable sunglasses Lithuania',
  'Men sunglasses Lithuania',
  'Women sunglasses Lithuania',
];

// English High-Intent Keywords - Prescription Glasses
const englishPrescriptionKeywords = [
  'Prescription glasses Lithuania',
  'Prescription eyewear Lithuania',
  'Buy prescription glasses online Lithuania',
  'Prescription glasses online Lithuania',
  'Designer prescription glasses Lithuania',
  'Premium prescription eyewear Lithuania',
  'Optical glasses Lithuania',
  'Reading glasses Lithuania',
  'Eyeglasses Lithuania',
  'Eye glasses shop Lithuania',
  'Prescription lenses Lithuania',
  'Optical store Lithuania',
];

// Brand Keywords - Enhanced
const brandKeywords = [
  'FocusRobin',
  'Focus Robin',
  'FocusRobin Lithuania',
  'FocusRobin Lietuva',
  'FocusRobin sunglasses',
  'FocusRobin prescription glasses',
  'FocusRobin eyewear',
  'FocusRobin glasses',
  'buy FocusRobin sunglasses',
  'buy FocusRobin glasses',
  'FocusRobin shop',
];

// Lithuanian High-Intent Keywords - Sunglasses
const lithuanianSunglassesKeywords = [
  'akiniai nuo saulės',
  'saulės akiniai',
  'saulės akiniai internetu',
  'polarizuoti saulės akiniai',
  'akiniai su UV apsauga',
  'akiniai vyrams',
  'akiniai moterims',
  'pigūs saulės akiniai',
  'kokybiški saulės akiniai',
  'dizaineriniai akiniai',
  'saulės akiniai Vilnius',
  'saulės akiniai Kaunas',
  'saulės akiniai Klaipėda',
];

// Lithuanian High-Intent Keywords - Prescription Glasses
const lithuanianPrescriptionKeywords = [
  'korekciniai akiniai',
  'akiniai su dioptrijomis',
  'receptiniai akiniai',
  'korekciniai akiniai internetu',
  'optiniai akiniai Lietuva',
  'akiniai regėjimui',
  'akiniai su lęšiais',
  'optika internetu',
  'akinių parduotuvė',
  'korekciniai akiniai Vilnius',
  'korekciniai akiniai Kaunas',
  'korekciniai akiniai Klaipėda',
];

// Geo-Targeting Keywords - Enhanced
const geoKeywords = [
  'sunglasses Vilnius',
  'sunglasses Kaunas',
  'sunglasses Klaipėda',
  'sunglasses Šiauliai',
  'sunglasses Panevėžys',
  'prescription glasses Vilnius',
  'prescription glasses Kaunas',
  'prescription glasses Klaipėda',
  'eyewear Vilnius',
  'eyewear Kaunas',
  'eyewear Lithuania',
  'optical shop Vilnius',
  'optical shop Lithuania',
  'glasses shop Lithuania',
];

// Combined keyword sets for easy access
const englishKeywords = [...englishSunglassesKeywords, ...englishPrescriptionKeywords, ...brandKeywords];
const lithuanianKeywords = [...lithuanianSunglassesKeywords, ...lithuanianPrescriptionKeywords];

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

  // Map 'product' to 'website' for OpenGraph (OpenGraph doesn't support 'product' type)
  const ogType: 'website' | 'article' = type === 'product' ? 'website' : type;

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
      type: ogType,
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
  context: 'hero' | 'product' | 'gallery' | 'thumbnail' = 'product',
  productType: 'sunglasses' | 'prescription' = 'sunglasses'
): string {
  if (productType === 'prescription') {
    const prescriptionContextText = {
      hero: `${productName} - Premium Prescription Glasses Lithuania`,
      product: `${productName} - Designer Prescription Eyewear | FocusRobin Lithuania`,
      gallery: `${productName} - Prescription Glasses Collection`,
      thumbnail: `${productName} - Prescription Eyewear Lithuania`,
    };
    return prescriptionContextText[context] || `${productName} - FocusRobin Premium Prescription Glasses`;
  }
  
  const sunglassesContextText = {
    hero: `${productName} - Premium Polarized Sunglasses Lithuania`,
    product: `${productName} - Designer Sunglasses | FocusRobin Lithuania`,
    gallery: `${productName} - Minimalist Sunglasses Collection`,
    thumbnail: `${productName} - UV400 Sunglasses Lithuania`,
  };

  return sunglassesContextText[context] || `${productName} - FocusRobin Premium Sunglasses`;
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
  productType?: 'sunglasses' | 'prescription';
}) {
  const isPrescription = product.productType === 'prescription';
  const defaultDescription = isPrescription
    ? `${product.name} - Premium prescription eyewear by FocusRobin Lithuania`
    : `${product.name} - Premium polarized sunglasses by FocusRobin Lithuania`;
  
  // Use /shop/ path for product URLs (consistent with sitemap)
  const productUrl = `${baseUrl}/shop/${product.slug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ? product.description.replace(/<[^>]*>?/gm, '') : defaultDescription,
    image: product.image || `${baseUrl}/Symbol Wide Primary light (Teal).svg`,
    brand: {
      '@type': 'Brand',
      name: 'FocusRobin',
    },
    category: isPrescription ? 'Prescription Eyewear' : 'Sunglasses',
    offers: {
      '@type': 'Offer',
      url: productUrl,
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
    description: 'Premium minimalist sunglasses and prescription eyewear designed in Lithuania. Elevate your style, enhance your vision with polarized sunglasses and prescription glasses.',
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

/**
 * Export keyword arrays for use in other components
 */
export {
  englishSunglassesKeywords,
  englishPrescriptionKeywords,
  brandKeywords,
  lithuanianSunglassesKeywords,
  lithuanianPrescriptionKeywords,
  geoKeywords,
};

