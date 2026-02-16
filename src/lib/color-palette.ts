/**
 * Standard Color Palette for Color Families
 * Maps normalized color family names (lowercase) to CSS color values or gradients.
 * Used for filters and mega menu to ensure consistent, clean color swatches.
 */
export const COLOR_PALETTE: Record<string, string> = {
    // Basic Colors
    black: '#000000',
    blue: '#2563EB', // A nice vibrant blue
    brown: '#8B4513', // SaddleBrown
    gold: 'radial-gradient(ellipse at center, #FFD700 0%, #B8860B 100%)', // Gold gradient
    green: '#228B22', // ForestGreen
    grey: '#808080',
    gray: '#808080', // Support both spellings
    orange: '#FFA500',
    pink: '#FFC0CB',
    purple: '#800080',
    red: '#EF4444', // Red-500
    silver: 'linear-gradient(135deg, #E0E0E0 0%, #A0A0A0 100%)', // Silver gradient
    white: '#FFFFFF',
    yellow: '#FACC15', // Yellow-400
    beige: '#F5F5DC',

    // Special Finishes
    tortoise: 'linear-gradient(45deg, #3E2723 25%, #D7CCC8 25%, #D7CCC8 50%, #3E2723 50%, #3E2723 75%, #D7CCC8 75%, #D7CCC8 100%)', // Simplified tortoise pattern
    transparent: 'linear-gradient(45deg, #f3f4f6 25%, #ffffff 25%, #ffffff 50%, #f3f4f6 50%, #f3f4f6 75%, #ffffff 75%, #ffffff 100%)', // Subtle checkerboard for transparent
    "pale apricot": '#FFE5B4',

    // Metals
    rose: '#F43F5E', // Rose
    "rose gold": 'linear-gradient(135deg, #F43F5E 0%, #FECDD3 100%)',
    gunmetal: '#2F3542',
};

/**
 * Get CSS background for a color family name
 * Fallback to hex if provided, or a default grey if not found
 */
export function getSwatchBackground(colorFamily: string | null | undefined, fallbackHex?: string): string {
    if (!colorFamily) return fallbackHex || '#E5E7EB'; // Default grey-200 if nothing provided

    const key = colorFamily.toLowerCase().trim();
    return COLOR_PALETTE[key] || fallbackHex || '#E5E7EB';
}
