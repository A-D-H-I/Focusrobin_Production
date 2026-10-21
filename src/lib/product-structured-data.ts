import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { SITE_URL } from '@/i18n/config';

/** Brand logo used when a product has no images (path URL-encoded: it contains spaces) */
export const SITE_LOGO_URL = `${SITE_URL}/${encodeURIComponent('Symbol Wide Primary light (Teal).svg')}`;

interface ProductLike {
  name: string;
  description?: string | null;
  brand?: string | null;
  price: string;
  averageRating?: number | null;
  reviewCount?: number | null;
  variants: { sku?: string | null; stock?: number | null; thumbnail?: string; images?: string[] }[];
}

interface ProductSchemaOptions {
  slug: string;
  /** Prescription glasses are made to order: different delivery times and no change-of-mind returns */
  kind: 'sunglasses' | 'eyeglasses';
}

// Mirrors the published shipping and returns policies (/shipping, /returns)
const LITHUANIA_SHIPPING = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'EUR' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'LT' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
  },
};

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'LT',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
};

function absoluteImageUrl(img: string): string {
  const normalized = normalizeImageUrl(img);
  return normalized.startsWith('http') ? normalized : `${SITE_URL}${normalized}`;
}

/** schema.org Product markup for a product detail page */
export function buildProductSchema(product: ProductLike, { slug, kind }: ProductSchemaOptions) {
  const images = product.variants
    .flatMap((v) => (v.images && v.images.length > 0 ? v.images : [v.thumbnail]))
    .filter((img): img is string => Boolean(img))
    .map(absoluteImageUrl);

  const price = Number(product.price.replace(/[^\d.]/g, '')) || 0;
  const brand = product.brand?.trim() || 'FocusRobin';
  const skus = product.variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
  const url = `${SITE_URL}/shop/${slug}`;
  const typeLabel = kind === 'eyeglasses' ? 'prescription glasses' : 'sunglasses';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - ${brand} ${typeLabel} from FocusRobin`,
    image: images.length > 0 ? [...new Set(images)] : [SITE_LOGO_URL],
    url,
    ...(skus[0] && { sku: skus[0] }),
    category: kind === 'eyeglasses' ? 'Prescription Glasses' : 'Sunglasses',
    brand: { '@type': 'Brand', name: brand },
    ...(price > 0 && {
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'EUR',
        price: price.toFixed(2),
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.variants.some((v) => (v.stock ?? 0) > 0)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'FocusRobin' },
        // Made-to-order prescription lenses ship on a different schedule and are not returnable
        ...(kind === 'sunglasses' && {
          shippingDetails: LITHUANIA_SHIPPING,
          hasMerchantReturnPolicy: RETURN_POLICY,
        }),
      },
    }),
    ...(product.averageRating && product.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating.toString(),
            reviewCount: product.reviewCount.toString(),
          },
        }
      : {}),
  };
}
