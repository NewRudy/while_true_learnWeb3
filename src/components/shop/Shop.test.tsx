/**
 * Shop Component Unit Tests
 * 商店组件单元测试
 *
 * @description 测试商店 UI 组件的渲染和交互
 * @requirements 3.3, 3.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Shop, ShopItemCard, PurchaseError, PurchaseSuccess, CategoryTabs, WalletDisplay } from './Shop';
import { useEconomyStore } from '@/systems/economy-system';
import { allShopItems } from '@/systems/economy-system/shop-items';
import type { ShopItem } from '@/types';

// Mock the economy store
vi.mock('@/systems/economy-system', () => ({
  useEconomyStore: vi.fn(),
}));

const mockUseEconomyStore = useEconomyStore as unknown as ReturnType<typeof vi.fn>;

describe('WalletDisplay', () => {
  it('should display balance', () => {
    render(<WalletDisplay balance={1000} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should format large numbers with commas', () => {
    render(<WalletDisplay balance={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should display zero balance', () => {
    render(<WalletDisplay balance={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('CategoryTabs', () => {
  it('should render all category tabs', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryTabs activeCategory="all" onCategoryChange={onCategoryChange} />);
    
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('模块')).toBeInTheDocument();
    expect(screen.getByText('工具')).toBeInTheDocument();
    expect(screen.getByText('装饰')).toBeInTheDocument();
  });

  it('should call onCategoryChange when tab is clicked', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryTabs activeCategory="all" onCategoryChange={onCategoryChange} />);
    
    fireEvent.click(screen.getByText('模块'));
    expect(onCategoryChange).toHaveBeenCalledWith('module');
  });

  it('should highlight active category', () => {
    const onCategoryChange = vi.fn();
    render(<CategoryTabs activeCategory="module" onCategoryChange={onCategoryChange} />);
    
    const moduleTab = screen.getByTestId('category-tab-module');
    expect(moduleTab).toHaveClass('bg-blue-600');
  });
});

describe('PurchaseError', () => {
  it('should display error message', () => {
    const onClose = vi.fn();
    render(<PurchaseError message="资金不足" onClose={onClose} />);
    
    expect(screen.getByText('资金不足')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PurchaseError message="资金不足" onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('PurchaseSuccess', () => {
  it('should display success message with item name', () => {
    const onClose = vi.fn();
    render(<PurchaseSuccess itemName="代币交换模块" onClose={onClose} />);
    
    expect(screen.getByText('成功购买: 代币交换模块')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PurchaseSuccess itemName="代币交换模块" onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ShopItemCard', () => {
  const mockItem: ShopItem = {
    id: 'test_item',
    name: '测试物品',
    description: '这是一个测试物品',
    price: 100,
    category: 'module',
    unlocks: ['test_unlock'],
  };

  it('should display item information', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('测试物品')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试物品')).toBeInTheDocument();
    expect(screen.getByText('💰 100')).toBeInTheDocument();
    expect(screen.getByText('模块')).toBeInTheDocument();
  });

  it('should show "购买" button when can afford and not owned', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('购买')).toBeInTheDocument();
  });

  it('should show "已拥有" when item is owned', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={true}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('已拥有')).toBeInTheDocument();
  });

  /**
   * @requirements 3.4 - 资金不足时显示错误
   */
  it('should show "资金不足" when cannot afford', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={false}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('资金不足')).toBeInTheDocument();
  });

  it('should show "购买中..." when purchasing', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={true}
      />
    );
    
    expect(screen.getByText('购买中...')).toBeInTheDocument();
  });

  it('should call onPurchase when purchase button is clicked', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    fireEvent.click(screen.getByText('购买'));
    expect(onPurchase).toHaveBeenCalledWith('test_item');
  });

  it('should not call onPurchase when item is owned', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={true}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    fireEvent.click(screen.getByText('已拥有'));
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('should not call onPurchase when cannot afford', () => {
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={mockItem}
        isOwned={false}
        canAfford={false}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    fireEvent.click(screen.getByText('资金不足'));
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('should display correct category label for tool', () => {
    const toolItem: ShopItem = { ...mockItem, category: 'tool' };
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={toolItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('工具')).toBeInTheDocument();
  });

  it('should display correct category label for cosmetic', () => {
    const cosmeticItem: ShopItem = { ...mockItem, category: 'cosmetic' };
    const onPurchase = vi.fn();
    render(
      <ShopItemCard
        item={cosmeticItem}
        isOwned={false}
        canAfford={true}
        onPurchase={onPurchase}
        isPurchasing={false}
      />
    );
    
    expect(screen.getByText('装饰')).toBeInTheDocument();
  });
});

describe('Shop', () => {
  const mockWallet = { balance: 1000, totalEarned: 1000, totalSpent: 0 };
  const mockUnlockedItems: string[] = [];

  beforeEach(() => {
    // Reset mock
    mockUseEconomyStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        wallet: mockWallet,
        unlockedItems: mockUnlockedItems,
      };
      return selector(state);
    });

    // Mock getState for shop service
    (mockUseEconomyStore as unknown as { getState: () => unknown }).getState = () => ({
      wallet: mockWallet,
      unlockedItems: mockUnlockedItems,
      hasEnoughFunds: (amount: number) => mockWallet.balance >= amount,
      isItemUnlocked: (itemId: string) => mockUnlockedItems.includes(itemId),
      deductFunds: vi.fn().mockReturnValue(true),
      addUnlockedItem: vi.fn(),
      addPurchaseRecord: vi.fn(),
      getWallet: () => mockWallet,
    });
  });

  it('should render shop container', () => {
    render(<Shop />);
    expect(screen.getByTestId('shop-container')).toBeInTheDocument();
  });

  it('should display shop title', () => {
    render(<Shop />);
    expect(screen.getByText('🏪 商店')).toBeInTheDocument();
  });

  it('should display wallet balance', () => {
    render(<Shop />);
    expect(screen.getByTestId('wallet-display')).toBeInTheDocument();
  });

  it('should display category tabs', () => {
    render(<Shop />);
    expect(screen.getByTestId('category-tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-module')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-tool')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-cosmetic')).toBeInTheDocument();
  });

  it('should display shop items', () => {
    render(<Shop />);
    // Check that at least one item is displayed
    const firstItem = allShopItems[0];
    if (!firstItem) {
      throw new Error('No shop items defined');
    }
    expect(screen.getByTestId(`shop-item-${firstItem.id}`)).toBeInTheDocument();
  });

  it('should filter items by category when tab is clicked', async () => {
    render(<Shop />);
    
    // Click on module tab
    fireEvent.click(screen.getByTestId('category-tab-module'));
    
    // Wait for re-render
    await waitFor(() => {
      // Module items should be visible
      const moduleItem = allShopItems.find(item => item.category === 'module');
      if (moduleItem) {
        expect(screen.getByTestId(`shop-item-${moduleItem.id}`)).toBeInTheDocument();
      }
      
      // Tool items should not be visible
      const toolItem = allShopItems.find(item => item.category === 'tool');
      if (toolItem) {
        expect(screen.queryByTestId(`shop-item-${toolItem.id}`)).not.toBeInTheDocument();
      }
    });
  });
});
