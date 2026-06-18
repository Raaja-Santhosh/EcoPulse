import React, { useState } from 'react';
import { useEcoPulseStore } from '../store';
import { Zap, Car, Leaf, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  id: number;
  category: 'energy' | 'transport' | 'diet' | 'waste';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  options: {
    label: string;
    description: string;
    value: number; // Annualized tons of CO2e for this selection
    emoji: string;
  }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'energy',
    title: 'Home Heating & Cooling',
    subtitle: "What is your household's primary heating and cooling source?",
    icon: <Zap className="w-12 h-12 text-[#d4a359]" />,
    options: [
      { emoji: '🔌', label: 'Electricity / Heat Pump', description: 'Highly efficient, electric powered grid option', value: 1.5 },
      { emoji: '🔥', label: 'Natural Gas', description: 'Standard residential gas boiler heating', value: 3.8 },
      { emoji: '🛢️', label: 'Heating Oil / Coal', description: 'High emission legacy heating fuels', value: 5.5 },
    ],
  },
  {
    id: 2,
    category: 'transport',
    title: 'Daily Commute',
    subtitle: 'How do you primarily commute to work, school, or activities?',
    icon: <Car className="w-12 h-12 text-[#c87a53]" />,
    options: [
      { emoji: '🚲', label: 'Walk / Bike / Active Transit', description: 'Zero emissions commuting', value: 0.1 },
      { emoji: '🚌', label: 'Public Transit', description: 'Shared bus, light rail, or train transit', value: 1.2 },
      { emoji: '⚡', label: 'Electric Vehicle (EV)', description: 'Electric powered personal vehicle', value: 2.0 },
      { emoji: '🚗', label: 'Petrol / Diesel Car', description: 'Standard fossil fuel personal vehicle', value: 4.5 },
    ],
  },
  {
    id: 3,
    category: 'diet',
    title: 'Daily Nutrition',
    subtitle: 'Which statement best describes your typical weekly diet?',
    icon: <Leaf className="w-12 h-12 text-[#4a6b5d]" />,
    options: [
      { emoji: '🥗', label: 'Vegan / Plant-Based', description: 'Completely free of animal products', value: 1.2 },
      { emoji: '🥚', label: 'Vegetarian', description: 'No meat, but consumes eggs & dairy products', value: 1.8 },
      { emoji: '🍗', label: 'Poultry & Fish', description: 'White meats only, avoids high emission red meats', value: 2.6 },
      { emoji: '🥩', label: 'Regular Meat Eater', description: 'Frequent consumption of red meats (beef, lamb)', value: 4.2 },
    ],
  },
  {
    id: 4,
    category: 'waste',
    title: 'Waste & Shopping',
    subtitle: 'How would you describe your household recycling and buying habits?',
    icon: <ShoppingBag className="w-12 h-12 text-[#c87a53]" />,
    options: [
      { emoji: '♻️', label: 'Zero-Waste Minded', description: 'Repairs items, composts, buys secondhand', value: 0.8 },
      { emoji: '📦', label: 'Average Consumer', description: 'Recycles sometimes, buys new items regularly', value: 1.5 },
      { emoji: '🛍️', label: 'High Consumption', description: 'Frequently buys new electronics/apparel, rarely recycles', value: 2.5 },
    ],
  },
];

/**
 * Onboarding quiz component that guides users through a 4-step baseline carbon
 * footprint assessment covering energy, transport, diet, and waste categories.
 * Awards 50 XP and triggers confetti on completion.
 */
export const Onboarding: React.FC = () => {
  const completeOnboarding = useEcoPulseStore((state) => state.completeOnboarding);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, number>>({});

  const question = QUESTIONS[currentStep];

  const handleSelect = (value: number) => {
    setSelections((prev) => ({
      ...prev,
      [question.category]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Trigger celebrate confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Submit results to Zustand store
      completeOnboarding({
        energy: selections.energy || 1.5,
        transport: selections.transport || 1.2,
        diet: selections.diet || 1.8,
        waste: selections.waste || 1.5,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const selectedValue = selections[question.category];

  return (
    <div className="max-w-2xl mx-auto my-8" role="region" aria-label="Onboarding baseline assessment">
      <div className="neo-card text-center p-8 bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34]">
        <h1 className="text-3xl font-bold font-serif mb-2 text-[#d4a359]">DISCOVER YOUR CARBON PULSE</h1>
        <p className="text-sm text-[#4a6b5d] mb-6 uppercase tracking-wider font-semibold">
          Step {question.id} of {QUESTIONS.length}: {question.title}
        </p>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-3 mb-8" aria-hidden="true">
          {QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className={`w-3 h-3 rounded-full border-2 border-[#2b3a34] transition-all duration-300 ${
                idx === currentStep ? 'bg-[#4a6b5d] w-8 rounded-lg' : 'bg-[#f5f3eb]'
              }`}
            />
          ))}
        </div>

        {/* Illustration or Icon */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <div className="p-4 bg-[#f5f3eb] border-2 border-[#2b3a34] rounded-none">
            {question.icon}
          </div>
        </div>

        {/* Question Text */}
        <h2 className="text-xl font-bold font-serif mb-6 text-[#2b3a34]">{question.subtitle}</h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" role="radiogroup" aria-label={question.subtitle}>
          {question.options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`flex flex-col text-left p-4 border-2 border-[#2b3a34] transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#d4a359] text-[#2b3a34] shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-[#f5f3eb] text-[#2b3a34] shadow-[3px_3px_0px_#2b3a34] hover:bg-[#faf9f5] hover:shadow-[5px_5px_0px_#2b3a34] hover:-translate-x-[2px] hover:-translate-y-[2px]'
                }`}
              >
                <span className="text-2xl mb-2" role="img" aria-label={opt.label}>
                  {opt.emoji}
                </span>
                <span className="font-bold text-sm uppercase tracking-wide mb-1">{opt.label}</span>
                <span className="text-xs text-[#4a6b5d]">{opt.description}</span>
              </button>
            );
          })}
        </div>

        {/* Back and Next buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="secondary-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> BACK
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedValue === undefined}
            className="primary-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {currentStep === QUESTIONS.length - 1 ? 'CALCULATE' : 'CONTINUE'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
