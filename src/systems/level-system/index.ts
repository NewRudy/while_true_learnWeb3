/**
 * Level System Exports
 * 关卡系统导出
 *
 * @description 导出关卡系统相关模块
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

// Level Definitions
export {
  // Chapter metadata
  chapterMetadata,
  type ChapterMetadata,

  // Level definitions by chapter
  chapter1Levels,
  chapter2Levels,
  chapter3Levels,
  chapter4Levels,
  chapter5Levels,
  chapter6Levels,

  // Aggregated data
  allLevelDefinitions,
  levelsByChapter,

  // Helper functions
  getAllLevelDefinitions,
  getLevelsByChapter,
  getLevelDefinitionById,
  getChapterMetadata,
  getAllChapterMetadata,
  getTotalLevelCount,
  getChapterLevelCount,
  getNextLevel,
  isLastLevelInChapter,
  isLastLevel,
} from './level-definitions';

// Level Store
export {
  useLevelStore,
  setupLevelPersistence,
  initializeLevelSystem,
  createLevelStore,
  getInitialLevelState,
  type LevelStoreState,
  type LevelStoreActions,
  type LevelStore,
} from './level-store';

// Level Persistence
export {
  LEVEL_STORAGE_KEY,
  LEVEL_STORAGE_VERSION,
  saveLevelState,
  loadLevelState,
  clearLevelState,
  hasPersistedLevelState,
  getPersistedLevelTimestamp,
  isValidLevelProgress,
  isValidLevelStatus,
  isValidPersistedLevelState,
  type PersistedLevelState,
  type LoadResult as LevelLoadResult,
} from './level-persistence';
