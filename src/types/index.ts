/**
 * ChainQuest (链上探秘) Type Definitions
 * 游戏核心类型定义导出
 *
 * @description 统一导出所有类型定义
 */

// Strategy Builder Types
export type {
  Position,
  StrategyNode,
  StrategyEdge,
  StrategyConfig,
  HandlePair,
  ValidationResult,
  ValidationError,
  IStrategyBuilder,
} from './strategy';

// Module System Types
export {
  ModuleType,
} from './module';

export type {
  ModuleCategory,
  PortDataType,
  PortDefinition,
  ModuleParamValue,
  ModuleConfig,
  ModuleDefinition,
  IModuleSystem,
} from './module';

// Game State Types
export type {
  // Economy System
  WalletState,
  ShopItemCategory,
  ShopItem,
  PurchaseResult,
  PurchaseRecord,
  IEconomySystem,

  // Level System
  LevelObjectiveType,
  LevelObjective,
  LevelDefinition,
  LevelStatus,
  LevelProgress,
  ChapterInfo,
  LevelCompletionResult,
  ILevelSystem,

  // Simulation Engine
  SimulationStatus,
  TransactionStatus,
  Transaction,
  SimulationState,
  SimulationError,
  SimulationResult,
  ISimulationEngine,

  // AI Assistant
  AIMessageRole,
  AIMessage,
  PlayerProgress,
  AIContext,
  RiskLevel,
  StrategyAnalysis,
  IAIAssistant,

  // Story System
  StoryNodeType,
  StoryChoice,
  StoryNode,
  IStorySystem,

  // Game State
  ThemeType,
  GameSettings,
  PlayerInfo,
  EconomyState,
  ProgressState,
  StoryState,
  StrategiesState,
  GameMeta,
  GameState,

  // Serialization
  SerializedGameState,
} from './game-state';
