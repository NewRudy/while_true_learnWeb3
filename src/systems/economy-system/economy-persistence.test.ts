/**
 * Economy Persistence Unit Tests
 * 经济系统持久化单元测试
 *
 * @description 测试钱包余额和已解锁物品的 localStorage 持久化
 * @requirements 3.5, 3.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveEconomyState,
  loadEconomyState,
  clearEconomyState,
  hasPersistedEconomyState,
  getPersistedEconomyTimestamp,
  isValidWalletState,
  isValidPurchaseRecord,
  isValidFundsTransaction,
  isValidPersistedEconomyState,
  ECONOMY_STORAGE_KEY,
  ECONOMY_STORAGE_VERSION,
  PersistedEconomyState,
} from './economy-persistence';
import { WalletState, PurchaseRecord } from '@/types';
import { FundsTransaction } from './economy-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

const getFirstSetItemValue = () => {
  const call = localStorageMock.setItem.mock.calls[0];
  if (!call) {
    throw new Error('Expected localStorage.setItem to be called');
  }
  return call[1];
};

describe('Economy Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Validation Functions', () => {
    describe('isValidWalletState', () => {
      it('should return true for valid wallet state', () => {
        const wallet: WalletState = {
          balance: 100,
          totalEarned: 200,
          totalSpent: 100,
        };
        expect(isValidWalletState(wallet)).toBe(true);
      });

      it('should return true for zero values', () => {
        const wallet: WalletState = {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        };
        expect(isValidWalletState(wallet)).toBe(true);
      });

      it('should return false for null', () => {
        expect(isValidWalletState(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isValidWalletState(undefined)).toBe(false);
      });

      it('should return false for missing properties', () => {
        expect(isValidWalletState({ balance: 100 })).toBe(false);
        expect(isValidWalletState({ balance: 100, totalEarned: 100 })).toBe(false);
      });

      it('should return false for negative values', () => {
        expect(isValidWalletState({ balance: -100, totalEarned: 100, totalSpent: 0 })).toBe(false);
      });

      it('should return false for non-number values', () => {
        expect(isValidWalletState({ balance: '100', totalEarned: 100, totalSpent: 0 })).toBe(false);
      });
    });

    describe('isValidPurchaseRecord', () => {
      it('should return true for valid purchase record', () => {
        const record: PurchaseRecord = {
          itemId: 'module_swap',
          timestamp: Date.now(),
          price: 500,
        };
        expect(isValidPurchaseRecord(record)).toBe(true);
      });

      it('should return false for empty itemId', () => {
        expect(isValidPurchaseRecord({ itemId: '', timestamp: Date.now(), price: 500 })).toBe(false);
      });

      it('should return false for invalid timestamp', () => {
        expect(isValidPurchaseRecord({ itemId: 'test', timestamp: 0, price: 500 })).toBe(false);
        expect(isValidPurchaseRecord({ itemId: 'test', timestamp: -1, price: 500 })).toBe(false);
      });

      it('should return false for negative price', () => {
        expect(isValidPurchaseRecord({ itemId: 'test', timestamp: Date.now(), price: -100 })).toBe(false);
      });

      it('should return true for zero price (free items)', () => {
        expect(isValidPurchaseRecord({ itemId: 'test', timestamp: Date.now(), price: 0 })).toBe(true);
      });
    });

    describe('isValidFundsTransaction', () => {
      it('should return true for valid earn transaction', () => {
        const transaction: FundsTransaction = {
          id: 'tx-123',
          amount: 100,
          reason: 'Level reward',
          timestamp: Date.now(),
          type: 'earn',
        };
        expect(isValidFundsTransaction(transaction)).toBe(true);
      });

      it('should return true for valid spend transaction', () => {
        const transaction: FundsTransaction = {
          id: 'tx-456',
          amount: -50,
          reason: 'Purchase',
          timestamp: Date.now(),
          type: 'spend',
        };
        expect(isValidFundsTransaction(transaction)).toBe(true);
      });

      it('should return false for invalid type', () => {
        expect(isValidFundsTransaction({
          id: 'tx-123',
          amount: 100,
          reason: 'Test',
          timestamp: Date.now(),
          type: 'invalid',
        })).toBe(false);
      });
    });

    describe('isValidPersistedEconomyState', () => {
      it('should return true for valid persisted state', () => {
        const state: PersistedEconomyState = {
          version: '1.0.0',
          timestamp: Date.now(),
          wallet: { balance: 100, totalEarned: 100, totalSpent: 0 },
          unlockedItems: ['module_swap'],
          purchaseHistory: [{ itemId: 'module_swap', timestamp: Date.now(), price: 500 }],
          fundsHistory: [{
            id: 'tx-1',
            amount: 100,
            reason: 'Test',
            timestamp: Date.now(),
            type: 'earn',
          }],
        };
        expect(isValidPersistedEconomyState(state)).toBe(true);
      });

      it('should return true for empty arrays', () => {
        const state: PersistedEconomyState = {
          version: '1.0.0',
          timestamp: Date.now(),
          wallet: { balance: 0, totalEarned: 0, totalSpent: 0 },
          unlockedItems: [],
          purchaseHistory: [],
          fundsHistory: [],
        };
        expect(isValidPersistedEconomyState(state)).toBe(true);
      });

      it('should return false for invalid wallet', () => {
        expect(isValidPersistedEconomyState({
          version: '1.0.0',
          timestamp: Date.now(),
          wallet: { balance: -100, totalEarned: 0, totalSpent: 0 },
          unlockedItems: [],
          purchaseHistory: [],
          fundsHistory: [],
        })).toBe(false);
      });

      it('should return false for non-string items in unlockedItems', () => {
        expect(isValidPersistedEconomyState({
          version: '1.0.0',
          timestamp: Date.now(),
          wallet: { balance: 0, totalEarned: 0, totalSpent: 0 },
          unlockedItems: [123],
          purchaseHistory: [],
          fundsHistory: [],
        })).toBe(false);
      });
    });
  });

  describe('saveEconomyState', () => {
    /**
     * @requirements 3.5 - 持久化钱包余额和已解锁物品
     */
    it('should save economy state to localStorage', () => {
      const state = {
        wallet: { balance: 500, totalEarned: 600, totalSpent: 100 },
        unlockedItems: ['module_swap', 'module_stake'],
        purchaseHistory: [{ itemId: 'module_swap', timestamp: Date.now(), price: 500 }],
        fundsHistory: [],
      };

      const result = saveEconomyState(state);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        ECONOMY_STORAGE_KEY,
        expect.any(String)
      );

      // Verify saved data structure
      const savedData = JSON.parse(getFirstSetItemValue());
      expect(savedData.version).toBe(ECONOMY_STORAGE_VERSION);
      expect(savedData.wallet).toEqual(state.wallet);
      expect(savedData.unlockedItems).toEqual(state.unlockedItems);
    });

    it('should include timestamp in saved data', () => {
      const beforeSave = Date.now();

      saveEconomyState({
        wallet: { balance: 0, totalEarned: 0, totalSpent: 0 },
        unlockedItems: [],
        purchaseHistory: [],
        fundsHistory: [],
      });

      const afterSave = Date.now();
      const savedData = JSON.parse(getFirstSetItemValue());

      expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(savedData.timestamp).toBeLessThanOrEqual(afterSave);
    });

    it('should return false when localStorage throws', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const result = saveEconomyState({
        wallet: { balance: 0, totalEarned: 0, totalSpent: 0 },
        unlockedItems: [],
        purchaseHistory: [],
        fundsHistory: [],
      });

      expect(result).toBe(false);
    });
  });

  describe('loadEconomyState', () => {
    /**
     * @requirements 3.6 - 加载时恢复钱包状态
     */
    it('should load economy state from localStorage', () => {
      const savedState: PersistedEconomyState = {
        version: ECONOMY_STORAGE_VERSION,
        timestamp: Date.now(),
        wallet: { balance: 500, totalEarned: 600, totalSpent: 100 },
        unlockedItems: ['module_swap'],
        purchaseHistory: [{ itemId: 'module_swap', timestamp: Date.now(), price: 500 }],
        fundsHistory: [],
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

      const result = loadEconomyState();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(savedState);
    });

    it('should return error when no saved state exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadEconomyState();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No saved economy state found');
    });

    it('should return error for invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not valid json');

      const result = loadEconomyState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid JSON');
    });

    it('should return error for corrupted data', () => {
      const corruptedState = {
        version: '1.0.0',
        timestamp: Date.now(),
        wallet: { balance: -100 }, // Invalid: negative balance
        unlockedItems: [],
        purchaseHistory: [],
        fundsHistory: [],
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(corruptedState));

      const result = loadEconomyState();

      expect(result.success).toBe(false);
      expect(result.error).toContain('corrupted or invalid');
    });

    it('should return error for missing required fields', () => {
      const incompleteState = {
        version: '1.0.0',
        timestamp: Date.now(),
        // Missing wallet, unlockedItems, etc.
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(incompleteState));

      const result = loadEconomyState();

      expect(result.success).toBe(false);
    });
  });

  describe('clearEconomyState', () => {
    it('should remove economy state from localStorage', () => {
      const result = clearEconomyState();

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(ECONOMY_STORAGE_KEY);
    });

    it('should return false when localStorage throws', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = clearEconomyState();

      expect(result).toBe(false);
    });
  });

  describe('hasPersistedEconomyState', () => {
    it('should return true when state exists', () => {
      localStorageMock.getItem.mockReturnValueOnce('{}');

      expect(hasPersistedEconomyState()).toBe(true);
    });

    it('should return false when state does not exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      expect(hasPersistedEconomyState()).toBe(false);
    });

    it('should return false when localStorage throws', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(hasPersistedEconomyState()).toBe(false);
    });
  });

  describe('getPersistedEconomyTimestamp', () => {
    it('should return timestamp when valid state exists', () => {
      const timestamp = Date.now();
      const savedState: PersistedEconomyState = {
        version: ECONOMY_STORAGE_VERSION,
        timestamp,
        wallet: { balance: 0, totalEarned: 0, totalSpent: 0 },
        unlockedItems: [],
        purchaseHistory: [],
        fundsHistory: [],
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState));

      expect(getPersistedEconomyTimestamp()).toBe(timestamp);
    });

    it('should return null when no state exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      expect(getPersistedEconomyTimestamp()).toBeNull();
    });

    it('should return null for corrupted state', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      expect(getPersistedEconomyTimestamp()).toBeNull();
    });
  });

  describe('Round-trip Persistence', () => {
    /**
     * @requirements 3.5, 3.6 - 保存和恢复钱包状态
     */
    it('should preserve wallet balance through save/load cycle', () => {
      const originalState = {
        wallet: { balance: 1234, totalEarned: 5678, totalSpent: 4444 },
        unlockedItems: ['module_swap', 'module_stake', 'tool_advanced_analytics'],
        purchaseHistory: [
          { itemId: 'module_swap', timestamp: 1000000, price: 500 },
          { itemId: 'module_stake', timestamp: 2000000, price: 1000 },
        ],
        fundsHistory: [
          { id: 'tx-1', amount: 1000, reason: 'Level 1', timestamp: 500000, type: 'earn' as const },
          { id: 'tx-2', amount: -500, reason: 'Purchase', timestamp: 1000000, type: 'spend' as const },
        ],
      };

      // Save
      saveEconomyState(originalState);

      // Get saved data and set it up for load
      const savedJson = getFirstSetItemValue();
      localStorageMock.getItem.mockReturnValueOnce(savedJson);

      // Load
      const result = loadEconomyState();

      expect(result.success).toBe(true);
      expect(result.data?.wallet).toEqual(originalState.wallet);
      expect(result.data?.unlockedItems).toEqual(originalState.unlockedItems);
      expect(result.data?.purchaseHistory).toEqual(originalState.purchaseHistory);
      expect(result.data?.fundsHistory).toEqual(originalState.fundsHistory);
    });
  });
});
