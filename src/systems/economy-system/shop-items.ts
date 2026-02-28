/**
 * Shop Items Data
 * 商店物品数据定义
 *
 * @description 定义游戏中可购买的所有物品
 * @requirements 3.3, 3.4
 */

import { ShopItem, ShopItemCategory } from '@/types';

/**
 * 模块类物品 - 解锁新的策略模块
 */
export const moduleShopItems: ShopItem[] = [
  {
    id: 'module_swap',
    name: '代币交换模块',
    description: '解锁 Swap 模块，允许在策略中进行代币交换操作',
    price: 500,
    category: 'module',
    unlocks: ['swap'],
  },
  {
    id: 'module_liquidity_add',
    name: '添加流动性模块',
    description: '解锁添加流动性模块，学习 DeFi 流动性提供',
    price: 800,
    category: 'module',
    unlocks: ['liquidity_add'],
  },
  {
    id: 'module_liquidity_remove',
    name: '移除流动性模块',
    description: '解锁移除流动性模块，管理你的流动性头寸',
    price: 800,
    category: 'module',
    unlocks: ['liquidity_remove'],
  },
  {
    id: 'module_stake',
    name: '质押模块',
    description: '解锁质押模块，学习 Staking 机制',
    price: 1000,
    category: 'module',
    unlocks: ['stake'],
  },
  {
    id: 'module_unstake',
    name: '解除质押模块',
    description: '解锁解除质押模块，管理你的质押资产',
    price: 1000,
    category: 'module',
    unlocks: ['unstake'],
  },
  {
    id: 'module_stop_loss',
    name: '止损模块',
    description: '解锁止损模块，保护你的投资免受大幅亏损',
    price: 600,
    category: 'module',
    unlocks: ['stop_loss'],
  },
  {
    id: 'module_take_profit',
    name: '止盈模块',
    description: '解锁止盈模块，在达到目标时自动获利了结',
    price: 600,
    category: 'module',
    unlocks: ['take_profit'],
  },
  {
    id: 'module_position_size',
    name: '仓位管理模块',
    description: '解锁仓位管理模块，精确控制每笔交易的资金比例',
    price: 750,
    category: 'module',
    unlocks: ['position_size'],
  },
];

/**
 * 工具类物品 - 解锁辅助功能
 */
export const toolShopItems: ShopItem[] = [
  {
    id: 'tool_advanced_analytics',
    name: '高级分析工具',
    description: '解锁详细的策略分析和性能指标',
    price: 1200,
    category: 'tool',
    unlocks: ['advanced_analytics'],
  },
  {
    id: 'tool_strategy_templates',
    name: '策略模板库',
    description: '解锁预设的策略模板，快速开始构建',
    price: 800,
    category: 'tool',
    unlocks: ['strategy_templates'],
  },
  {
    id: 'tool_simulation_speed',
    name: '模拟加速器',
    description: '解锁更快的模拟速度选项',
    price: 500,
    category: 'tool',
    unlocks: ['simulation_speed_boost'],
  },
  {
    id: 'tool_ai_hints',
    name: 'AI 提示增强',
    description: '解锁更详细的 AI 助手提示和建议',
    price: 1500,
    category: 'tool',
    unlocks: ['ai_hints_enhanced'],
  },
];

/**
 * 装饰类物品 - 外观定制
 */
export const cosmeticShopItems: ShopItem[] = [
  {
    id: 'cosmetic_theme_cyber',
    name: '赛博朋克主题',
    description: '解锁赛博朋克风格的界面主题',
    price: 300,
    category: 'cosmetic',
    unlocks: ['theme_cyber'],
  },
  {
    id: 'cosmetic_theme_nature',
    name: '自然主题',
    description: '解锁清新自然风格的界面主题',
    price: 300,
    category: 'cosmetic',
    unlocks: ['theme_nature'],
  },
  {
    id: 'cosmetic_node_style_neon',
    name: '霓虹节点样式',
    description: '解锁霓虹灯效果的策略节点样式',
    price: 400,
    category: 'cosmetic',
    unlocks: ['node_style_neon'],
  },
  {
    id: 'cosmetic_avatar_robot',
    name: '机器人头像',
    description: '解锁机器人风格的玩家头像',
    price: 200,
    category: 'cosmetic',
    unlocks: ['avatar_robot'],
  },
];

/**
 * 所有商店物品
 */
export const allShopItems: ShopItem[] = [
  ...moduleShopItems,
  ...toolShopItems,
  ...cosmeticShopItems,
];

/**
 * 根据ID获取商店物品
 * @param itemId 物品ID
 * @returns 商店物品或 undefined
 */
export function getShopItemById(itemId: string): ShopItem | undefined {
  return allShopItems.find((item) => item.id === itemId);
}

/**
 * 根据类别获取商店物品
 * @param category 物品类别
 * @returns 该类别的所有物品
 */
export function getShopItemsByCategory(category: ShopItemCategory): ShopItem[] {
  return allShopItems.filter((item) => item.category === category);
}

/**
 * 获取物品价格
 * @param itemId 物品ID
 * @returns 物品价格，如果物品不存在返回 -1
 */
export function getItemPrice(itemId: string): number {
  const item = getShopItemById(itemId);
  return item ? item.price : -1;
}
