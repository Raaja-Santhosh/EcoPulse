import { CarbonMath } from './math.js';

describe('CarbonMath - Transport Emissions', () => {
    // Normal cases
    test('calculates correct petrol emissions', () => {
        expect(CarbonMath.calculateTransportEmissions(100, 'petrol')).toBeCloseTo(41.1);
    });

    test('calculates correct electric emissions', () => {
        expect(CarbonMath.calculateTransportEmissions(100, 'electric')).toBeCloseTo(12.0);
    });

    test('calculates correct transit emissions', () => {
        expect(CarbonMath.calculateTransportEmissions(100, 'transit')).toBeCloseTo(8.0);
    });

    test('returns 0 for unknown mode', () => {
        expect(CarbonMath.calculateTransportEmissions(100, 'unknown')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(100, 'diesel')).toBe(0);
    });

    // Boundary limits & negative inputs
    test('boundary: very small positive float', () => {
        expect(CarbonMath.calculateTransportEmissions(1e-323, 'petrol')).toBeCloseTo(0, 10);
    });

    test('negative input returns 0', () => {
        expect(CarbonMath.calculateTransportEmissions(-1, 'petrol')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(-99999, 'petrol')).toBe(0);
    });

    // Empty strings, nulls, undefined, NaN
    test('empty string returns 0', () => {
        expect(CarbonMath.calculateTransportEmissions('', 'petrol')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions('   ', 'petrol')).toBe(0);
    });

    test('null and undefined return 0', () => {
        expect(CarbonMath.calculateTransportEmissions(null, 'petrol')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(undefined, 'petrol')).toBe(0);
    });

    test('NaN returns 0', () => {
        expect(CarbonMath.calculateTransportEmissions(NaN, 'petrol')).toBe(0);
    });

    // Infinity & Massive values
    test('Infinity miles returns Infinity', () => {
        expect(CarbonMath.calculateTransportEmissions(Infinity, 'petrol')).toBe(Infinity);
        expect(CarbonMath.calculateTransportEmissions(-Infinity, 'petrol')).toBe(0); // since parsed <= 0
    });

    test('massive values', () => {
        const maxSafe = Number.MAX_SAFE_INTEGER;
        expect(CarbonMath.calculateTransportEmissions(maxSafe, 'petrol')).toBe(maxSafe * 0.411);
    });

    // Parameter type mismatches
    test('type mismatches and parsable strings', () => {
        expect(CarbonMath.calculateTransportEmissions('100.5', 'petrol')).toBeCloseTo(41.3055);
        expect(CarbonMath.calculateTransportEmissions('100abc', 'petrol')).toBeCloseTo(41.1);
        expect(CarbonMath.calculateTransportEmissions('abc100', 'petrol')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(true, 'petrol')).toBe(0); // parseFloat(true) is NaN
        expect(CarbonMath.calculateTransportEmissions([100], 'petrol')).toBeCloseTo(41.1); // parseFloat([100]) is 100
        expect(CarbonMath.calculateTransportEmissions({}, 'petrol')).toBe(0);
    });

    test('invalid type or case-mismatched modes', () => {
        expect(CarbonMath.calculateTransportEmissions(100, 'PETROL')).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(100, null)).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(100, undefined)).toBe(0);
        expect(CarbonMath.calculateTransportEmissions(100, 123)).toBe(0);
    });

    // Overflow
    test('overflow to Infinity', () => {
        expect(CarbonMath.calculateTransportEmissions(Number.MAX_VALUE, 'petrol')).toBe(Number.MAX_VALUE * 0.411);
        expect(CarbonMath.calculateTransportEmissions(Number.MAX_VALUE * 3, 'petrol')).toBe(Infinity);
    });
});

describe('CarbonMath - Diet Emissions', () => {
    test('valid meal types', () => {
        expect(CarbonMath.calculateDietEmissions('beef')).toBe(7.2);
        expect(CarbonMath.calculateDietEmissions('chicken')).toBe(2.4);
        expect(CarbonMath.calculateDietEmissions('veggie')).toBe(1.1);
        expect(CarbonMath.calculateDietEmissions('vegan')).toBe(0.5);
    });

    test('fallback / unrecognized types', () => {
        expect(CarbonMath.calculateDietEmissions('fish')).toBe(0.5);
        expect(CarbonMath.calculateDietEmissions('')).toBe(0.5);
        expect(CarbonMath.calculateDietEmissions(null)).toBe(0.5);
        expect(CarbonMath.calculateDietEmissions(undefined)).toBe(0.5);
        expect(CarbonMath.calculateDietEmissions(123)).toBe(0.5);
        expect(CarbonMath.calculateDietEmissions(true)).toBe(0.5);
    });
});

describe('CarbonMath - Energy Emissions', () => {
    test('calculates correct energy emissions', () => {
        expect(CarbonMath.calculateEnergyEmissions(100)).toBeCloseTo(38.5);
    });

    test('boundary: very small positive float', () => {
        expect(CarbonMath.calculateEnergyEmissions(1e-323)).toBeCloseTo(0, 10);
    });

    test('negative inputs return 0', () => {
        expect(CarbonMath.calculateEnergyEmissions(-100)).toBe(0);
    });

    test('empty string, null, undefined, NaN return 0', () => {
        expect(CarbonMath.calculateEnergyEmissions('')).toBe(0);
        expect(CarbonMath.calculateEnergyEmissions(null)).toBe(0);
        expect(CarbonMath.calculateEnergyEmissions(undefined)).toBe(0);
        expect(CarbonMath.calculateEnergyEmissions(NaN)).toBe(0);
    });

    test('Infinity and Massive values', () => {
        expect(CarbonMath.calculateEnergyEmissions(Infinity)).toBe(Infinity);
        expect(CarbonMath.calculateEnergyEmissions(1e308 * 3)).toBe(Infinity);
    });

    test('type mismatches', () => {
        expect(CarbonMath.calculateEnergyEmissions('200')).toBeCloseTo(77.0);
        expect(CarbonMath.calculateEnergyEmissions('200abc')).toBeCloseTo(77.0);
        expect(CarbonMath.calculateEnergyEmissions('abc200')).toBe(0);
        expect(CarbonMath.calculateEnergyEmissions([200])).toBeCloseTo(77.0);
        expect(CarbonMath.calculateEnergyEmissions({})).toBe(0);
    });
});

describe('CarbonMath - Waste Savings', () => {
    test('valid waste types', () => {
        expect(CarbonMath.calculateWasteSavings('compost')).toBe(-0.5);
        expect(CarbonMath.calculateWasteSavings('recycle')).toBe(-0.3);
        expect(CarbonMath.calculateWasteSavings('landfill')).toBe(1.5);
    });

    test('fallback / unrecognized types', () => {
        expect(CarbonMath.calculateWasteSavings('hazardous')).toBe(1.5);
        expect(CarbonMath.calculateWasteSavings('')).toBe(1.5);
        expect(CarbonMath.calculateWasteSavings(null)).toBe(1.5);
        expect(CarbonMath.calculateWasteSavings(undefined)).toBe(1.5);
        expect(CarbonMath.calculateWasteSavings(123)).toBe(1.5);
        expect(CarbonMath.calculateWasteSavings(true)).toBe(1.5);
    });
});
