import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CarbonMath } from '../utils/carbonMath';

export interface Log {
  id: string;
  category: string;
  title: string;
  description: string; // support both title and description
  value: number; // raw value
  carbon: number; // carbon impact in kg CO2e
  isSaving: boolean; // true if it's savings, false if it's emissions
  date: string;
  isSystem?: boolean;
}

export interface Action {
  id: string;
  category: string;
  title: string;
  description: string;
  frequency: 'daily' | 'commitment';
  savings: number; // carbon reduction in kg
  xp: number; // xp reward
  completed: boolean;
}

export interface AppState {
  // Onboarding / Baseline
  onboarded: boolean;
  isOnboarded: boolean; // support both
  score: number; // baseline carbon footprint score in tons
  footprint: {
    energy: number;
    transport: number;
    diet: number;
    waste: number;
  };
  categoryScores: {
    energy: number;
    transport: number;
    diet: number;
    waste: number;
  }; // support both
  
  // Gamification
  xp: number;
  streak: number;
  level: number;
  levelName: string;
  lastLogDate: string | null;
  challengeCompleted: boolean;
  
  // Lists
  actions: Action[];
  habits: Action[]; // support both
  logs: Log[];
  
  // Onboarding actions
  setOnboarded: (onboarded: boolean) => void;
  completeOnboarding: (scores: { energy: number; transport: number; diet: number; waste: number }) => void;
  setFootprint: (footprint: { energy: number; transport: number; diet: number; waste: number }) => void;
  
  // Log management
  addLog: (category: string, value: number, carbon: number, isSaving: boolean, title: string) => void;
  addActivityLog: (category: string, rawValue: number | string, subType?: string) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  
  // Habits management
  toggleAction: (actionId: string) => void;
  toggleHabit: (habitId: string) => void; // support both
  
  // XP / Streaks management
  addXp: (amount: number) => void;
  addXP: (amount: number) => void; // support both
  
  // Backend / AI assistant
  sendChatMessage: (message: string) => Promise<{ reply: string; auto_log?: any }>;
  
  // Reset
  resetState: () => void;
  resetAll: () => void; // support both
}

const defaultHabits: Action[] = [
  { id: '1', category: 'energy', title: 'Lower Thermostat by 1°C', description: 'Reduce space heating energy.', frequency: 'daily', savings: 0.45, xp: 40, completed: false },
  { id: '2', category: 'transport', title: 'Commute via Public Transit/Bike', description: 'Leave the car at home.', frequency: 'daily', savings: 1.2, xp: 80, completed: false },
  { id: '3', category: 'diet', title: 'Eat Plant-Based Today', description: 'Zero meat and dairy products.', frequency: 'daily', savings: 0.8, xp: 60, completed: false },
  { id: '4', category: 'waste', title: 'Line Dry Clothes', description: 'Avoid using the high-energy clothes dryer.', frequency: 'daily', savings: 0.35, xp: 30, completed: false },
  { id: '5', category: 'energy', title: 'Unplug Idle Electronics', description: 'Prevent phantom energy draw.', frequency: 'daily', savings: 0.15, xp: 20, completed: false },
  { id: '6', category: 'waste', title: 'Compost Organic Waste', description: 'Avoid food waste rotting in landfills.', frequency: 'daily', savings: 0.25, xp: 35, completed: false }
];

const getLevelInfo = (xp: number): { level: number; levelName: string } => {
  if (xp >= 1500) return { level: 5, levelName: 'Level 5: Forest Guardian' };
  if (xp >= 800) return { level: 4, levelName: 'Level 4: Oak Tree' };
  if (xp >= 400) return { level: 3, levelName: 'Level 3: Sapling' };
  if (xp >= 150) return { level: 2, levelName: 'Level 2: Sprout' };
  return { level: 1, levelName: 'Level 1: Seedling' };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      isOnboarded: false,
      score: 0,
      footprint: { energy: 0, transport: 0, diet: 0, waste: 0 },
      categoryScores: { energy: 0, transport: 0, diet: 0, waste: 0 },
      
      xp: 0,
      streak: 0,
      level: 1,
      levelName: 'Level 1: Seedling',
      lastLogDate: null,
      challengeCompleted: false,
      
      actions: defaultHabits,
      habits: defaultHabits,
      logs: [],

      setOnboarded: (onboarded) => set({ onboarded, isOnboarded: onboarded }),

      completeOnboarding: (scores) => {
        const sum = parseFloat((scores.energy + scores.transport + scores.diet + scores.waste).toFixed(1));
        const systemLog: Log = {
          id: `sys-${Date.now()}`,
          category: 'system',
          title: 'Baseline Assessment Completed',
          description: 'Baseline Assessment Completed',
          value: 0,
          carbon: 0,
          isSaving: false,
          date: new Date().toISOString().split('T')[0],
          isSystem: true
        };
        set({
          onboarded: true,
          isOnboarded: true,
          score: sum,
          footprint: scores,
          categoryScores: scores,
          logs: [systemLog]
        });
      },

      setFootprint: (footprint) => {
        const sum = parseFloat((footprint.energy + footprint.transport + footprint.diet + footprint.waste).toFixed(1));
        set({ footprint, categoryScores: footprint, score: sum });
      },

      addLog: (category, value, carbon, isSaving, title) => {
        const today = new Date().toISOString().split('T')[0];
        const newLog: Log = {
          id: Date.now().toString(),
          category,
          title,
          description: title,
          value,
          carbon,
          isSaving,
          date: today
        };

        set((state) => {
          // Calculate streak update
          let nextStreak = state.streak;
          if (state.lastLogDate !== today) {
            if (!state.lastLogDate) {
              nextStreak = 1;
            } else {
              const lastDate = new Date(state.lastLogDate);
              const currentDate = new Date(today);
              const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                nextStreak = Math.min(30, state.streak + 1);
              } else {
                nextStreak = 1;
              }
            }
          }

          const nextXp = state.xp + 10;
          const { level, levelName } = getLevelInfo(nextXp);

          return {
            logs: [newLog, ...state.logs],
            xp: nextXp,
            level,
            levelName,
            streak: nextStreak,
            lastLogDate: today
          };
        });
      },

      addActivityLog: (category, rawValue, subType) => {
        let value = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
        if (isNaN(value)) value = 0;
        let carbon = 0;
        let title = '';

        if (category === 'transport') {
          const mode = subType || 'petrol';
          carbon = CarbonMath.calculateTransportEmissions(value, mode);
          title = `Commute: ${value} miles via ${mode}`;
        } else if (category === 'diet') {
          carbon = CarbonMath.calculateDietEmissions(subType || 'vegan') * value;
          title = `${value} serving(s) of ${subType || 'vegan'} meal`;
        } else if (category === 'energy') {
          carbon = CarbonMath.calculateEnergyEmissions(value);
          title = `Utility Electricity (${value} kWh)`;
        } else if (category === 'waste') {
          carbon = CarbonMath.calculateWasteSavings(subType || 'landfill') * value;
          title = `Waste disposal: ${value} kg of ${subType || 'landfill'}`;
        }

        get().addLog(category, value, carbon, carbon < 0, title);
      },

      deleteLog: (id) => set((state) => {
        const filteredLogs = state.logs.filter(l => l.id !== id);
        return { logs: filteredLogs };
      }),

      clearLogs: () => set((state) => ({
        logs: state.logs.filter((l) => l.isSystem)
      })),

      toggleAction: (actionId) => {
        set((state) => {
          const updatedActions = state.actions.map((act) => {
            if (act.id === actionId) {
              const nextCompleted = !act.completed;
              // Adjust baseline footprint
              const updatedFootprint = { ...state.footprint };
              const category = act.category as keyof typeof state.footprint;
              
              // complete reduces score, uncomplete increases score
              if (nextCompleted) {
                updatedFootprint[category] = Math.max(0, updatedFootprint[category] - (act.savings / 12));
              } else {
                updatedFootprint[category] = updatedFootprint[category] + (act.savings / 12);
              }

              return { ...act, completed: nextCompleted };
            }
            return act;
          });

          // Recalculate full state values
          let nextFootprint = { ...state.footprint };
          let nextXP = state.xp;
          let nextStreak = state.streak;

          const action = state.actions.find(a => a.id === actionId);
          if (action) {
            const category = action.category as keyof typeof state.footprint;
            const wasCompleted = action.completed;
            if (!wasCompleted) {
              nextFootprint[category] = Math.max(0, state.footprint[category] - (action.savings / 12));
              nextXP = state.xp + action.xp;
              nextStreak = Math.min(30, state.streak + 1);
            } else {
              nextFootprint[category] = state.footprint[category] + (action.savings / 12);
              nextXP = Math.max(0, state.xp - action.xp);
            }
          }

          const { level, levelName } = getLevelInfo(nextXP);
          const sum = parseFloat((nextFootprint.energy + nextFootprint.transport + nextFootprint.diet + nextFootprint.waste).toFixed(1));

          return {
            actions: updatedActions,
            habits: updatedActions,
            footprint: nextFootprint,
            categoryScores: nextFootprint,
            score: sum,
            xp: nextXP,
            level,
            levelName,
            streak: nextStreak
          };
        });
      },

      toggleHabit: (habitId) => {
        get().toggleAction(habitId);
      },

      addXp: (amount) => set((state) => {
        const nextXp = state.xp + amount;
        const { level, levelName } = getLevelInfo(nextXp);
        return { xp: nextXp, level, levelName };
      }),

      addXP: (amount) => {
        get().addXp(amount);
      },

      sendChatMessage: async (message) => {
        const score = parseFloat((get().footprint.energy + get().footprint.transport + get().footprint.diet + get().footprint.waste).toFixed(1));
        const payload = {
          message,
          footprint: score
        };

        const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const tryEndpoints = [
          `${backendBase}/chat`,
          `${backendBase}/api/chat`
        ];

        let lastError = null;
        for (const endpoint of tryEndpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              return await response.json();
            } else {
              lastError = new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (e: any) {
            lastError = e;
          }
        }
        
        // Return a simulated fallback response if backend is offline
        console.warn('FastAPI backend not responding, returning simulated fallback.', lastError);
        
        let fallbackReply = `I'm your EcoPulse AI assistant! Since the backend is currently offline, I will simulate my replies. To lower your ${score}t footprint, try taking public transit or eating a plant-based diet.`;
        let fallbackAutoLog = undefined;

        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('bike') || lowerMsg.includes('ride') || lowerMsg.includes('cycle')) {
          fallbackReply = "EcoPulse AI has automatically logged your electric bike ride! I've reduced your transport emissions.";
          fallbackAutoLog = {
            category: 'transport',
            value: 10, // 10 miles
            carbon: 1.2, // 1.2 kg CO2e
            description: 'Electric bike ride (auto-logged)'
          };
        } else if (lowerMsg.includes('salad') || lowerMsg.includes('vegan') || lowerMsg.includes('vegetable') || lowerMsg.includes('plant-based')) {
          fallbackReply = "EcoPulse AI has automatically logged your vegan meal! Great choice.";
          fallbackAutoLog = {
            category: 'diet',
            value: 1, // 1 serving
            carbon: 0.5, // 0.5 kg CO2e
            description: 'Vegan plant-based meal (auto-logged)'
          };
        }

        return {
          reply: fallbackReply,
          auto_log: fallbackAutoLog
        };
      },

      resetState: () => set({
        onboarded: false,
        isOnboarded: false,
        score: 0,
        footprint: { energy: 0, transport: 0, diet: 0, waste: 0 },
        categoryScores: { energy: 0, transport: 0, diet: 0, waste: 0 },
        actions: defaultHabits.map(a => ({ ...a, completed: false })),
        habits: defaultHabits.map(a => ({ ...a, completed: false })),
        logs: [],
        xp: 0,
        streak: 0,
        level: 1,
        levelName: 'Level 1: Seedling',
        lastLogDate: null,
        challengeCompleted: false
      }),

      resetAll: () => {
        get().resetState();
      }
    }),
    {
      name: 'ecopulse_state'
    }
  )
);
export const useEcoPulseStore = useAppStore;
export default useAppStore;
