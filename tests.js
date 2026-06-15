// EcoPulse Unit Tests

// Mock calculations matching app.js math
const CarbonMath = {
    calculateTransportEmissions(miles, mode) {
        // Edge Case: Handle non-numbers or negative distance safely
        const parsedMiles = parseFloat(miles);
        if (isNaN(parsedMiles) || parsedMiles <= 0) return 0;

        if (mode === 'petrol') return parsedMiles * 0.411;
        if (mode === 'electric') return parsedMiles * 0.12;
        return parsedMiles * 0.08; // transit
    },
    calculateDietEmissions(mealType) {
        // Edge Case: Fallback for empty/null selections
        if (!mealType) return 0.5; // default to lowest vegan
        if (mealType === 'beef') return 7.2;
        if (mealType === 'chicken') return 2.4;
        if (mealType === 'veggie') return 1.1;
        return 0.5; // vegan
    },
    calculateEnergyEmissions(kwh) {
        // Edge Case: Handle negative KWh
        const parsedKWh = parseFloat(kwh);
        if (isNaN(parsedKWh) || parsedKWh <= 0) return 0;
        return parsedKWh * 0.385;
    },
    calculateWasteSavings(wasteType) {
        if (!wasteType) return 1.5; // default to standard landfill
        if (wasteType === 'compost') return -0.5;
        if (wasteType === 'recycle') return -0.3;
        return 1.5; // landfill
    }
};

// Simple Test Runner
const Suite = {
    tests: [],
    add(name, fn) {
        this.tests.push({ name, fn });
    },
    run(onComplete) {
        let passed = 0;
        let failed = 0;
        const results = [];

        this.tests.forEach(test => {
            try {
                test.fn();
                results.push({ name: test.name, status: 'PASS', error: null });
                passed++;
            } catch (err) {
                results.push({ name: test.name, status: 'FAIL', error: err.message });
                failed++;
            }
        });

        onComplete({ passed, failed, total: this.tests.length, results });
    }
};

// Assertions Helper
const Assert = {
    equal(actual, expected, msg) {
        if (actual !== expected) {
            throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
        }
    },
    closeTo(actual, expected, delta, msg) {
        if (Math.abs(actual - expected) > delta) {
            throw new Error(`${msg || 'Assertion failed'}: expected ${actual} to be close to ${expected} (within ${delta})`);
        }
    }
};

// --- Correctness Tests ---
Suite.add('Transport Petrol Emissions Calculation', () => {
    const emissions = CarbonMath.calculateTransportEmissions(10, 'petrol');
    Assert.closeTo(emissions, 4.11, 0.01, '10 miles on petrol should emit 4.11 kg CO2');
});

Suite.add('Transport Transit Emissions Calculation', () => {
    const emissions = CarbonMath.calculateTransportEmissions(10, 'transit');
    Assert.closeTo(emissions, 0.8, 0.01, '10 miles on transit should emit 0.8 kg CO2');
});

Suite.add('Diet Meat vs Vegan Emissions', () => {
    const beefEmissions = CarbonMath.calculateDietEmissions('beef');
    const veganEmissions = CarbonMath.calculateDietEmissions('vegan');
    Assert.equal(beefEmissions, 7.2, 'Beef meal should be 7.2 kg CO2');
    Assert.equal(veganEmissions, 0.5, 'Vegan meal should be 0.5 kg CO2');
});

Suite.add('Energy Usage KWh Emissions', () => {
    const emissions = CarbonMath.calculateEnergyEmissions(100);
    Assert.closeTo(emissions, 38.5, 0.1, '100 kWh should be 38.5 kg CO2');
});

Suite.add('Waste Composting Credit Savings', () => {
    const savings = CarbonMath.calculateWasteSavings('compost');
    Assert.equal(savings, -0.5, 'Composting should return a carbon credit of -0.5 kg');
});

// --- Edge Case / Robustness Tests ---
Suite.add('Edge Case: Zero Commute Miles Handled', () => {
    const emissions = CarbonMath.calculateTransportEmissions(0, 'petrol');
    Assert.equal(emissions, 0, '0 miles commute should emit exactly 0 kg carbon');
});

Suite.add('Edge Case: Negative Commute Miles Handled Safely', () => {
    const emissions = CarbonMath.calculateTransportEmissions(-5, 'petrol');
    Assert.equal(emissions, 0, 'Negative miles should be caught and return 0 kg carbon');
});

Suite.add('Edge Case: Null/Empty Diet Selector Handled Safely', () => {
    const emissions = CarbonMath.calculateDietEmissions(null);
    Assert.equal(emissions, 0.5, 'Null diet choice should fallback to default vegan index');
});

Suite.add('Edge Case: Negative Energy usage (KWh) Handled Safely', () => {
    const emissions = CarbonMath.calculateEnergyEmissions(-50);
    Assert.equal(emissions, 0, 'Negative energy values should return 0 emissions');
});

Suite.add('Edge Case: Empty Waste Selector Handled Safely', () => {
    const savings = CarbonMath.calculateWasteSavings('');
    Assert.equal(savings, 1.5, 'Empty waste choice should fallback to default landfill emissions');
});

if (typeof window !== 'undefined') {
    window.Suite = Suite;
}
