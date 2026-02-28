/**
 * Level Persistence Module
 * 关卡系统持久化模块
 *
 * @description 处理关卡进度的 localStorage 持久化
 * @requirements 4.1, 4.2, 4.4, 4.5
 */

import { LevelProgress, LevelStatus } from '@/types';

/**
 * localStorage 存储键
 */
export const LEVEL_STORAGE_KEY = 'chainquest_level_state';

/**
 * 当前持久化数据版本
 */
export const LEVEL_STORAGE_VERSION = '1.0.0';

/**
 * 持久化的关卡状态数据结构
 */
export interface PersistedLevelState {
  /** 数据版本号 */
  version: string;
  /** 保存时间戳 */
  timestamp: number;
  /** 当前章节 */
  currentChapter: number;
  /** 当前关卡ID */
  currentLevelId: string | null;
  /** 各关卡进度 */
  levelProgress: Record<string, LevelProgress>;
  /** 已解锁的章节列表 */
  unlockedChapters: number[];
}

/**
 * 加载结果类型
 */
export interface LoadResult {
  /** 是否成功加载 */
  success: boolean;
  /** 加载的数据（成功时） */
  data?: PersistedLevelState;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 有效的关卡状态值
 */
const VALID_LEVEL_STATUSES: LevelStatus[] = ['locked', 'unlocked', 'in_progress', 'completed'];

/**
 * 验证关卡状态值
 * @param status 待验证的状态
 * @returns 是否有效
 */
export function isValidLevelStatus(status: unknown): status is LevelStatus {
  return typeof status === 'string' && VALID_LEVEL_STATUSES.includes(status as LevelStatus);
}

/**
 * 验证关卡进度数据
 * @param progress 待验证的关卡进度
 * @returns 是否有效
 */
export function isValidLevelProgress(progress: unknown): progress is LevelProgress {
  if (typeof progress !== 'object' || progress === null) {
    return false;
  }

  const p = progress as Record<string, unknown>;

  return (
    typeof p.levelId === 'string' &&
    p.levelId.length > 0 &&
    isValidLevelStatus(p.status) &&
    typeof p.bestScore === 'number' &&
    p.bestScore >= 0 &&
    typeof p.attempts === 'number' &&
    p.attempts >= 0 &&
    Array.isArray(p.completedObjectives) &&
    p.completedObjectives.every((obj) => typeof obj === 'string')
  );
}

/**
 * 验证持久化的关卡状态数据
 * @param data 待验证的数据
 * @returns 是否有效
 */
export function isValidPersistedLevelState(data: unknown): data is PersistedLevelState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as Record<string, unknown>;

  // 验证版本和时间戳
  if (typeof d.version !== 'string' || typeof d.timestamp !== 'number') {
    return false;
  }

  // 验证当前章节
  if (typeof d.currentChapter !== 'number' || d.currentChapter < 1) {
    return false;
  }

  // 验证当前关卡ID（可以为 null）
  if (d.currentLevelId !== null && typeof d.currentLevelId !== 'string') {
    return false;
  }

  // 验证关卡进度
  if (typeof d.levelProgress !== 'object' || d.levelProgress === null) {
    return false;
  }
  const levelProgress = d.levelProgress as Record<string, unknown>;
  for (const key of Object.keys(levelProgress)) {
    if (!isValidLevelProgress(levelProgress[key])) {
      return false;
    }
  }

  // 验证已解锁章节列表
  if (!Array.isArray(d.unlockedChapters)) {
    return false;
  }
  if (!d.unlockedChapters.every((ch) => typeof ch === 'number' && ch >= 1)) {
    return false;
  }

  return true;
}

/**
 * 保存关卡状态到 localStorage
 * @param state 要保存的状态
 * @returns 是否保存成功
 */
export function saveLevelState(state: {
  currentChapter: number;
  currentLevelId: string | null;
  levelProgress: Record<string, LevelProgress>;
  unlockedChapters: number[];
}): boolean {
  try {
    const persistedState: PersistedLevelState = {
      version: LEVEL_STORAGE_VERSION,
      timestamp: Date.now(),
      currentChapter: state.currentChapter,
      currentLevelId: state.currentLevelId,
      levelProgress: state.levelProgress,
      unlockedChapters: state.unlockedChapters,
    };

    const serialized = JSON.stringify(persistedState);
    localStorage.setItem(LEVEL_STORAGE_KEY, serialized);

    return true;
  } catch (error) {
    console.error('Failed to save level state:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载关卡状态
 * @returns 加载结果
 */
export function loadLevelState(): LoadResult {
  try {
    const serialized = localStorage.getItem(LEVEL_STORAGE_KEY);

    // 没有保存的数据
    if (serialized === null) {
      return {
        success: false,
        error: 'No saved level state found',
      };
    }

    // 解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      return {
        success: false,
        error: 'Failed to parse saved level state: invalid JSON',
      };
    }

    // 验证数据结构
    if (!isValidPersistedLevelState(parsed)) {
      return {
        success: false,
        error: 'Saved level state is corrupted or invalid',
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load level state: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * 清除保存的关卡状态
 * @returns 是否清除成功
 */
export function clearLevelState(): boolean {
  try {
    localStorage.removeItem(LEVEL_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear level state:', error);
    return false;
  }
}

/**
 * 检查是否有保存的关卡状态
 * @returns 是否存在保存的状态
 */
export function hasPersistedLevelState(): boolean {
  try {
    return localStorage.getItem(LEVEL_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * 获取保存的关卡状态的时间戳
 * @returns 时间戳，如果没有保存的状态则返回 null
 */
export function getPersistedLevelTimestamp(): number | null {
  const result = loadLevelState();
  if (result.success && result.data) {
    return result.data.timestamp;
  }
  return null;
}
