/**
 * Shop Component
 * 商店 UI 组件
 *
 * @description 显示商店物品列表，支持购买和解锁功能
 * @requirements 3.3, 3.4
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ShopItem, ShopItemCategory, PurchaseResult } from '@/types';
import { useEconomyStore } from '@/systems/economy-system';
import { createShopService, IShopService } from '@/systems/economy-system/shop-service';

/**
 * 商店物品卡片属性
 */
interface ShopItemCardProps {
  /** 商店物品 */
  item: ShopItem;
  /** 是否已拥有 */
  isOwned: boolean;
  /** 是否能负担 */
  canAfford: boolean;
  /** 购买回调 */
  onPurchase: (itemId: string) => void;
  /** 是否正在购买中 */
  isPurchasing: boolean;
}

/**
 * 商店物品卡片组件
 */
export const ShopItemCard: React.FC<ShopItemCardProps> = ({
  item,
  isOwned,
  canAfford,
  onPurchase,
  isPurchasing,
}) => {
  const handleClick = useCallback(() => {
    if (!isOwned && canAfford && !isPurchasing) {
      onPurchase(item.id);
    }
  }, [item.id, isOwned, canAfford, isPurchasing, onPurchase]);

  // 确定按钮状态和文本
  const buttonState = useMemo(() => {
    if (isOwned) {
      return { text: '已拥有', disabled: true, className: 'bg-gray-400 cursor-not-allowed' };
    }
    if (!canAfford) {
      return { text: '资金不足', disabled: true, className: 'bg-red-400 cursor-not-allowed' };
    }
    if (isPurchasing) {
      return { text: '购买中...', disabled: true, className: 'bg-blue-400 cursor-wait' };
    }
    return { text: '购买', disabled: false, className: 'bg-blue-600 hover:bg-blue-700 cursor-pointer' };
  }, [isOwned, canAfford, isPurchasing]);

  // 类别标签颜色
  const categoryColors: Record<ShopItemCategory, string> = {
    module: 'bg-purple-100 text-purple-800',
    tool: 'bg-green-100 text-green-800',
    cosmetic: 'bg-pink-100 text-pink-800',
  };

  // 类别中文名称
  const categoryNames: Record<ShopItemCategory, string> = {
    module: '模块',
    tool: '工具',
    cosmetic: '装饰',
  };

  return (
    <div
      className={`
        border rounded-lg p-4 shadow-sm transition-all duration-200
        ${isOwned ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-md'}
      `}
      data-testid={`shop-item-${item.id}`}
    >
      {/* 头部：名称和类别 */}
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold text-lg ${isOwned ? 'text-gray-500' : 'text-gray-800'}`}>
          {item.name}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[item.category]}`}>
          {categoryNames[item.category]}
        </span>
      </div>

      {/* 描述 */}
      <p className={`text-sm mb-3 ${isOwned ? 'text-gray-400' : 'text-gray-600'}`}>
        {item.description}
      </p>

      {/* 底部：价格和购买按钮 */}
      <div className="flex justify-between items-center">
        <span className={`font-bold ${isOwned ? 'text-gray-400' : canAfford ? 'text-green-600' : 'text-red-500'}`}>
          💰 {item.price}
        </span>
        <button
          onClick={handleClick}
          disabled={buttonState.disabled}
          className={`
            px-4 py-2 rounded-md text-white font-medium text-sm
            transition-colors duration-200
            ${buttonState.className}
          `}
          data-testid={`purchase-btn-${item.id}`}
        >
          {buttonState.text}
        </button>
      </div>
    </div>
  );
};

/**
 * 购买错误提示属性
 */
interface PurchaseErrorProps {
  /** 错误消息 */
  message: string;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 购买错误提示组件
 * @requirements 3.4 - 资金不足时显示错误
 */
export const PurchaseError: React.FC<PurchaseErrorProps> = ({ message, onClose }) => {
  return (
    <div
      className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
      role="alert"
      data-testid="purchase-error"
    >
      <span className="text-xl">⚠️</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-red-700 hover:text-red-900 font-bold"
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
};

/**
 * 购买成功提示属性
 */
interface PurchaseSuccessProps {
  /** 物品名称 */
  itemName: string;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 购买成功提示组件
 */
export const PurchaseSuccess: React.FC<PurchaseSuccessProps> = ({ itemName, onClose }) => {
  return (
    <div
      className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
      role="alert"
      data-testid="purchase-success"
    >
      <span className="text-xl">✅</span>
      <span>成功购买: {itemName}</span>
      <button
        onClick={onClose}
        className="ml-2 text-green-700 hover:text-green-900 font-bold"
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
};

/**
 * 类别筛选标签属性
 */
interface CategoryTabsProps {
  /** 当前选中的类别 */
  activeCategory: ShopItemCategory | 'all';
  /** 类别变更回调 */
  onCategoryChange: (category: ShopItemCategory | 'all') => void;
}

/**
 * 类别筛选标签组件
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  const categories: Array<{ key: ShopItemCategory | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'module', label: '模块' },
    { key: 'tool', label: '工具' },
    { key: 'cosmetic', label: '装饰' },
  ];

  return (
    <div className="flex gap-2 mb-4" role="tablist">
      {categories.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key)}
          className={`
            px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200
            ${activeCategory === key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          role="tab"
          aria-selected={activeCategory === key}
          data-testid={`category-tab-${key}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

/**
 * 钱包余额显示属性
 */
interface WalletDisplayProps {
  /** 当前余额 */
  balance: number;
}

/**
 * 钱包余额显示组件
 */
export const WalletDisplay: React.FC<WalletDisplayProps> = ({ balance }) => {
  return (
    <div
      className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
      data-testid="wallet-display"
    >
      <span className="text-xl">💰</span>
      <span className="font-bold text-lg">{balance.toLocaleString()}</span>
    </div>
  );
};

/**
 * 商店组件属性
 */
export interface ShopProps {
  /** 可选的自定义商店服务（用于测试） */
  shopService?: IShopService;
}

/**
 * 商店主组件
 *
 * @requirements 3.3 - 购买升级，扣除成本并解锁新功能
 * @requirements 3.4 - 资金不足时显示错误并阻止交易
 */
export const Shop: React.FC<ShopProps> = ({ shopService: customShopService }) => {
  // 状态
  const [activeCategory, setActiveCategory] = useState<ShopItemCategory | 'all'>('all');
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<string | null>(null);

  // 获取 economy store
  const wallet = useEconomyStore((state) => state.wallet);
  const unlockedItems = useEconomyStore((state) => state.unlockedItems);

  // 创建或使用提供的商店服务
  const shopService = useMemo(() => {
    return customShopService || createShopService(() => useEconomyStore.getState());
  }, [customShopService]);

  // 获取商店物品
  const shopItems = useMemo(() => {
    const items = shopService.getShopItems();
    if (activeCategory === 'all') {
      return items;
    }
    return items.filter((item) => item.category === activeCategory);
  }, [shopService, activeCategory]);

  // 处理购买
  const handlePurchase = useCallback(
    (itemId: string) => {
      setPurchasingItemId(itemId);
      setError(null);
      setSuccessItem(null);

      // 模拟短暂延迟以显示购买中状态
      setTimeout(() => {
        const result: PurchaseResult = shopService.purchase(itemId);

        if (result.success) {
          const item = shopService.getShopItem(itemId);
          setSuccessItem(item?.name || itemId);
        } else {
          // @requirements 3.4 - 显示错误
          setError(result.error || '购买失败');
        }

        setPurchasingItemId(null);
      }, 300);
    },
    [shopService]
  );

  // 关闭错误提示
  const handleCloseError = useCallback(() => {
    setError(null);
  }, []);

  // 关闭成功提示
  const handleCloseSuccess = useCallback(() => {
    setSuccessItem(null);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="shop-container">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏪 商店</h1>
        <WalletDisplay balance={wallet.balance} />
      </div>

      {/* 类别筛选 */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* 物品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shopItems.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            isOwned={unlockedItems.includes(item.id)}
            canAfford={wallet.balance >= item.price}
            onPurchase={handlePurchase}
            isPurchasing={purchasingItemId === item.id}
          />
        ))}
      </div>

      {/* 空状态 */}
      {shopItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">该类别暂无物品</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && <PurchaseError message={error} onClose={handleCloseError} />}

      {/* 成功提示 */}
      {successItem && (
        <PurchaseSuccess itemName={successItem} onClose={handleCloseSuccess} />
      )}
    </div>
  );
};

export default Shop;
