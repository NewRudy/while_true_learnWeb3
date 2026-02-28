/**
 * Economy Persistence Module
 * 经济系统持久化模块
 *
 * @description 处理钱包余额和已解锁物品的 localStorage 持久化
 * @requirements 3.5, 3.6
 */

import { WalletState, PurchaseRecord } from '@/types';
import { FundsTransaction } from './economy-store';

/**
 * localStorage 存储键
 */
export const ECONOMY_STORAGE_KEY = 'chainquest_economy_state';

/**
 * 当前持久化数据版本
 */
export const ECONOMY_STORAGE_VERSION = '1.0.0';

/**
 * 持久化的经济状态数据结构
 */
export interface PersistedEconomyState {
  /** 数据版本号 */
  version: string;
  /** 保存时间戳 */
  timestamp: number;
  /** 钱包状态 */
  wallet: WalletState;
  /** 已解锁物品ID列表 */
  unlockedItems: string[];
  /** 购买历史 */
  purchaseHistory: PurchaseRecord[];
  /** 资金变动历史 */
  fundsHistory: FundsTransaction[];
}

/**
 * 加载结果类型
 */
export interface LoadResult {
  /** 是否成功加载 */
  success: boolean;
  /** 加载的数据（成功时） */
  data?: PersistedEconomyState;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 验证钱包状态数据
 * @param wallet 待验证的钱包数据
 * @returns 是否有效
 */
export function isValidWalletState(wallet: unknown): wallet is WalletState {
  if (typeof wallet !== 'object' || wallet === null) {
    return false;
  }

  const w = wallet as Record<string, unknown>;

  return (
    typeof w.balance === 'number' &&
    typeof w.totalEarned === 'number' &&
    typeof w.totalSpent === 'number' &&
    w.balance >= 0 &&
    w.totalEarned >= 0 &&
    w.totalSpent >= 0
  );
}

/**
 * 验证购买记录
 * @param record 待验证的购买记录
 * @returns 是否有效
 */
export function isValidPurchaseRecord(record: unknown): record is PurchaseRecord {
  if (typeof record !== 'object' || record === null) {
    return false;
  }

  const r = record as Record<string, unknown>;

  return (
    typeof r.itemId === 'string' &&
    typeof r.timestamp === 'number' &&
    typeof r.price === 'number' &&
    r.itemId.length > 0 &&
    r.timestamp > 0 &&
    r.price >= 0
  );
}

/**
 * 验证资金变动记录
 * @param transaction 待验证的资金变动记录
 * @returns 是否有效
 */
export function isValidFundsTransaction(transaction: unknown): transaction is FundsTransaction {
  if (typeof transaction !== 'object' || transaction === null) {
    return false;
  }

  const t = transaction as Record<string, unknown>;

  return (
    typeof t.id === 'string' &&
    typeof t.amount === 'number' &&
    typeof t.reason === 'string' &&
    typeof t.timestamp === 'number' &&
    (t.type === 'earn' || t.type === 'spend')
  );
}

/**
 * 验证持久化的经济状态数据
 * @param data 待验证的数据
 * @returns 是否有效
 */
export function isValidPersistedEconomyState(data: unknown): data is PersistedEconomyState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as Record<string, unknown>;

  // 验证版本和时间戳
  if (typeof d.version !== 'string' || typeof d.timestamp !== 'number') {
    return false;
  }

  // 验证钱包状态
  if (!isValidWalletState(d.wallet)) {
    return false;
  }

  // 验证已解锁物品列表
  if (!Array.isArray(d.unlockedItems)) {
    return false;
  }
  if (!d.unlockedItems.every((item) => typeof item === 'string')) {
    return false;
  }

  // 验证购买历史
  if (!Array.isArray(d.purchaseHistory)) {
    return false;
  }
  if (!d.purchaseHistory.every(isValidPurchaseRecord)) {
    return false;
  }

  // 验证资金变动历史
  if (!Array.isArray(d.fundsHistory)) {
    return false;
  }
  if (!d.fundsHistory.every(isValidFundsTransaction)) {
    return false;
  }

  return true;
}

/**
 * 保存经济状态到 localStorage
 * @param state 要保存的状态
 * @returns 是否保存成功
 * @requirements 3.5
 */
export function saveEconomyState(state: {
  wallet: WalletState;
  unlockedItems: string[];
  purchaseHistory: PurchaseRecord[];
  fundsHistory: FundsTransaction[];
}): boolean {
  try {
    const persistedState: PersistedEconomyState = {
      version: ECONOMY_STORAGE_VERSION,
      timestamp: Date.now(),
      wallet: state.wallet,
      unlockedItems: state.unlockedItems,
      purchaseHistory: state.purchaseHistory,
      fundsHistory: state.fundsHistory,
    };

    const serialized = JSON.stringify(persistedState);
    localStorage.setItem(ECONOMY_STORAGE_KEY, serialized);

    return true;
  } catch (error) {
    console.error('Failed to save economy state:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载经济状态
 * @returns 加载结果
 * @requirements 3.6
 */
export function loadEconomyState(): LoadResult {
  try {
    const serialized = localStorage.getItem(ECONOMY_STORAGE_KEY);

    // 没有保存的数据
    if (serialized === null) {
      return {
        success: false,
        error: 'No saved economy state found',
      };
    }

    // 解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      return {
        success: false,
        error: 'Failed to parse saved economy state: invalid JSON',
      };
    }

    // 验证数据结构
    if (!isValidPersistedEconomyState(parsed)) {
      return {
        success: false,
        error: 'Saved economy state is corrupted or invalid',
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load economy state: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * 清除保存的经济状态
 * @returns 是否清除成功
 */
export function clearEconomyState(): boolean {
  try {
    localStorage.removeItem(ECONOMY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear economy state:', error);
    return false;
  }
}

/**
 * 检查是否有保存的经济状态
 * @returns 是否存在保存的状态
 */
export function hasPersistedEconomyState(): boolean {
  try {
    return localStorage.getItem(ECONOMY_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * 获取保存的经济状态的时间戳
 * @returns 时间戳，如果没有保存的状态则返回 null
 */
export function getPersistedEconomyTimestamp(): number | null {
  const result = loadEconomyState();
  if (result.success && result.data) {
    return result.data.timestamp;
  }
  return null;
}

