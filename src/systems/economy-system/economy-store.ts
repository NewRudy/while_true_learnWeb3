/**
 * Economy System Store
 * 经济系统状态管理
 *
 * @description 使用 Zustand 管理钱包状态和经济系统操作
 * @requirements 3.1, 3.2, 3.5, 3.6
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WalletState, PurchaseRecord } from '@/types';
import {
  saveEconomyState,
  loadEconomyState,
  clearEconomyState,
} from './economy-persistence';

/**
 * 资金变动记录
 */
export interface FundsTransaction {
  /** 交易ID */
  id: string;
  /** 金额（正数为收入，负数为支出） */
  amount: number;
  /** 变动原因 */
  reason: string;
  /** 时间戳 */
  timestamp: number;
  /** 交易类型 */
  type: 'earn' | 'spend';
}

/**
 * Economy Store 状态接口
 */
export interface EconomyStoreState {
  /** 钱包状态 */
  wallet: WalletState;
  /** 已解锁物品ID列表 */
  unlockedItems: string[];
  /** 购买历史 */
  purchaseHistory: PurchaseRecord[];
  /** 资金变动历史 */
  fundsHistory: FundsTransaction[];
  /** 最近一次资金变动（用于动画显示） */
  lastFundsChange: FundsTransaction | null;
}

/**
 * Economy Store 操作接口
 */
export interface EconomyStoreActions {
  /**
   * 添加资金
   * @param amount 金额（必须为正数）
   * @param reason 添加原因（如：关卡奖励、成就奖励等）
   * @requirements 3.1, 3.2
   */
  addFunds: (amount: number, reason: string) => void;

  /**
   * 扣除资金
   * @param amount 金额（必须为正数）
   * @param reason 扣除原因（如：购买物品等）
   * @returns 是否扣除成功
   */
  deductFunds: (amount: number, reason: string) => boolean;

  /**
   * 获取钱包状态
   */
  getWallet: () => WalletState;

  /**
   * 检查是否有足够资金
   * @param amount 需要的金额
   */
  hasEnoughFunds: (amount: number) => boolean;

  /**
   * 添加已解锁物品
   * @param itemId 物品ID
   */
  addUnlockedItem: (itemId: string) => void;

  /**
   * 检查物品是否已解锁
   * @param itemId 物品ID
   */
  isItemUnlocked: (itemId: string) => boolean;

  /**
   * 添加购买记录
   * @param record 购买记录
   */
  addPurchaseRecord: (record: PurchaseRecord) => void;

  /**
   * 重置钱包状态（用于新游戏）
   */
  resetWallet: () => void;

  /**
   * 清除最近资金变动（动画完成后调用）
   */
  clearLastFundsChange: () => void;

  /**
   * 恢复经济状态（从持久化存储加载）
   * @param state 要恢复的状态
   */
  restoreState: (state: Partial<EconomyStoreState>) => void;

  /**
   * 从 localStorage 加载保存的状态
   * @returns 是否成功加载
   * @requirements 3.6
   */
  loadFromStorage: () => boolean;

  /**
   * 保存当前状态到 localStorage
   * @returns 是否成功保存
   * @requirements 3.5
   */
  saveToStorage: () => boolean;

  /**
   * 清除 localStorage 中保存的状态
   * @returns 是否成功清除
   */
  clearStorage: () => boolean;
}

/**
 * Economy Store 完整类型
 */
export type EconomyStore = EconomyStoreState & EconomyStoreActions;

/**
 * 初始钱包状态
 */
const initialWalletState: WalletState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
};

/**
 * 初始经济系统状态
 */
const initialState: EconomyStoreState = {
  wallet: initialWalletState,
  unlockedItems: [],
  purchaseHistory: [],
  fundsHistory: [],
  lastFundsChange: null,
};

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建 Economy Store
 * 使用 Zustand 进行状态管理
 *
 * @requirements 3.1, 3.2, 3.5, 3.6
 */
export const useEconomyStore = create<EconomyStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    ...initialState,

    /**
     * 添加资金
     * 当玩家完成关卡或获得奖励时调用
     *
     * @requirements 3.1 - 关卡完成奖励
     * @requirements 3.2 - 更新钱包余额
     */
    addFunds: (amount: number, reason: string) => {
      // 验证金额
      if (amount <= 0) {
        console.warn('addFunds: amount must be positive');
        return;
      }

      const transaction: FundsTransaction = {
        id: generateId(),
        amount,
        reason,
        timestamp: Date.now(),
        type: 'earn',
      };

      set((state) => ({
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance + amount,
          totalEarned: state.wallet.totalEarned + amount,
        },
        fundsHistory: [...state.fundsHistory, transaction],
        lastFundsChange: transaction,
      }));
    },

    /**
     * 扣除资金
     * 当玩家购买物品时调用
     *
     * @returns 是否扣除成功（余额不足时返回 false）
     */
    deductFunds: (amount: number, reason: string) => {
      // 验证金额
      if (amount <= 0) {
        console.warn('deductFunds: amount must be positive');
        return false;
      }

      const { wallet } = get();

      // 检查余额是否足够
      if (wallet.balance < amount) {
        return false;
      }

      const transaction: FundsTransaction = {
        id: generateId(),
        amount: -amount, // 负数表示支出
        reason,
        timestamp: Date.now(),
        type: 'spend',
      };

      set((state) => ({
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance - amount,
          totalSpent: state.wallet.totalSpent + amount,
        },
        fundsHistory: [...state.fundsHistory, transaction],
        lastFundsChange: transaction,
      }));

      return true;
    },

    /**
     * 获取钱包状态
     */
    getWallet: () => {
      return get().wallet;
    },

    /**
     * 检查是否有足够资金
     */
    hasEnoughFunds: (amount: number) => {
      return get().wallet.balance >= amount;
    },

    /**
     * 添加已解锁物品
     */
    addUnlockedItem: (itemId: string) => {
      set((state) => {
        // 避免重复添加
        if (state.unlockedItems.includes(itemId)) {
          return state;
        }
        return {
          unlockedItems: [...state.unlockedItems, itemId],
        };
      });
    },

    /**
     * 检查物品是否已解锁
     */
    isItemUnlocked: (itemId: string) => {
      return get().unlockedItems.includes(itemId);
    },

    /**
     * 添加购买记录
     */
    addPurchaseRecord: (record: PurchaseRecord) => {
      set((state) => ({
        purchaseHistory: [...state.purchaseHistory, record],
      }));
    },

    /**
     * 重置钱包状态
     */
    resetWallet: () => {
      set(initialState);
      // 清除持久化存储
      clearEconomyState();
    },

    /**
     * 清除最近资金变动
     */
    clearLastFundsChange: () => {
      set({ lastFundsChange: null });
    },

    /**
     * 恢复经济状态
     */
    restoreState: (state: Partial<EconomyStoreState>) => {
      set((currentState) => ({
        ...currentState,
        ...state,
        // 确保 lastFundsChange 在恢复时为 null
        lastFundsChange: null,
      }));
    },

    /**
     * 从 localStorage 加载保存的状态
     * @requirements 3.6
     */
    loadFromStorage: () => {
      const result = loadEconomyState();
      if (result.success && result.data) {
        set({
          wallet: result.data.wallet,
          unlockedItems: result.data.unlockedItems,
          purchaseHistory: result.data.purchaseHistory,
          fundsHistory: result.data.fundsHistory,
          lastFundsChange: null,
        });
        return true;
      }
      return false;
    },

    /**
     * 保存当前状态到 localStorage
     * @requirements 3.5
     */
    saveToStorage: () => {
      const state = get();
      return saveEconomyState({
        wallet: state.wallet,
        unlockedItems: state.unlockedItems,
        purchaseHistory: state.purchaseHistory,
        fundsHistory: state.fundsHistory,
      });
    },

    /**
     * 清除 localStorage 中保存的状态
     */
    clearStorage: () => {
      return clearEconomyState();
    },
  }))
);

/**
 * 设置自动保存订阅
 * 当钱包余额或已解锁物品变化时自动保存
 * @requirements 3.5
 */
export function setupEconomyPersistence(): () => void {
  // 订阅钱包变化
  const unsubWallet = useEconomyStore.subscribe(
    (state) => state.wallet,
    () => {
      useEconomyStore.getState().saveToStorage();
    }
  );

  // 订阅已解锁物品变化
  const unsubUnlocked = useEconomyStore.subscribe(
    (state) => state.unlockedItems,
    () => {
      useEconomyStore.getState().saveToStorage();
    }
  );

  // 返回清理函数
  return () => {
    unsubWallet();
    unsubUnlocked();
  };
}

/**
 * 初始化经济系统（加载保存的状态并设置自动保存）
 * @returns 清理函数
 * @requirements 3.5, 3.6
 */
export function initializeEconomySystem(): () => void {
  // 尝试从 localStorage 加载保存的状态
  useEconomyStore.getState().loadFromStorage();

  // 设置自动保存
  return setupEconomyPersistence();
};

/**
 * 创建独立的 Economy Store 实例（用于测试）
 */
export function createEconomyStore() {
  return create<EconomyStore>()((set, get) => ({
    ...initialState,

    addFunds: (amount: number, reason: string) => {
      if (amount <= 0) {
        return;
      }

      const transaction: FundsTransaction = {
        id: generateId(),
        amount,
        reason,
        timestamp: Date.now(),
        type: 'earn',
      };

      set((state) => ({
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance + amount,
          totalEarned: state.wallet.totalEarned + amount,
        },
        fundsHistory: [...state.fundsHistory, transaction],
        lastFundsChange: transaction,
      }));
    },

    deductFunds: (amount: number, reason: string) => {
      if (amount <= 0) {
        return false;
      }

      const { wallet } = get();

      if (wallet.balance < amount) {
        return false;
      }

      const transaction: FundsTransaction = {
        id: generateId(),
        amount: -amount,
        reason,
        timestamp: Date.now(),
        type: 'spend',
      };

      set((state) => ({
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance - amount,
          totalSpent: state.wallet.totalSpent + amount,
        },
        fundsHistory: [...state.fundsHistory, transaction],
        lastFundsChange: transaction,
      }));

      return true;
    },

    getWallet: () => get().wallet,

    hasEnoughFunds: (amount: number) => get().wallet.balance >= amount,

    addUnlockedItem: (itemId: string) => {
      set((state) => {
        if (state.unlockedItems.includes(itemId)) {
          return state;
        }
        return {
          unlockedItems: [...state.unlockedItems, itemId],
        };
      });
    },

    isItemUnlocked: (itemId: string) => get().unlockedItems.includes(itemId),

    addPurchaseRecord: (record: PurchaseRecord) => {
      set((state) => ({
        purchaseHistory: [...state.purchaseHistory, record],
      }));
    },

    resetWallet: () => {
      set(initialState);
      clearEconomyState();
    },

    clearLastFundsChange: () => {
      set({ lastFundsChange: null });
    },

    restoreState: (state: Partial<EconomyStoreState>) => {
      set((currentState) => ({
        ...currentState,
        ...state,
        lastFundsChange: null,
      }));
    },

    loadFromStorage: () => {
      const result = loadEconomyState();
      if (result.success && result.data) {
        set({
          wallet: result.data.wallet,
          unlockedItems: result.data.unlockedItems,
          purchaseHistory: result.data.purchaseHistory,
          fundsHistory: result.data.fundsHistory,
          lastFundsChange: null,
        });
        return true;
      }
      return false;
    },

    saveToStorage: () => {
      const state = get();
      return saveEconomyState({
        wallet: state.wallet,
        unlockedItems: state.unlockedItems,
        purchaseHistory: state.purchaseHistory,
        fundsHistory: state.fundsHistory,
      });
    },

    clearStorage: () => {
      return clearEconomyState();
    },
  }));
}

/**
 * 获取初始状态（用于测试）
 */
export function getInitialEconomyState(): EconomyStoreState {
  return { ...initialState };
}
