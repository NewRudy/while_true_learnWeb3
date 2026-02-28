/**
 * Economy System Exports
 * 经济系统导出
 *
 * @description 导出经济系统相关模块
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

// Economy Store
export {
  useEconomyStore,
  createEconomyStore,
  getInitialEconomyState,
  setupEconomyPersistence,
  initializeEconomySystem,
  type EconomyStore,
  type EconomyStoreState,
  type EconomyStoreActions,
  type FundsTransaction,
} from './economy-store';

// Economy Persistence
export {
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
  type PersistedEconomyState,
  type LoadResult as EconomyLoadResult,
} from './economy-persistence';

// Shop Items
export {
  allShopItems,
  moduleShopItems,
  toolShopItems,
  cosmeticShopItems,
  getShopItemById,
  getShopItemsByCategory,
  getItemPrice,
} from './shop-items';

// Shop Service
export {
  createShopService,
  validatePurchase,
  calculateBalanceAfterPurchase,
  PurchaseErrorType,
  purchaseErrorMessages,
  type IShopService,
} from './shop-service';
