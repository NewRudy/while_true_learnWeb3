/**
 * Strategy Serialization Tests
 * 策略序列化工具函数测试
 *
 * @description 测试策略序列化、反序列化和 localStorage 持久化功能
 * @requirements 1.6, 2.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeStrategy,
  deserializeStrategy,
  saveStrategyToStorage,
  loadStrategyFromStorage,
  deleteStrategyFromStorage,
  getSavedStrategies,
  clearAllStrategies,
  isValidStrategyConfig,
  isStorageAvailable,
} from './strategy-serialization';
import { StrategyConfig } from '@/types/strategy';
import { ModuleType } from '@/types/module';

/**
 * 创建测试用的策略配置
 */
function createTestStrategy(overrides?: Partial<StrategyConfig>): StrategyConfig {
  return {
    id: 'test-strategy-1',
    name: '测试策略',
    nodes: [
      {
        id: 'node-1',
        type: ModuleType.BUY,
        position: { x: 100, y: 100 },
        data: {
          moduleType: ModuleType.BUY,
          params: { amount: 100, token: 'ETH' },
        },
      },
      {
        id: 'node-2',
        type: ModuleType.SELL,
        position: { x: 300, y: 100 },
        data: {
          moduleType: ModuleType.SELL,
          params: { amount: 50, token: 'ETH' },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'fund-out',
        targetHandle: 'fund-in',
      },
    ],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

describe('serializeStrategy', () => {
  it('should serialize a strategy config to JSON string', () => {
    const strategy = createTestStrategy();
    const serialized = serializeStrategy(strategy);

    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.timestamp).toBeTypeOf('number');
    expect(parsed.data).toEqual(strategy);
  });

  it('should serialize an empty strategy', () => {
    const strategy = createTestStrategy({
      nodes: [],
      edges: [],
    });
    const serialized = serializeStrategy(strategy);
    const parsed = JSON.parse(serialized);

    expect(parsed.data.nodes).toEqual([]);
    expect(parsed.data.edges).toEqual([]);
  });
});

describe('deserializeStrategy', () => {
  it('should deserialize a valid JSON string to strategy config', () => {
    const strategy = createTestStrategy();
    const serialized = serializeStrategy(strategy);
    const deserialized = deserializeStrategy(serialized);

    expect(deserialized).toEqual(strategy);
  });

  it('should return null for invalid JSON', () => {
    const result = deserializeStrategy('invalid json');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = deserializeStrategy('');
    expect(result).toBeNull();
  });

  it('should return null for invalid strategy config', () => {
    const invalidConfig = JSON.stringify({
      version: '1.0.0',
      timestamp: Date.now(),
      data: { invalid: 'data' },
    });
    const result = deserializeStrategy(invalidConfig);
    expect(result).toBeNull();
  });

  it('should handle legacy format (direct StrategyConfig)', () => {
    const strategy = createTestStrategy();
    const legacyFormat = JSON.stringify(strategy);
    const deserialized = deserializeStrategy(legacyFormat);

    expect(deserialized).toEqual(strategy);
  });
});

describe('isValidStrategyConfig', () => {
  it('should return true for valid strategy config', () => {
    const strategy = createTestStrategy();
    expect(isValidStrategyConfig(strategy)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidStrategyConfig(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidStrategyConfig(undefined)).toBe(false);
  });

  it('should return false for missing id', () => {
    const strategy = createTestStrategy();
    const { id: _id, ...withoutId } = strategy;
    expect(isValidStrategyConfig(withoutId)).toBe(false);
  });

  it('should return false for invalid node', () => {
    const strategy = createTestStrategy();
    (strategy.nodes as unknown[]).push({ invalid: 'node' });
    expect(isValidStrategyConfig(strategy)).toBe(false);
  });

  it('should return false for invalid edge', () => {
    const strategy = createTestStrategy();
    (strategy.edges as unknown[]).push({ invalid: 'edge' });
    expect(isValidStrategyConfig(strategy)).toBe(false);
  });

  it('should return false for invalid module type in node', () => {
    const strategy = {
      ...createTestStrategy(),
      nodes: [
        {
          id: 'node-1',
          type: 'invalid_type',
          position: { x: 100, y: 100 },
          data: { moduleType: 'invalid_type', params: {} },
        },
      ],
    };
    expect(isValidStrategyConfig(strategy)).toBe(false);
  });
});

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveStrategyToStorage', () => {
    it('should save a strategy to localStorage', () => {
      const strategy = createTestStrategy();
      const result = saveStrategyToStorage(strategy);

      expect(result).toBe(true);

      const saved = localStorage.getItem('chainquest_strategy_test-strategy-1');
      expect(saved).not.toBeNull();
    });

    it('should update strategy list when saving', () => {
      const strategy = createTestStrategy();
      saveStrategyToStorage(strategy);

      const list = getSavedStrategies();
      expect(list).toHaveLength(1);
      const [firstItem] = list;
      if (!firstItem) {
        throw new Error('Expected saved strategy');
      }
      expect(firstItem.id).toBe('test-strategy-1');
      expect(firstItem.name).toBe('测试策略');
    });
  });

  describe('loadStrategyFromStorage', () => {
    it('should load a saved strategy from localStorage', () => {
      const strategy = createTestStrategy();
      saveStrategyToStorage(strategy);

      const loaded = loadStrategyFromStorage('test-strategy-1');
      expect(loaded).toEqual(strategy);
    });

    it('should return null for non-existent strategy', () => {
      const loaded = loadStrategyFromStorage('non-existent');
      expect(loaded).toBeNull();
    });
  });

  describe('deleteStrategyFromStorage', () => {
    it('should delete a strategy from localStorage', () => {
      const strategy = createTestStrategy();
      saveStrategyToStorage(strategy);

      const result = deleteStrategyFromStorage('test-strategy-1');
      expect(result).toBe(true);

      const loaded = loadStrategyFromStorage('test-strategy-1');
      expect(loaded).toBeNull();
    });

    it('should remove strategy from list when deleting', () => {
      const strategy = createTestStrategy();
      saveStrategyToStorage(strategy);
      deleteStrategyFromStorage('test-strategy-1');

      const list = getSavedStrategies();
      expect(list).toHaveLength(0);
    });
  });

  describe('getSavedStrategies', () => {
    it('should return empty array when no strategies saved', () => {
      const list = getSavedStrategies();
      expect(list).toEqual([]);
    });

    it('should return all saved strategies sorted by updatedAt', () => {
      const strategy1 = createTestStrategy({
        id: 'strategy-1',
        name: '策略1',
        updatedAt: 1700000000000,
      });
      const strategy2 = createTestStrategy({
        id: 'strategy-2',
        name: '策略2',
        updatedAt: 1700000001000,
      });

      saveStrategyToStorage(strategy1);
      saveStrategyToStorage(strategy2);

      const list = getSavedStrategies();
      expect(list).toHaveLength(2);
      const [firstItem, secondItem] = list;
      if (!firstItem || !secondItem) {
        throw new Error('Expected two saved strategies');
      }
      expect(firstItem.id).toBe('strategy-2'); // More recent first
      expect(secondItem.id).toBe('strategy-1');
    });
  });

  describe('clearAllStrategies', () => {
    it('should clear all saved strategies', () => {
      const strategy1 = createTestStrategy({ id: 'strategy-1' });
      const strategy2 = createTestStrategy({ id: 'strategy-2' });

      saveStrategyToStorage(strategy1);
      saveStrategyToStorage(strategy2);

      const result = clearAllStrategies();
      expect(result).toBe(true);

      const list = getSavedStrategies();
      expect(list).toHaveLength(0);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });
});

describe('round-trip serialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should preserve strategy data through serialize/deserialize cycle', () => {
    const original = createTestStrategy();
    const serialized = serializeStrategy(original);
    const deserialized = deserializeStrategy(serialized);

    expect(deserialized).toEqual(original);
  });

  it('should preserve strategy data through save/load cycle', () => {
    const original = createTestStrategy();
    saveStrategyToStorage(original);
    const loaded = loadStrategyFromStorage(original.id);

    expect(loaded).toEqual(original);
  });

  it('should preserve complex nested params', () => {
    const strategy = createTestStrategy({
      nodes: [
        {
          id: 'node-1',
          type: ModuleType.CONDITION,
          position: { x: 100, y: 100 },
          data: {
            moduleType: ModuleType.CONDITION,
            params: {
              condition: 'price > 100',
              threshold: 100.5,
              enabled: true,
            },
          },
        },
      ],
    });

    const serialized = serializeStrategy(strategy);
    const deserialized = deserializeStrategy(serialized);

    expect(deserialized).toEqual(strategy);
    if (!deserialized) {
      throw new Error('Expected deserialized strategy');
    }
    const [firstNode] = deserialized.nodes;
    if (!firstNode) {
      throw new Error('Expected node in deserialized strategy');
    }
    expect(firstNode.data.params).toEqual({
      condition: 'price > 100',
      threshold: 100.5,
      enabled: true,
    });
  });
});
