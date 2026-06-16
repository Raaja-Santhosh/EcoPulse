// carbonMath.ts - Type-safe Carbon Calculation Functions

export const CarbonMath = {
  calculateTransportEmissions(miles: number | string, mode: string): number {
    const parsedMiles = typeof miles === 'number' ? miles : parseFloat(miles);
    if (isNaN(parsedMiles) || parsedMiles <= 0) return 0;

    if (mode === 'petrol') return parsedMiles * 0.411;
    if (mode === 'electric') return parsedMiles * 0.12;
    if (mode === 'transit') return parsedMiles * 0.08;
    return 0;
  },

  calculateDietEmissions(mealType: string): number {
    if (!mealType) return 0.5; // fallback default
    if (mealType === 'beef') return 7.2;
    if (mealType === 'chicken') return 2.4;
    if (mealType === 'veggie') return 1.1;
    if (mealType === 'vegan') return 0.5;
    return 0.5;
  },

  calculateEnergyEmissions(kwh: number | string): number {
    const parsedKWh = typeof kwh === 'number' ? kwh : parseFloat(kwh);
    if (isNaN(parsedKWh) || parsedKWh <= 0) return 0;
    return parsedKWh * 0.385;
  },

  calculateWasteSavings(wasteType: string): number {
    if (!wasteType) return 1.5;
    if (wasteType === 'compost') return -0.5;
    if (wasteType === 'recycle') return -0.3;
    if (wasteType === 'landfill') return 1.5;
    return 1.5;
  }
};
