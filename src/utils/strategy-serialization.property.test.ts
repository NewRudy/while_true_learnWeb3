/**
 * Strategy Serialization Property Tests
 * 策略序列化属性测试
 *
 * Feature: web3-learning-game, Property 1: Strategy Configuration Round-Trip
 * **Validates: Requirements 2.6, 2.7**
 *
 * @description 验证策略配置序列化和反序列化的往返属性
 *
 * Property 1: Strategy Configuration Round-Trip
 * For any valid StrategyConfig object, serializing it to JSON and then deserializing
 * it back SHALL produce an object that is deeply equal to the original.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serializeStrategy,
  deserializeStrategy,
  isValidStrategyConfig,
} from './strategy-serialization';
import { StrategyConfig, StrategyNode, StrategyEdge, Position } from '@/types/strategy';
import { ModuleType, ModuleConfig, ModuleParamValue } from '@/types/module';

const requireItem = <T,>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
};

/**
 * Arbitrary for generating valid ModuleType values
 * 生成有效的模块类型
 */
const moduleTypeArb: fc.Arbitrary<ModuleType> = fc.constantFrom(
  ModuleType.BUY,
  ModuleType.SELL,
  ModuleType.TRANSFER,
  ModuleType.HOLD,
  ModuleType.CONDITION,
  ModuleType.SWAP,
  ModuleType.LIQUIDITY_ADD,
  ModuleType.LIQUIDITY_REMOVE,
  ModuleType.STAKE,
  ModuleType.UNSTAKE,
  ModuleType.STOP_LOSS,
  ModuleType.TAKE_PROFIT,
  ModuleType.POSITION_SIZE
);

/**
 * Normalize a number to handle -0 vs +0 edge case
 * JSON.stringify converts -0 to 0, so we need to normalize for comparison
 * 处理 -0 和 +0 的边界情况
 */
function normalizeNumber(n: number): number {
  return Object.is(n, -0) ? 0 : n;
}

/**
 * Arbitrary for generating valid Position objects
 * Uses integer values to avoid floating point precision issues
 * 生成有效的位置坐标
 */
const positionArb: fc.Arbitrary<Position> = fc.record({
  x: fc.double({ min: -10000, max: 10000, noNaN: true }).map(normalizeNumber),
  y: fc.double({ min: -10000, max: 10000, noNaN: true }).map(normalizeNumber),
});

/**
 * Arbitrary for generating valid ModuleParamValue
 * 生成有效的模块参数值
 */
const moduleParamValueArb: fc.Arbitrary<ModuleParamValue> = fc.oneof(
  fc.double({ min: -1e10, max: 1e10, noNaN: true }).map(normalizeNumber),
  fc.string({ minLength: 0, maxLength: 100 }),
  fc.boolean()
);

/**
 * Arbitrary for generating valid params Record
 * 生成有效的参数记录
 */
const paramsArb: fc.Arbitrary<Record<string, ModuleParamValue>> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  moduleParamValueArb,
  { minKeys: 0, maxKeys: 10 }
);

/**
 * Arbitrary for generating valid ModuleConfig objects
 * 生成有效的模块配置
 */
const moduleConfigArb: fc.Arbitrary<ModuleConfig> = fc.record({
  moduleType: moduleTypeArb,
  params: paramsArb,
});

/**
 * Arbitrary for generating valid node IDs
 * 生成有效的节点ID
 */
const nodeIdArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid StrategyNode objects
 * 生成有效的策略节点
 */
const strategyNodeArb: fc.Arbitrary<StrategyNode> = fc.record({
  id: nodeIdArb,
  type: moduleTypeArb,
  position: positionArb,
  data: moduleConfigArb,
});

/**
 * Arbitrary for generating valid handle IDs
 * 生成有效的连接点ID
 */
const handleIdArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid StrategyEdge objects
 * 生成有效的策略边
 */
const strategyEdgeArb: fc.Arbitrary<StrategyEdge> = fc.record({
  id: nodeIdArb,
  source: nodeIdArb,
  target: nodeIdArb,
  sourceHandle: handleIdArb,
  targetHandle: handleIdArb,
});

/**
 * Arbitrary for generating valid timestamps
 * 生成有效的时间戳
 */
const timestampArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: Date.now() + 1000000000 });

/**
 * Arbitrary for generating valid strategy names
 * 生成有效的策略名称
 */
const strategyNameArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid StrategyConfig objects
 * 生成有效的策略配置
 */
const strategyConfigArb: fc.Arbitrary<StrategyConfig> = fc.record({
  id: nodeIdArb,
  name: strategyNameArb,
  nodes: fc.array(strategyNodeArb, { minLength: 0, maxLength: 20 }),
  edges: fc.array(strategyEdgeArb, { minLength: 0, maxLength: 30 }),
  createdAt: timestampArb,
  updatedAt: timestampArb,
});

/**
 * Deep equality check for StrategyConfig objects
 * 深度比较两个策略配置是否相等
 */
function deepEqualStrategyConfig(a: StrategyConfig, b: StrategyConfig): boolean {
  // Compare basic fields
  if (a.id !== b.id) return false;
  if (a.name !== b.name) return false;
  if (a.createdAt !== b.createdAt) return false;
  if (a.updatedAt !== b.updatedAt) return false;

  // Compare nodes array
  if (a.nodes.length !== b.nodes.length) return false;
  for (let i = 0; i < a.nodes.length; i++) {
    const nodeA = a.nodes[i];
    const nodeB = b.nodes[i];
    if (!nodeA || !nodeB) return false;
    if (nodeA.id !== nodeB.id) return false;
    if (nodeA.type !== nodeB.type) return false;
    if (nodeA.position.x !== nodeB.position.x) return false;
    if (nodeA.position.y !== nodeB.position.y) return false;
    if (nodeA.data.moduleType !== nodeB.data.moduleType) return false;
    // Compare params
    const paramsA = Object.keys(nodeA.data.params).sort();
    const paramsB = Object.keys(nodeB.data.params).sort();
    if (paramsA.length !== paramsB.length) return false;
    for (let j = 0; j < paramsA.length; j++) {
      const keyA = paramsA[j];
      const keyB = paramsB[j];
      if (!keyA || !keyB) return false;
      if (keyA !== keyB) return false;
      if (nodeA.data.params[keyA] !== nodeB.data.params[keyB]) return false;
    }
  }

  // Compare edges array
  if (a.edges.length !== b.edges.length) return false;
  for (let i = 0; i < a.edges.length; i++) {
    const edgeA = a.edges[i];
    const edgeB = b.edges[i];
    if (!edgeA || !edgeB) return false;
    if (edgeA.id !== edgeB.id) return false;
    if (edgeA.source !== edgeB.source) return false;
    if (edgeA.target !== edgeB.target) return false;
    if (edgeA.sourceHandle !== edgeB.sourceHandle) return false;
    if (edgeA.targetHandle !== edgeB.targetHandle) return false;
  }

  return true;
}

describe('Strategy Serialization Property Tests', () => {
  // Feature: web3-learning-game, Property 1: Strategy Configuration Round-Trip
  // **Validates: Requirements 2.6, 2.7**

  describe('Property 1.1: Round-Trip - Serialize then deserialize produces equivalent config', () => {
    it('serializing and deserializing a StrategyConfig should produce an equivalent object', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          // Serialize the config
          const serialized = serializeStrategy(config);

          // Deserialize it back
          const deserialized = deserializeStrategy(serialized);

          // Deserialization should succeed
          expect(deserialized).not.toBeNull();

          // The deserialized config should be deeply equal to the original
          expect(deepEqualStrategyConfig(config, deserialized!)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('round-trip should preserve all node properties', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();

          // Verify each node is preserved
          for (let i = 0; i < config.nodes.length; i++) {
            const originalNode = requireItem(config.nodes[i], 'Expected original node');
            const deserializedNode = requireItem(
              deserialized?.nodes[i],
              'Expected deserialized node'
            );

            expect(deserializedNode.id).toBe(originalNode.id);
            expect(deserializedNode.type).toBe(originalNode.type);
            expect(deserializedNode.position.x).toBe(originalNode.position.x);
            expect(deserializedNode.position.y).toBe(originalNode.position.y);
            expect(deserializedNode.data.moduleType).toBe(originalNode.data.moduleType);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('round-trip should preserve all edge properties', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();

          // Verify each edge is preserved
          for (let i = 0; i < config.edges.length; i++) {
            const originalEdge = requireItem(config.edges[i], 'Expected original edge');
            const deserializedEdge = requireItem(
              deserialized?.edges[i],
              'Expected deserialized edge'
            );

            expect(deserializedEdge.id).toBe(originalEdge.id);
            expect(deserializedEdge.source).toBe(originalEdge.source);
            expect(deserializedEdge.target).toBe(originalEdge.target);
            expect(deserializedEdge.sourceHandle).toBe(originalEdge.sourceHandle);
            expect(deserializedEdge.targetHandle).toBe(originalEdge.targetHandle);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 1.2: Determinism - Same config always serializes to equivalent output', () => {
    it('serializing the same config multiple times should produce parseable results that deserialize to equivalent objects', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          // Serialize multiple times
          const serialized1 = serializeStrategy(config);
          const serialized2 = serializeStrategy(config);

          // Both should deserialize to equivalent objects
          const deserialized1 = deserializeStrategy(serialized1);
          const deserialized2 = deserializeStrategy(serialized2);

          expect(deserialized1).not.toBeNull();
          expect(deserialized2).not.toBeNull();
          expect(deepEqualStrategyConfig(deserialized1!, deserialized2!)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('multiple round-trips should produce equivalent results', () => {
      fc.assert(
        fc.property(strategyConfigArb, fc.integer({ min: 2, max: 5 }), (config, numTrips) => {
          let current = config;

          // Perform multiple round-trips
          for (let i = 0; i < numTrips; i++) {
            const serialized = serializeStrategy(current);
            const deserialized = deserializeStrategy(serialized);
            expect(deserialized).not.toBeNull();
            current = deserialized!;
          }

          // Final result should be equivalent to original
          expect(deepEqualStrategyConfig(config, current)).toBe(true);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 1.3: Data Preservation - All fields are preserved', () => {
    it('all module params should be preserved through serialization', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();

          // Verify all params are preserved for each node
          for (let i = 0; i < config.nodes.length; i++) {
            const originalNode = requireItem(config.nodes[i], 'Expected original node');
            const deserializedNode = requireItem(
              deserialized?.nodes[i],
              'Expected deserialized node'
            );
            const originalParams = originalNode.data.params;
            const deserializedParams = deserializedNode.data.params;

            const originalKeys = Object.keys(originalParams).sort();
            const deserializedKeys = Object.keys(deserializedParams).sort();

            expect(deserializedKeys).toEqual(originalKeys);

            for (const key of originalKeys) {
              expect(deserializedParams[key]).toBe(originalParams[key]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('timestamps should be preserved exactly', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized!.createdAt).toBe(config.createdAt);
          expect(deserialized!.updatedAt).toBe(config.updatedAt);
        }),
        { numRuns: 100 }
      );
    });

    it('strategy id and name should be preserved exactly', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized!.id).toBe(config.id);
          expect(deserialized!.name).toBe(config.name);
        }),
        { numRuns: 100 }
      );
    });

    it('node positions should be preserved with exact precision', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();

          for (let i = 0; i < config.nodes.length; i++) {
            const originalNode = requireItem(config.nodes[i], 'Expected original node');
            const deserializedNode = requireItem(
              deserialized?.nodes[i],
              'Expected deserialized node'
            );
            expect(deserializedNode.position.x).toBe(originalNode.position.x);
            expect(deserializedNode.position.y).toBe(originalNode.position.y);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('array lengths should be preserved', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized!.nodes.length).toBe(config.nodes.length);
          expect(deserialized!.edges.length).toBe(config.edges.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 1.4: Validation Consistency', () => {
    it('generated configs should pass validation', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          expect(isValidStrategyConfig(config)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('deserialized configs should pass validation', () => {
      fc.assert(
        fc.property(strategyConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(isValidStrategyConfig(deserialized)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('empty nodes and edges arrays should be preserved', () => {
      fc.assert(
        fc.property(nodeIdArb, strategyNameArb, timestampArb, timestampArb, (id, name, createdAt, updatedAt) => {
          const config: StrategyConfig = {
            id,
            name,
            nodes: [],
            edges: [],
            createdAt,
            updatedAt,
          };

          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized!.nodes).toEqual([]);
          expect(deserialized!.edges).toEqual([]);
        }),
        { numRuns: 50 }
      );
    });

    it('configs with many nodes should round-trip correctly', () => {
      const manyNodesConfigArb = fc.record({
        id: nodeIdArb,
        name: strategyNameArb,
        nodes: fc.array(strategyNodeArb, { minLength: 10, maxLength: 50 }),
        edges: fc.array(strategyEdgeArb, { minLength: 0, maxLength: 100 }),
        createdAt: timestampArb,
        updatedAt: timestampArb,
      });

      fc.assert(
        fc.property(manyNodesConfigArb, (config) => {
          const serialized = serializeStrategy(config);
          const deserialized = deserializeStrategy(serialized);

          expect(deserialized).not.toBeNull();
          expect(deepEqualStrategyConfig(config, deserialized!)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });
  });
});
