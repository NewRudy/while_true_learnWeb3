/**
 * Level Definitions
 * 关卡定义数据
 *
 * @description 定义游戏中所有章节和关卡的配置
 * @requirements 4.3
 */

import { LevelDefinition, ModuleType } from '@/types';

/**
 * 章节元数据
 * 定义每个章节的基本信息
 */
export interface ChapterMetadata {
  chapter: number;
  name: string;
  description: string;
}

/**
 * 章节元数据定义
 */
export const chapterMetadata: ChapterMetadata[] = [
  {
    chapter: 1,
    name: '初识链上世界',
    description: '发现神秘钱包，学习基础交易操作',
  },
  {
    chapter: 2,
    name: '策略初探',
    description: '学习条件判断和仓位管理',
  },
  {
    chapter: 3,
    name: '风险与收益',
    description: '掌握止损止盈，控制交易风险',
  },
  {
    chapter: 4,
    name: 'DeFi 入门',
    description: '探索去中心化交易和流动性',
  },
  {
    chapter: 5,
    name: '质押与收益',
    description: '学习质押机制，获取被动收益',
  },
  {
    chapter: 6,
    name: '钱包之谜',
    description: '揭开神秘钱包的最终秘密',
  },
];


// ============================================
// Chapter 1: 初识链上世界 (Discovering the Chain World)
// ============================================

/**
 * 第一章关卡定义
 * 学习基础交易操作：买入、卖出、转账、持有
 */
export const chapter1Levels: LevelDefinition[] = [
  {
    id: 'level-1-1',
    chapter: 1,
    levelNumber: 1,
    name: '神秘钱包',
    description: '你发现了一个神秘的链上钱包，里面有一些初始资金。尝试进行第一笔买入操作。',
    objectives: [
      {
        id: 'obj-1-1-1',
        description: '完成一笔买入交易',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-1-1-2',
        description: '完成至少 1 次有效执行',
        type: 'transaction_count',
        target: 1,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY],
    initialFunds: 1000,
    targetFunds: 1000,
    maxTransactions: 5,
    storyContext: '在整理旧电脑时，你发现了一个加密钱包的助记词。当你导入钱包后，发现里面竟然有一些资金...',
    hints: [
      '拖拽买入模块到画布上',
      '设置买入金额，不要超过你的资金',
      '点击运行按钮执行策略',
    ],
  },
  {
    id: 'level-1-2',
    chapter: 1,
    levelNumber: 2,
    name: '买卖之道',
    description: '学习如何买入和卖出资产，尝试通过低买高卖获得利润。',
    objectives: [
      {
        id: 'obj-1-2-1',
        description: '获得 10% 以上的利润',
        type: 'profit',
        target: 10,
        completed: false,
      },
      {
        id: 'obj-1-2-2',
        description: '完成至少 2 笔交易',
        type: 'transaction_count',
        target: 2,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL],
    initialFunds: 1000,
    targetFunds: 1100,
    maxTransactions: 10,
    storyContext: '钱包里的资金似乎有规律地在增长。你决定尝试一些简单的交易策略...',
    hints: [
      '先买入资产，等待价格上涨后卖出',
      '注意观察模拟中的价格变化',
      '连接买入和卖出模块形成完整策略',
    ],
  },
  {
    id: 'level-1-3',
    chapter: 1,
    levelNumber: 3,
    name: '资金流转',
    description: '学习转账和持有操作，理解资金在链上的流动方式。',
    objectives: [
      {
        id: 'obj-1-3-1',
        description: '使用转账模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-1-3-2',
        description: '使用持有模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-1-3-3',
        description: '最终资金达到 1200',
        type: 'profit',
        target: 20,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.TRANSFER, ModuleType.HOLD],
    initialFunds: 1000,
    targetFunds: 1200,
    maxTransactions: 15,
    storyContext: '你注意到钱包有一些奇怪的转账记录，似乎指向某个特定的地址...',
    hints: [
      '持有模块可以让策略等待一段时间',
      '转账模块可以将资金发送到其他地址',
      '合理安排买卖时机，利用持有等待最佳价格',
    ],
  },
];

// ============================================
// Chapter 2: 策略初探 (Strategy Exploration)
// ============================================

/**
 * 第二章关卡定义
 * 学习条件判断和仓位管理
 */
export const chapter2Levels: LevelDefinition[] = [
  {
    id: 'level-2-1',
    chapter: 2,
    levelNumber: 1,
    name: '条件判断',
    description: '学习使用条件模块，根据市场情况做出不同的决策。',
    objectives: [
      {
        id: 'obj-2-1-1',
        description: '使用条件判断模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-2-1-2',
        description: '获得 15% 以上的利润',
        type: 'profit',
        target: 15,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.HOLD, ModuleType.CONDITION],
    initialFunds: 1500,
    targetFunds: 1725,
    maxTransactions: 15,
    storyContext: '钱包的前主人似乎是一位经验丰富的交易者，留下了一些策略笔记...',
    hints: [
      '条件模块可以根据价格高低选择不同的执行路径',
      '设置合理的条件阈值',
      '将条件模块的两个输出连接到不同的操作',
    ],
  },
  {
    id: 'level-2-2',
    chapter: 2,
    levelNumber: 2,
    name: '仓位控制',
    description: '学习仓位管理，控制每笔交易的资金比例。',
    objectives: [
      {
        id: 'obj-2-2-1',
        description: '使用仓位管理模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-2-2-2',
        description: '完成至少 4 笔交易',
        type: 'transaction_count',
        target: 4,
        completed: false,
      },
      {
        id: 'obj-2-2-3',
        description: '避免单笔亏损超过 10%',
        type: 'avoid_loss',
        target: 10,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.CONDITION, ModuleType.POSITION_SIZE],
    initialFunds: 2000,
    targetFunds: 2200,
    maxTransactions: 20,
    storyContext: '笔记中提到了"永远不要把所有鸡蛋放在一个篮子里"...',
    hints: [
      '仓位管理模块可以限制单笔交易的资金比例',
      '分散投资可以降低风险',
      '设置合理的风险参数',
    ],
  },
  {
    id: 'level-2-3',
    chapter: 2,
    levelNumber: 3,
    name: '策略组合',
    description: '综合运用所学知识，构建一个完整的交易策略。',
    objectives: [
      {
        id: 'obj-2-3-1',
        description: '获得 25% 以上的利润',
        type: 'profit',
        target: 25,
        completed: false,
      },
      {
        id: 'obj-2-3-2',
        description: '使用至少 3 种不同的模块',
        type: 'use_module',
        target: 3,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.HOLD, ModuleType.CONDITION, ModuleType.POSITION_SIZE],
    initialFunds: 2500,
    targetFunds: 3125,
    maxTransactions: 25,
    storyContext: '你开始理解这个钱包的运作方式，它似乎在执行某种自动化策略...',
    hints: [
      '结合条件判断和仓位管理',
      '在不同市场条件下采取不同策略',
      '耐心等待最佳入场时机',
    ],
  },
];


// ============================================
// Chapter 3: 风险与收益 (Risk and Reward)
// ============================================

/**
 * 第三章关卡定义
 * 掌握止损止盈，控制交易风险
 */
export const chapter3Levels: LevelDefinition[] = [
  {
    id: 'level-3-1',
    chapter: 3,
    levelNumber: 1,
    name: '止损保护',
    description: '学习使用止损模块，在市场下跌时保护你的资金。',
    objectives: [
      {
        id: 'obj-3-1-1',
        description: '使用止损模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-3-1-2',
        description: '最大亏损不超过 15%',
        type: 'avoid_loss',
        target: 15,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.CONDITION, ModuleType.STOP_LOSS],
    initialFunds: 3000,
    targetFunds: 2550,
    maxTransactions: 20,
    storyContext: '市场开始波动，你需要学会保护自己的资金...',
    hints: [
      '止损模块会在价格下跌到设定值时自动卖出',
      '设置合理的止损百分比',
      '止损是风险管理的重要工具',
    ],
  },
  {
    id: 'level-3-2',
    chapter: 3,
    levelNumber: 2,
    name: '锁定利润',
    description: '学习使用止盈模块，在达到目标时锁定利润。',
    objectives: [
      {
        id: 'obj-3-2-1',
        description: '使用止盈模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-3-2-2',
        description: '获得 20% 以上的利润',
        type: 'profit',
        target: 20,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.CONDITION, ModuleType.TAKE_PROFIT],
    initialFunds: 3000,
    targetFunds: 3600,
    maxTransactions: 20,
    storyContext: '贪婪是交易者最大的敌人，学会在合适的时候获利了结...',
    hints: [
      '止盈模块会在价格上涨到设定值时自动卖出',
      '不要过于贪婪，设定合理的目标',
      '落袋为安是明智的选择',
    ],
  },
  {
    id: 'level-3-3',
    chapter: 3,
    levelNumber: 3,
    name: '风险平衡',
    description: '综合运用止损止盈，构建风险可控的交易策略。',
    objectives: [
      {
        id: 'obj-3-3-1',
        description: '同时使用止损和止盈模块',
        type: 'use_module',
        target: 2,
        completed: false,
      },
      {
        id: 'obj-3-3-2',
        description: '获得 30% 以上的利润',
        type: 'profit',
        target: 30,
        completed: false,
      },
      {
        id: 'obj-3-3-3',
        description: '最大回撤不超过 20%',
        type: 'avoid_loss',
        target: 20,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.CONDITION,
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
      ModuleType.POSITION_SIZE,
    ],
    initialFunds: 4000,
    targetFunds: 5200,
    maxTransactions: 30,
    storyContext: '钱包的前主人留下了一条信息："风险与收益总是相伴而行"...',
    hints: [
      '止损和止盈应该配合使用',
      '风险收益比是关键指标',
      '好的策略应该在控制风险的同时追求收益',
    ],
  },
];

// ============================================
// Chapter 4: DeFi 入门 (DeFi Introduction)
// ============================================

/**
 * 第四章关卡定义
 * 探索去中心化交易和流动性
 */
export const chapter4Levels: LevelDefinition[] = [
  {
    id: 'level-4-1',
    chapter: 4,
    levelNumber: 1,
    name: '代币兑换',
    description: '学习在去中心化交易所进行代币兑换。',
    objectives: [
      {
        id: 'obj-4-1-1',
        description: '使用兑换模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-4-1-2',
        description: '完成至少 3 笔兑换',
        type: 'transaction_count',
        target: 3,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.SWAP, ModuleType.CONDITION],
    initialFunds: 5000,
    targetFunds: 5500,
    maxTransactions: 25,
    storyContext: '你发现钱包曾经与多个 DeFi 协议交互过...',
    hints: [
      '兑换模块可以在不同代币之间转换',
      '注意滑点设置',
      'DEX 交易不需要中心化交易所',
    ],
  },
  {
    id: 'level-4-2',
    chapter: 4,
    levelNumber: 2,
    name: '流动性提供',
    description: '学习向流动性池添加流动性，成为流动性提供者。',
    objectives: [
      {
        id: 'obj-4-2-1',
        description: '使用添加流动性模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-4-2-2',
        description: '获得 15% 以上的收益',
        type: 'profit',
        target: 15,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.SWAP, ModuleType.LIQUIDITY_ADD],
    initialFunds: 6000,
    targetFunds: 6900,
    maxTransactions: 20,
    storyContext: '流动性挖矿是 DeFi 的核心概念之一...',
    hints: [
      '添加流动性需要提供代币对',
      '流动性提供者可以获得交易手续费',
      '注意无常损失的风险',
    ],
  },
  {
    id: 'level-4-3',
    chapter: 4,
    levelNumber: 3,
    name: '流动性管理',
    description: '学习管理流动性头寸，包括添加和移除流动性。',
    objectives: [
      {
        id: 'obj-4-3-1',
        description: '使用添加和移除流动性模块',
        type: 'use_module',
        target: 2,
        completed: false,
      },
      {
        id: 'obj-4-3-2',
        description: '获得 25% 以上的收益',
        type: 'profit',
        target: 25,
        completed: false,
      },
      {
        id: 'obj-4-3-3',
        description: '完成至少 5 笔交易',
        type: 'transaction_count',
        target: 5,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.SWAP,
      ModuleType.LIQUIDITY_ADD,
      ModuleType.LIQUIDITY_REMOVE,
      ModuleType.CONDITION,
    ],
    initialFunds: 8000,
    targetFunds: 10000,
    maxTransactions: 30,
    storyContext: '钱包的交易记录显示，前主人是一位活跃的流动性提供者...',
    hints: [
      '在合适的时机添加和移除流动性',
      '监控流动性池的收益率',
      '根据市场情况调整策略',
    ],
  },
];


// ============================================
// Chapter 5: 质押与收益 (Staking and Yield)
// ============================================

/**
 * 第五章关卡定义
 * 学习质押机制，获取被动收益
 */
export const chapter5Levels: LevelDefinition[] = [
  {
    id: 'level-5-1',
    chapter: 5,
    levelNumber: 1,
    name: '质押入门',
    description: '学习将代币质押到协议中获取收益。',
    objectives: [
      {
        id: 'obj-5-1-1',
        description: '使用质押模块',
        type: 'use_module',
        target: 1,
        completed: false,
      },
      {
        id: 'obj-5-1-2',
        description: '获得 10% 以上的质押收益',
        type: 'profit',
        target: 10,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.STAKE, ModuleType.HOLD],
    initialFunds: 10000,
    targetFunds: 11000,
    maxTransactions: 15,
    storyContext: '质押是获取被动收益的重要方式...',
    hints: [
      '质押模块可以将代币锁定获取收益',
      '注意质押的锁定期',
      '选择合适的质押协议',
    ],
  },
  {
    id: 'level-5-2',
    chapter: 5,
    levelNumber: 2,
    name: '灵活质押',
    description: '学习质押和解除质押的时机选择。',
    objectives: [
      {
        id: 'obj-5-2-1',
        description: '使用质押和解除质押模块',
        type: 'use_module',
        target: 2,
        completed: false,
      },
      {
        id: 'obj-5-2-2',
        description: '获得 20% 以上的收益',
        type: 'profit',
        target: 20,
        completed: false,
      },
    ],
    availableModules: [ModuleType.BUY, ModuleType.SELL, ModuleType.STAKE, ModuleType.UNSTAKE, ModuleType.CONDITION],
    initialFunds: 12000,
    targetFunds: 14400,
    maxTransactions: 25,
    storyContext: '灵活管理质押头寸可以最大化收益...',
    hints: [
      '在收益率高时质押',
      '在需要资金时解除质押',
      '注意解除质押可能需要等待期',
    ],
  },
  {
    id: 'level-5-3',
    chapter: 5,
    levelNumber: 3,
    name: '收益最大化',
    description: '综合运用所有 DeFi 工具，构建收益最大化策略。',
    objectives: [
      {
        id: 'obj-5-3-1',
        description: '获得 35% 以上的收益',
        type: 'profit',
        target: 35,
        completed: false,
      },
      {
        id: 'obj-5-3-2',
        description: '使用至少 4 种不同的模块',
        type: 'use_module',
        target: 4,
        completed: false,
      },
      {
        id: 'obj-5-3-3',
        description: '最大回撤不超过 25%',
        type: 'avoid_loss',
        target: 25,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.SWAP,
      ModuleType.LIQUIDITY_ADD,
      ModuleType.LIQUIDITY_REMOVE,
      ModuleType.STAKE,
      ModuleType.UNSTAKE,
      ModuleType.CONDITION,
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
    ],
    initialFunds: 15000,
    targetFunds: 20250,
    maxTransactions: 40,
    storyContext: '你已经掌握了大部分 DeFi 工具，是时候展示你的实力了...',
    hints: [
      '结合流动性提供和质押',
      '使用风控模块保护收益',
      '根据市场情况灵活调整',
    ],
  },
];

// ============================================
// Chapter 6: 钱包之谜 (The Wallet Mystery)
// ============================================

/**
 * 第六章关卡定义
 * 揭开神秘钱包的最终秘密
 */
export const chapter6Levels: LevelDefinition[] = [
  {
    id: 'level-6-1',
    chapter: 6,
    levelNumber: 1,
    name: '线索追踪',
    description: '根据钱包的交易记录，追踪神秘资金的来源。',
    objectives: [
      {
        id: 'obj-6-1-1',
        description: '完成至少 8 笔交易',
        type: 'transaction_count',
        target: 8,
        completed: false,
      },
      {
        id: 'obj-6-1-2',
        description: '获得 30% 以上的收益',
        type: 'profit',
        target: 30,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.TRANSFER,
      ModuleType.SWAP,
      ModuleType.CONDITION,
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
    ],
    initialFunds: 20000,
    targetFunds: 26000,
    maxTransactions: 50,
    storyContext: '所有的线索都指向一个方向，真相即将揭晓...',
    hints: [
      '仔细分析每笔交易的目的',
      '寻找交易记录中的规律',
      '运用你学到的所有知识',
    ],
  },
  {
    id: 'level-6-2',
    chapter: 6,
    levelNumber: 2,
    name: '最终挑战',
    description: '运用所有技能，完成最终的交易挑战。',
    objectives: [
      {
        id: 'obj-6-2-1',
        description: '获得 50% 以上的收益',
        type: 'profit',
        target: 50,
        completed: false,
      },
      {
        id: 'obj-6-2-2',
        description: '使用至少 6 种不同的模块',
        type: 'use_module',
        target: 6,
        completed: false,
      },
      {
        id: 'obj-6-2-3',
        description: '最大回撤不超过 30%',
        type: 'avoid_loss',
        target: 30,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.TRANSFER,
      ModuleType.HOLD,
      ModuleType.CONDITION,
      ModuleType.SWAP,
      ModuleType.LIQUIDITY_ADD,
      ModuleType.LIQUIDITY_REMOVE,
      ModuleType.STAKE,
      ModuleType.UNSTAKE,
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
      ModuleType.POSITION_SIZE,
    ],
    initialFunds: 25000,
    targetFunds: 37500,
    maxTransactions: 60,
    storyContext: '这是最后的考验，证明你已经完全掌握了链上交易的艺术...',
    hints: [
      '综合运用所有学到的知识',
      '平衡风险和收益',
      '相信你的判断',
    ],
  },
  {
    id: 'level-6-3',
    chapter: 6,
    levelNumber: 3,
    name: '谜底揭晓',
    description: '完成最后一笔交易，揭开神秘钱包的真正秘密。',
    objectives: [
      {
        id: 'obj-6-3-1',
        description: '达到 50000 的最终资金',
        type: 'profit',
        target: 100,
        completed: false,
      },
      {
        id: 'obj-6-3-2',
        description: '完成所有交易',
        type: 'transaction_count',
        target: 10,
        completed: false,
      },
    ],
    availableModules: [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.TRANSFER,
      ModuleType.HOLD,
      ModuleType.CONDITION,
      ModuleType.SWAP,
      ModuleType.LIQUIDITY_ADD,
      ModuleType.LIQUIDITY_REMOVE,
      ModuleType.STAKE,
      ModuleType.UNSTAKE,
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
      ModuleType.POSITION_SIZE,
    ],
    initialFunds: 25000,
    targetFunds: 50000,
    maxTransactions: 100,
    storyContext: '神秘钱包的秘密终于要揭晓了。原来，这个钱包是一位 Web3 先驱留给后人的礼物，希望有人能够学会这些知识，继续传承下去...',
    hints: [
      '这是你的毕业考试',
      '运用一切所学',
      '你已经准备好了',
    ],
  },
];


// ============================================
// Aggregated Level Data
// ============================================

/**
 * 所有关卡定义
 * 按章节顺序排列
 */
export const allLevelDefinitions: LevelDefinition[] = [
  ...chapter1Levels,
  ...chapter2Levels,
  ...chapter3Levels,
  ...chapter4Levels,
  ...chapter5Levels,
  ...chapter6Levels,
];

/**
 * 按章节分组的关卡定义
 */
export const levelsByChapter: Record<number, LevelDefinition[]> = {
  1: chapter1Levels,
  2: chapter2Levels,
  3: chapter3Levels,
  4: chapter4Levels,
  5: chapter5Levels,
  6: chapter6Levels,
};

// ============================================
// Helper Functions
// ============================================

/**
 * 获取所有关卡定义
 * @returns 所有关卡定义数组
 */
export function getAllLevelDefinitions(): LevelDefinition[] {
  return allLevelDefinitions;
}

/**
 * 根据章节获取关卡定义
 * @param chapter 章节编号
 * @returns 该章节的关卡定义数组
 */
export function getLevelsByChapter(chapter: number): LevelDefinition[] {
  return levelsByChapter[chapter] || [];
}

/**
 * 根据ID获取关卡定义
 * @param levelId 关卡ID
 * @returns 关卡定义或 undefined
 */
export function getLevelDefinitionById(levelId: string): LevelDefinition | undefined {
  return allLevelDefinitions.find((level) => level.id === levelId);
}

/**
 * 获取章节元数据
 * @param chapter 章节编号
 * @returns 章节元数据或 undefined
 */
export function getChapterMetadata(chapter: number): ChapterMetadata | undefined {
  return chapterMetadata.find((c) => c.chapter === chapter);
}

/**
 * 获取所有章节元数据
 * @returns 所有章节元数据数组
 */
export function getAllChapterMetadata(): ChapterMetadata[] {
  return chapterMetadata;
}

/**
 * 获取关卡总数
 * @returns 关卡总数
 */
export function getTotalLevelCount(): number {
  return allLevelDefinitions.length;
}

/**
 * 获取章节的关卡数量
 * @param chapter 章节编号
 * @returns 该章节的关卡数量
 */
export function getChapterLevelCount(chapter: number): number {
  return getLevelsByChapter(chapter).length;
}

/**
 * 获取下一个关卡
 * @param currentLevelId 当前关卡ID
 * @returns 下一个关卡定义或 undefined（如果是最后一关）
 */
export function getNextLevel(currentLevelId: string): LevelDefinition | undefined {
  const currentIndex = allLevelDefinitions.findIndex((level) => level.id === currentLevelId);
  if (currentIndex === -1 || currentIndex === allLevelDefinitions.length - 1) {
    return undefined;
  }
  return allLevelDefinitions[currentIndex + 1];
}

/**
 * 检查是否是章节的最后一关
 * @param levelId 关卡ID
 * @returns 是否是章节的最后一关
 */
export function isLastLevelInChapter(levelId: string): boolean {
  const level = getLevelDefinitionById(levelId);
  if (!level) return false;

  const chapterLevels = getLevelsByChapter(level.chapter);
  return chapterLevels[chapterLevels.length - 1]?.id === levelId;
}

/**
 * 检查是否是游戏的最后一关
 * @param levelId 关卡ID
 * @returns 是否是游戏的最后一关
 */
export function isLastLevel(levelId: string): boolean {
  return allLevelDefinitions[allLevelDefinitions.length - 1]?.id === levelId;
}
