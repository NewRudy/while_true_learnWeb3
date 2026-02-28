/**
 * Economy Store Unit Tests
 * 经济系统存储单元测试
 *
 * @description 测试钱包状态管理和资金操作
 * @requirements 3.1, 3.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEconomyStore, getInitialEconomyState } from './economy-store';
import type { EconomyStore } from './economy-store';

describe('Economy Store', () => {
  let store: ReturnType<typeof createEconomyStore>;
  let getState: () => EconomyStore;

  beforeEach(() => {
    store = createEconomyStore();
    getState = store.getState;
  });

  describe('Initial State', () => {
    it('should have zero balance initially', () => {
      const state = getState();
      expect(state.wallet.balance).toBe(0);
    });

    it('should have zero totalEarned initially', () => {
      const state = getState();
      expect(state.wallet.totalEarned).toBe(0);
    });

    it('should have zero totalSpent initially', () => {
      const state = getState();
      expect(state.wallet.totalSpent).toBe(0);
    });

    it('should have empty unlockedItems initially', () => {
      const state = getState();
      expect(state.unlockedItems).toEqual([]);
    });

    it('should have empty purchaseHistory initially', () => {
      const state = getState();
      expect(state.purchaseHistory).toEqual([]);
    });

    it('should have null lastFundsChange initially', () => {
      const state = getState();
      expect(state.lastFundsChange).toBeNull();
    });
  });

  describe('addFunds', () => {
    /**
     * @requirements 3.1 - 关卡完成奖励
     */
    it('should increase balance when adding funds', () => {
      getState().addFunds(100, 'Level completion reward');
      expect(getState().wallet.balance).toBe(100);
    });

    /**
     * @requirements 3.2 - 更新钱包余额
     */
    it('should update totalEarned when adding funds', () => {
      getState().addFunds(100, 'Level completion reward');
      expect(getState().wallet.totalEarned).toBe(100);
    });

    it('should accumulate balance with multiple addFunds calls', () => {
      getState().addFunds(100, 'First reward');
      getState().addFunds(50, 'Second reward');
      expect(getState().wallet.balance).toBe(150);
      expect(getState().wallet.totalEarned).toBe(150);
    });

    it('should not change balance for zero amount', () => {
      getState().addFunds(0, 'Invalid');
      expect(getState().wallet.balance).toBe(0);
    });

    it('should not change balance for negative amount', () => {
      getState().addFunds(-50, 'Invalid');
      expect(getState().wallet.balance).toBe(0);
    });

    /**
     * @requirements 3.2 - 显示动画
     */
    it('should set lastFundsChange for animation display', () => {
      getState().addFunds(100, 'Level reward');
      const lastChange = getState().lastFundsChange;
      expect(lastChange).not.toBeNull();
      expect(lastChange?.amount).toBe(100);
      expect(lastChange?.reason).toBe('Level reward');
      expect(lastChange?.type).toBe('earn');
    });

    it('should add transaction to fundsHistory', () => {
      getState().addFunds(100, 'Level reward');
      expect(getState().fundsHistory).toHaveLength(1);
      const [firstEntry] = getState().fundsHistory;
      if (!firstEntry) {
        throw new Error('Expected fundsHistory entry');
      }
      expect(firstEntry.amount).toBe(100);
    });
  });

  describe('deductFunds', () => {
    beforeEach(() => {
      // Setup initial balance
      getState().addFunds(200, 'Initial balance');
    });

    it('should decrease balance when deducting funds', () => {
      const result = getState().deductFunds(50, 'Purchase');
      expect(result).toBe(true);
      expect(getState().wallet.balance).toBe(150);
    });

    it('should update totalSpent when deducting funds', () => {
      getState().deductFunds(50, 'Purchase');
      expect(getState().wallet.totalSpent).toBe(50);
    });

    it('should return false when insufficient funds', () => {
      const result = getState().deductFunds(300, 'Expensive purchase');
      expect(result).toBe(false);
      expect(getState().wallet.balance).toBe(200);
    });

    it('should not change totalSpent when deduction fails', () => {
      getState().deductFunds(300, 'Expensive purchase');
      expect(getState().wallet.totalSpent).toBe(0);
    });

    it('should return false for zero amount', () => {
      const result = getState().deductFunds(0, 'Invalid');
      expect(result).toBe(false);
    });

    it('should return false for negative amount', () => {
      const result = getState().deductFunds(-50, 'Invalid');
      expect(result).toBe(false);
    });

    it('should set lastFundsChange with negative amount for spend', () => {
      getState().deductFunds(50, 'Purchase');
      const lastChange = getState().lastFundsChange;
      expect(lastChange).not.toBeNull();
      expect(lastChange?.amount).toBe(-50);
      expect(lastChange?.type).toBe('spend');
    });

    it('should allow deducting exact balance', () => {
      const result = getState().deductFunds(200, 'All funds');
      expect(result).toBe(true);
      expect(getState().wallet.balance).toBe(0);
    });
  });

  describe('getWallet', () => {
    it('should return current wallet state', () => {
      getState().addFunds(100, 'Test');
      const wallet = getState().getWallet();
      expect(wallet.balance).toBe(100);
      expect(wallet.totalEarned).toBe(100);
      expect(wallet.totalSpent).toBe(0);
    });
  });

  describe('hasEnoughFunds', () => {
    beforeEach(() => {
      getState().addFunds(100, 'Initial');
    });

    it('should return true when balance is sufficient', () => {
      expect(getState().hasEnoughFunds(50)).toBe(true);
    });

    it('should return true when balance equals amount', () => {
      expect(getState().hasEnoughFunds(100)).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      expect(getState().hasEnoughFunds(150)).toBe(false);
    });

    it('should return true for zero amount', () => {
      expect(getState().hasEnoughFunds(0)).toBe(true);
    });
  });

  describe('Unlocked Items', () => {
    it('should add unlocked item', () => {
      getState().addUnlockedItem('module_swap');
      expect(getState().unlockedItems).toContain('module_swap');
    });

    it('should not add duplicate items', () => {
      getState().addUnlockedItem('module_swap');
      getState().addUnlockedItem('module_swap');
      expect(getState().unlockedItems).toHaveLength(1);
    });

    it('should check if item is unlocked', () => {
      getState().addUnlockedItem('module_swap');
      expect(getState().isItemUnlocked('module_swap')).toBe(true);
      expect(getState().isItemUnlocked('module_stake')).toBe(false);
    });
  });

  describe('Purchase History', () => {
    it('should add purchase record', () => {
      const record = {
        itemId: 'module_swap',
        timestamp: Date.now(),
        price: 100,
      };
      getState().addPurchaseRecord(record);
      expect(getState().purchaseHistory).toHaveLength(1);
      expect(getState().purchaseHistory[0]).toEqual(record);
    });
  });

  describe('resetWallet', () => {
    it('should reset all state to initial values', () => {
      // Setup some state
      getState().addFunds(100, 'Test');
      getState().deductFunds(30, 'Purchase');
      getState().addUnlockedItem('module_swap');

      // Reset
      getState().resetWallet();

      const state = getState();
      expect(state.wallet.balance).toBe(0);
      expect(state.wallet.totalEarned).toBe(0);
      expect(state.wallet.totalSpent).toBe(0);
      expect(state.unlockedItems).toEqual([]);
      expect(state.purchaseHistory).toEqual([]);
      expect(state.fundsHistory).toEqual([]);
    });
  });

  describe('clearLastFundsChange', () => {
    it('should clear lastFundsChange', () => {
      getState().addFunds(100, 'Test');
      expect(getState().lastFundsChange).not.toBeNull();

      getState().clearLastFundsChange();
      expect(getState().lastFundsChange).toBeNull();
    });
  });

  describe('restoreState', () => {
    it('should restore wallet state', () => {
      const savedState = {
        wallet: {
          balance: 500,
          totalEarned: 600,
          totalSpent: 100,
        },
      };

      getState().restoreState(savedState);

      expect(getState().wallet.balance).toBe(500);
      expect(getState().wallet.totalEarned).toBe(600);
      expect(getState().wallet.totalSpent).toBe(100);
    });

    it('should restore unlocked items', () => {
      const savedState = {
        unlockedItems: ['module_swap', 'module_stake'],
      };

      getState().restoreState(savedState);

      expect(getState().unlockedItems).toEqual(['module_swap', 'module_stake']);
    });

    it('should set lastFundsChange to null on restore', () => {
      getState().addFunds(100, 'Test');
      expect(getState().lastFundsChange).not.toBeNull();

      getState().restoreState({
        wallet: { balance: 200, totalEarned: 200, totalSpent: 0 },
      });

      expect(getState().lastFundsChange).toBeNull();
    });
  });

  describe('getInitialEconomyState', () => {
    it('should return a copy of initial state', () => {
      const initial = getInitialEconomyState();
      expect(initial.wallet.balance).toBe(0);
      expect(initial.wallet.totalEarned).toBe(0);
      expect(initial.wallet.totalSpent).toBe(0);
      expect(initial.unlockedItems).toEqual([]);
    });
  });
});
