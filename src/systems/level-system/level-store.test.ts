/**
 * Level Store Unit Tests
 * 关卡系统状态管理单元测试
 *
 * @description 测试关卡进度管理、解锁逻辑和目标追踪
 * @requirements 4.1, 4.2, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLevelStore, getInitialLevelState } from './level-store';
import { SimulationResult } from '@/types';
import { getLevelsByChapter } from './level-definitions';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

const requireValue = <T,>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
};

describe('Level Store', () => {
  let store: ReturnType<typeof createLevelStore>;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    store = createLevelStore();
  });

  describe('Initial State', () => {
    /**
     * @requirements 4.1 - 游戏开始时只有第一章解锁
     */
    it('should have Chapter 1 unlocked by default', () => {
      const state = store.getState();
      expect(state.unlockedChapters).toContain(1);
      expect(state.unlockedChapters).toHaveLength(1);
    });

    it('should have first level of Chapter 1 unlocked', () => {
      const state = store.getState();
      const firstLevel = requireValue(
        getLevelsByChapter(1)[0],
        'Expected Chapter 1 to have at least one level'
      );
      const progress = requireValue(
        state.levelProgress[firstLevel.id],
        'Expected level progress for first level'
      );
      expect(progress.status).toBe('unlocked');
    });

    it('should have all other levels locked', () => {
      const state = store.getState();
      const chapter2Levels = getLevelsByChapter(2);
      for (const level of chapter2Levels) {
        const progress = requireValue(
          state.levelProgress[level.id],
          `Expected level progress for ${level.id}`
        );
        expect(progress.status).toBe('locked');
      }
    });

    it('should have currentChapter set to 1', () => {
      const state = store.getState();
      expect(state.currentChapter).toBe(1);
    });

    it('should have currentLevelId as null', () => {
      const state = store.getState();
      expect(state.currentLevelId).toBeNull();
    });
  });

  describe('getChapters', () => {
    it('should return all 6 chapters', () => {
      const chapters = store.getState().getChapters();
      expect(chapters).toHaveLength(6);
    });

    it('should mark Chapter 1 as unlocked', () => {
      const chapters = store.getState().getChapters();
      const firstChapter = requireValue(chapters[0], 'Expected Chapter 1');
      expect(firstChapter.unlocked).toBe(true);
    });

    it('should mark other chapters as locked', () => {
      const chapters = store.getState().getChapters();
      for (const chapter of chapters.slice(1)) {
        expect(chapter.unlocked).toBe(false);
      }
    });

    it('should include correct level counts', () => {
      const chapters = store.getState().getChapters();
      const firstChapter = requireValue(chapters[0], 'Expected Chapter 1');
      expect(firstChapter.levelCount).toBe(3); // Chapter 1 has 3 levels
    });

    it('should track completed levels count', () => {
      const chapters = store.getState().getChapters();
      const firstChapter = requireValue(chapters[0], 'Expected Chapter 1');
      expect(firstChapter.completedLevels).toBe(0);
    });
  });

  describe('getLevelsInChapter', () => {
    it('should return levels for a valid chapter', () => {
      const levels = store.getState().getLevelsInChapter(1);
      expect(levels.length).toBeGreaterThan(0);
      const firstLevel = requireValue(levels[0], 'Expected at least one level');
      expect(firstLevel.chapter).toBe(1);
    });

    it('should return empty array for invalid chapter', () => {
      const levels = store.getState().getLevelsInChapter(99);
      expect(levels).toHaveLength(0);
    });
  });

  describe('getLevelProgress', () => {
    it('should return progress for existing level', () => {
      const progress = store.getState().getLevelProgress('level-1-1');
      expect(progress.levelId).toBe('level-1-1');
      expect(progress.status).toBe('unlocked');
    });

    it('should return locked progress for non-existent level', () => {
      const progress = store.getState().getLevelProgress('non-existent');
      expect(progress.status).toBe('locked');
    });
  });

  describe('startLevel', () => {
    /**
     * @requirements 4.4 - 追踪关卡目标进度
     */
    it('should start an unlocked level', () => {
      const level = store.getState().startLevel('level-1-1');
      expect(level).not.toBeNull();
      expect(level?.id).toBe('level-1-1');
    });

    it('should set currentLevelId when starting a level', () => {
      store.getState().startLevel('level-1-1');
      expect(store.getState().currentLevelId).toBe('level-1-1');
    });

    it('should set level status to in_progress', () => {
      store.getState().startLevel('level-1-1');
      const progress = store.getState().getLevelProgress('level-1-1');
      expect(progress.status).toBe('in_progress');
    });

    it('should increment attempts counter', () => {
      store.getState().startLevel('level-1-1');
      const progress1 = store.getState().getLevelProgress('level-1-1');
      expect(progress1.attempts).toBe(1);

      // Reset to unlocked and start again
      store.setState((state) => ({
        levelProgress: {
          ...state.levelProgress,
          'level-1-1': {
            ...requireValue(
              state.levelProgress['level-1-1'],
              'Expected progress for level-1-1'
            ),
            status: 'unlocked',
          },
        },
      }));
      store.getState().startLevel('level-1-1');
      const progress2 = store.getState().getLevelProgress('level-1-1');
      expect(progress2.attempts).toBe(2);
    });

    it('should initialize objective progress tracking', () => {
      store.getState().startLevel('level-1-1');
      const state = store.getState();
      expect(Object.keys(state.currentObjectiveProgress).length).toBeGreaterThan(0);
    });

    it('should return null for locked level', () => {
      const level = store.getState().startLevel('level-2-1');
      expect(level).toBeNull();
    });

    it('should return null for non-existent level', () => {
      const level = store.getState().startLevel('non-existent');
      expect(level).toBeNull();
    });
  });

  describe('completeLevel', () => {
    const failedResult: SimulationResult = {
      success: false,
      finalFunds: 800,
      profitLoss: -200,
      profitLossPercent: -20,
      transactionCount: 1,
      executionTime: 500,
      errors: [{ code: 'ERROR', message: 'Test error' }],
    };

    beforeEach(() => {
      store.getState().startLevel('level-1-1');
    });

    /**
     * @requirements 4.5 - 完成所有目标后标记关卡完成并触发奖励
     */
    it('should mark level as completed on success', () => {
      // Level 1-1 objectives: use buy module (1 transaction), avoid loss (0%)
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      const completion = store.getState().completeLevel('level-1-1', result);
      expect(completion.success).toBe(true);

      const progress = store.getState().getLevelProgress('level-1-1');
      expect(progress.status).toBe('completed');
    });

    it('should calculate score on completion', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      const completion = store.getState().completeLevel('level-1-1', result);
      expect(completion.score).toBeGreaterThan(0);
    });

    it('should calculate reward on successful completion', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      const completion = store.getState().completeLevel('level-1-1', result);
      expect(completion.reward).toBeGreaterThan(0);
    });

    it('should update bestScore if new score is higher', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      store.getState().completeLevel('level-1-1', result);
      const progress = store.getState().getLevelProgress('level-1-1');
      expect(progress.bestScore).toBeGreaterThan(0);
    });

    it('should reset currentLevelId after completion', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      store.getState().completeLevel('level-1-1', result);
      expect(store.getState().currentLevelId).toBeNull();
    });

    it('should set level to unlocked on failure', () => {
      store.getState().completeLevel('level-1-1', failedResult);
      const progress = store.getState().getLevelProgress('level-1-1');
      expect(progress.status).toBe('unlocked');
    });

    it('should return zero reward on failure', () => {
      const completion = store.getState().completeLevel('level-1-1', failedResult);
      expect(completion.reward).toBe(0);
    });
  });

  describe('unlockNextLevel', () => {
    /**
     * @requirements 4.2 - 完成章节所有关卡后解锁下一章节
     */
    it('should unlock the next level in the same chapter', () => {
      // Complete level 1-1
      store.setState((state) => ({
        levelProgress: {
          ...state.levelProgress,
          'level-1-1': {
            ...requireValue(
              state.levelProgress['level-1-1'],
              'Expected progress for level-1-1'
            ),
            status: 'completed',
          },
        },
      }));

      store.getState().unlockNextLevel('level-1-1');

      const nextProgress = store.getState().getLevelProgress('level-1-2');
      expect(nextProgress.status).toBe('unlocked');
    });

    it('should unlock next chapter when completing last level of a chapter', () => {
      // Set all chapter 1 levels as completed
      store.setState((state) => ({
        levelProgress: {
          ...state.levelProgress,
          'level-1-1': {
            ...requireValue(
              state.levelProgress['level-1-1'],
              'Expected progress for level-1-1'
            ),
            status: 'completed',
          },
          'level-1-2': {
            ...requireValue(
              state.levelProgress['level-1-2'],
              'Expected progress for level-1-2'
            ),
            status: 'completed',
          },
          'level-1-3': {
            ...requireValue(
              state.levelProgress['level-1-3'],
              'Expected progress for level-1-3'
            ),
            status: 'completed',
          },
        },
      }));

      store.getState().unlockNextLevel('level-1-3');

      expect(store.getState().unlockedChapters).toContain(2);
    });

    it('should not unlock chapter 7 (does not exist)', () => {
      // Set all chapter 6 levels as completed
      store.setState((state) => ({
        levelProgress: {
          ...state.levelProgress,
          'level-6-1': {
            ...requireValue(
              state.levelProgress['level-6-1'],
              'Expected progress for level-6-1'
            ),
            status: 'completed',
          },
          'level-6-2': {
            ...requireValue(
              state.levelProgress['level-6-2'],
              'Expected progress for level-6-2'
            ),
            status: 'completed',
          },
          'level-6-3': {
            ...requireValue(
              state.levelProgress['level-6-3'],
              'Expected progress for level-6-3'
            ),
            status: 'completed',
          },
        },
        unlockedChapters: [1, 2, 3, 4, 5, 6],
      }));

      store.getState().unlockNextLevel('level-6-3');

      expect(store.getState().unlockedChapters).not.toContain(7);
    });
  });

  describe('isChapterUnlocked', () => {
    it('should return true for Chapter 1', () => {
      expect(store.getState().isChapterUnlocked(1)).toBe(true);
    });

    it('should return false for locked chapters', () => {
      expect(store.getState().isChapterUnlocked(2)).toBe(false);
    });
  });

  describe('isLevelUnlocked', () => {
    it('should return true for unlocked level', () => {
      expect(store.getState().isLevelUnlocked('level-1-1')).toBe(true);
    });

    it('should return false for locked level', () => {
      expect(store.getState().isLevelUnlocked('level-2-1')).toBe(false);
    });
  });

  describe('updateObjectiveProgress', () => {
    /**
     * @requirements 4.4 - 追踪关卡目标进度
     */
    it('should update objective progress', () => {
      store.getState().startLevel('level-1-1');
      store.getState().updateObjectiveProgress('obj-1-1-1', 50);

      const state = store.getState();
      expect(state.currentObjectiveProgress['obj-1-1-1']).toBe(50);
    });
  });

  describe('checkObjectivesCompletion', () => {
    it('should detect completed profit objective', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1200,
        profitLoss: 200,
        profitLossPercent: 20,
        transactionCount: 3,
        executionTime: 1000,
        errors: [],
      };

      // Level 1-2 has profit objective of 10%
      const completed = store.getState().checkObjectivesCompletion('level-1-2', result);
      expect(completed).toContain('obj-1-2-1'); // profit objective
    });

    it('should detect completed transaction_count objective', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1100,
        profitLoss: 100,
        profitLossPercent: 10,
        transactionCount: 5,
        executionTime: 1000,
        errors: [],
      };

      // Level 1-2 has transaction_count objective of 2
      const completed = store.getState().checkObjectivesCompletion('level-1-2', result);
      expect(completed).toContain('obj-1-2-2'); // transaction count objective
    });

    it('should detect completed avoid_loss objective', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1000,
        profitLoss: 0,
        profitLossPercent: 0,
        transactionCount: 1,
        executionTime: 1000,
        errors: [],
      };

      // Level 1-1 has avoid_loss objective
      const completed = store.getState().checkObjectivesCompletion('level-1-1', result);
      expect(completed).toContain('obj-1-1-2'); // avoid loss objective
    });

    it('should return empty array for non-existent level', () => {
      const result: SimulationResult = {
        success: true,
        finalFunds: 1100,
        profitLoss: 100,
        profitLossPercent: 10,
        transactionCount: 2,
        executionTime: 1000,
        errors: [],
      };

      const completed = store.getState().checkObjectivesCompletion('non-existent', result);
      expect(completed).toHaveLength(0);
    });
  });

  describe('resetLevelState', () => {
    it('should reset to initial state', () => {
      // Modify state
      store.getState().startLevel('level-1-1');
      store.setState({ unlockedChapters: [1, 2, 3] });

      // Reset
      store.getState().resetLevelState();

      const state = store.getState();
      expect(state.currentLevelId).toBeNull();
      expect(state.unlockedChapters).toEqual([1]);
    });
  });

  describe('Persistence', () => {
    it('should save state to localStorage', () => {
      store.getState().startLevel('level-1-1');
      const saved = store.getState().saveToStorage();
      expect(saved).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load state from localStorage', () => {
      // Save some state
      store.setState({ unlockedChapters: [1, 2] });
      store.getState().saveToStorage();

      // Create new store and load
      const newStore = createLevelStore();
      const loaded = newStore.getState().loadFromStorage();
      expect(loaded).toBe(true);
      expect(newStore.getState().unlockedChapters).toContain(2);
    });

    it('should clear localStorage', () => {
      store.getState().saveToStorage();
      const cleared = store.getState().clearStorage();
      expect(cleared).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});

describe('getInitialLevelState', () => {
  it('should return a copy of initial state', () => {
    const state1 = getInitialLevelState();
    const state2 = getInitialLevelState();

    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2); // Different references
  });

  it('should have Chapter 1 unlocked', () => {
    const state = getInitialLevelState();
    expect(state.unlockedChapters).toContain(1);
  });
});
