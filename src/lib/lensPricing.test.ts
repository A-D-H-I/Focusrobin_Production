/**
 * Unit tests for lens pricing module
 */

import {
  calculateLensPairTotal,
  getAllowedCoatings,
  getFromPricePair,
  getSupportedIndexes,
  getBasePairPrice,
  getCoatingDeltaPair,
  normalizeSelection,
  type LensSelection,
} from './lensPricing';

describe('lensPricing', () => {
  describe('getSupportedIndexes', () => {
    it('should return all indices for CLEAR', () => {
      const indices = getSupportedIndexes('CLEAR');
      expect(indices).toEqual(['1.56', '1.60', '1.67']);
    });

    it('should return all indices for TINTED', () => {
      const indices = getSupportedIndexes('TINTED');
      expect(indices).toEqual(['1.56', '1.60', '1.67']);
    });

    it('should return all indices for PHOTOCHROMIC_SOLIS', () => {
      const indices = getSupportedIndexes('PHOTOCHROMIC_SOLIS');
      expect(indices).toEqual(['1.56', '1.60', '1.67']);
    });

    it('should return only 1.60 and 1.67 for POLARIZED_NUPOLAR', () => {
      const indices = getSupportedIndexes('POLARIZED_NUPOLAR');
      expect(indices).toEqual(['1.60', '1.67']);
    });
  });

  describe('getAllowedCoatings', () => {
    it('should return UC and BLUE_PRO for CLEAR', () => {
      const coatings = getAllowedCoatings('CLEAR');
      expect(coatings).toEqual(['UC', 'BLUE_PRO']);
    });

    it('should return only SERICUM_UV for TINTED (no BLUE_PRO)', () => {
      const coatings = getAllowedCoatings('TINTED');
      expect(coatings).toEqual(['SERICUM_UV']);
    });

    it('should return SERICUM_UV and BLUE_PRO for PHOTOCHROMIC_SOLIS', () => {
      const coatings = getAllowedCoatings('PHOTOCHROMIC_SOLIS');
      expect(coatings).toEqual(['SERICUM_UV', 'BLUE_PRO']);
    });

    it('should return only SERICUM_UV for POLARIZED_NUPOLAR (no BLUE_PRO)', () => {
      const coatings = getAllowedCoatings('POLARIZED_NUPOLAR');
      expect(coatings).toEqual(['SERICUM_UV']);
    });
  });

  describe('getBasePairPrice', () => {
    it('should calculate CLEAR 1.67 UC base pair = 50.14', () => {
      expect(getBasePairPrice('CLEAR', '1.67', 'UC')).toBe(50.14);
    });

    it('should calculate CLEAR 1.67 BLUE_PRO base pair = 62.14', () => {
      expect(getBasePairPrice('CLEAR', '1.67', 'BLUE_PRO')).toBe(62.14);
    });

    it('should calculate TINTED 1.67 SERICUM_UV base pair = 62.14', () => {
      expect(getBasePairPrice('TINTED', '1.67', 'SERICUM_UV')).toBe(62.14);
    });

    it('should return 0 for POLARIZED 1.56 (not available)', () => {
      expect(getBasePairPrice('POLARIZED_NUPOLAR', '1.56', 'SERICUM_UV')).toBe(0);
    });
  });

  describe('getCoatingDeltaPair', () => {
    it('should calculate CLEAR 1.67 BLUE_PRO delta vs UC = 12.00', () => {
      const delta = getCoatingDeltaPair('CLEAR', '1.67', 'BLUE_PRO');
      expect(delta).toBe(12.00); // (31.07 - 25.07) * 2 = 12.00
    });

    it('should return 0 for cheapest coating', () => {
      const delta = getCoatingDeltaPair('CLEAR', '1.67', 'UC');
      expect(delta).toBe(0);
    });

    it('should return 0 for TINTED when SERICUM_UV and BLUE_PRO are same price', () => {
      const delta = getCoatingDeltaPair('TINTED', '1.67', 'BLUE_PRO');
      expect(delta).toBe(0); // Both are 31.07 per lens, so same price
    });
  });

  describe('calculateLensPairTotal', () => {
    it('should calculate correctly for CLEAR 1.67 UC', () => {
      const selection: LensSelection = {
        lensType: 'CLEAR',
        lensIndex: '1.67',
        coating: 'UC',
      };
      expect(calculateLensPairTotal(selection)).toBe(50.14);
    });

    it('should calculate correctly for CLEAR 1.67 BLUE_PRO', () => {
      const selection: LensSelection = {
        lensType: 'CLEAR',
        lensIndex: '1.67',
        coating: 'BLUE_PRO',
      };
      expect(calculateLensPairTotal(selection)).toBe(62.14);
    });

    it('should calculate correctly for TINTED 1.67 SERICUM_UV + FULL_TINT_CATALOG', () => {
      const selection: LensSelection = {
        lensType: 'TINTED',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        tintType: 'FULL_TINT_CATALOG',
        tintColor: 'Grey',
        tintShade: 70,
      };
      expect(calculateLensPairTotal(selection)).toBe(68.14); // 62.14 + 6.00
    });

    it('should calculate correctly for TINTED 1.67 GRADIENT', () => {
      const selection: LensSelection = {
        lensType: 'TINTED',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        tintType: 'GRADIENT',
        tintColor: 'Brown',
        tintRecipe: '50->0',
      };
      expect(calculateLensPairTotal(selection)).toBe(70.14); // 62.14 + 8.00 (PDF price)
    });

    it('should calculate correctly for PHOTOCHROMIC_SOLIS 1.67 SERICUM_UV', () => {
      const selection: LensSelection = {
        lensType: 'PHOTOCHROMIC_SOLIS',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        photochromicColor: 'Brown',
      };
      expect(calculateLensPairTotal(selection)).toBe(77.80);
    });

    it('should calculate correctly for POLARIZED_NUPOLAR 1.67 SERICUM_UV', () => {
      const selection: LensSelection = {
        lensType: 'POLARIZED_NUPOLAR',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        polarizedColor: 'Green',
      };
      expect(calculateLensPairTotal(selection)).toBe(129.24);
    });
  });

  describe('normalizeSelection', () => {
    it('should normalize POLARIZED 1.56 to 1.60', () => {
      const selection: LensSelection = {
        lensType: 'POLARIZED_NUPOLAR',
        lensIndex: '1.56', // Invalid
        coating: 'SERICUM_UV',
        polarizedColor: 'Brown',
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.lensIndex).toBe('1.60');
    });

    it('should auto-correct TINTED + UC to SERICUM_UV', () => {
      const selection: LensSelection = {
        lensType: 'TINTED',
        lensIndex: '1.67',
        coating: 'UC', // Invalid
        tintType: 'FULL_TINT_CATALOG',
        tintColor: 'Grey',
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.coating).toBe('SERICUM_UV');
    });

    it('should auto-correct CLEAR + SERICUM_UV to UC', () => {
      const selection: LensSelection = {
        lensType: 'CLEAR',
        lensIndex: '1.67',
        coating: 'SERICUM_UV', // Invalid for CLEAR
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.coating).toBe('UC'); // First allowed coating
    });

    it('should clear tint fields for non-TINTED lens types', () => {
      const selection: LensSelection = {
        lensType: 'CLEAR',
        lensIndex: '1.67',
        coating: 'UC',
        tintType: 'FULL_TINT_CATALOG', // Should be cleared
        tintColor: 'Brown',
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.tintType).toBeUndefined();
      expect(normalized.tintColor).toBeUndefined();
    });

    it('should auto-set tint defaults for TINTED', () => {
      const selection: LensSelection = {
        lensType: 'TINTED',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        // Missing tintType and tintColor
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.tintType).toBe('FULL_TINT_CATALOG');
      expect(normalized.tintColor).toBe('Grey');
      expect(normalized.tintShade).toBe(70); // Default for Grey
    });

    it('should auto-set gradient recipe for GRADIENT tint', () => {
      const selection: LensSelection = {
        lensType: 'TINTED',
        lensIndex: '1.67',
        coating: 'SERICUM_UV',
        tintType: 'GRADIENT',
        tintColor: 'Brown',
      };
      const normalized = normalizeSelection(selection);
      expect(normalized.tintRecipe).toBe('50->0');
      expect(normalized.tintShade).toBeUndefined();
    });
  });

  describe('getFromPricePair', () => {
    // Note: getFromPricePair adds €15 profit to the base price
    it('should return correct from price for CLEAR 1.67 (with profit)', () => {
      // UC base pair €50.14 + €15 profit = €65.14
      expect(getFromPricePair('CLEAR', '1.67')).toBe(65.14);
    });

    it('should return correct from price for TINTED 1.67 (with profit)', () => {
      // SERICUM_UV base €62.14 + Full Tint €6.00 + €15 profit = €83.14
      expect(getFromPricePair('TINTED', '1.67')).toBe(83.14);
    });

    it('should return correct from price for PHOTOCHROMIC_SOLIS 1.67 (with profit)', () => {
      // SERICUM_UV base €77.80 + €15 profit = €92.80
      expect(getFromPricePair('PHOTOCHROMIC_SOLIS', '1.67')).toBe(92.80);
    });

    it('should return correct from price for POLARIZED_NUPOLAR 1.67 (with profit)', () => {
      // SERICUM_UV base €129.24 + €15 profit = €144.24
      expect(getFromPricePair('POLARIZED_NUPOLAR', '1.67')).toBe(144.24);
    });
  });
});
