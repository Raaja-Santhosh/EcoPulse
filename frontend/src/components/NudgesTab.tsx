import React, { useState } from 'react';
import { useEcoPulseStore } from '../store';
import { AlertOctagon, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Scenario {
  id: 'food' | 'commute';
  title: string;
  icon: string;
  description: string;
  options: {
    id: string;
    label: string;
    description: string;
    carbon: number; // kg CO2e
    costLabel: string;
    isEco: boolean;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'food',
    title: 'Dinner Choice',
    icon: '🍔',
    description: 'You are ordering dinner on a food delivery app. Choose your meal:',
    options: [
      { id: 'beef', label: 'Beef Burger Combo', description: 'Flame-grilled Angus beef patty with fries', carbon: 8.2, costLabel: '8.2 kg CO₂e', isEco: false },
      { id: 'vegan', label: 'Plant-Based Harvest Bowl', description: 'Organic quinoa, roasted sweet potatoes, and avocado', carbon: 0.6, costLabel: '0.6 kg CO₂e', isEco: true },
    ],
  },
  {
    id: 'commute',
    title: 'Commute Route',
    icon: '🚗',
    description: 'You are planning your commute to the office tomorrow morning:',
    options: [
      { id: 'suv', label: 'Drive Petrol SUV (Solo)', description: 'Commuting by personal combustion engine vehicle', carbon: 6.2, costLabel: '6.2 kg CO₂e', isEco: false },
      { id: 'train', label: 'Take Light Rail Train', description: 'Electric shared rail transport option', carbon: 0.8, costLabel: '0.8 kg CO₂e', isEco: true },
    ],
  },
];

export const NudgesTab: React.FC = () => {
  const { addLog, addXp } = useEcoPulseStore();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeNudge, setActiveNudge] = useState<{
    scenarioId: 'food' | 'commute';
    optionId: string;
    highCarbon: number;
    ecoCarbon: number;
    ecoOptionId: string;
    ecoOptionLabel: string;
  } | null>(null);

  const handleSelectOption = (scenarioId: 'food' | 'commute', optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [scenarioId]: optionId }));
    
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    const option = scenario.options.find(o => o.id === optionId);

    if (option && !option.isEco) {
      // High-carbon choice! Trigger the brutalist warning nudge.
      const ecoOption = scenario.options.find(o => o.isEco)!;
      setActiveNudge({
        scenarioId,
        optionId,
        highCarbon: option.carbon,
        ecoCarbon: ecoOption.carbon,
        ecoOptionId: ecoOption.id,
        ecoOptionLabel: ecoOption.label,
      });
    } else if (option && option.isEco) {
      // Eco friendly choice directly: Reward XP, log saving
      confetti({
        particleCount: 50,
        spread: 30,
        origin: { y: 0.8 }
      });
      addXp(30);
      addLog(
        scenarioId === 'food' ? 'diet' : 'transport',
        scenarioId === 'food' ? 1 : 15, // value
        option.carbon, // carbon
        true, // isSaving
        `Chose eco-friendly ${option.label} directly`
      );
      alert(`Eco-friendly choice logged! +30 XP granted.`);
    }
  };

  const handleSwitchToEco = () => {
    if (!activeNudge) return;
    const { scenarioId, ecoOptionId, ecoOptionLabel, highCarbon, ecoCarbon } = activeNudge;

    // Switch selection
    setSelectedOptions((prev) => ({ ...prev, [scenarioId]: ecoOptionId }));
    
    // Grant bonus XP (+50 XP) and log carbon savings
    addXp(50);
    const savings = Math.round((highCarbon - ecoCarbon) * 10) / 10;
    addLog(
      scenarioId === 'food' ? 'diet' : 'transport',
      scenarioId === 'food' ? 1 : 15, // value
      savings, // carbon
      true, // isSaving
      `Nudged to Eco choice: ${ecoOptionLabel} (Saved ${savings}kg)`
    );

    // Confetti celebration
    confetti({
      particleCount: 150,
      spread: 60,
      colors: ['#4a6b5d', '#d4a359', '#c87a53'],
      origin: { y: 0.6 }
    });

    setActiveNudge(null);
  };

  const handleConfirmHighCarbon = () => {
    if (!activeNudge) return;
    const { scenarioId, optionId, highCarbon } = activeNudge;
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    const option = scenario.options.find(o => o.id === optionId)!;

    // Log high-carbon emissions
    addLog(
      scenarioId === 'food' ? 'diet' : 'transport',
      scenarioId === 'food' ? 1 : 15, // value
      highCarbon, // carbon
      false, // isSaving = false, so it adds to footprint
      `Logged high-carbon option: ${option.label}`
    );

    setActiveNudge(null);
    alert(`High-carbon selection confirmed and logged to your footprint.`);
  };

  return (
    <div className="flex flex-col gap-8 text-left" role="tabpanel" aria-label="Behavioral Decision Sandbox">
      
      {/* Editorial Title */}
      <div className="border-b-2 border-[#2b3a34] pb-4">
        <h2 className="text-3xl font-bold font-serif text-[#2b3a34] uppercase">Decision Sandbox</h2>
        <p className="text-sm text-[#4a6b5d] mt-1">
          Simulate real-time choice points (e.g. food apps or daily travel) to test the platform's nudge mechanics.
        </p>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="neo-card bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-[#f5f3eb] border-2 border-[#2b3a34]">{scenario.icon}</span>
              <h3 className="text-xl font-serif font-bold text-[#2b3a34]">{scenario.title}</h3>
            </div>
            <p className="text-xs text-[#4a6b5d] leading-relaxed">{scenario.description}</p>
            
            <div className="flex flex-col gap-3 mt-2">
              {scenario.options.map((opt) => {
                const isSelected = selectedOptions[scenario.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(scenario.id, opt.id)}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 border-2 border-[#2b3a34] text-left transition-all duration-100 ${
                      isSelected
                        ? 'bg-[#f5f3eb] border-dashed border-[#c87a53] shadow-none translate-x-[1px] translate-y-[1px]'
                        : 'bg-white shadow-[2px_2px_0px_#2b3a34] hover:bg-[#faf9f5]'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[#2b3a34]">{opt.label}</h4>
                      <p className="text-[10px] text-[#4a6b5d]">{opt.description}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold mt-2 md:mt-0 ${
                        opt.isEco ? 'text-[#4a6b5d]' : 'text-[#c87a53]'
                      }`}
                    >
                      {opt.costLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* BRUTALIST WARNING MODAL OVERLAY */}
      {activeNudge && (
        <div className="fixed inset-0 bg-[#2b3a34]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="nudge-title">
          <div className="w-full max-w-lg bg-white border-4 border-[#2b3a34] shadow-[8px_8px_0px_#c87a53] p-8 text-center flex flex-col items-center gap-5">
            <div className="p-4 bg-[#fffaf5] border-2 border-[#c87a53]">
              <AlertOctagon className="w-16 h-16 text-[#c87a53]" />
            </div>
            <h3 id="nudge-title" className="text-2xl font-serif font-black text-[#c87a53] uppercase tracking-wide">
              ECOLOGICAL WARNING
            </h3>
            
            <p className="text-sm text-[#4a6b5d] leading-relaxed">
              Making this selection will release <strong className="text-[#c87a53]">{activeNudge.highCarbon} kg CO₂e</strong> into the atmosphere. 
              This is equivalent to burning <strong className="text-[#2b3a34]">1 gallon of petrol</strong> or driving 20 miles in an SUV.
            </p>
            
            <div className="bg-[#f5f3eb] border-2 border-[#2b3a34] p-4 w-full text-left">
              <span className="text-[10px] font-bold text-[#4a6b5d] uppercase block mb-1">Eco Recommendation</span>
              <p className="text-xs text-[#2b3a34]">
                Switch to <strong className="text-[#4a6b5d]">{activeNudge.ecoOptionLabel}</strong> ({activeNudge.ecoCarbon} kg) to immediately prevent <strong className="text-[#4a6b5d]">{Math.round((activeNudge.highCarbon - activeNudge.ecoCarbon) * 10) / 10} kg</strong> of carbon emissions!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <button
                type="button"
                onClick={handleConfirmHighCarbon}
                className="secondary-btn flex-1 text-xs py-3 border-[#c87a53] text-[#c87a53]"
              >
                PROCEED ANYWAY
              </button>
              <button
                type="button"
                onClick={handleSwitchToEco}
                className="primary-btn flex-1 text-xs py-3 bg-[#4a6b5d] text-white flex items-center justify-center gap-1.5"
              >
                SWITCH & SAVE (+50 XP) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default NudgesTab;
