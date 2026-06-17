/**
 * CarbonMath — Type-safe Carbon Calculation Functions
 *
 * Provides certified emission coefficients and calculation methods
 * for all four EcoPulse activity categories: Transport, Diet, Energy, and Waste.
 *
 * All coefficients are sourced from peer-reviewed environmental datasets:
 * - Transport: EPA 2023 per-mile emission factors
 * - Diet: OWID / Poore & Nemecek (2018) per-serving estimates
 * - Energy: US EPA eGRID 2022 grid average
 * - Waste: EPA WARM Model v15
 */

/** Transport emission coefficients in kg CO₂ per mile. */
const TRANSPORT_COEFFICIENTS: Record<string, number> = {
  petrol: 0.411,
  electric: 0.12,
  transit: 0.08,
} as const;

/** Diet emission coefficients in kg CO₂ per serving. */
const DIET_COEFFICIENTS: Record<string, number> = {
  beef: 7.2,
  chicken: 2.4,
  veggie: 1.1,
  vegan: 0.5,
} as const;

/** Energy grid coefficient in kg CO₂e per kWh. */
const ENERGY_COEFFICIENT = 0.385;

/** Waste coefficients in kg CO₂e (negative = savings, positive = emissions). */
const WASTE_COEFFICIENTS: Record<string, number> = {
  compost: -0.5,
  recycle: -0.3,
  landfill: 1.5,
} as const;

export const CarbonMath = {
  /**
   * Calculate transport emissions for a given distance and commute mode.
   *
   * @param miles - Distance traveled (number or parseable string).
   * @param mode  - Commute mode: 'petrol' | 'electric' | 'transit'.
   * @returns Emissions in kg CO₂. Returns 0 for invalid or non-positive inputs.
   */
  calculateTransportEmissions(miles: number | string, mode: string): number {
    const parsedMiles = typeof miles === 'number' ? miles : parseFloat(miles);
    if (isNaN(parsedMiles) || parsedMiles <= 0) return 0;
    return parsedMiles * (TRANSPORT_COEFFICIENTS[mode] ?? 0);
  },

  /**
   * Retrieve the per-serving emission factor for a given meal type.
   *
   * @param mealType - Diet type: 'beef' | 'chicken' | 'veggie' | 'vegan'.
   * @returns Emissions in kg CO₂ per serving. Defaults to 0.5 (vegan) for unknown types.
   */
  calculateDietEmissions(mealType: string): number {
    if (!mealType) return 0.5;
    return DIET_COEFFICIENTS[mealType] ?? 0.5;
  },

  /**
   * Calculate energy emissions from electricity consumption.
   *
   * @param kwh - Electricity consumed (number or parseable string).
   * @returns Emissions in kg CO₂e. Returns 0 for invalid or non-positive inputs.
   */
  calculateEnergyEmissions(kwh: number | string): number {
    const parsedKWh = typeof kwh === 'number' ? kwh : parseFloat(kwh);
    if (isNaN(parsedKWh) || parsedKWh <= 0) return 0;
    return parsedKWh * ENERGY_COEFFICIENT;
  },

  /**
   * Retrieve the waste impact factor for a given waste handling method.
   *
   * @param wasteType - Waste method: 'compost' | 'recycle' | 'landfill'.
   * @returns Impact in kg CO₂e (negative = savings). Defaults to 1.5 (landfill).
   */
  calculateWasteSavings(wasteType: string): number {
    if (!wasteType) return 1.5;
    return WASTE_COEFFICIENTS[wasteType] ?? 1.5;
  },
};
