/**
 * Strategy Serialization Utilities
 * 策略序列化和反序列化工具函数
 *
 * @description 提供策略配置的序列化、反序列化和 localStorage 持久化功能
 * @requirements 1.6, 2.6
 */

import { StrategyConfig, StrategyNode, StrategyEdge } from '@/types/strategy';
import { ModuleType } from '@/types/module';

/**
 * 策略存储键名前缀
 */
const STORAGE_KEY_PREFIX = 'chainquest_strategy_';
const STRATEGY_LIST_KEY = 'chainquest_strategy_list';

/**
 * 序列化后的策略格式
 */
export interface SerializedStrategy {
  version: string;
  timestamp: number;
  data: StrategyConfig;
}

/**
 * 策略列表项
 */
export interface StrategyListItem {
  id: string;
  name: string;
  updatedAt: number;
}

/**
 * 当前序列化版本
 */
const SERIALIZATION_VERSION = '1.0.0';

/**
 * 验证节点是否有效
 */
function isValidNode(node: unknown): node is StrategyNode {
  if (!node || typeof node !== 'object') return false;
  const n = node as Record<string, unknown>;

  return (
    typeof n.id === 'string' &&
    typeof n.type === 'string' &&
    Object.values(ModuleType).includes(n.type as ModuleType) &&
    typeof n.position === 'object' &&
    n.position !== null &&
    typeof (n.position as Record<string, unknown>).x === 'number' &&
    typeof (n.position as Record<string, unknown>).y === 'number' &&
    typeof n.data === 'object' &&
    n.data !== null
  );
}

/**
 * 验证边是否有效
 */
function isValidEdge(edge: unknown): edge is StrategyEdge {
  if (!edge || typeof edge !== 'object') return false;
  const e = edge as Record<string, unknown>;

  return (
    typeof e.id === 'string' &&
    typeof e.source === 'string' &&
    typeof e.target === 'string' &&
    typeof e.sourceHandle === 'string' &&
    typeof e.targetHandle === 'string'
  );
}

/**
 * 验证策略配置是否有效
 */
export function isValidStrategyConfig(config: unknown): config is StrategyConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;

  // 验证基本字段
  if (
    typeof c.id !== 'string' ||
    typeof c.name !== 'string' ||
    typeof c.createdAt !== 'number' ||
    typeof c.updatedAt !== 'number'
  ) {
    return false;
  }

  // 验证节点数组
  if (!Array.isArray(c.nodes)) return false;
  for (const node of c.nodes) {
    if (!isValidNode(node)) return false;
  }

  // 验证边数组
  if (!Array.isArray(c.edges)) return false;
  for (const edge of c.edges) {
    if (!isValidEdge(edge)) return false;
  }

  return true;
}

/**
 * 序列化策略配置为 JSON 字符串
 * 
 * @param config - 策略配置对象
 * @returns 序列化后的 JSON 字符串
 */
export function serializeStrategy(config: StrategyConfig): string {
  const serialized: SerializedStrategy = {
    version: SERIALIZATION_VERSION,
    timestamp: Date.now(),
    data: config,
  };

  return JSON.stringify(serialized);
}

/**
 * 反序列化 JSON 字符串为策略配置
 * 
 * @param json - JSON 字符串
 * @returns 策略配置对象，如果解析失败则返回 null
 */
export function deserializeStrategy(json: string): StrategyConfig | null {
  try {
    const parsed = JSON.parse(json);

    // 检查是否是新格式（带版本号）
    if (parsed.version && parsed.data) {
      const serialized = parsed as SerializedStrategy;
      if (isValidStrategyConfig(serialized.data)) {
        return serialized.data;
      }
    }

    // 兼容旧格式（直接存储 StrategyConfig）
    if (isValidStrategyConfig(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 获取策略的存储键名
 */
function getStorageKey(strategyId: string): string {
  return `${STORAGE_KEY_PREFIX}${strategyId}`;
}

/**
 * 保存策略到 localStorage
 * 
 * @param config - 策略配置对象
 * @returns 是否保存成功
 */
export function saveStrategyToStorage(config: StrategyConfig): boolean {
  try {
    const serialized = serializeStrategy(config);
    const key = getStorageKey(config.id);

    localStorage.setItem(key, serialized);

    // 更新策略列表
    updateStrategyList(config);

    return true;
  } catch (error) {
    console.error('Failed to save strategy to localStorage:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载策略
 * 
 * @param strategyId - 策略ID
 * @returns 策略配置对象，如果加载失败则返回 null
 */
export function loadStrategyFromStorage(strategyId: string): StrategyConfig | null {
  try {
    const key = getStorageKey(strategyId);
    const json = localStorage.getItem(key);

    if (!json) return null;

    return deserializeStrategy(json);
  } catch (error) {
    console.error('Failed to load strategy from localStorage:', error);
    return null;
  }
}

/**
 * 从 localStorage 删除策略
 * 
 * @param strategyId - 策略ID
 * @returns 是否删除成功
 */
export function deleteStrategyFromStorage(strategyId: string): boolean {
  try {
    const key = getStorageKey(strategyId);
    localStorage.removeItem(key);

    // 从策略列表中移除
    removeFromStrategyList(strategyId);

    return true;
  } catch (error) {
    console.error('Failed to delete strategy from localStorage:', error);
    return false;
  }
}

/**
 * 获取所有已保存的策略列表
 * 
 * @returns 策略列表项数组
 */
export function getSavedStrategies(): StrategyListItem[] {
  try {
    const json = localStorage.getItem(STRATEGY_LIST_KEY);
    if (!json) return [];

    const list = JSON.parse(json);
    if (!Array.isArray(list)) return [];

    return list.filter(
      (item): item is StrategyListItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.updatedAt === 'number'
    );
  } catch {
    return [];
  }
}

/**
 * 更新策略列表
 */
function updateStrategyList(config: StrategyConfig): void {
  const list = getSavedStrategies();
  const existingIndex = list.findIndex((item) => item.id === config.id);

  const listItem: StrategyListItem = {
    id: config.id,
    name: config.name,
    updatedAt: config.updatedAt,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = listItem;
  } else {
    list.push(listItem);
  }

  // 按更新时间降序排序
  list.sort((a, b) => b.updatedAt - a.updatedAt);

  localStorage.setItem(STRATEGY_LIST_KEY, JSON.stringify(list));
}

/**
 * 从策略列表中移除
 */
function removeFromStrategyList(strategyId: string): void {
  const list = getSavedStrategies();
  const filteredList = list.filter((item) => item.id !== strategyId);
  localStorage.setItem(STRATEGY_LIST_KEY, JSON.stringify(filteredList));
}

/**
 * 检查 localStorage 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清除所有已保存的策略
 * 
 * @returns 是否清除成功
 */
export function clearAllStrategies(): boolean {
  try {
    const list = getSavedStrategies();

    // 删除所有策略数据
    for (const item of list) {
      const key = getStorageKey(item.id);
      localStorage.removeItem(key);
    }

    // 清空策略列表
    localStorage.removeItem(STRATEGY_LIST_KEY);

    return true;
  } catch (error) {
    console.error('Failed to clear all strategies:', error);
    return false;
  }
}
