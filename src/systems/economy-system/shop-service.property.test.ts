/**
 * Shop Service Property Tests
 * 商店服务属性测试
 *
 * @description 使用 fast-check 进行属性测试，验证购买交易的不变量
 * @requirements 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createEconomyStore } from './economy-store';
import { createShopService } from './shop-service';
import { allShopItems, getShopItemById } from './shop-items';

/**
 * Feature: web3-learning-game, Property 5: Purchase Transaction Invariants
 *
 * **Validates: Requirements 3.3, 3.4**
 *
 * *For any* purchase attempt, the wallet balance after the transaction SHALL equal
 * the balance before minus the item cost (if successful) or remain unchanged (if failed),
 * and purchased items SHALL be added to unlocked items exactly once.
 */
describe('Shop Service Property Tests', () => {
  // Arbitrary for generating valid shop item IDs
  const shopItemIdArb = fc.constantFrom(...allShopItems.map((item) => item.id));

  // Arbitrary for generating initial balance (positive integers)
  const balanceArb = fc.integer({ min: 0, max: 100000 });

  // Arbitrary for generating a list of pre-owned item IDs (subset of all items)
  const preOwnedItemsArb = fc.subarray(allShopItems.map((item) => item.id), {
    minLength: 0,
    maxLength: allShopItems.length,
  });

  /**
   * Property 5: Purchase Transaction Invariants
   *
   * For any purchase attempt:
   * - If successful: balance = balanceBefore - itemPrice, item added to unlocked exactly once
   * - If failed: balance unchanged, unlocked items unchanged
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('Property 5: Purchase transaction maintains balance invariants', () => {
    fc.assert(
      fc.property(
        shopItemIdArb,
        balanceArb,
        preOwnedItemsArb,
        (itemId, initialBalance, preOwnedItems) => {
          // Setup: Create fresh store for this iteration
          const store = createEconomyStore();
          const service = createShopService(() => store.getState());

          // Set initial balance
          if (initialBalance > 0) {
            store.getState().addFunds(initialBalance, 'Test setup');
          }

          // Add pre-owned items
          for (const ownedId of preOwnedItems) {
            store.getState().addUnlockedItem(ownedId);
          }

          // Capture state before purchase
          const balanceBefore = store.getState().wallet.balance;
          const unlockedBefore = [...store.getState().unlockedItems];

          // Get item details
          const item = getShopItemById(itemId);
          expect(item).toBeDefined();

          // Attempt purchase
          const result = service.purchase(itemId);

          // Get state after purchase
          const balanceAfter = store.getState().wallet.balance;
          const unlockedAfter = store.getState().unlockedItems;

          if (result.success) {
            // Successful purchase invariants
            // 1. Balance should decrease by exactly the item price
            expect(balanceAfter).toBe(balanceBefore - item!.price);

            // 2. Item should be in unlocked items
            expect(unlockedAfter).toContain(itemId);

            // 3. Item should be added exactly once (count should increase by 1 for the item itself)
            // Note: The item's unlocks array may add additional items
            const itemUnlocks = item!.unlocks;
            const expectedNewItems = 1 + itemUnlocks.filter(
              (unlockId) => !unlockedBefore.includes(unlockId)
            ).length;

            // Count how many new items were actually added
            const newItemsAdded = unlockedAfter.filter(
              (id) => !unlockedBefore.includes(id)
            ).length;

            expect(newItemsAdded).toBe(expectedNewItems);

            // 4. newBalance in result should match actual balance
            expect(result.newBalance).toBe(balanceAfter);
          } else {
            // Failed purchase invariants
            // 1. Balance should remain unchanged
            expect(balanceAfter).toBe(balanceBefore);

            // 2. Unlocked items should remain unchanged
            expect(unlockedAfter).toEqual(unlockedBefore);

            // 3. Error message should be present
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5a: Successful purchase requires sufficient funds
   *
   * A purchase can only succeed if the balance >= item price AND item is not already owned.
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('Property 5a: Successful purchase requires sufficient funds and item not owned', () => {
    fc.assert(
      fc.property(
        shopItemIdArb,
        balanceArb,
        preOwnedItemsArb,
        (itemId, initialBalance, preOwnedItems) => {
          // Setup
          const store = createEconomyStore();
          const service = createShopService(() => store.getState());

          if (initialBalance > 0) {
            store.getState().addFunds(initialBalance, 'Test setup');
          }

          for (const ownedId of preOwnedItems) {
            store.getState().addUnlockedItem(ownedId);
          }

          const item = getShopItemById(itemId);
          expect(item).toBeDefined();

          const balanceBefore = store.getState().wallet.balance;
          const isAlreadyOwned = preOwnedItems.includes(itemId);

          // Attempt purchase
          const result = service.purchase(itemId);

          // Verify: success only if sufficient funds AND not already owned
          if (result.success) {
            expect(balanceBefore).toBeGreaterThanOrEqual(item!.price);
            expect(isAlreadyOwned).toBe(false);
          }

          // Verify: failure if insufficient funds OR already owned
          if (balanceBefore < item!.price || isAlreadyOwned) {
            expect(result.success).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: Purchase is idempotent for owned items
   *
   * Attempting to purchase an already-owned item should always fail
   * and leave the state unchanged.
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('Property 5b: Purchasing already-owned item fails without state change', () => {
    fc.assert(
      fc.property(
        shopItemIdArb,
        balanceArb,
        (itemId, initialBalance) => {
          // Setup
          const store = createEconomyStore();
          const service = createShopService(() => store.getState());

          // Give enough balance to afford any item
          const maxPrice = Math.max(...allShopItems.map((i) => i.price));
          store.getState().addFunds(maxPrice + initialBalance, 'Test setup');

          // Pre-own the item
          store.getState().addUnlockedItem(itemId);

          // Capture state before
          const balanceBefore = store.getState().wallet.balance;
          const unlockedBefore = [...store.getState().unlockedItems];

          // Attempt to purchase already-owned item
          const result = service.purchase(itemId);

          // Should fail
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // State should be unchanged
          expect(store.getState().wallet.balance).toBe(balanceBefore);
          expect(store.getState().unlockedItems).toEqual(unlockedBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5c: Insufficient funds always prevents purchase
   *
   * If balance < item price, purchase must fail and state must remain unchanged.
   *
   * **Validates: Requirements 3.4**
   */
  it('Property 5c: Insufficient funds prevents purchase', () => {
    fc.assert(
      fc.property(shopItemIdArb, (itemId) => {
        // Setup
        const store = createEconomyStore();
        const service = createShopService(() => store.getState());

        const item = getShopItemById(itemId);
        expect(item).toBeDefined();

        // Set balance to less than item price (but >= 0)
        const insufficientBalance = Math.max(0, item!.price - 1);
        if (insufficientBalance > 0) {
          store.getState().addFunds(insufficientBalance, 'Test setup');
        }

        // Capture state before
        const balanceBefore = store.getState().wallet.balance;
        const unlockedBefore = [...store.getState().unlockedItems];

        // Verify we have insufficient funds
        expect(balanceBefore).toBeLessThan(item!.price);

        // Attempt purchase
        const result = service.purchase(itemId);

        // Should fail
        expect(result.success).toBe(false);
        expect(result.error).toContain('资金不足');

        // State should be unchanged
        expect(store.getState().wallet.balance).toBe(balanceBefore);
        expect(store.getState().unlockedItems).toEqual(unlockedBefore);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5d: Total spent tracking is consistent
   *
   * After a successful purchase, totalSpent should increase by exactly the item price.
   *
   * **Validates: Requirements 3.3**
   */
  it('Property 5d: Successful purchase correctly updates totalSpent', () => {
    fc.assert(
      fc.property(shopItemIdArb, (itemId) => {
        // Setup
        const store = createEconomyStore();
        const service = createShopService(() => store.getState());

        const item = getShopItemById(itemId);
        expect(item).toBeDefined();

        // Give enough balance
        store.getState().addFunds(item!.price + 1000, 'Test setup');

        // Capture state before
        const totalSpentBefore = store.getState().wallet.totalSpent;

        // Attempt purchase
        const result = service.purchase(itemId);

        if (result.success) {
          // totalSpent should increase by item price
          expect(store.getState().wallet.totalSpent).toBe(
            totalSpentBefore + item!.price
          );
        } else {
          // totalSpent should remain unchanged
          expect(store.getState().wallet.totalSpent).toBe(totalSpentBefore);
        }
      }),
      { numRuns: 100 }
    );
  });
});
