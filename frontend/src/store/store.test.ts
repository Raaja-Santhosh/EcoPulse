import { useAppStore } from './useAppStore';

describe('Zustand store.test.ts - Zustand Store Edge Cases', () => {
  beforeEach(() => {
    useAppStore.getState().resetState();
  });

  // 1. Onboarding Quiz Triggers
  test('onboarding quiz triggers and updates state correctly', () => {
    const store = useAppStore.getState();
    expect(store.onboarded).toBe(false);
    
    const scores = { energy: 3.5, transport: 2.2, diet: 1.1, waste: 0.9 };
    store.completeOnboarding(scores);

    const updated = useAppStore.getState();
    expect(updated.onboarded).toBe(true);
    expect(updated.isOnboarded).toBe(true);
    expect(updated.score).toBe(7.7); // sum of scores
    expect(updated.footprint).toEqual(scores);
    expect(updated.logs.length).toBe(1);
    expect(updated.logs[0].isSystem).toBe(true);
    expect(updated.logs[0].title).toBe('Baseline Assessment Completed');
  });

  // 2. Logs CRUD
  test('logs CRUD operations and streak calculations', () => {
    const store = useAppStore.getState();
    
    // Create / Add Log
    store.addLog('transport', 10, 4.11, true, 'Biked to work');
    let state = useAppStore.getState();
    expect(state.logs.length).toBe(1);
    expect(state.logs[0].category).toBe('transport');
    expect(state.logs[0].value).toBe(10);
    expect(state.logs[0].carbon).toBe(4.11);
    expect(state.xp).toBe(10);
    expect(state.streak).toBe(1);

    // Read Log (accessed via state.logs)
    const logId = state.logs[0].id;
    expect(state.logs.find(l => l.id === logId)).toBeDefined();

    // Delete Log
    store.deleteLog(logId);
    state = useAppStore.getState();
    expect(state.logs.length).toBe(0);
  });

  // 3. XP Thresholds & 4. Levelups
  test('XP thresholds and levelups transition correctly', () => {
    const store = useAppStore.getState();
    
    // Level 1: Seedling (< 150 XP)
    expect(store.level).toBe(1);
    expect(store.levelName).toBe('Level 1: Seedling');

    // Level 2: Sprout (>= 150 XP)
    store.addXp(150);
    let state = useAppStore.getState();
    expect(state.level).toBe(2);
    expect(state.levelName).toBe('Level 2: Sprout');

    // Level 3: Sapling (>= 400 XP)
    store.addXp(250);
    state = useAppStore.getState();
    expect(state.level).toBe(3);
    expect(state.levelName).toBe('Level 3: Sapling');

    // Level 4: Oak Tree (>= 800 XP)
    store.addXp(400);
    state = useAppStore.getState();
    expect(state.level).toBe(4);
    expect(state.levelName).toBe('Level 4: Oak Tree');

    // Level 5: Forest Guardian (>= 1500 XP)
    store.addXp(700);
    state = useAppStore.getState();
    expect(state.level).toBe(5);
    expect(state.levelName).toBe('Level 5: Forest Guardian');
  });

  // 5. Chat Fallback States
  test('chat message API success and failure fallback states', async () => {
    const fakeResponse = {
      reply: 'EcoPulse AI test response',
      auto_log: {
        category: 'diet',
        description: 'Vegan salad',
        carbon_saved: 0.5
      }
    };

    // Success state mock
    const mockFetchSuccess = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeResponse),
      })
    );
    globalThis.fetch = mockFetchSuccess;

    const store = useAppStore.getState();
    const resultSuccess = await store.sendChatMessage('I ate a plant-based meal');
    expect(mockFetchSuccess).toHaveBeenCalled();
    expect(resultSuccess).toEqual(fakeResponse);

    // Failure fallback state mock
    const mockFetchFailure = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('API offline'))
    );
    globalThis.fetch = mockFetchFailure;

    // Suppress console.warn for cleaner test run
    const originalWarn = console.warn;
    console.warn = jest.fn();

    const resultFallback = await store.sendChatMessage('I ate a vegan salad');
    expect(mockFetchFailure).toHaveBeenCalledTimes(2);
    expect(resultFallback.reply).toContain('EcoPulse AI');
    expect(resultFallback.auto_log).toBeDefined();
    expect(resultFallback.auto_log?.category).toBe('diet');

    console.warn = originalWarn;
  });
});
