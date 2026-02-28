/**
 * Simulation Engine Types
 * 模拟引擎内部类型定义
 *
 * @description 定义模拟引擎内部使用的类型
 * @requirements 2.1, 2.2
 */

import { StrategyNode, StrategyEdge } from '@/types';

/**
 * 执行上下文
 * 模块执行时的上下文信息
 */
export interface ExecutionContext {
  /** 当前资金 */
  funds: number;
  /** 当前步骤 */
  step: number;
  /** 模拟开始时间 */
  startTime: number;
  /** 模拟速度 (1-10) */
  speed: number;
}

/**
 * 模块执行结果
 */
export interface ModuleExecutionResult {
  /** 是否执行成功 */
  success: boolean;
  /** 执行后的资金变化 */
  fundsChange: number;
  /** 输出数据 */
  outputData?: Record<string, unknown>;
  /** 错误信息 */
  error?: string;
  /** 下一个要执行的输出端口 */
  nextOutputPort?: string;
}

/**
 * 执行队列项
 */
export interface ExecutionQueueItem {
  /** 节点ID */
  nodeId: string;
  /** 输入数据 */
  inputData: Record<string, unknown>;
  /** 来源端口 */
  sourcePort?: string;
}

/**
 * 策略执行图
 * 用于追踪节点之间的连接关系
 */
export interface ExecutionGraph {
  /** 节点映射 */
  nodes: Map<string, StrategyNode>;
  /** 边映射 (sourceNodeId -> edges) */
  outgoingEdges: Map<string, StrategyEdge[]>;
  /** 边映射 (targetNodeId -> edges) */
  incomingEdges: Map<string, StrategyEdge[]>;
  /** 入口节点ID列表 (没有输入连接的节点) */
  entryNodes: string[];
}

/**
 * 状态变化回调类型
 */
export type StateChangeCallback = (state: import('@/types').SimulationState) => void;

/**
 * 模拟引擎配置
 */
export interface SimulationEngineConfig {
  /** 默认模拟速度 */
  defaultSpeed?: number;
  /** 步骤间隔基础时间 (ms) */
  baseStepInterval?: number;
  /** 最大执行步骤数 */
  maxSteps?: number;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: Required<SimulationEngineConfig> = {
  defaultSpeed: 5,
  baseStepInterval: 1000,
  maxSteps: 1000,
};
