import { useEcoPulseStore, getLevelInfo } from './store';

describe('Zustand useEcoPulseStore (store.ts) Tests', () => {
  beforeEach(() => {
    useEcoPulseStore.getState().resetAll();
  });

  test('initial store state', () => {
    const state = useEcoPulseStore.getState();
    expect(state.onboarded).toBe(false);
    expect(state.score).toBe(0);
    expect(state.categoryScores).toEqual({ energy: 0, transport: 0, diet: 0, waste: 0 });
    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
    expect(state.levelName).toBe('Eco Seed');
    expect(state.logs).toEqual([]);
    expect(state.streak).toBe(0);
  });

  test('getLevelInfo calculates correct levels and names', () => {
    expect(getLevelInfo(0)).toEqual({ level: 1, levelName: 'Eco Seed' });
    expect(getLevelInfo(149)).toEqual({ level: 1, levelName: 'Eco Seed' });
    expect(getLevelInfo(150)).toEqual({ level: 2, levelName: 'Eco Seedling' });
    expect(getLevelInfo(399)).toEqual({ level: 2, levelName: 'Eco Seedling' });
    expect(getLevelInfo(400)).toEqual({ level: 3, levelName: 'Active Sprout' });
    expect(getLevelInfo(799)).toEqual({ level: 3, levelName: 'Active Sprout' });
    expect(getLevelInfo(800)).toEqual({ level: 4, levelName: 'Forest Protector' });
    expect(getLevelInfo(1499)).toEqual({ level: 4, levelName: 'Forest Protector' });
    expect(getLevelInfo(1500)).toEqual({ level: 5, levelName: 'Eco Guardian' });
  });

  test('completeOnboarding transitions state, awards 50 XP, and levels up', () => {
    const store = useEcoPulseStore.getState();
    const scores = { energy: 2.5, transport: 3.1, diet: 1.2, waste: 0.8 };
    
    store.completeOnboarding(scores);

    const updated = useEcoPulseStore.getState();
    expect(updated.onboarded).toBe(true);
    expect(updated.categoryScores).toEqual(scores);
    expect(updated.score).toBe(7.6); // 2.5 + 3.1 + 1.2 + 0.8 = 7.6
    expect(updated.xp).toBe(50);
    expect(updated.level).toBe(1); // 50 XP is Level 1 (Eco Seed)
  });

  test('addLog adds items, tracks streak and adds 10 XP', () => {
    const store = useEcoPulseStore.getState();
    
    // Add log
    store.addLog('transport', 10, 4.11, true, 'Biked to work');
    
    let updated = useEcoPulseStore.getState();
    expect(updated.logs.length).toBe(1);
    expect(updated.logs[0].category).toBe('transport');
    expect(updated.logs[0].value).toBe(10);
    expect(updated.logs[0].carbon).toBe(-4.11); // isSaving is true, so it flips to negative
    expect(updated.logs[0].title).toBe('Biked to work');
    expect(updated.xp).toBe(10);
    expect(updated.streak).toBe(1);
  });

  test('deleteLog removes the correct log item', () => {
    const store = useEcoPulseStore.getState();
    
    store.addLog('diet', 1, 0.5, true, 'Vegan salad');
    let updated = useEcoPulseStore.getState();
    const logId = updated.logs[0].id;

    store.deleteLog(logId);
    
    updated = useEcoPulseStore.getState();
    expect(updated.logs.length).toBe(0);
  });

  test('toggleHabit completes/uncompletes a habit and awards 25 XP', () => {
    const store = useEcoPulseStore.getState();
    const habitId = store.habits[0].id; // First habit is 'Turn off standby power'

    // Initial state: not completed
    expect(store.habits[0].completed).toBe(false);

    // Toggle to completed
    store.toggleHabit(habitId);
    let updated = useEcoPulseStore.getState();
    expect(updated.habits[0].completed).toBe(true);
    expect(updated.xp).toBe(25); // +25 XP
    
    // Toggle back to not completed
    store.toggleHabit(habitId);
    updated = useEcoPulseStore.getState();
    expect(updated.habits[0].completed).toBe(false);
    expect(updated.xp).toBe(25); // XP remains 25 (as we don't deduct XP)
  });

  test('addXp updates level and name dynamically', () => {
    const store = useEcoPulseStore.getState();
    
    // Level 1 to Level 2 boundary
    store.addXp(150);
    let updated = useEcoPulseStore.getState();
    expect(updated.xp).toBe(150);
    expect(updated.level).toBe(2);
    expect(updated.levelName).toBe('Eco Seedling');

    // Level 2 to Level 5 boundary
    store.addXp(1350);
    updated = useEcoPulseStore.getState();
    expect(updated.xp).toBe(1500);
    expect(updated.level).toBe(5);
    expect(updated.levelName).toBe('Eco Guardian');
  });
});
