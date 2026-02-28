/**
 * Simulation Engine Tests
 * 模拟引擎单元测试
 *
 * @description 测试模拟引擎的核心功能
 * @requirements 2.1, 2.2
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimulationEngine, createSimulationEngine } from './simulation-engine';
import { ModuleType, StrategyConfig } from '@/types';

/**
 * 创建测试用的策略配置
 */
function createTestStrategy(options?: {
  nodes?: StrategyConfig['nodes'];
  edges?: StrategyConfig['edges'];
}): StrategyConfig {
  return {
    id: 'test-strategy',
    name: 'Test Strategy',
    nodes: options?.nodes || [
      {
        id: 'node-1',
        type: ModuleType.BUY,
        position: { x: 0, y: 0 },
        data: {
          moduleType: ModuleType.BUY,
          params: {
            amount: 50,
            amountType: 'percent',
            asset: 'ETH',
            orderType: 'market',
          },
        },
      },
    ],
    edges: options?.edges || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = createSimulationEngine({
      baseStepInterval: 100,
      defaultSpeed: 5,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    engine.reset();
  });

  describe('loadStrategy', () => {
    it('should load a strategy and set initial state', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);

      const state = engine.getState();
      expect(state.status).toBe('idle');
      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBeGreaterThan(0);
    });

    it('should reset state when loading a new strategy', () => {
      const strategy1 = createTestStrategy();
      engine.loadStrategy(strategy1);
      engine.start(1000);
      vi.advanceTimersByTime(100);

      const strategy2 = createTestStrategy();
      engine.loadStrategy(strategy2);

      const state = engine.getState();
      expect(state.status).toBe('idle');
      expect(state.currentStep).toBe(0);
    });
  });

  describe('start', () => {
    it('should start simulation with initial funds', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      const state = engine.getState();
      expect(state.status).toBe('running');
      expect(state.funds).toBe(1000);
    });

    it('should not start without a loaded strategy', () => {
      engine.start(1000);

      const state = engine.getState();
      expect(state.status).toBe('idle');
    });

    it('should not start if already running', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);
      engine.start(2000); // Try to start again

      const state = engine.getState();
      expect(state.funds).toBe(1000); // Should keep original funds
    });
  });

  describe('pause and resume', () => {
    it('should pause a running simulation', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      engine.pause();

      const state = engine.getState();
      expect(state.status).toBe('paused');
    });

    it('should resume a paused simulation', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);
      engine.pause();

      engine.resume();

      const state = engine.getState();
      expect(state.status).toBe('running');
    });

    it('should not pause if not running', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);

      engine.pause();

      const state = engine.getState();
      expect(state.status).toBe('idle');
    });

    it('should not resume if not paused', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      engine.resume(); // Already running

      const state = engine.getState();
      expect(state.status).toBe('running');
    });
  });

  describe('stop', () => {
    it('should stop a running simulation', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      engine.stop();

      const state = engine.getState();
      expect(state.status).toBe('completed');
    });

    it('should stop a paused simulation', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);
      engine.pause();

      engine.stop();

      const state = engine.getState();
      expect(state.status).toBe('completed');
    });
  });

  describe('setSpeed', () => {
    it('should set simulation speed within valid range', () => {
      engine.setSpeed(7);
      expect(engine.getSpeed()).toBe(7);
    });

    it('should clamp speed to minimum of 1', () => {
      engine.setSpeed(0);
      expect(engine.getSpeed()).toBe(1);
    });

    it('should clamp speed to maximum of 10', () => {
      engine.setSpeed(15);
      expect(engine.getSpeed()).toBe(10);
    });
  });

  describe('step execution', () => {
    it('should execute steps and update state', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute a step
      vi.advanceTimersByTime(100);

      const state = engine.getState();
      expect(state.currentStep).toBeGreaterThan(0);
    });

    it('should create transactions during execution', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute steps
      vi.advanceTimersByTime(200);

      const state = engine.getState();
      expect(state.transactions.length).toBeGreaterThan(0);
    });

    it('should update funds based on module execution', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'buy-node',
            type: ModuleType.BUY,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.BUY,
              params: {
                amount: 100,
                amountType: 'fixed',
                asset: 'ETH',
                orderType: 'market',
              },
            },
          },
        ],
      });
      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute the buy
      vi.advanceTimersByTime(200);

      const state = engine.getState();
      // After buying 100, funds should be 900
      expect(state.funds).toBe(900);
    });
  });

  describe('state change listeners', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      const strategy = createTestStrategy();

      engine.loadStrategy(strategy);
      engine.onStateChange(listener);
      engine.start(1000);

      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing from state changes', () => {
      const listener = vi.fn();
      const strategy = createTestStrategy();

      engine.loadStrategy(strategy);
      const unsubscribe = engine.onStateChange(listener);
      unsubscribe();

      listener.mockClear();
      engine.start(1000);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getResult', () => {
    it('should return null if simulation not completed', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      const result = engine.getResult();
      expect(result).toBeNull();
    });

    it('should return result after simulation completes', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to complete simulation
      vi.advanceTimersByTime(500);

      engine.stop();

      const result = engine.getResult();
      expect(result).not.toBeNull();
      expect(result?.finalFunds).toBeDefined();
      expect(result?.profitLoss).toBeDefined();
      expect(result?.profitLossPercent).toBeDefined();
      expect(result?.transactionCount).toBeDefined();
      expect(result?.executionTime).toBeDefined();
    });

    it('should calculate profit/loss correctly', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'sell-node',
            type: ModuleType.SELL,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.SELL,
              params: {
                amount: 100,
                amountType: 'fixed',
                asset: 'ETH',
                orderType: 'market',
              },
            },
          },
        ],
      });
      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to complete
      vi.advanceTimersByTime(500);
      engine.stop();

      const result = engine.getResult();
      expect(result).not.toBeNull();
      // Sell adds 100 to funds, so profit should be 100
      expect(result?.profitLoss).toBe(100);
      expect(result?.profitLossPercent).toBe(10); // 100/1000 * 100
    });
  });

  describe('multi-node strategy execution', () => {
    it('should execute connected nodes in sequence', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'buy-node',
            type: ModuleType.BUY,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.BUY,
              params: {
                amount: 100,
                amountType: 'fixed',
                asset: 'ETH',
                orderType: 'market',
              },
            },
          },
          {
            id: 'sell-node',
            type: ModuleType.SELL,
            position: { x: 200, y: 0 },
            data: {
              moduleType: ModuleType.SELL,
              params: {
                amount: 50,
                amountType: 'fixed',
                asset: 'ETH',
                orderType: 'market',
              },
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'buy-node',
            target: 'sell-node',
            sourceHandle: 'signal_out',
            targetHandle: 'signal_in',
          },
        ],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute both nodes
      vi.advanceTimersByTime(500);

      const state = engine.getState();
      // Buy -100, Sell +50 = 950
      expect(state.funds).toBe(950);
      expect(state.transactions.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle insufficient funds error', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'buy-node',
            type: ModuleType.BUY,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.BUY,
              params: {
                amount: 2000, // More than initial funds
                amountType: 'fixed',
                asset: 'ETH',
                orderType: 'market',
              },
            },
          },
        ],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute
      vi.advanceTimersByTime(200);

      const state = engine.getState();
      // Should still execute with available funds (1000)
      expect(state.funds).toBe(0);
    });

    it('should detect invalid strategy with no nodes before starting', () => {
      const strategy = createTestStrategy({
        nodes: [],
        edges: [],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      const state = engine.getState();
      expect(state.status).toBe('error');

      const errors = engine.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      const [firstError] = errors;
      if (!firstError) {
        throw new Error('Expected validation error');
      }
      expect(firstError.code).toBe('INVALID_STRATEGY');
    });

    it('should pause execution and highlight problematic module on runtime error', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'transfer-node',
            type: ModuleType.TRANSFER,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.TRANSFER,
              params: {
                amount: 5000, // More than initial funds
                toAddress: '0x123',
              },
            },
          },
        ],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute
      vi.advanceTimersByTime(200);

      const state = engine.getState();
      expect(state.status).toBe('error');
      expect(state.activeNodeId).toBe('transfer-node'); // Problematic node highlighted

      const errors = engine.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      const [firstError] = errors;
      if (!firstError) {
        throw new Error('Expected execution error');
      }
      expect(firstError.code).toBe('EXECUTION_ERROR');
      expect(firstError.nodeId).toBe('transfer-node');
    });

    it('should create failed transaction record on runtime error', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'transfer-node',
            type: ModuleType.TRANSFER,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.TRANSFER,
              params: {
                amount: 5000, // More than initial funds
                toAddress: '0x123',
              },
            },
          },
        ],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute
      vi.advanceTimersByTime(200);

      const state = engine.getState();
      expect(state.transactions.length).toBe(1);
      const [firstTransaction] = state.transactions;
      if (!firstTransaction) {
        throw new Error('Expected transaction record');
      }
      expect(firstTransaction.status).toBe('failed');
    });

    it('should return error result when simulation fails', () => {
      const strategy = createTestStrategy({
        nodes: [
          {
            id: 'transfer-node',
            type: ModuleType.TRANSFER,
            position: { x: 0, y: 0 },
            data: {
              moduleType: ModuleType.TRANSFER,
              params: {
                amount: 5000,
                toAddress: '0x123',
              },
            },
          },
        ],
      });

      engine.loadStrategy(strategy);
      engine.start(1000);

      // Advance time to execute
      vi.advanceTimersByTime(200);

      const result = engine.getResult();
      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateStrategy', () => {
    it('should return invalid when no strategy is loaded', () => {
      const validation = engine.validateStrategy();
      expect(validation.valid).toBe(false);
      const [firstError] = validation.errors;
      if (!firstError) {
        throw new Error('Expected validation error');
      }
      expect(firstError.code).toBe('NO_STRATEGY');
    });

    it('should return valid for a valid strategy', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);

      const validation = engine.validateStrategy();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return invalid for empty strategy', () => {
      const strategy = createTestStrategy({
        nodes: [],
        edges: [],
      });
      engine.loadStrategy(strategy);

      const validation = engine.validateStrategy();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset engine to initial state', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);
      vi.advanceTimersByTime(200);

      engine.reset();

      const state = engine.getState();
      expect(state.status).toBe('idle');
      expect(state.currentStep).toBe(0);
      expect(state.funds).toBe(0);
      expect(state.transactions).toHaveLength(0);
    });
  });

  describe('helper methods', () => {
    it('canStart should return true when strategy is loaded', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);

      expect(engine.canStart()).toBe(true);
    });

    it('canStart should return false when no strategy is loaded', () => {
      expect(engine.canStart()).toBe(false);
    });

    it('canPause should return true when running', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);

      expect(engine.canPause()).toBe(true);
    });

    it('canResume should return true when paused', () => {
      const strategy = createTestStrategy();
      engine.loadStrategy(strategy);
      engine.start(1000);
      engine.pause();

      expect(engine.canResume()).toBe(true);
    });
  });
});
