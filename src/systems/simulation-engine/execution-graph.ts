/**
 * Execution Graph Builder
 * 执行图构建器
 *
 * @description 将策略配置转换为可执行的图结构
 * @requirements 2.1
 */

import { StrategyConfig, StrategyNode, StrategyEdge } from '@/types';
import { ExecutionGraph } from './types';

/**
 * 构建执行图
 * 将策略配置转换为便于执行的图结构
 *
 * @param config 策略配置
 * @returns 执行图
 */
export function buildExecutionGraph(config: StrategyConfig): ExecutionGraph {
  const nodes = new Map<string, StrategyNode>();
  const outgoingEdges = new Map<string, StrategyEdge[]>();
  const incomingEdges = new Map<string, StrategyEdge[]>();

  // 构建节点映射
  for (const node of config.nodes) {
    nodes.set(node.id, node);
    outgoingEdges.set(node.id, []);
    incomingEdges.set(node.id, []);
  }

  // 构建边映射
  for (const edge of config.edges) {
    const outgoing = outgoingEdges.get(edge.source);
    if (outgoing) {
      outgoing.push(edge);
    }

    const incoming = incomingEdges.get(edge.target);
    if (incoming) {
      incoming.push(edge);
    }
  }

  // 找出入口节点 (没有输入连接的节点)
  const entryNodes: string[] = [];
  for (const [nodeId, edges] of incomingEdges) {
    if (edges.length === 0) {
      entryNodes.push(nodeId);
    }
  }

  return {
    nodes,
    outgoingEdges,
    incomingEdges,
    entryNodes,
  };
}

/**
 * 获取节点的下游节点
 *
 * @param graph 执行图
 * @param nodeId 节点ID
 * @param outputPort 输出端口ID (可选，用于条件分支)
 * @returns 下游节点ID列表
 */
export function getDownstreamNodes(
  graph: ExecutionGraph,
  nodeId: string,
  outputPort?: string
): string[] {
  const edges = graph.outgoingEdges.get(nodeId) || [];

  if (outputPort) {
    // 如果指定了输出端口，只返回从该端口连接的节点
    return edges.filter((e) => e.sourceHandle === outputPort).map((e) => e.target);
  }

  // 返回所有下游节点
  return edges.map((e) => e.target);
}

/**
 * 获取节点的上游节点
 *
 * @param graph 执行图
 * @param nodeId 节点ID
 * @returns 上游节点ID列表
 */
export function getUpstreamNodes(graph: ExecutionGraph, nodeId: string): string[] {
  const edges = graph.incomingEdges.get(nodeId) || [];
  return edges.map((e) => e.source);
}

/**
 * 检查图是否有效
 * 验证图是否有入口节点且没有孤立节点
 *
 * @param graph 执行图
 * @returns 验证结果
 */
export function validateExecutionGraph(graph: ExecutionGraph): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查是否有节点
  if (graph.nodes.size === 0) {
    errors.push('策略中没有任何节点');
    return { valid: false, errors };
  }

  // 检查是否有入口节点
  if (graph.entryNodes.length === 0) {
    errors.push('策略中没有入口节点（所有节点都有输入连接，可能存在循环）');
  }

  // 检查是否有孤立节点（既没有输入也没有输出的节点，且不是唯一节点）
  if (graph.nodes.size > 1) {
    for (const [nodeId] of graph.nodes) {
      const incoming = graph.incomingEdges.get(nodeId) || [];
      const outgoing = graph.outgoingEdges.get(nodeId) || [];
      if (incoming.length === 0 && outgoing.length === 0) {
        errors.push(`节点 ${nodeId} 是孤立的，没有任何连接`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 计算执行图的总步骤数
 * 基于图的拓扑结构估算
 *
 * @param graph 执行图
 * @returns 估算的总步骤数
 */
export function estimateTotalSteps(graph: ExecutionGraph): number {
  // 简单估算：节点数量作为基础步骤数
  // 实际执行时可能因为条件分支而有所不同
  return graph.nodes.size;
}
