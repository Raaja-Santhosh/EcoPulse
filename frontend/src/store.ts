import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogItem {
  id: string;
  date: string;
  category: 'energy' | 'transport' | 'diet' | 'waste';
  value: number;
  carbon: number; // in kg CO2e
  isSaving: boolean;
  title: string;
}

export interface HabitCommitment {
  id: string;
  category: 'energy' | 'transport' | 'diet' | 'waste';
  title: string;
  description: string;
  savings: number; // in kg CO2e
  completed: boolean;
  frequency: 'daily' | 'commitment';
}

interface EcoPulseState {
  onboarded: boolean;
  score: number; // Annualized baseline score in tons CO2e/yr
  categoryScores: {
    energy: number;
    transport: number;
    diet: number;
    waste: number;
  };
  xp: number;
  level: number;
  levelName: string;
  logs: LogItem[];
  habits: HabitCommitment[];
  streak: number;
  lastLoggedDate: string | null;
  completeOnboarding: (answers: { energy: number; transport: number; diet: number; waste: number }) => void;
  addLog: (category: 'energy' | 'transport' | 'diet' | 'waste', value: number, carbon: number, isSaving: boolean, title: string) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  toggleHabit: (id: string) => void;
  addXp: (amount: number) => void;
  resetAll: () => void;
}

const DEFAULT_HABITS: HabitCommitment[] = [
  { id: 'h1', category: 'energy', title: 'Turn off standby power', description: 'Switch off devices at the wall when not in use.', savings: 0.5, completed: false, frequency: 'daily' },
  { id: 'h2', category: 'energy', title: 'Line-dry laundry', description: 'Avoid the clothes dryer and dry clothes naturally.', savings: 1.2, completed: false, frequency: 'daily' },
  { id: 'h3', category: 'transport', title: 'Bike to local shop', description: 'Leave the car behind for short trips under 2 miles.', savings: 0.8, completed: false, frequency: 'daily' },
  { id: 'h4', category: 'diet', title: 'Eat a fully plant-based day', description: 'Consume zero meat or dairy today.', savings: 3.5, completed: false, frequency: 'daily' },
  { id: 'h5', category: 'waste', title: 'Zero single-use plastics', description: 'Use reusable bags, cups, and food containers.', savings: 0.4, completed: false, frequency: 'daily' },
  { id: 'h6', category: 'energy', title: 'Upgrade to LED bulbs', description: 'Commit to replacing legacy incandescent bulbs.', savings: 45.0, completed: false, frequency: 'commitment' },
  { id: 'h7', category: 'transport', title: 'Transition to hybrid/EV', description: 'Commit to clean transport options for future purchases.', savings: 1200.0, completed: false, frequency: 'commitment' },
  { id: 'h8', category: 'diet', title: 'Meatless Mondays', description: 'Commit to vegetarian eating one full day per week.', savings: 180.0, completed: false, frequency: 'commitment' },
];

export const getLevelInfo = (xp: number) => {
  if (xp >= 1500) return { level: 5, name: 'Eco Guardian' };
  if (xp >= 800) return { level: 4, name: 'Forest Protector' };
  if (xp >= 400) return { level: 3, name: 'Active Sprout' };
  if (xp >= 150) return { level: 2, name: 'Eco Seedling' };
  return { level: 1, name: 'Eco Seed' };
};

export const useEcoPulseStore = create<EcoPulseState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      score: 0,
      categoryScores: { energy: 0, transport: 0, diet: 0, waste: 0 },
      xp: 0,
      level: 1,
      levelName: 'Eco Seed',
      logs: [],
      habits: DEFAULT_HABITS,
      streak: 0,
      lastLoggedDate: null,

      completeOnboarding: (answers) => {
        const totalBaseline = answers.energy + answers.transport + answers.diet + answers.waste;
        set({
          onboarded: true,
          score: Math.round(totalBaseline * 10) / 10,
          categoryScores: answers,
          xp: 50, // bonus for completing onboarding
          ...getLevelInfo(50),
        });
      },

      addLog: (category, value, carbon, isSaving, title) => {
        let finalCarbon = isSaving ? -carbon : carbon;

        const newLog: LogItem = {
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          category,
          value,
          carbon: Math.round(finalCarbon * 100) / 100,
          isSaving,
          title,
        };

        const today = new Date().toDateString();
        const lastLogged = get().lastLoggedDate;
        let currentStreak = get().streak;

        if (lastLogged !== today) {
          if (lastLogged === new Date(Date.now() - 86400000).toDateString()) {
            currentStreak += 1;
          } else if (lastLogged === null || lastLogged !== today) {
            currentStreak = 1;
          }
        }

        // Add 10 XP per log
        const newXp = get().xp + 10;
        const levelInfo = getLevelInfo(newXp);

        set((state) => ({
          logs: [newLog, ...state.logs],
          lastLoggedDate: today,
          streak: currentStreak,
          xp: newXp,
          ...levelInfo,
        }));
      },

      deleteLog: (id) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== id),
        }));
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      toggleHabit: (id) => {
        const updatedHabits = get().habits.map((habit) => {
          if (habit.id === id) {
            const completed = !habit.completed;
            if (completed) {
              // Grant 25 XP for completing a habit
              get().addXp(25);
            }
            return { ...habit, completed };
          }
          return habit;
        });
        set({ habits: updatedHabits });
      },

      addXp: (amount) => {
        const newXp = get().xp + amount;
        const levelInfo = getLevelInfo(newXp);
        set({ xp: newXp, ...levelInfo });
      },

      resetAll: () => {
        set({
          onboarded: false,
          score: 0,
          categoryScores: { energy: 0, transport: 0, diet: 0, waste: 0 },
          xp: 0,
          level: 1,
          levelName: 'Eco Seed',
          logs: [],
          habits: DEFAULT_HABITS.map(h => ({ ...h, completed: false })),
          streak: 0,
          lastLoggedDate: null,
        });
      },
    }),
    {
      name: 'ecopulse-storage',
    }
  )
);
