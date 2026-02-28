/**
 * Shop Service
 * 商店服务 - 购买逻辑和解锁功能
 *
 * @description 实现商店购买逻辑，包括资金检查、扣款和解锁
 * @requirements 3.3, 3.4
 */

import { ShopItem, PurchaseResult, PurchaseRecord, ShopItemCategory } from '@/types';
import { EconomyStore } from './economy-store';
import {
  allShopItems,
  getShopItemById,
  getShopItemsByCategory,
} from './shop-items';

/**
 * 购买错误类型
 */
export enum PurchaseErrorType {
  /** 物品不存在 */
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  /** 资金不足 */
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  /** 物品已拥有 */
  ALREADY_OWNED = 'ALREADY_OWNED',
}

/**
 * 购买错误消息映射
 */
export const purchaseErrorMessages: Record<PurchaseErrorType, string> = {
  [PurchaseErrorType.ITEM_NOT_FOUND]: '物品不存在',
  [PurchaseErrorType.INSUFFICIENT_FUNDS]: '资金不足，无法完成购买',
  [PurchaseErrorType.ALREADY_OWNED]: '您已拥有此物品',
};

/**
 * Shop Service 接口
 */
export interface IShopService {
  /** 获取所有商店物品 */
  getShopItems(): ShopItem[];
  /** 根据类别获取商店物品 */
  getShopItemsByCategory(category: ShopItemCategory): ShopItem[];
  /** 获取单个商店物品 */
  getShopItem(itemId: string): ShopItem | undefined;
  /** 检查是否能负担某物品 */
  canAfford(itemId: string): boolean;
  /** 检查物品是否已拥有 */
  isOwned(itemId: string): boolean;
  /** 购买物品 */
  purchase(itemId: string): PurchaseResult;
  /** 获取已解锁物品列表 */
  getUnlockedItems(): string[];
}

/**
 * 创建 Shop Service
 * @param economyStore Economy Store 实例
 * @returns Shop Service 实例
 *
 * @requirements 3.3 - 购买升级，扣除成本并解锁新功能
 * @requirements 3.4 - 资金不足时显示错误并阻止交易
 */
export function createShopService(
  economyStore: () => EconomyStore
): IShopService {
  return {
    /**
     * 获取所有商店物品
     */
    getShopItems(): ShopItem[] {
      return [...allShopItems];
    },

    /**
     * 根据类别获取商店物品
     */
    getShopItemsByCategory(category: ShopItemCategory): ShopItem[] {
      return getShopItemsByCategory(category);
    },

    /**
     * 获取单个商店物品
     */
    getShopItem(itemId: string): ShopItem | undefined {
      return getShopItemById(itemId);
    },

    /**
     * 检查是否能负担某物品
     * @param itemId 物品ID
     * @returns 是否能负担
     */
    canAfford(itemId: string): boolean {
      const item = getShopItemById(itemId);
      if (!item) {
        return false;
      }
      return economyStore().hasEnoughFunds(item.price);
    },

    /**
     * 检查物品是否已拥有
     * @param itemId 物品ID
     * @returns 是否已拥有
     */
    isOwned(itemId: string): boolean {
      return economyStore().isItemUnlocked(itemId);
    },

    /**
     * 购买物品
     * @param itemId 物品ID
     * @returns 购买结果
     *
     * @requirements 3.3 - 购买升级，扣除成本并解锁新功能
     * @requirements 3.4 - 资金不足时显示错误并阻止交易
     */
    purchase(itemId: string): PurchaseResult {
      // 1. 检查物品是否存在
      const item = getShopItemById(itemId);
      if (!item) {
        return {
          success: false,
          error: purchaseErrorMessages[PurchaseErrorType.ITEM_NOT_FOUND],
        };
      }

      // 2. 检查是否已拥有
      if (economyStore().isItemUnlocked(itemId)) {
        return {
          success: false,
          error: purchaseErrorMessages[PurchaseErrorType.ALREADY_OWNED],
        };
      }

      // 3. 检查资金是否足够
      // @requirements 3.4 - 资金不足时显示错误并阻止交易
      if (!economyStore().hasEnoughFunds(item.price)) {
        return {
          success: false,
          error: purchaseErrorMessages[PurchaseErrorType.INSUFFICIENT_FUNDS],
        };
      }

      // 4. 扣除资金
      // @requirements 3.3 - 扣除成本
      const deductSuccess = economyStore().deductFunds(
        item.price,
        `购买: ${item.name}`
      );

      if (!deductSuccess) {
        return {
          success: false,
          error: purchaseErrorMessages[PurchaseErrorType.INSUFFICIENT_FUNDS],
        };
      }

      // 5. 解锁物品
      // @requirements 3.3 - 解锁新功能
      economyStore().addUnlockedItem(itemId);

      // 6. 解锁物品关联的内容
      for (const unlockId of item.unlocks) {
        economyStore().addUnlockedItem(unlockId);
      }

      // 7. 添加购买记录
      const purchaseRecord: PurchaseRecord = {
        itemId,
        timestamp: Date.now(),
        price: item.price,
      };
      economyStore().addPurchaseRecord(purchaseRecord);

      // 8. 返回成功结果
      return {
        success: true,
        newBalance: economyStore().getWallet().balance,
      };
    },

    /**
     * 获取已解锁物品列表
     */
    getUnlockedItems(): string[] {
      return economyStore().unlockedItems;
    },
  };
}

/**
 * 验证购买前置条件
 * 纯函数，用于测试和验证
 *
 * @param itemId 物品ID
 * @param balance 当前余额
 * @param unlockedItems 已解锁物品列表
 * @returns 验证结果
 */
export function validatePurchase(
  itemId: string,
  balance: number,
  unlockedItems: string[]
): { valid: boolean; error?: PurchaseErrorType } {
  // 检查物品是否存在
  const item = getShopItemById(itemId);
  if (!item) {
    return { valid: false, error: PurchaseErrorType.ITEM_NOT_FOUND };
  }

  // 检查是否已拥有
  if (unlockedItems.includes(itemId)) {
    return { valid: false, error: PurchaseErrorType.ALREADY_OWNED };
  }

  // 检查资金是否足够
  if (balance < item.price) {
    return { valid: false, error: PurchaseErrorType.INSUFFICIENT_FUNDS };
  }

  return { valid: true };
}

/**
 * 计算购买后的余额
 * 纯函数，用于测试
 *
 * @param itemId 物品ID
 * @param currentBalance 当前余额
 * @returns 购买后余额，如果购买无效返回 null
 */
export function calculateBalanceAfterPurchase(
  itemId: string,
  currentBalance: number
): number | null {
  const item = getShopItemById(itemId);
  if (!item) {
    return null;
  }
  if (currentBalance < item.price) {
    return null;
  }
  return currentBalance - item.price;
}
