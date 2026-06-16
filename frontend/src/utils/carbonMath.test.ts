import { CarbonMath } from './carbonMath';

describe('CarbonMath Utility Unit Tests', () => {
  describe('calculateTransportEmissions', () => {
    test('valid petrol emissions calculation', () => {
      expect(CarbonMath.calculateTransportEmissions(100, 'petrol')).toBeCloseTo(41.1);
    });

    test('valid electric emissions calculation', () => {
      expect(CarbonMath.calculateTransportEmissions(100, 'electric')).toBeCloseTo(12.0);
    });

    test('valid transit emissions calculation', () => {
      expect(CarbonMath.calculateTransportEmissions(100, 'transit')).toBeCloseTo(8.0);
    });

    test('handles miles as numeric string', () => {
      expect(CarbonMath.calculateTransportEmissions('100.5', 'petrol')).toBeCloseTo(41.3055);
    });

    test('returns 0 for negative, invalid, or empty miles', () => {
      expect(CarbonMath.calculateTransportEmissions(-50, 'petrol')).toBe(0);
      expect(CarbonMath.calculateTransportEmissions('abc', 'petrol')).toBe(0);
      expect(CarbonMath.calculateTransportEmissions(0, 'petrol')).toBe(0);
    });

    test('returns 0 for unknown transport modes', () => {
      expect(CarbonMath.calculateTransportEmissions(100, 'rocket')).toBe(0);
      expect(CarbonMath.calculateTransportEmissions(100, '')).toBe(0);
    });

    test('handles NaN miles', () => {
      expect(CarbonMath.calculateTransportEmissions(NaN, 'petrol')).toBe(0);
    });
  });

  describe('calculateDietEmissions', () => {
    test('calculates correct emission values for diet types', () => {
      expect(CarbonMath.calculateDietEmissions('beef')).toBe(7.2);
      expect(CarbonMath.calculateDietEmissions('chicken')).toBe(2.4);
      expect(CarbonMath.calculateDietEmissions('veggie')).toBe(1.1);
      expect(CarbonMath.calculateDietEmissions('vegan')).toBe(0.5);
    });

    test('returns fallback default for empty or invalid diet categories', () => {
      expect(CarbonMath.calculateDietEmissions('')).toBe(0.5);
      expect(CarbonMath.calculateDietEmissions('junkfood')).toBe(0.5);
    });
  });

  describe('calculateEnergyEmissions', () => {
    test('valid electricity emissions calculation', () => {
      expect(CarbonMath.calculateEnergyEmissions(200)).toBeCloseTo(77.0);
    });

    test('handles kwh as numeric string', () => {
      expect(CarbonMath.calculateEnergyEmissions('200')).toBeCloseTo(77.0);
    });

    test('returns 0 for negative, zero, NaN, or non-numeric kwh', () => {
      expect(CarbonMath.calculateEnergyEmissions(-10)).toBe(0);
      expect(CarbonMath.calculateEnergyEmissions(0)).toBe(0);
      expect(CarbonMath.calculateEnergyEmissions('xyz')).toBe(0);
      expect(CarbonMath.calculateEnergyEmissions(NaN)).toBe(0);
    });
  });

  describe('calculateWasteSavings', () => {
    test('calculates correct values for waste types', () => {
      expect(CarbonMath.calculateWasteSavings('compost')).toBe(-0.5);
      expect(CarbonMath.calculateWasteSavings('recycle')).toBe(-0.3);
      expect(CarbonMath.calculateWasteSavings('landfill')).toBe(1.5);
    });

    test('returns fallback default for empty or invalid waste types', () => {
      expect(CarbonMath.calculateWasteSavings('')).toBe(1.5);
      expect(CarbonMath.calculateWasteSavings('burning')).toBe(1.5);
    });
  });
});
