import type { Metadata } from 'next';

/**
 * Metadata Helper Utilities
 * 
 * Provides consistent Open Graph and Twitter Card metadata across all pages.
 * Ensures complete metadata objects to prevent Next.js from dropping properties
 * when page-level metadata overrides layout metadata.
 */

const METADATA_BASE = 'https://focusrobin.lt';
const SITE_NAME = 'FocusRobin';

/**
 * Get OG image URL
 * Uses raster PNG (1200x630) for optimal social sharing
 */
export function getOGImageUrl(customImage?: string): string {
  if (customImage) {
    // If custom image is provided, normalize it
    const normalized = customImage.startsWith('http') 
      ? customImage 
      : `${METADATA_BASE}${customImage.startsWith('/') ? customImage : `/${customImage}`}`;
    return normalized;
  }
  // Default OG image (should be 1200x630 PNG)
  // TODO: Create /public/og.png (1200x630) and replace this
  return `${METADATA_BASE}/og.png`;
}

/**
 * Create complete Open Graph metadata object
 */
export function createOpenGraphMetadata(options: {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
}): Metadata['openGraph'] {
  const {
    title,
    description,
    url = METADATA_BASE,
    image,
    type = 'website',
  } = options;

  return {
    type,
    locale: 'en_IE',
    url: url.startsWith('http') ? url : `${METADATA_BASE}${url.startsWith('/') ? url : `/${url}`}`,
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: getOGImageUrl(image),
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };
}

/**
 * Create complete Twitter Card metadata object
 */
export function createTwitterMetadata(options: {
  title: string;
  description: string;
  image?: string;
  card?: 'summary' | 'summary_large_image';
}): Metadata['twitter'] {
  const {
    title,
    description,
    image,
    card = 'summary_large_image',
  } = options;

  return {
    card,
    title,
    description,
    images: [getOGImageUrl(image)],
  };
}

/**
 * Create complete metadata object with Open Graph and Twitter
 * Use this helper in page-level generateMetadata() to ensure all properties are included
 */
export function createPageMetadata(options: {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
}): Partial<Metadata> {
  const {
    title,
    description,
    url,
    image,
    type,
    twitterCard,
  } = options;

  return {
    title,
    description,
    openGraph: createOpenGraphMetadata({
      title,
      description,
      url,
      image,
      type,
    }),
    twitter: createTwitterMetadata({
      title,
      description,
      image,
      card: twitterCard,
    }),
  };
}

