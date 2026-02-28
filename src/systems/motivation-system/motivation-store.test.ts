import { beforeEach, describe, expect, it } from 'vitest';
import { useMotivationStore } from './motivation-store';

describe('motivation store', () => {
  beforeEach(() => {
    useMotivationStore.getState().reset();
    localStorage.clear();
  });

  it('increases streak and applies milestone bonus', () => {
    const store = useMotivationStore.getState();

    store.recordRunResult({
      success: true,
      baseReward: 100,
      replayClear: false,
      unlockedNewChapter: false,
    });
    store.recordRunResult({
      success: true,
      baseReward: 100,
      replayClear: false,
      unlockedNewChapter: false,
    });
    const third = useMotivationStore.getState().recordRunResult({
      success: true,
      baseReward: 100,
      replayClear: false,
      unlockedNewChapter: false,
    });

    expect(third.newStreak).toBe(3);
    expect(third.milestoneBonus).toBeGreaterThan(0);
    expect(third.totalPayout).toBeGreaterThan(third.baseReward);
  });

  it('resets streak on failure', () => {
    const store = useMotivationStore.getState();

    store.recordRunResult({
      success: true,
      baseReward: 120,
      replayClear: false,
      unlockedNewChapter: false,
    });
    const failed = useMotivationStore.getState().recordRunResult({
      success: false,
      baseReward: 120,
      replayClear: false,
      unlockedNewChapter: false,
    });

    expect(failed.totalPayout).toBe(0);
    expect(useMotivationStore.getState().winStreak).toBe(0);
  });

  it('reduces replay clear base reward', () => {
    const payout = useMotivationStore.getState().recordRunResult({
      success: true,
      baseReward: 200,
      replayClear: true,
      unlockedNewChapter: false,
    });

    expect(payout.baseReward).toBe(70);
    expect(payout.replayReduction).toBeGreaterThan(0);
  });
});

