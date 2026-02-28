/**
 * Game State Types
 * 游戏状态相关类型定义
 *
 * @description 定义完整的游戏状态和所有子状态接口
 * @requirements 3.1-3.6, 4.1-4.6, 5.1-5.6, 6.1-6.5, 9.1-9.6
 */

import { ModuleType } from './module';
import { StrategyConfig } from './strategy';

// ============================================
// Economy System Types (经济系统类型)
// ============================================

/**
 * 钱包状态
 * 玩家的虚拟钱包信息
 */
export interface WalletState {
  /** 当前余额 */
  balance: number;
  /** 累计获得的总金额 */
  totalEarned: number;
  /** 累计花费的总金额 */
  totalSpent: number;
}

/**
 * 商店物品类别
 */
export type ShopItemCategory = 'module' | 'tool' | 'cosmetic';

/**
 * 可购买物品
 * 商店中的物品定义
 */
export interface ShopItem {
  /** 物品唯一标识符 */
  id: string;
  /** 物品名称 */
  name: string;
  /** 物品描述 */
  description: string;
  /** 价格 */
  price: number;
  /** 物品类别 */
  category: ShopItemCategory;
  /** 购买后解锁的内容ID列表 */
  unlocks: string[];
}

/**
 * 购买结果
 */
export interface PurchaseResult {
  /** 是否购买成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 购买后的新余额 */
  newBalance?: number;
}

/**
 * 购买记录
 */
export interface PurchaseRecord {
  /** 物品ID */
  itemId: string;
  /** 购买时间戳 */
  timestamp: number;
  /** 购买价格 */
  price: number;
}

/**
 * Economy System 接口
 */
export interface IEconomySystem {
  /** 获取钱包状态 */
  getWallet(): WalletState;
  /** 添加资金 */
  addFunds(amount: number, reason: string): void;
  /** 购买物品 */
  purchase(itemId: string): PurchaseResult;
  /** 获取商店物品列表 */
  getShopItems(): ShopItem[];
  /** 获取已解锁物品列表 */
  getUnlockedItems(): string[];
  /** 检查是否能负担某物品 */
  canAfford(itemId: string): boolean;
}

// ============================================
// Level System Types (关卡系统类型)
// ============================================

/**
 * 关卡目标类型
 */
export type LevelObjectiveType = 'profit' | 'transaction_count' | 'use_module' | 'avoid_loss';

/**
 * 关卡目标
 */
export interface LevelObjective {
  /** 目标唯一标识符 */
  id: string;
  /** 目标描述 */
  description: string;
  /** 目标类型 */
  type: LevelObjectiveType;
  /** 目标值 */
  target: number;
  /** 是否已完成 */
  completed: boolean;
}

/**
 * 关卡定义
 * 完整的关卡配置信息
 */
export interface LevelDefinition {
  /** 关卡唯一标识符 */
  id: string;
  /** 所属章节 */
  chapter: number;
  /** 章节内的关卡序号 */
  levelNumber: number;
  /** 关卡名称 */
  name: string;
  /** 关卡描述 */
  description: string;
  /** 关卡目标列表 */
  objectives: LevelObjective[];
  /** 可用模块类型列表 */
  availableModules: ModuleType[];
  /** 初始资金 */
  initialFunds: number;
  /** 目标资金 */
  targetFunds: number;
  /** 最大交易次数限制 */
  maxTransactions: number;
  /** 故事背景 */
  storyContext: string;
  /** 提示列表 */
  hints: string[];
}

/**
 * 关卡进度状态
 */
export type LevelStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

/**
 * 关卡进度
 * 玩家在某个关卡的进度信息
 */
export interface LevelProgress {
  /** 关卡ID */
  levelId: string;
  /** 关卡状态 */
  status: LevelStatus;
  /** 最高分数 */
  bestScore: number;
  /** 尝试次数 */
  attempts: number;
  /** 已完成的目标ID列表 */
  completedObjectives: string[];
}

/**
 * 章节信息
 */
export interface ChapterInfo {
  /** 章节编号 */
  chapter: number;
  /** 章节名称 */
  name: string;
  /** 章节描述 */
  description: string;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 包含的关卡数量 */
  levelCount: number;
  /** 已完成的关卡数量 */
  completedLevels: number;
}

/**
 * 关卡完成结果
 */
export interface LevelCompletionResult {
  /** 是否成功完成 */
  success: boolean;
  /** 获得的分数 */
  score: number;
  /** 获得的奖励金额 */
  reward: number;
  /** 是否解锁了新关卡 */
  unlockedNewLevel: boolean;
  /** 是否解锁了新章节 */
  unlockedNewChapter: boolean;
}

/**
 * Level System 接口
 */
export interface ILevelSystem {
  /** 获取所有章节信息 */
  getChapters(): ChapterInfo[];
  /** 获取某章节的所有关卡 */
  getLevelsInChapter(chapter: number): LevelDefinition[];
  /** 获取关卡进度 */
  getLevelProgress(levelId: string): LevelProgress;
  /** 开始关卡 */
  startLevel(levelId: string): LevelDefinition;
  /** 完成关卡 */
  completeLevel(levelId: string, result: SimulationResult): LevelCompletionResult;
  /** 解锁下一关卡 */
  unlockNextLevel(currentLevelId: string): void;
}

// ============================================
// Simulation Engine Types (模拟引擎类型)
// ============================================

/**
 * 模拟状态枚举
 */
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * 交易状态
 */
export type TransactionStatus = 'pending' | 'success' | 'failed';

/**
 * 交易记录
 */
export interface Transaction {
  /** 交易唯一标识符 */
  id: string;
  /** 交易时间戳 */
  timestamp: number;
  /** 交易类型 */
  type: string;
  /** 交易金额 */
  amount: number;
  /** 来源 */
  from: string;
  /** 目标 */
  to: string;
  /** 交易状态 */
  status: TransactionStatus;
}

/**
 * 模拟状态
 * 模拟运行时的状态信息
 */
export interface SimulationState {
  /** 模拟状态 */
  status: SimulationStatus;
  /** 当前执行步骤 */
  currentStep: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 当前资金 */
  funds: number;
  /** 交易记录列表 */
  transactions: Transaction[];
  /** 当前活跃的节点ID */
  activeNodeId: string | null;
}

/**
 * 模拟错误
 */
export interface SimulationError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关节点ID */
  nodeId?: string;
}

/**
 * 模拟结果
 * 模拟完成后的结果汇总
 */
export interface SimulationResult {
  /** 是否成功完成 */
  success: boolean;
  /** 最终资金 */
  finalFunds: number;
  /** 盈亏金额 */
  profitLoss: number;
  /** 盈亏百分比 */
  profitLossPercent: number;
  /** 交易次数 */
  transactionCount: number;
  executedModuleTypes?: string[];
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 错误列表 */
  errors: SimulationError[];
}

/**
 * Simulation Engine 接口
 */
export interface ISimulationEngine {
  /** 加载策略 */
  loadStrategy(config: StrategyConfig): void;
  /** 开始模拟 */
  start(initialFunds: number): void;
  /** 暂停模拟 */
  pause(): void;
  /** 恢复模拟 */
  resume(): void;
  /** 停止模拟 */
  stop(): void;
  /** 设置模拟速度 */
  setSpeed(speed: number): void;
  /** 获取当前状态 */
  getState(): SimulationState;
  /** 获取模拟结果 */
  getResult(): SimulationResult | null;
  /** 订阅状态变化 */
  onStateChange(callback: (state: SimulationState) => void): () => void;
}

// ============================================
// AI Assistant Types (AI 助手类型)
// ============================================

/**
 * AI 消息角色
 */
export type AIMessageRole = 'user' | 'assistant' | 'system';

/**
 * AI 消息
 */
export interface AIMessage {
  /** 消息唯一标识符 */
  id: string;
  /** 消息角色 */
  role: AIMessageRole;
  /** 消息内容 */
  content: string;
  /** 消息时间戳 */
  timestamp: number;
}

/**
 * 玩家进度信息（用于 AI 上下文）
 */
export interface PlayerProgress {
  /** 当前章节 */
  currentChapter: number;
  /** 已完成的关卡数 */
  completedLevels: number;
  /** 总游戏时间 */
  totalPlayTime: number;
}

/**
 * AI 上下文
 * 提供给 AI 助手的上下文信息
 */
export interface AIContext {
  /** 当前关卡定义 */
  currentLevel: LevelDefinition | null;
  /** 当前策略配置 */
  currentStrategy: StrategyConfig | null;
  /** 最近的错误信息 */
  recentErrors: string[];
  /** 玩家进度 */
  playerProgress: PlayerProgress;
}

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * 策略分析结果
 */
export interface StrategyAnalysis {
  /** 策略优点 */
  strengths: string[];
  /** 策略缺点 */
  weaknesses: string[];
  /** 改进建议 */
  suggestions: string[];
  /** 风险等级 */
  riskLevel: RiskLevel;
}

/**
 * AI Assistant 接口
 */
export interface IAIAssistant {
  /** 初始化 AI 助手 */
  initialize(context: AIContext): void;
  /** 发送消息 */
  sendMessage(message: string): Promise<AIMessage>;
  /** 获取提示 */
  getHint(): Promise<string>;
  /** 分析策略 */
  analyzeStrategy(strategy: StrategyConfig): Promise<StrategyAnalysis>;
  /** 解释概念 */
  explainConcept(concept: string): Promise<string>;
  /** 获取对话历史 */
  getConversationHistory(): AIMessage[];
  /** 清除对话历史 */
  clearHistory(): void;
}

// ============================================
// Story System Types (故事系统类型)
// ============================================

/**
 * 故事节点类型
 */
export type StoryNodeType = 'dialogue' | 'narration' | 'choice' | 'reveal';

/**
 * 故事选择
 */
export interface StoryChoice {
  /** 选择唯一标识符 */
  id: string;
  /** 选择文本 */
  text: string;
  /** 选择后跳转的节点ID */
  nextNodeId: string;
}

/**
 * 故事节点
 */
export interface StoryNode {
  /** 节点唯一标识符 */
  id: string;
  /** 所属章节 */
  chapter: number;
  /** 节点类型 */
  type: StoryNodeType;
  /** 节点内容 */
  content: string;
  /** 角色名称（对话类型时使用） */
  character?: string;
  /** 选择列表（选择类型时使用） */
  choices?: StoryChoice[];
  /** 下一个节点ID */
  nextNodeId?: string;
}

/**
 * Story System 接口
 */
export interface IStorySystem {
  /** 获取当前故事节点 */
  getCurrentNode(): StoryNode | null;
  /** 推进故事 */
  advanceStory(): StoryNode | null;
  /** 做出选择 */
  makeChoice(choiceId: string): StoryNode | null;
  /** 获取已解锁的线索 */
  getUnlockedClues(): string[];
  /** 获取章节开场 */
  getChapterIntro(chapter: number): StoryNode;
  /** 获取章节结尾 */
  getChapterOutro(chapter: number): StoryNode;
}


// ============================================
// Game State (完整游戏状态)
// ============================================

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark';

/**
 * 游戏设置
 */
export interface GameSettings {
  /** 主题 */
  theme: ThemeType;
  /** 是否启用音效 */
  soundEnabled: boolean;
  /** 音乐音量 (0-1) */
  musicVolume: number;
  /** 音效音量 (0-1) */
  sfxVolume: number;
  /** 模拟速度 */
  simulationSpeed: number;
}

/**
 * 玩家信息
 */
export interface PlayerInfo {
  /** 玩家唯一标识符 */
  id: string;
  /** 玩家名称 */
  name: string;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 经济状态
 */
export interface EconomyState {
  /** 钱包状态 */
  wallet: WalletState;
  /** 已解锁物品ID列表 */
  unlockedItems: string[];
  /** 购买历史 */
  purchaseHistory: PurchaseRecord[];
}

/**
 * 进度状态
 */
export interface ProgressState {
  /** 当前章节 */
  currentChapter: number;
  /** 当前关卡ID */
  currentLevel: string | null;
  /** 各关卡进度 */
  levelProgress: Record<string, LevelProgress>;
  /** 总游戏时间（秒） */
  totalPlayTime: number;
}

/**
 * 故事状态
 */
export interface StoryState {
  /** 当前故事节点ID */
  currentNodeId: string | null;
  /** 已解锁的线索列表 */
  unlockedClues: string[];
  /** 玩家做出的选择记录 */
  choices: Record<string, string>;
}

/**
 * 策略存档状态
 */
export interface StrategiesState {
  /** 已保存的策略列表 */
  saved: StrategyConfig[];
  /** 当前正在编辑的策略 */
  current: StrategyConfig | null;
}

/**
 * 游戏元数据
 */
export interface GameMeta {
  /** 游戏版本 */
  version: string;
  /** 最后保存时间戳 */
  lastSaved: number;
}

/**
 * 完整游戏状态
 * 包含所有游戏数据的顶层状态对象
 */
export interface GameState {
  /** 玩家信息 */
  player: PlayerInfo;
  /** 经济状态 */
  economy: EconomyState;
  /** 进度状态 */
  progress: ProgressState;
  /** 故事状态 */
  story: StoryState;
  /** 策略存档 */
  strategies: StrategiesState;
  /** 游戏设置 */
  settings: GameSettings;
  /** 元数据 */
  meta: GameMeta;
}

// ============================================
// Serialization Types (序列化类型)
// ============================================

/**
 * 序列化的游戏状态
 * 用于持久化存储的格式
 */
export interface SerializedGameState {
  /** 版本号 */
  version: string;
  /** 保存时间戳 */
  timestamp: number;
  /** 校验和 */
  checksum: string;
  /** 游戏状态数据 */
  data: GameState;
}
