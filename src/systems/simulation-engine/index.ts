/**
 * Simulation Engine Exports
 * 模拟引擎导出
 *
 * @description 导出模拟引擎相关模块
 * @requirements 2.1, 2.2
 */

// Main engine
export {
  SimulationEngine,
  simulationEngine,
  createSimulationEngine,
} from './simulation-engine';

// Execution graph utilities
export {
  buildExecutionGraph,
  getDownstreamNodes,
  getUpstreamNodes,
  validateExecutionGraph,
  estimateTotalSteps,
} from './execution-graph';

// Module executor
export { executeModule, createTransaction } from './module-executor';

// Types
export type {
  ExecutionContext,
  ModuleExecutionResult,
  ExecutionQueueItem,
  ExecutionGraph,
  StateChangeCallback,
  SimulationEngineConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';
