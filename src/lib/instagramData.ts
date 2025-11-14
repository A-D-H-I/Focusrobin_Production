// All available images from both heroimage and instagramimages folders
export const allInstagramImages = [
  { src: '/heroimage/hero1.jpg', alt: 'FocusRobin Instagram post' },
  { src: '/heroimage/heroimage.jpg', alt: 'FocusRobin Instagram post' },
  { src: '/heroimage/iconic.jpg', alt: 'FocusRobin Instagram post' },
  { src: '/heroimage/IMG_2738.JPG', alt: 'FocusRobin Instagram post' },
  { src: '/instagramimages/IMG_3275.JPG', alt: 'FocusRobin Instagram post' },
  { src: '/instagramimages/IMG_4364.ARW', alt: 'FocusRobin Instagram post' },
];

// Helper function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create 9 images by repeating the available images
function createInstagramImageLinks() {
  const shuffled = shuffleArray(allInstagramImages);
  const repeatedImages = [];
  for (let i = 0; i < 9; i++) {
    repeatedImages.push(shuffled[i % shuffled.length]);
  }
  return shuffleArray(repeatedImages).map((img, index) => ({
    id: index + 1,
    src: img.src,
    alt: `${img.alt} ${index + 1}`,
    link: 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  }));
}

export const instagramImageLinks = createInstagramImageLinks();

