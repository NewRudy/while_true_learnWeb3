/**
 * Level System Store
 * 关卡系统状态管理
 *
 * @description 使用 Zustand 管理关卡进度和解锁状态
 * @requirements 4.1, 4.2, 4.4, 4.5
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  LevelProgress,
  LevelDefinition,
  LevelCompletionResult,
  ChapterInfo,
  SimulationResult,
  LevelStatus,
} from '@/types';
import {
  saveLevelState,
  loadLevelState,
  clearLevelState,
} from './level-persistence';
import {
  getAllChapterMetadata,
  getLevelsByChapter,
  getLevelDefinitionById,
  getNextLevel,
  isLastLevelInChapter,
  allLevelDefinitions,
} from './level-definitions';

/**
 * Level Store 状态接口
 */
export interface LevelStoreState {
  /** 当前章节 */
  currentChapter: number;
  /** 当前关卡ID */
  currentLevelId: string | null;
  /** 各关卡进度 */
  levelProgress: Record<string, LevelProgress>;
  /** 已解锁的章节列表 */
  unlockedChapters: number[];
  /** 当前关卡的目标追踪状态 */
  currentObjectiveProgress: Record<string, number>;
}

/**
 * Level Store 操作接口
 */
export interface LevelStoreActions {
  /**
   * 获取所有章节信息
   * @returns 章节信息数组
   */
  getChapters: () => ChapterInfo[];

  /**
   * 获取某章节的所有关卡
   * @param chapter 章节编号
   * @returns 关卡定义数组
   */
  getLevelsInChapter: (chapter: number) => LevelDefinition[];

  /**
   * 获取关卡进度
   * @param levelId 关卡ID
   * @returns 关卡进度
   */
  getLevelProgress: (levelId: string) => LevelProgress;

  /**
   * 开始关卡
   * @param levelId 关卡ID
   * @returns 关卡定义
   * @requirements 4.4
   */
  startLevel: (levelId: string) => LevelDefinition | null;

  /**
   * 完成关卡
   * @param levelId 关卡ID
   * @param result 模拟结果
   * @returns 关卡完成结果
   * @requirements 4.5
   */
  completeLevel: (levelId: string, result: SimulationResult) => LevelCompletionResult;

  /**
   * 解锁下一关卡
   * @param currentLevelId 当前关卡ID
   * @requirements 4.2
   */
  unlockNextLevel: (currentLevelId: string) => void;

  /**
   * 检查章节是否已解锁
   * @param chapter 章节编号
   * @returns 是否已解锁
   */
  isChapterUnlocked: (chapter: number) => boolean;

  /**
   * 检查关卡是否已解锁
   * @param levelId 关卡ID
   * @returns 是否已解锁
   */
  isLevelUnlocked: (levelId: string) => boolean;

  /**
   * 更新目标进度
   * @param objectiveId 目标ID
   * @param progress 进度值
   * @requirements 4.4
   */
  updateObjectiveProgress: (objectiveId: string, progress: number) => void;

  /**
   * 检查目标是否完成
   * @param levelId 关卡ID
   * @param result 模拟结果
   * @returns 已完成的目标ID列表
   */
  checkObjectivesCompletion: (levelId: string, result: SimulationResult) => string[];

  /**
   * 重置关卡状态（用于新游戏）
   */
  resetLevelState: () => void;

  /**
   * 从 localStorage 加载保存的状态
   * @returns 是否成功加载
   */
  loadFromStorage: () => boolean;

  /**
   * 保存当前状态到 localStorage
   * @returns 是否成功保存
   */
  saveToStorage: () => boolean;

  /**
   * 清除 localStorage 中保存的状态
   * @returns 是否成功清除
   */
  clearStorage: () => boolean;
}

/**
 * Level Store 完整类型
 */
export type LevelStore = LevelStoreState & LevelStoreActions;

/**
 * 创建初始关卡进度
 * @param levelId 关卡ID
 * @param status 初始状态
 * @returns 关卡进度对象
 */
function createInitialLevelProgress(levelId: string, status: LevelStatus): LevelProgress {
  return {
    levelId,
    status,
    bestScore: 0,
    attempts: 0,
    completedObjectives: [],
  };
}

function getProgressSnapshot(
  levelId: string,
  status: LevelStatus,
  progress?: LevelProgress
): LevelProgress {
  return progress ?? createInitialLevelProgress(levelId, status);
}

/**
 * 初始化所有关卡进度
 * 第一章第一关解锁，其他关卡锁定
 * @requirements 4.1
 */
function initializeLevelProgress(): Record<string, LevelProgress> {
  const progress: Record<string, LevelProgress> = {};

  for (const level of allLevelDefinitions) {
    // 第一章第一关默认解锁
    const isFirstLevel = level.chapter === 1 && level.levelNumber === 1;
    const status: LevelStatus = isFirstLevel ? 'unlocked' : 'locked';
    progress[level.id] = createInitialLevelProgress(level.id, status);
  }

  return progress;
}

/**
 * 初始状态
 * @requirements 4.1 - 第一章默认解锁
 */
const initialState: LevelStoreState = {
  currentChapter: 1,
  currentLevelId: null,
  levelProgress: initializeLevelProgress(),
  unlockedChapters: [1], // 第一章默认解锁
  currentObjectiveProgress: {},
};

/**
 * 计算关卡分数
 * @param result 模拟结果
 * @param level 关卡定义
 * @returns 分数 (0-100)
 */
function calculateScore(result: SimulationResult, level: LevelDefinition): number {
  if (!result.success) {
    return 0;
  }

  let score = 0;

  // 基础分：完成关卡得 50 分
  score += 50;

  // 利润分：根据利润百分比计算（最多 30 分）
  const profitTarget = ((level.targetFunds - level.initialFunds) / level.initialFunds) * 100;
  if (profitTarget > 0) {
    const profitRatio = Math.min(result.profitLossPercent / profitTarget, 1.5);
    score += Math.floor(profitRatio * 30);
  } else {
    // 如果目标是不亏损，则根据是否亏损计算
    score += result.profitLoss >= 0 ? 30 : 0;
  }

  // 效率分：根据交易次数计算（最多 20 分）
  const transactionEfficiency = Math.max(0, 1 - result.transactionCount / level.maxTransactions);
  score += Math.floor(transactionEfficiency * 20);

  return Math.min(100, Math.max(0, score));
}

/**
 * 计算奖励金额
 * @param score 分数
 * @param level 关卡定义
 * @returns 奖励金额
 */
function calculateReward(score: number, level: LevelDefinition): number {
  // 基础奖励：章节 * 100
  const baseReward = level.chapter * 100;

  // 分数加成：分数 / 100 * 基础奖励
  const scoreBonus = Math.floor((score / 100) * baseReward);

  return baseReward + scoreBonus;
}

/**
 * 创建 Level Store
 * 使用 Zustand 进行状态管理
 *
 * @requirements 4.1, 4.2, 4.4, 4.5
 */
export const useLevelStore = create<LevelStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    ...initialState,

    /**
     * 获取所有章节信息
     */
    getChapters: (): ChapterInfo[] => {
      const state = get();
      const chapters = getAllChapterMetadata();

      return chapters.map((chapter) => {
        const levels = getLevelsByChapter(chapter.chapter);
        const completedLevels = levels.filter(
          (level) => state.levelProgress[level.id]?.status === 'completed'
        ).length;

        return {
          chapter: chapter.chapter,
          name: chapter.name,
          description: chapter.description,
          unlocked: state.unlockedChapters.includes(chapter.chapter),
          levelCount: levels.length,
          completedLevels,
        };
      });
    },

    /**
     * 获取某章节的所有关卡
     */
    getLevelsInChapter: (chapter: number): LevelDefinition[] => {
      return getLevelsByChapter(chapter);
    },

    /**
     * 获取关卡进度
     */
    getLevelProgress: (levelId: string): LevelProgress => {
      const state = get();
      return (
        state.levelProgress[levelId] ||
        createInitialLevelProgress(levelId, 'locked')
      );
    },

    /**
     * 开始关卡
     * @requirements 4.4 - 追踪关卡目标进度
     */
    startLevel: (levelId: string): LevelDefinition | null => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        console.warn(`Level not found: ${levelId}`);
        return null;
      }

      const state = get();
      const progress = getProgressSnapshot(levelId, 'locked', state.levelProgress[levelId]);

      // 检查关卡是否已解锁
      if (progress && progress.status === 'locked') {
        console.warn(`Level is locked: ${levelId}`);
        return null;
      }

      // 初始化目标进度追踪
      const objectiveProgress: Record<string, number> = {};
      for (const objective of level.objectives) {
        objectiveProgress[objective.id] = 0;
      }

      set((state) => {
        const baseProgress = getProgressSnapshot(
          levelId,
          'unlocked',
          state.levelProgress[levelId]
        );
        return {
          currentLevelId: levelId,
          currentChapter: level.chapter,
          currentObjectiveProgress: objectiveProgress,
          levelProgress: {
            ...state.levelProgress,
            [levelId]: {
              ...baseProgress,
              status: 'in_progress',
              attempts: baseProgress.attempts + 1,
            },
          },
        };
      });

      return level;
    },

    /**
     * 完成关卡
     * @requirements 4.5 - 标记关卡完成并触发奖励
     */
    completeLevel: (levelId: string, result: SimulationResult): LevelCompletionResult => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        return {
          success: false,
          score: 0,
          reward: 0,
          unlockedNewLevel: false,
          unlockedNewChapter: false,
        };
      }

      // 检查目标完成情况
      const completedObjectives = get().checkObjectivesCompletion(levelId, result);
      const allObjectivesCompleted = completedObjectives.length === level.objectives.length;

      // 计算分数和奖励
      const score = calculateScore(result, level);
      const reward =
        allObjectivesCompleted && result.success ? calculateReward(score, level) : 0;

      // 判断是否成功完成
      const success = allObjectivesCompleted && result.success;

      let unlockedNewLevel = false;
      let unlockedNewChapter = false;

      if (success) {
        // 更新关卡进度
        set((state) => {
          const baseProgress = getProgressSnapshot(
            levelId,
            'unlocked',
            state.levelProgress[levelId]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [levelId]: {
                ...baseProgress,
                status: 'completed',
                bestScore: Math.max(baseProgress.bestScore, score),
                completedObjectives,
              },
            },
            currentLevelId: null,
            currentObjectiveProgress: {},
          };
        });

        // 解锁下一关卡
        const nextLevel = getNextLevel(levelId);
        if (nextLevel) {
          const nextProgress = get().levelProgress[nextLevel.id];
          if (nextProgress?.status === 'locked') {
            unlockedNewLevel = true;
            get().unlockNextLevel(levelId);
          }
        }

        // 检查是否解锁新章节
        if (isLastLevelInChapter(levelId)) {
          const nextChapter = level.chapter + 1;
          if (!get().unlockedChapters.includes(nextChapter) && nextChapter <= 6) {
            unlockedNewChapter = true;
          }
        }
      } else {
        // 失败时只更新状态为 unlocked（可重试）
        set((state) => {
          const baseProgress = getProgressSnapshot(
            levelId,
            'unlocked',
            state.levelProgress[levelId]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [levelId]: {
                ...baseProgress,
                status: 'unlocked',
              },
            },
            currentLevelId: null,
            currentObjectiveProgress: {},
          };
        });
      }

      return {
        success,
        score,
        reward,
        unlockedNewLevel,
        unlockedNewChapter,
      };
    },

    /**
     * 解锁下一关卡
     * @requirements 4.2 - 完成章节所有关卡后解锁下一章节
     */
    unlockNextLevel: (currentLevelId: string): void => {
      const currentLevel = getLevelDefinitionById(currentLevelId);
      if (!currentLevel) {
        return;
      }

      const nextLevel = getNextLevel(currentLevelId);

      // 解锁下一关卡
      if (nextLevel) {
        set((state) => {
          const baseProgress = getProgressSnapshot(
            nextLevel.id,
            'locked',
            state.levelProgress[nextLevel.id]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [nextLevel.id]: {
                ...baseProgress,
                levelId: nextLevel.id,
                status: 'unlocked',
                bestScore: baseProgress.bestScore,
                attempts: baseProgress.attempts,
                completedObjectives: baseProgress.completedObjectives,
              },
            },
          };
        });
      }

      // 如果是章节最后一关，解锁下一章节
      if (isLastLevelInChapter(currentLevelId)) {
        const nextChapter = currentLevel.chapter + 1;
        if (nextChapter <= 6) {
          set((state) => {
            if (state.unlockedChapters.includes(nextChapter)) {
              return state;
            }
            return {
              unlockedChapters: [...state.unlockedChapters, nextChapter],
            };
          });
        }
      }
    },

    /**
     * 检查章节是否已解锁
     */
    isChapterUnlocked: (chapter: number): boolean => {
      return get().unlockedChapters.includes(chapter);
    },

    /**
     * 检查关卡是否已解锁
     */
    isLevelUnlocked: (levelId: string): boolean => {
      const progress = get().levelProgress[levelId];
      return progress?.status !== 'locked';
    },

    /**
     * 更新目标进度
     * @requirements 4.4 - 追踪关卡目标进度
     */
    updateObjectiveProgress: (objectiveId: string, progress: number): void => {
      set((state) => ({
        currentObjectiveProgress: {
          ...state.currentObjectiveProgress,
          [objectiveId]: progress,
        },
      }));
    },

    /**
     * 检查目标是否完成
     */
    checkObjectivesCompletion: (levelId: string, result: SimulationResult): string[] => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        return [];
      }

      const completedObjectives: string[] = [];

      for (const objective of level.objectives) {
        let completed = false;

        switch (objective.type) {
          case 'profit':
            // 检查利润百分比是否达到目标
            completed = result.profitLossPercent >= objective.target;
            break;

          case 'transaction_count':
            // 检查交易次数是否达到目标
            completed = result.transactionCount >= objective.target;
            break;

          case 'use_module':
            // 优先使用真实执行模块数量评估，兼容旧结果时回退到交易次数
            if (Array.isArray(result.executedModuleTypes) && result.executedModuleTypes.length > 0) {
              completed = new Set(result.executedModuleTypes).size >= objective.target;
            } else {
              completed = result.transactionCount >= objective.target;
            }
            break;

          case 'avoid_loss':
            // 检查亏损是否在允许范围内
            const lossPercent = result.profitLossPercent < 0 ? Math.abs(result.profitLossPercent) : 0;
            completed = lossPercent <= objective.target;
            break;
        }

        if (completed) {
          completedObjectives.push(objective.id);
        }
      }

      return completedObjectives;
    },

    /**
     * 重置关卡状态
     */
    resetLevelState: (): void => {
      set(initialState);
      clearLevelState();
    },

    /**
     * 从 localStorage 加载保存的状态
     */
    loadFromStorage: (): boolean => {
      const result = loadLevelState();
      if (result.success && result.data) {
        set({
          currentChapter: result.data.currentChapter,
          currentLevelId: result.data.currentLevelId,
          levelProgress: result.data.levelProgress,
          unlockedChapters: result.data.unlockedChapters,
          currentObjectiveProgress: {},
        });
        return true;
      }
      return false;
    },

    /**
     * 保存当前状态到 localStorage
     */
    saveToStorage: (): boolean => {
      const state = get();
      return saveLevelState({
        currentChapter: state.currentChapter,
        currentLevelId: state.currentLevelId,
        levelProgress: state.levelProgress,
        unlockedChapters: state.unlockedChapters,
      });
    },

    /**
     * 清除 localStorage 中保存的状态
     */
    clearStorage: (): boolean => {
      return clearLevelState();
    },
  }))
);

/**
 * 设置自动保存订阅
 * 当关卡进度或解锁章节变化时自动保存
 */
export function setupLevelPersistence(): () => void {
  // 订阅关卡进度变化
  const unsubProgress = useLevelStore.subscribe(
    (state) => state.levelProgress,
    () => {
      useLevelStore.getState().saveToStorage();
    }
  );

  // 订阅解锁章节变化
  const unsubChapters = useLevelStore.subscribe(
    (state) => state.unlockedChapters,
    () => {
      useLevelStore.getState().saveToStorage();
    }
  );

  // 返回清理函数
  return () => {
    unsubProgress();
    unsubChapters();
  };
}

/**
 * 初始化关卡系统（加载保存的状态并设置自动保存）
 * @returns 清理函数
 */
export function initializeLevelSystem(): () => void {
  // 尝试从 localStorage 加载保存的状态
  useLevelStore.getState().loadFromStorage();

  // 设置自动保存
  return setupLevelPersistence();
}

/**
 * 创建独立的 Level Store 实例（用于测试）
 */
export function createLevelStore() {
  return create<LevelStore>()((set, get) => ({
    ...initialState,

    getChapters: (): ChapterInfo[] => {
      const state = get();
      const chapters = getAllChapterMetadata();

      return chapters.map((chapter) => {
        const levels = getLevelsByChapter(chapter.chapter);
        const completedLevels = levels.filter(
          (level) => state.levelProgress[level.id]?.status === 'completed'
        ).length;

        return {
          chapter: chapter.chapter,
          name: chapter.name,
          description: chapter.description,
          unlocked: state.unlockedChapters.includes(chapter.chapter),
          levelCount: levels.length,
          completedLevels,
        };
      });
    },

    getLevelsInChapter: (chapter: number): LevelDefinition[] => {
      return getLevelsByChapter(chapter);
    },

    getLevelProgress: (levelId: string): LevelProgress => {
      const state = get();
      return (
        state.levelProgress[levelId] ||
        createInitialLevelProgress(levelId, 'locked')
      );
    },

    startLevel: (levelId: string): LevelDefinition | null => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        console.warn(`Level not found: ${levelId}`);
        return null;
      }

      const state = get();
      const progress = getProgressSnapshot(levelId, 'locked', state.levelProgress[levelId]);

      if (progress && progress.status === 'locked') {
        console.warn(`Level is locked: ${levelId}`);
        return null;
      }

      const objectiveProgress: Record<string, number> = {};
      for (const objective of level.objectives) {
        objectiveProgress[objective.id] = 0;
      }

      set((state) => {
        const baseProgress = getProgressSnapshot(
          levelId,
          'unlocked',
          state.levelProgress[levelId]
        );
        return {
          currentLevelId: levelId,
          currentChapter: level.chapter,
          currentObjectiveProgress: objectiveProgress,
          levelProgress: {
            ...state.levelProgress,
            [levelId]: {
              ...baseProgress,
              status: 'in_progress',
              attempts: baseProgress.attempts + 1,
            },
          },
        };
      });

      return level;
    },

    completeLevel: (levelId: string, result: SimulationResult): LevelCompletionResult => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        return {
          success: false,
          score: 0,
          reward: 0,
          unlockedNewLevel: false,
          unlockedNewChapter: false,
        };
      }

      const completedObjectives = get().checkObjectivesCompletion(levelId, result);
      const allObjectivesCompleted = completedObjectives.length === level.objectives.length;
      const score = calculateScore(result, level);
      const reward =
        allObjectivesCompleted && result.success ? calculateReward(score, level) : 0;
      const success = allObjectivesCompleted && result.success;

      let unlockedNewLevel = false;
      let unlockedNewChapter = false;

      if (success) {
        set((state) => {
          const baseProgress = getProgressSnapshot(
            levelId,
            'unlocked',
            state.levelProgress[levelId]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [levelId]: {
                ...baseProgress,
                status: 'completed',
                bestScore: Math.max(baseProgress.bestScore, score),
                completedObjectives,
              },
            },
            currentLevelId: null,
            currentObjectiveProgress: {},
          };
        });

        const nextLevel = getNextLevel(levelId);
        if (nextLevel) {
          const nextProgress = get().levelProgress[nextLevel.id];
          if (nextProgress?.status === 'locked') {
            unlockedNewLevel = true;
            get().unlockNextLevel(levelId);
          }
        }

        if (isLastLevelInChapter(levelId)) {
          const nextChapter = level.chapter + 1;
          if (!get().unlockedChapters.includes(nextChapter) && nextChapter <= 6) {
            unlockedNewChapter = true;
          }
        }
      } else {
        set((state) => {
          const baseProgress = getProgressSnapshot(
            levelId,
            'unlocked',
            state.levelProgress[levelId]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [levelId]: {
                ...baseProgress,
                status: 'unlocked',
              },
            },
            currentLevelId: null,
            currentObjectiveProgress: {},
          };
        });
      }

      return {
        success,
        score,
        reward,
        unlockedNewLevel,
        unlockedNewChapter,
      };
    },

    unlockNextLevel: (currentLevelId: string): void => {
      const currentLevel = getLevelDefinitionById(currentLevelId);
      if (!currentLevel) {
        return;
      }

      const nextLevel = getNextLevel(currentLevelId);

      if (nextLevel) {
        set((state) => {
          const baseProgress = getProgressSnapshot(
            nextLevel.id,
            'locked',
            state.levelProgress[nextLevel.id]
          );
          return {
            levelProgress: {
              ...state.levelProgress,
              [nextLevel.id]: {
                ...baseProgress,
                levelId: nextLevel.id,
                status: 'unlocked',
                bestScore: baseProgress.bestScore,
                attempts: baseProgress.attempts,
                completedObjectives: baseProgress.completedObjectives,
              },
            },
          };
        });
      }

      if (isLastLevelInChapter(currentLevelId)) {
        const nextChapter = currentLevel.chapter + 1;
        if (nextChapter <= 6) {
          set((state) => {
            if (state.unlockedChapters.includes(nextChapter)) {
              return state;
            }
            return {
              unlockedChapters: [...state.unlockedChapters, nextChapter],
            };
          });
        }
      }
    },

    isChapterUnlocked: (chapter: number): boolean => {
      return get().unlockedChapters.includes(chapter);
    },

    isLevelUnlocked: (levelId: string): boolean => {
      const progress = get().levelProgress[levelId];
      return progress?.status !== 'locked';
    },

    updateObjectiveProgress: (objectiveId: string, progress: number): void => {
      set((state) => ({
        currentObjectiveProgress: {
          ...state.currentObjectiveProgress,
          [objectiveId]: progress,
        },
      }));
    },

    checkObjectivesCompletion: (levelId: string, result: SimulationResult): string[] => {
      const level = getLevelDefinitionById(levelId);
      if (!level) {
        return [];
      }

      const completedObjectives: string[] = [];

      for (const objective of level.objectives) {
        let completed = false;

        switch (objective.type) {
          case 'profit':
            completed = result.profitLossPercent >= objective.target;
            break;
          case 'transaction_count':
            completed = result.transactionCount >= objective.target;
            break;
          case 'use_module':
            if (Array.isArray(result.executedModuleTypes) && result.executedModuleTypes.length > 0) {
              completed = new Set(result.executedModuleTypes).size >= objective.target;
            } else {
              completed = result.transactionCount >= objective.target;
            }
            break;
          case 'avoid_loss':
            const lossPercent = result.profitLossPercent < 0 ? Math.abs(result.profitLossPercent) : 0;
            completed = lossPercent <= objective.target;
            break;
        }

        if (completed) {
          completedObjectives.push(objective.id);
        }
      }

      return completedObjectives;
    },

    resetLevelState: (): void => {
      set(initialState);
      clearLevelState();
    },

    loadFromStorage: (): boolean => {
      const result = loadLevelState();
      if (result.success && result.data) {
        set({
          currentChapter: result.data.currentChapter,
          currentLevelId: result.data.currentLevelId,
          levelProgress: result.data.levelProgress,
          unlockedChapters: result.data.unlockedChapters,
          currentObjectiveProgress: {},
        });
        return true;
      }
      return false;
    },

    saveToStorage: (): boolean => {
      const state = get();
      return saveLevelState({
        currentChapter: state.currentChapter,
        currentLevelId: state.currentLevelId,
        levelProgress: state.levelProgress,
        unlockedChapters: state.unlockedChapters,
      });
    },

    clearStorage: (): boolean => {
      return clearLevelState();
    },
  }));
}

/**
 * 获取初始状态（用于测试）
 */
export function getInitialLevelState(): LevelStoreState {
  return { ...initialState };
}
