import { describe, it, expect } from '@jest/globals';
import {
  calculateRxTotal,
  PRICES,
  FIXED_PROFIT,
  type LensCategory,
  type Coating,
  type TintType,
  type FrameType,
} from '../rx167';

describe('calculateRxTotal', () => {
  const baseFramePrice = 100.0;
  const baseInput = {
    framePrice: baseFramePrice,
    lensCategory: 'CLEAR_OR_TINT' as LensCategory,
    coating: 'UC' as Coating,
    frameType: 'FULL_FRAME' as FrameType,
    fixedProfit: FIXED_PROFIT,
  };

  describe('Clear lens, no tint', () => {
    it('should calculate tint add-on as 0', () => {
      const result = calculateRxTotal({
        ...baseInput,
        tintType: 'NONE',
      });

      expect(result.breakdown.tintPairAddOn).toBe(0);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.CLEAR_OR_TINT.UC);
      expect(result.breakdown.rxAddOnNet).toBe(
        2 * PRICES.lenses.CLEAR_OR_TINT.UC + PRICES.edging.FULL_FRAME + 0
      );
    });
  });

  describe('Clear lens + Full Tint', () => {
    it('should calculate tint add-on as 6 per pair', () => {
      const result = calculateRxTotal({
        ...baseInput,
        tintType: 'FULL_CATALOG',
      });

      expect(result.breakdown.tintPairAddOn).toBe(PRICES.tinting.FULL_CATALOG);
      expect(result.breakdown.tintPairAddOn).toBe(6);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.CLEAR_OR_TINT.UC);
      expect(result.breakdown.rxAddOnNet).toBe(
        2 * PRICES.lenses.CLEAR_OR_TINT.UC + PRICES.edging.FULL_FRAME + 6
      );
    });
  });

  describe('Clear lens + Gradient', () => {
    it('should calculate tint add-on as 12 per pair', () => {
      const result = calculateRxTotal({
        ...baseInput,
        tintType: 'GRADIENT',
      });

      expect(result.breakdown.tintPairAddOn).toBe(PRICES.tinting.GRADIENT);
      expect(result.breakdown.tintPairAddOn).toBe(12);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.CLEAR_OR_TINT.UC);
      expect(result.breakdown.rxAddOnNet).toBe(
        2 * PRICES.lenses.CLEAR_OR_TINT.UC + PRICES.edging.FULL_FRAME + 12
      );
    });
  });

  describe('Photochromic lens', () => {
    it('should force tint to NONE and add-on = 0 even if tintType is provided', () => {
      const result = calculateRxTotal({
        ...baseInput,
        lensCategory: 'PHOTOCHROMIC_SOLIS' as LensCategory,
        tintType: 'FULL_CATALOG', // Should be ignored
      });

      expect(result.breakdown.tintPairAddOn).toBe(0);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.PHOTOCHROMIC_SOLIS.UC);
      expect(result.breakdown.rxAddOnNet).toBe(
        2 * PRICES.lenses.PHOTOCHROMIC_SOLIS.UC + PRICES.edging.FULL_FRAME + 0
      );
    });
  });

  describe('Polarized lens', () => {
    it('should force tint to NONE and add-on = 0 even if tintType is provided', () => {
      const result = calculateRxTotal({
        ...baseInput,
        lensCategory: 'POLARIZED_NUPOLAR' as LensCategory,
        tintType: 'GRADIENT', // Should be ignored
      });

      expect(result.breakdown.tintPairAddOn).toBe(0);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.POLARIZED_NUPOLAR.UC);
      expect(result.breakdown.rxAddOnNet).toBe(
        2 * PRICES.lenses.POLARIZED_NUPOLAR.UC + PRICES.edging.FULL_FRAME + 0
      );
    });
  });

  describe('Profit calculation', () => {
    it('should add fixed profit of 15 EUR', () => {
      const result = calculateRxTotal({
        ...baseInput,
        tintType: 'NONE',
      });

      expect(result.breakdown.profit).toBe(FIXED_PROFIT);
      expect(result.breakdown.rxRetailNet).toBe(
        result.breakdown.rxAddOnNet + FIXED_PROFIT
      );
    });
  });

  describe('Total calculation', () => {
    it('should include frame price in total', () => {
      const result = calculateRxTotal({
        ...baseInput,
        tintType: 'FULL_CATALOG',
      });

      expect(result.totalNet).toBe(baseFramePrice + result.breakdown.rxRetailNet);
    });
  });

  describe('Blue PRO coating', () => {
    it('should use correct lens price for Blue PRO', () => {
      const result = calculateRxTotal({
        ...baseInput,
        coating: 'BLUE_PRO' as Coating,
        tintType: 'NONE',
      });

      expect(result.breakdown.lensBasePerLens).toBe(PRICES.lenses.CLEAR_OR_TINT.BLUE_PRO);
      expect(result.breakdown.lensesPair).toBe(2 * PRICES.lenses.CLEAR_OR_TINT.BLUE_PRO);
    });
  });

  describe('Different frame types', () => {
    it('should use correct edging fee for each frame type', () => {
      const frameTypes: FrameType[] = [
        'FULL_FRAME',
        'NYLON_FRAME',
        'RIMLESS_PRESSING',
        'RIMLESS_INDIVIDUAL',
        'LINDBERG_COMPLEX',
      ];

      frameTypes.forEach((frameType) => {
        const result = calculateRxTotal({
          ...baseInput,
          frameType,
          tintType: 'NONE',
        });

        expect(result.breakdown.edgingFee).toBe(PRICES.edging[frameType]);
      });
    });
  });
});

