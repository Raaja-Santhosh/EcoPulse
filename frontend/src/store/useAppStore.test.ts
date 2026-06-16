import { useAppStore } from './useAppStore';

describe('Zustand useAppStore Tests', () => {
  beforeEach(() => {
    useAppStore.getState().resetState();
  });

  test('initial empty/default state values', () => {
    const state = useAppStore.getState();
    expect(state.onboarded).toBe(false);
    expect(state.score).toBe(0);
    expect(state.xp).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.logs).toEqual([]);
    expect(state.footprint).toEqual({ energy: 0, transport: 0, diet: 0, waste: 0 });
  });

  test('complete onboarding calculations and state update', () => {
    const store = useAppStore.getState();
    
    const initialScores = {
      energy: 3.8,
      transport: 4.5,
      diet: 1.8,
      waste: 1.5
    };

    store.completeOnboarding(initialScores);

    const updatedState = useAppStore.getState();
    expect(updatedState.onboarded).toBe(true);
    expect(updatedState.footprint).toEqual(initialScores);
    expect(updatedState.score).toBe(11.6); // 3.8 + 4.5 + 1.8 + 1.5 = 11.6
    expect(updatedState.logs.length).toBe(1);
    expect(updatedState.logs[0].isSystem).toBe(true);
    expect(updatedState.logs[0].title).toBe('Baseline Assessment Completed');
  });

  test('addLog increases XP and updates logs list', () => {
    const store = useAppStore.getState();
    
    // Initial XP should be 0
    expect(store.xp).toBe(0);

    store.addLog('transport', 10, 4.11, true, 'Biked to work');

    const updated = useAppStore.getState();
    expect(updated.logs.length).toBe(1);
    expect(updated.logs[0].category).toBe('transport');
    expect(updated.logs[0].title).toBe('Biked to work');
    expect(updated.logs[0].carbon).toBe(4.11);
    
    // addLog increments XP by 10 (unlike backend which adds carbon factor)
    expect(updated.xp).toBe(10);
    expect(updated.level).toBe(1);
    expect(updated.streak).toBe(1);
  });

  test('deleteLog removes log from store logs list', () => {
    const store = useAppStore.getState();
    store.addLog('transport', 10, 4.11, true, 'Biked to work');
    
    const addedState = useAppStore.getState();
    const logId = addedState.logs[0].id;

    store.deleteLog(logId);

    const deletedState = useAppStore.getState();
    expect(deletedState.logs.length).toBe(0);
  });

  test('chat message API success handling', async () => {
    const fakeResponse = {
      reply: 'Great job saving carbon!',
      auto_log: {
        category: 'transport',
        description: 'Mocked ride',
        carbon_saved: 3.5
      }
    };

    // Mock global fetch
    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeResponse),
      })
    );
    globalThis.fetch = mockFetch;

    const store = useAppStore.getState();
    const result = await store.sendChatMessage('I cycled 5 miles today');

    expect(mockFetch).toHaveBeenCalled();
    expect(result).toEqual(fakeResponse);
  });

  test('chat message API failure and offline fallback simulation', async () => {
    // Mock global fetch to fail/reject
    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('Network disconnected'))
    );
    globalThis.fetch = mockFetch;

    // Suppress console.warn during test to keep output clean
    const originalWarn = console.warn;
    console.warn = jest.fn();

    const store = useAppStore.getState();
    const result = await store.sendChatMessage('I cycled 5 miles today');

    expect(mockFetch).toHaveBeenCalledTimes(2); // Retries for both endpoints
    expect(result.reply).toContain('EcoPulse AI');
    expect(result.auto_log).toBeDefined();
    expect(result.auto_log.category).toBe('transport');

    // Restore console.warn
    console.warn = originalWarn;
  });
});
