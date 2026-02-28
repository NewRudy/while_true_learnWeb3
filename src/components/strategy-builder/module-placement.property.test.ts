/**
 * Module Placement Property Tests
 * 模块放置属性测试
 *
 * Feature: web3-learning-game, Property 6: Module Placement Correctness
 * **Validates: Requirements 1.2**
 *
 * @description 验证模块放置的正确性属性
 *
 * Property 6: Module Placement Correctness
 * For any module type and position, adding a node to the strategy SHALL create
 * a node with the correct module type, position, and default configuration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import { moduleSystem } from '@/systems';
import { ModuleType, ModuleParamValue } from '@/types';

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
 * Arbitrary for generating valid Position objects
 * Uses reasonable canvas coordinates
 * 生成有效的位置坐标
 */
const positionArb: fc.Arbitrary<{ x: number; y: number }> = fc.record({
  x: fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
  y: fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
});

/**
 * Helper function to check if a node has the correct default configuration
 * 检查节点是否具有正确的默认配置
 */
function hasDefaultConfig(
  nodeParams: Record<string, ModuleParamValue>,
  moduleType: ModuleType
): boolean {
  const moduleDef = moduleSystem.getModuleDefinition(moduleType);
  const defaultParams = moduleDef.defaultParams;

  // Check that all default params are present with correct values
  for (const [key, value] of Object.entries(defaultParams)) {
    if (!(key in nodeParams)) {
      return false;
    }
    if (nodeParams[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Helper function to reset the store state before each test
 * 在每个测试前重置 store 状态
 */
function resetStore(): void {
  const store = useStrategyBuilderStore.getState();
  store.clearStrategy();
}

describe('Module Placement Property Tests', () => {
  // Feature: web3-learning-game, Property 6: Module Placement Correctness
  // **Validates: Requirements 1.2**

  beforeEach(() => {
    resetStore();
  });

  describe('Property 6.1: Node Type Correctness - Node type matches requested module type', () => {
    it('addNode should create a node with the correct module type', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          // Reset store before each property check
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          // The node's moduleType should match the requested type
          expect(node.data.moduleType).toBe(moduleType);
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should set the correct node type identifier', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          // The node type should be 'moduleNode' (React Flow node type)
          expect(node.type).toBe('moduleNode');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6.2: Position Correctness - Node position matches requested position', () => {
    it('addNode should create a node at the exact requested position', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          // The node's position should exactly match the requested position
          expect(node.position.x).toBe(position.x);
          expect(node.position.y).toBe(position.y);
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should preserve position for various coordinate ranges', () => {
      // Test with specific coordinate ranges
      const coordinateRangesArb = fc.oneof(
        // Small positive coordinates
        fc.record({
          x: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        }),
        // Large positive coordinates
        fc.record({
          x: fc.double({ min: 1000, max: 5000, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: 1000, max: 5000, noNaN: true, noDefaultInfinity: true }),
        }),
        // Negative coordinates
        fc.record({
          x: fc.double({ min: -5000, max: 0, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: -5000, max: 0, noNaN: true, noDefaultInfinity: true }),
        }),
        // Mixed coordinates
        fc.record({
          x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        })
      );

      fc.assert(
        fc.property(moduleTypeArb, coordinateRangesArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          expect(node.position.x).toBe(position.x);
          expect(node.position.y).toBe(position.y);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6.3: Default Configuration - Node has default config from module definition', () => {
    it('addNode should create a node with all default parameters from module definition', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          // The node should have the correct default configuration
          expect(hasDefaultConfig(node.data.params, moduleType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should include all default parameter keys', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // All default param keys should be present in the node
          const defaultKeys = Object.keys(moduleDef.defaultParams);
          const nodeKeys = Object.keys(node.data.params);

          for (const key of defaultKeys) {
            expect(nodeKeys).toContain(key);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should set default parameter values exactly', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // Each default param value should match exactly
          for (const [key, expectedValue] of Object.entries(moduleDef.defaultParams)) {
            expect(node.data.params[key]).toBe(expectedValue);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6.4: Node Metadata - Node has correct label and description', () => {
    it('addNode should set the correct label from module definition', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // The node's label should match the module definition name
          expect(node.data.label).toBe(moduleDef.name);
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should set the correct description from module definition', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // The node's description should match the module definition description
          expect(node.data.description).toBe(moduleDef.description);
        }),
        { numRuns: 100 }
      );
    });

    it('addNode should set the correct category from module definition', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // The node's category should match the module definition category
          expect(node.data.category).toBe(moduleDef.category);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6.5: Node ID Uniqueness - Each added node has a unique ID', () => {
    it('addNode should generate unique IDs for multiple nodes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(moduleTypeArb, positionArb), { minLength: 2, maxLength: 20 }),
          (nodeSpecs) => {
            resetStore();

            const store = useStrategyBuilderStore.getState();
            const nodeIds: string[] = [];

            // Add multiple nodes
            for (const [moduleType, position] of nodeSpecs) {
              const node = store.addNode(moduleType, position);
              nodeIds.push(node.id);
            }

            // All IDs should be unique
            const uniqueIds = new Set(nodeIds);
            expect(uniqueIds.size).toBe(nodeIds.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('addNode should generate non-empty IDs', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);

          // The node ID should be non-empty
          expect(node.id).toBeDefined();
          expect(node.id.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6.6: Store State Consistency - Node is added to store correctly', () => {
    it('addNode should add the node to the store nodes array', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const initialNodeCount = store.nodes.length;
          const node = store.addNode(moduleType, position);

          // Get updated state
          const updatedStore = useStrategyBuilderStore.getState();

          // Node count should increase by 1
          expect(updatedStore.nodes.length).toBe(initialNodeCount + 1);

          // The added node should be in the store
          const foundNode = updatedStore.nodes.find((n) => n.id === node.id);
          expect(foundNode).toBeDefined();
          expect(foundNode?.data.moduleType).toBe(moduleType);
        }),
        { numRuns: 100 }
      );
    });

    it('multiple addNode calls should accumulate nodes correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(moduleTypeArb, positionArb), { minLength: 1, maxLength: 10 }),
          (nodeSpecs) => {
            resetStore();

            const store = useStrategyBuilderStore.getState();
            const addedNodes: ReturnType<typeof store.addNode>[] = [];

            // Add multiple nodes
            for (const [moduleType, position] of nodeSpecs) {
              const node = store.addNode(moduleType, position);
              addedNodes.push(node);
            }

            // Get updated state
            const updatedStore = useStrategyBuilderStore.getState();

            // All added nodes should be in the store
            expect(updatedStore.nodes.length).toBe(nodeSpecs.length);

            for (const addedNode of addedNodes) {
              const foundNode = updatedStore.nodes.find((n) => n.id === addedNode.id);
              expect(foundNode).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 6 Combined: Full module placement correctness', () => {
    it('addNode should satisfy all placement correctness properties', () => {
      fc.assert(
        fc.property(moduleTypeArb, positionArb, (moduleType, position) => {
          resetStore();

          const store = useStrategyBuilderStore.getState();
          const node = store.addNode(moduleType, position);
          const moduleDef = moduleSystem.getModuleDefinition(moduleType);

          // Property 6.1: Type correctness
          expect(node.data.moduleType).toBe(moduleType);

          // Property 6.2: Position correctness
          expect(node.position.x).toBe(position.x);
          expect(node.position.y).toBe(position.y);

          // Property 6.3: Default configuration
          expect(hasDefaultConfig(node.data.params, moduleType)).toBe(true);

          // Property 6.4: Metadata correctness
          expect(node.data.label).toBe(moduleDef.name);
          expect(node.data.description).toBe(moduleDef.description);
          expect(node.data.category).toBe(moduleDef.category);

          // Property 6.5: ID validity
          expect(node.id).toBeDefined();
          expect(node.id.length).toBeGreaterThan(0);

          // Property 6.6: Store consistency
          const updatedStore = useStrategyBuilderStore.getState();
          const foundNode = updatedStore.nodes.find((n) => n.id === node.id);
          expect(foundNode).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });
});
