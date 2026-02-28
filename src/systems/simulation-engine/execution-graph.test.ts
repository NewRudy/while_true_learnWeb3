/**
 * Execution Graph Tests
 * 执行图单元测试
 *
 * @description 测试执行图构建和操作功能
 * @requirements 2.1
 */

import { describe, it, expect } from 'vitest';
import {
  buildExecutionGraph,
  getDownstreamNodes,
  getUpstreamNodes,
  validateExecutionGraph,
  estimateTotalSteps,
} from './execution-graph';
import { ModuleType, StrategyConfig } from '@/types';

/**
 * 创建测试用的策略配置
 */
function createTestStrategy(
  nodeCount: number,
  edges: Array<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>
): StrategyConfig {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i + 1}`,
    type: ModuleType.BUY,
    position: { x: i * 100, y: 0 },
    data: {
      moduleType: ModuleType.BUY,
      params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
    },
  }));

  const strategyEdges = edges.map((e, i) => ({
    id: `edge-${i + 1}`,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || 'signal_out',
    targetHandle: e.targetHandle || 'signal_in',
  }));

  return {
    id: 'test-strategy',
    name: 'Test Strategy',
    nodes,
    edges: strategyEdges,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('buildExecutionGraph', () => {
  it('should build a graph from strategy config', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
    ]);

    const graph = buildExecutionGraph(strategy);

    expect(graph.nodes.size).toBe(3);
    expect(graph.outgoingEdges.size).toBe(3);
    expect(graph.incomingEdges.size).toBe(3);
  });

  it('should identify entry nodes correctly', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
    ]);

    const graph = buildExecutionGraph(strategy);

    expect(graph.entryNodes).toContain('node-1');
    expect(graph.entryNodes).not.toContain('node-2');
    expect(graph.entryNodes).not.toContain('node-3');
  });

  it('should handle multiple entry nodes', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-3' },
      { source: 'node-2', target: 'node-3' },
    ]);

    const graph = buildExecutionGraph(strategy);

    expect(graph.entryNodes).toContain('node-1');
    expect(graph.entryNodes).toContain('node-2');
    expect(graph.entryNodes).not.toContain('node-3');
  });

  it('should handle empty strategy', () => {
    const strategy: StrategyConfig = {
      id: 'empty',
      name: 'Empty',
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const graph = buildExecutionGraph(strategy);

    expect(graph.nodes.size).toBe(0);
    expect(graph.entryNodes).toHaveLength(0);
  });

  it('should handle single node strategy', () => {
    const strategy = createTestStrategy(1, []);

    const graph = buildExecutionGraph(strategy);

    expect(graph.nodes.size).toBe(1);
    expect(graph.entryNodes).toContain('node-1');
  });
});

describe('getDownstreamNodes', () => {
  it('should return downstream nodes', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-1', target: 'node-3' },
    ]);

    const graph = buildExecutionGraph(strategy);
    const downstream = getDownstreamNodes(graph, 'node-1');

    expect(downstream).toContain('node-2');
    expect(downstream).toContain('node-3');
    expect(downstream).toHaveLength(2);
  });

  it('should return empty array for leaf nodes', () => {
    const strategy = createTestStrategy(2, [{ source: 'node-1', target: 'node-2' }]);

    const graph = buildExecutionGraph(strategy);
    const downstream = getDownstreamNodes(graph, 'node-2');

    expect(downstream).toHaveLength(0);
  });

  it('should filter by output port when specified', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-2', sourceHandle: 'signal_true' },
      { source: 'node-1', target: 'node-3', sourceHandle: 'signal_false' },
    ]);

    const graph = buildExecutionGraph(strategy);

    const trueDownstream = getDownstreamNodes(graph, 'node-1', 'signal_true');
    expect(trueDownstream).toContain('node-2');
    expect(trueDownstream).not.toContain('node-3');

    const falseDownstream = getDownstreamNodes(graph, 'node-1', 'signal_false');
    expect(falseDownstream).toContain('node-3');
    expect(falseDownstream).not.toContain('node-2');
  });
});

describe('getUpstreamNodes', () => {
  it('should return upstream nodes', () => {
    const strategy = createTestStrategy(3, [
      { source: 'node-1', target: 'node-3' },
      { source: 'node-2', target: 'node-3' },
    ]);

    const graph = buildExecutionGraph(strategy);
    const upstream = getUpstreamNodes(graph, 'node-3');

    expect(upstream).toContain('node-1');
    expect(upstream).toContain('node-2');
    expect(upstream).toHaveLength(2);
  });

  it('should return empty array for entry nodes', () => {
    const strategy = createTestStrategy(2, [{ source: 'node-1', target: 'node-2' }]);

    const graph = buildExecutionGraph(strategy);
    const upstream = getUpstreamNodes(graph, 'node-1');

    expect(upstream).toHaveLength(0);
  });
});

describe('validateExecutionGraph', () => {
  it('should validate a valid graph', () => {
    const strategy = createTestStrategy(2, [{ source: 'node-1', target: 'node-2' }]);

    const graph = buildExecutionGraph(strategy);
    const result = validateExecutionGraph(graph);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect empty graph', () => {
    const strategy: StrategyConfig = {
      id: 'empty',
      name: 'Empty',
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const graph = buildExecutionGraph(strategy);
    const result = validateExecutionGraph(graph);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect isolated nodes', () => {
    // Create a strategy with 3 nodes where node-3 is isolated
    const strategy: StrategyConfig = {
      id: 'test',
      name: 'Test',
      nodes: [
        {
          id: 'node-1',
          type: ModuleType.BUY,
          position: { x: 0, y: 0 },
          data: { moduleType: ModuleType.BUY, params: {} },
        },
        {
          id: 'node-2',
          type: ModuleType.SELL,
          position: { x: 100, y: 0 },
          data: { moduleType: ModuleType.SELL, params: {} },
        },
        {
          id: 'node-3',
          type: ModuleType.HOLD,
          position: { x: 200, y: 0 },
          data: { moduleType: ModuleType.HOLD, params: {} },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'signal_out',
          targetHandle: 'signal_in',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const graph = buildExecutionGraph(strategy);
    const result = validateExecutionGraph(graph);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('node-3'))).toBe(true);
  });

  it('should allow single node without connections', () => {
    const strategy = createTestStrategy(1, []);

    const graph = buildExecutionGraph(strategy);
    const result = validateExecutionGraph(graph);

    expect(result.valid).toBe(true);
  });
});

describe('estimateTotalSteps', () => {
  it('should estimate steps based on node count', () => {
    const strategy = createTestStrategy(5, []);

    const graph = buildExecutionGraph(strategy);
    const steps = estimateTotalSteps(graph);

    expect(steps).toBe(5);
  });

  it('should return 0 for empty graph', () => {
    const strategy: StrategyConfig = {
      id: 'empty',
      name: 'Empty',
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const graph = buildExecutionGraph(strategy);
    const steps = estimateTotalSteps(graph);

    expect(steps).toBe(0);
  });
});
