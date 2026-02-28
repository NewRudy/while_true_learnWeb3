/**
 * Shop Service Unit Tests
 * 商店服务单元测试
 *
 * @description 测试购买逻辑和解锁功能
 * @requirements 3.3, 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEconomyStore } from './economy-store';
import {
  createShopService,
  validatePurchase,
  calculateBalanceAfterPurchase,
  PurchaseErrorType,
  purchaseErrorMessages,
} from './shop-service';
import { allShopItems, getShopItemById } from './shop-items';
import type { IShopService } from './shop-service';
import type { EconomyStore } from './economy-store';

describe('Shop Service', () => {
  let economyStore: ReturnType<typeof createEconomyStore>;
  let getState: () => EconomyStore;
  let shopService: IShopService;

  beforeEach(() => {
    economyStore = createEconomyStore();
    getState = economyStore.getState;
    shopService = createShopService(getState);
  });

  describe('getShopItems', () => {
    it('should return all shop items', () => {
      const items = shopService.getShopItems();
      expect(items.length).toBe(allShopItems.length);
    });

    it('should return a copy of items (not the original array)', () => {
      const items1 = shopService.getShopItems();
      const items2 = shopService.getShopItems();
      expect(items1).not.toBe(items2);
      expect(items1).toEqual(items2);
    });
  });

  describe('getShopItemsByCategory', () => {
    it('should return only module items', () => {
      const items = shopService.getShopItemsByCategory('module');
      expect(items.every((item) => item.category === 'module')).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should return only tool items', () => {
      const items = shopService.getShopItemsByCategory('tool');
      expect(items.every((item) => item.category === 'tool')).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should return only cosmetic items', () => {
      const items = shopService.getShopItemsByCategory('cosmetic');
      expect(items.every((item) => item.category === 'cosmetic')).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('getShopItem', () => {
    it('should return item by id', () => {
      const item = shopService.getShopItem('module_swap');
      expect(item).toBeDefined();
      expect(item?.id).toBe('module_swap');
    });

    it('should return undefined for non-existent item', () => {
      const item = shopService.getShopItem('non_existent_item');
      expect(item).toBeUndefined();
    });
  });

  describe('canAfford', () => {
    it('should return false when balance is zero', () => {
      expect(shopService.canAfford('module_swap')).toBe(false);
    });

    it('should return true when balance is sufficient', () => {
      const item = getShopItemById('module_swap')!;
      getState().addFunds(item.price, 'Test');
      expect(shopService.canAfford('module_swap')).toBe(true);
    });

    it('should return true when balance equals price', () => {
      const item = getShopItemById('module_swap')!;
      getState().addFunds(item.price, 'Test');
      expect(shopService.canAfford('module_swap')).toBe(true);
    });

    it('should return false when balance is less than price', () => {
      const item = getShopItemById('module_swap')!;
      getState().addFunds(item.price - 1, 'Test');
      expect(shopService.canAfford('module_swap')).toBe(false);
    });

    it('should return false for non-existent item', () => {
      getState().addFunds(10000, 'Test');
      expect(shopService.canAfford('non_existent_item')).toBe(false);
    });
  });

  describe('isOwned', () => {
    it('should return false for items not owned', () => {
      expect(shopService.isOwned('module_swap')).toBe(false);
    });

    it('should return true for owned items', () => {
      getState().addUnlockedItem('module_swap');
      expect(shopService.isOwned('module_swap')).toBe(true);
    });
  });

  describe('purchase', () => {
    /**
     * @requirements 3.3 - 购买升级，扣除成本并解锁新功能
     */
    describe('successful purchase', () => {
      beforeEach(() => {
        // Add enough funds for any item
        getState().addFunds(10000, 'Test funds');
      });

      it('should return success result', () => {
        const result = shopService.purchase('module_swap');
        expect(result.success).toBe(true);
      });

      it('should deduct the correct amount from balance', () => {
        const item = getShopItemById('module_swap')!;
        const balanceBefore = getState().wallet.balance;
        shopService.purchase('module_swap');
        expect(getState().wallet.balance).toBe(balanceBefore - item.price);
      });

      it('should return new balance in result', () => {
        const item = getShopItemById('module_swap')!;
        const balanceBefore = getState().wallet.balance;
        const result = shopService.purchase('module_swap');
        expect(result.newBalance).toBe(balanceBefore - item.price);
      });

      it('should unlock the item', () => {
        shopService.purchase('module_swap');
        expect(getState().isItemUnlocked('module_swap')).toBe(true);
      });

      it('should unlock associated content', () => {
        const item = getShopItemById('module_swap')!;
        shopService.purchase('module_swap');
        for (const unlockId of item.unlocks) {
          expect(getState().isItemUnlocked(unlockId)).toBe(true);
        }
      });

      it('should add purchase record', () => {
        const item = getShopItemById('module_swap')!;
        shopService.purchase('module_swap');
        const history = getState().purchaseHistory;
        expect(history.length).toBe(1);
        const [firstRecord] = history;
        if (!firstRecord) {
          throw new Error('Expected purchase history entry');
        }
        expect(firstRecord.itemId).toBe('module_swap');
        expect(firstRecord.price).toBe(item.price);
      });
    });

    /**
     * @requirements 3.4 - 资金不足时显示错误并阻止交易
     */
    describe('insufficient funds', () => {
      it('should return failure result', () => {
        const result = shopService.purchase('module_swap');
        expect(result.success).toBe(false);
      });

      it('should return insufficient funds error message', () => {
        const result = shopService.purchase('module_swap');
        expect(result.error).toBe(
          purchaseErrorMessages[PurchaseErrorType.INSUFFICIENT_FUNDS]
        );
      });

      it('should not change balance', () => {
        const balanceBefore = getState().wallet.balance;
        shopService.purchase('module_swap');
        expect(getState().wallet.balance).toBe(balanceBefore);
      });

      it('should not unlock the item', () => {
        shopService.purchase('module_swap');
        expect(getState().isItemUnlocked('module_swap')).toBe(false);
      });

      it('should not add purchase record', () => {
        shopService.purchase('module_swap');
        expect(getState().purchaseHistory.length).toBe(0);
      });
    });

    describe('item not found', () => {
      beforeEach(() => {
        getState().addFunds(10000, 'Test funds');
      });

      it('should return failure result', () => {
        const result = shopService.purchase('non_existent_item');
        expect(result.success).toBe(false);
      });

      it('should return item not found error message', () => {
        const result = shopService.purchase('non_existent_item');
        expect(result.error).toBe(
          purchaseErrorMessages[PurchaseErrorType.ITEM_NOT_FOUND]
        );
      });

      it('should not change balance', () => {
        const balanceBefore = getState().wallet.balance;
        shopService.purchase('non_existent_item');
        expect(getState().wallet.balance).toBe(balanceBefore);
      });
    });

    describe('already owned', () => {
      beforeEach(() => {
        getState().addFunds(10000, 'Test funds');
        getState().addUnlockedItem('module_swap');
      });

      it('should return failure result', () => {
        const result = shopService.purchase('module_swap');
        expect(result.success).toBe(false);
      });

      it('should return already owned error message', () => {
        const result = shopService.purchase('module_swap');
        expect(result.error).toBe(
          purchaseErrorMessages[PurchaseErrorType.ALREADY_OWNED]
        );
      });

      it('should not change balance', () => {
        const balanceBefore = getState().wallet.balance;
        shopService.purchase('module_swap');
        expect(getState().wallet.balance).toBe(balanceBefore);
      });
    });

    describe('edge cases', () => {
      it('should allow purchase with exact balance', () => {
        const item = getShopItemById('module_swap')!;
        getState().addFunds(item.price, 'Exact amount');
        const result = shopService.purchase('module_swap');
        expect(result.success).toBe(true);
        expect(getState().wallet.balance).toBe(0);
      });

      it('should fail purchase with one less than required', () => {
        const item = getShopItemById('module_swap')!;
        getState().addFunds(item.price - 1, 'Almost enough');
        const result = shopService.purchase('module_swap');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('getUnlockedItems', () => {
    it('should return empty array initially', () => {
      expect(shopService.getUnlockedItems()).toEqual([]);
    });

    it('should return unlocked items after purchase', () => {
      getState().addFunds(10000, 'Test');
      shopService.purchase('module_swap');
      const unlocked = shopService.getUnlockedItems();
      expect(unlocked).toContain('module_swap');
    });
  });
});

describe('validatePurchase', () => {
  it('should return valid for valid purchase', () => {
    const item = getShopItemById('module_swap')!;
    const result = validatePurchase('module_swap', item.price, []);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for non-existent item', () => {
    const result = validatePurchase('non_existent', 10000, []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(PurchaseErrorType.ITEM_NOT_FOUND);
  });

  it('should return invalid for already owned item', () => {
    const result = validatePurchase('module_swap', 10000, ['module_swap']);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(PurchaseErrorType.ALREADY_OWNED);
  });

  it('should return invalid for insufficient funds', () => {
    const result = validatePurchase('module_swap', 0, []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(PurchaseErrorType.INSUFFICIENT_FUNDS);
  });
});

describe('calculateBalanceAfterPurchase', () => {
  it('should return correct balance after purchase', () => {
    const item = getShopItemById('module_swap')!;
    const result = calculateBalanceAfterPurchase('module_swap', 1000);
    expect(result).toBe(1000 - item.price);
  });

  it('should return null for non-existent item', () => {
    const result = calculateBalanceAfterPurchase('non_existent', 1000);
    expect(result).toBeNull();
  });

  it('should return null for insufficient funds', () => {
    const result = calculateBalanceAfterPurchase('module_swap', 0);
    expect(result).toBeNull();
  });

  it('should return zero for exact balance', () => {
    const item = getShopItemById('module_swap')!;
    const result = calculateBalanceAfterPurchase('module_swap', item.price);
    expect(result).toBe(0);
  });
});
