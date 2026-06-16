import React, { useState } from 'react';
import { useEcoPulseStore } from '../store';
import { CheckSquare, Square, Zap, Car, Leaf, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

type FilterType = 'all' | 'daily' | 'commitment' | 'energy' | 'transport' | 'diet' | 'waste';

export const ActionCenterTab: React.FC = () => {
  const { habits, toggleHabit } = useEcoPulseStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    toggleHabit(id);
    if (!currentlyCompleted) {
      // Trigger canvas-confetti upon completion!
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.7 }
      });
    }
  };

  const filteredHabits = habits.filter((habit) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'daily') return habit.frequency === 'daily';
    if (activeFilter === 'commitment') return habit.frequency === 'commitment';
    return habit.category === activeFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'energy': return <Zap className="w-4 h-4 text-[#d4a359]" />;
      case 'transport': return <Car className="w-4 h-4 text-[#c87a53]" />;
      case 'diet': return <Leaf className="w-4 h-4 text-[#4a6b5d]" />;
      case 'waste': return <ShoppingBag className="w-4 h-4 text-[#79a6d2]" />;
      default: return null;
    }
  };

  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case 'energy': return 'border-t-[#d4a359]';
      case 'transport': return 'border-t-[#c87a53]';
      case 'diet': return 'border-t-[#4a6b5d]';
      case 'waste': return 'border-t-[#79a6d2]';
      default: return 'border-t-[#2b3a34]';
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left" role="tabpanel" aria-label="Action Center habits and commitments">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#2b3a34] pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif text-[#2b3a34] uppercase">Action Center</h2>
          <p className="text-sm text-[#4a6b5d] mt-1">Check off daily habits or commit to long-term sustainability goals to gain XP.</p>
        </div>

        {/* Filter categories */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'daily', 'commitment', 'energy', 'transport', 'diet', 'waste'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`filter-btn text-xs py-1.5 px-3 border-2 border-[#2b3a34] ${
                activeFilter === filter
                  ? 'bg-[#4a6b5d] text-white shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-white text-[#4a6b5d] shadow-[2px_2px_0px_#2b3a34] hover:bg-[#faf9f5]'
              }`}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List of actions */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#2b3a34] bg-white">
          <p className="text-sm text-[#4a6b5d]">No actions match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className={`neo-card bg-white border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] flex flex-col justify-between border-t-8 ${getCategoryColorClass(
                habit.category
              )}`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#4a6b5d] uppercase border-2 border-[#2b3a34] px-2 py-0.5 bg-[#f5f3eb]">
                    {getCategoryIcon(habit.category)} {habit.category}
                  </span>
                  <span className="text-[10px] font-bold text-[#c87a53] uppercase tracking-wider font-mono">
                    {habit.frequency}
                  </span>
                </div>
                <h4 className="text-lg font-serif font-bold text-[#2b3a34] mt-2 leading-snug">{habit.title}</h4>
                <p className="text-xs text-[#4a6b5d] leading-relaxed">{habit.description}</p>
              </div>

              <div className="flex justify-between items-center border-t-2 border-[#f5f3eb] mt-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#4a6b5d] font-bold uppercase">Estimated Savings</span>
                  <span className="text-sm font-bold font-mono text-[#4a6b5d]">
                    {habit.savings} kg CO₂e{habit.frequency === 'daily' ? '/day' : '/yr'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(habit.id, habit.completed)}
                  aria-label={`Toggle completion for ${habit.title}`}
                  className={`flex items-center gap-2 border-2 border-[#2b3a34] px-3 py-1.5 font-serif font-bold text-xs uppercase transition-all duration-100 ${
                    habit.completed
                      ? 'bg-[#4a6b5d] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                      : 'bg-[#f5f3eb] text-[#2b3a34] shadow-[2px_2px_0px_#2b3a34] hover:bg-[#faf9f5]'
                  }`}
                >
                  {habit.completed ? (
                    <>
                      <CheckSquare className="w-4 h-4" /> DONE
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" /> COMPLETE
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rewards callout */}
      <div className="neo-card bg-[#f5f3eb] border-2 border-[#2b3a34] shadow-[4px_4px_0px_#2b3a34] text-center p-6 mt-4">
        <h4 className="font-serif font-bold text-lg text-[#2b3a34] uppercase">Complete Actions, Earn XP</h4>
        <p className="text-xs text-[#4a6b5d] mt-1">Each checked habit yields +25 XP. Watch your rank grow on the dashboard leaderboard!</p>
      </div>

    </div>
  );
};
export default ActionCenterTab;
