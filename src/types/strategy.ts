/**
 * Strategy Builder Types
 * 策略构建器相关类型定义
 *
 * @description 定义策略节点、连接边和策略配置的接口
 * @requirements 1.1, 2.6
 */

import { ModuleType, ModuleConfig } from './module';

/**
 * 位置坐标
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 策略节点类型定义
 * 表示策略画布上的一个模块节点
 */
export interface StrategyNode {
  /** 节点唯一标识符 */
  id: string;
  /** 模块类型 */
  type: ModuleType;
  /** 节点在画布上的位置 */
  position: Position;
  /** 模块配置数据 */
  data: ModuleConfig;
}

/**
 * 连接边定义
 * 表示两个节点之间的连接关系
 */
export interface StrategyEdge {
  /** 边的唯一标识符 */
  id: string;
  /** 源节点ID */
  source: string;
  /** 目标节点ID */
  target: string;
  /** 源节点的连接点ID */
  sourceHandle: string;
  /** 目标节点的连接点ID */
  targetHandle: string;
}

/**
 * 策略配置
 * 完整的策略定义，包含所有节点和连接
 */
export interface StrategyConfig {
  /** 策略唯一标识符 */
  id: string;
  /** 策略名称 */
  name: string;
  /** 策略中的所有节点 */
  nodes: StrategyNode[];
  /** 策略中的所有连接边 */
  edges: StrategyEdge[];
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
}

/**
 * 连接点对
 * 用于连接两个节点时指定源和目标连接点
 */
export interface HandlePair {
  sourceHandle: string;
  targetHandle: string;
}

/**
 * 验证结果
 * 策略验证的返回结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误信息列表 */
  errors: ValidationError[];
  /** 警告信息列表 */
  warnings: string[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误类型 */
  type: 'invalid_connection' | 'missing_required' | 'invalid_config' | 'cycle_detected';
  /** 错误消息 */
  message: string;
  /** 相关节点ID */
  nodeId?: string;
  /** 相关边ID */
  edgeId?: string;
}

/**
 * Strategy Builder 接口
 * 策略构建器的核心操作接口
 */
export interface IStrategyBuilder {
  /** 添加新节点 */
  addNode(type: ModuleType, position: Position): StrategyNode;
  /** 移除节点 */
  removeNode(nodeId: string): void;
  /** 连接两个节点 */
  connectNodes(sourceId: string, targetId: string, handles: HandlePair): StrategyEdge | null;
  /** 更新节点配置 */
  updateNodeConfig(nodeId: string, config: Partial<ModuleConfig>): void;
  /** 验证策略 */
  validateStrategy(): ValidationResult;
  /** 导出策略配置 */
  exportStrategy(): StrategyConfig;
  /** 导入策略配置 */
  importStrategy(config: StrategyConfig): void;
}
