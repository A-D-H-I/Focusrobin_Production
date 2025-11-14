// src/lib/productData.ts

export interface ProductColorVariant {
  name: string;
  hex: string;
  // Each color now has its own gallery of images
  images: string[]; 
}

export interface Product {
  id: string; // Used for the URL, e.g., /products/solaris-rounds
  name: string;
  price: string;
  cashback: string; // Added from your screenshot
  
  // Replaced simple 'image' and 'colors' with a full variant system
  variants: ProductColorVariant[];
  
  // --- Additional Information ---
  categories: string[]; // For filtering (e.g., ['Sunglass', 'Women'])
  warranty: string;
  description: string;
  lensMaterial: string;
  frameMaterial: string;
  uvProtection: string;
  size: {
    lensWidth: string;
    bridge: string;
    temple: string;
  };
}

export const productCatalog: Product[] = [
  {
    id: 'solaris-rounds',
    name: 'Solaris Rounds',
    price: '€159.99',
    cashback: '€6.00 CASHBACK',
    variants: [
      { 
        name: 'Sand', 
        hex: '#C4A574',
        images: [
          '/images/products/solaris-sand-1.jpg', // Main image
          '/images/products/solaris-sand-2.jpg', // Side view
          '/images/products/solaris-sand-3.jpg', // On model
        ]
      },
      { 
        name: 'Ocean', 
        hex: '#1C3142',
        images: [
          '/images/products/solaris-ocean-1.jpg',
          '/images/products/solaris-ocean-2.jpg',
        ]
      },
    ],
    categories: ['Sunglass', 'Unisex'],
    warranty: '1 Year Warranty',
    description: 'Iconic round frames with a keyhole bridge, crafted from lightweight acetate for all-day comfort. Perfect for a timeless, intellectual look.',
    lensMaterial: 'Nylon',
    frameMaterial: 'Partially Bio Based Acetate',
    uvProtection: 'UV 400, 100% Protection',
    size: {
      lensWidth: '49mm',
      bridge: '20mm',
      temple: '145mm',
    },
  },
  {
    id: 'catalyst-cat-eye',
    name: 'Catalyst Cat-Eye',
    price: '€139.99',
    cashback: '€5.00 CASHBACK',
    variants: [
      { 
        name: 'Atomic Pink', 
        hex: '#F56278',
        images: [
          '/images/products/catalyst-pink-1.jpg',
          '/images/products/catalyst-pink-2.jpg',
        ]
      },
      { 
        name: 'Jet Black', 
        hex: '#000000',
        images: [
          '/images/products/catalyst-black-1.jpg',
        ]
      },
    ],
    categories: ['Sunglass', 'Women'],
    warranty: '1 Year Warranty',
    description: 'A bold, upswept cat-eye design that adds a touch of retro glamour to any outfit. Made from high-quality acetate.',
    lensMaterial: 'Polycarbonate',
    frameMaterial: 'Acetate',
    uvProtection: 'UV 400, 100% Protection',
    size: {
      lensWidth: '52mm',
      bridge: '18mm',
      temple: '145mm',
    },
  },
  // Add all your other products here...
];