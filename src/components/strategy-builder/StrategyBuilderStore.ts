/**
 * Strategy Builder Store
 * 策略构建器状态管理
 *
 * @description 使用 Zustand 管理策略构建器的状态
 * @requirements 1.1, 1.2, 1.6, 2.6
 */

import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { ModuleType, ModuleConfig, StrategyConfig } from '@/types';
import { moduleSystem } from '@/systems';
import {
  saveStrategyToStorage,
  loadStrategyFromStorage,
  deleteStrategyFromStorage,
  getSavedStrategies,
  StrategyListItem,
} from '@/utils';

/**
 * 策略节点数据类型
 */
export interface StrategyNodeData extends ModuleConfig, Record<string, unknown> {
  label: string;
  description: string;
  category: 'basic' | 'advanced' | 'risk';
}

/**
 * React Flow 节点类型
 */
export type StrategyFlowNode = Node<StrategyNodeData, 'moduleNode'>;

/**
 * React Flow 边类型
 */
export type StrategyFlowEdge = Edge;

/**
 * 策略构建器状态接口
 */
interface StrategyBuilderState {
  // 节点和边
  nodes: StrategyFlowNode[];
  edges: StrategyFlowEdge[];

  // 策略元数据
  strategyId: string;
  strategyName: string;

  // 当前选中的节点
  selectedNodeId: string | null;

  // 当前玩家等级（用于过滤可用模块）
  playerLevel: number;
  // 当前关卡允许的模块类型（null 表示不限制）
  allowedModuleTypes: ModuleType[] | null;

  // 操作方法
  onNodesChange: (changes: NodeChange<StrategyFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // 节点操作
  addNode: (type: ModuleType, position: { x: number; y: number }) => StrategyFlowNode;
  removeNode: (nodeId: string) => void;
  updateNodeConfig: (nodeId: string, config: Partial<ModuleConfig>) => void;
  selectNode: (nodeId: string | null) => void;

  // 策略操作
  clearStrategy: () => void;
  setStrategyName: (name: string) => void;
  exportStrategy: () => StrategyConfig;
  importStrategy: (config: StrategyConfig) => void;

  // 持久化操作
  saveStrategy: () => boolean;
  loadStrategy: (strategyId: string) => boolean;
  deleteStrategy: (strategyId: string) => boolean;
  getSavedStrategyList: () => StrategyListItem[];

  // 玩家等级
  setPlayerLevel: (level: number) => void;
  // 设置关卡可用模块限制
  setAllowedModuleTypes: (moduleTypes: ModuleType[] | null) => void;
}

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 生成边ID
 */
const generateEdgeId = (source: string, target: string): string => {
  return `edge_${source}_${target}_${Date.now()}`;
};

/**
 * 创建策略构建器 Store
 */
export const useStrategyBuilderStore = create<StrategyBuilderState>((set, get) => ({
  // 初始状态
  nodes: [],
  edges: [],
  strategyId: generateId(),
  strategyName: '新策略',
  selectedNodeId: null,
  playerLevel: 1,
  allowedModuleTypes: null,

  // React Flow 节点变化处理
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // React Flow 边变化处理
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // 连接处理
  onConnect: (connection) => {
    // 验证连接是否有效
    const { nodes } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    // 获取源端口和目标端口的数据类型
    const sourceModuleDef = moduleSystem.getModuleDefinition(sourceNode.data.moduleType);
    const targetModuleDef = moduleSystem.getModuleDefinition(targetNode.data.moduleType);

    const sourcePort = sourceModuleDef.outputs.find((p) => p.id === connection.sourceHandle);
    const targetPort = targetModuleDef.inputs.find((p) => p.id === connection.targetHandle);

    // 验证端口类型兼容性
    if (sourcePort && targetPort && sourcePort.dataType === targetPort.dataType) {
      set({
        edges: addEdge(
          {
            ...connection,
            id: generateEdgeId(connection.source!, connection.target!),
            animated: true,
            style: { stroke: getEdgeColor(sourcePort.dataType) },
          },
          get().edges
        ),
      });
    }
  },

  // 添加节点
  addNode: (type, position) => {
    const moduleDef = moduleSystem.getModuleDefinition(type);
    const moduleConfig = moduleSystem.createModuleInstance(type);

    const newNode: StrategyFlowNode = {
      id: generateId(),
      type: 'moduleNode',
      position,
      data: {
        ...moduleConfig,
        label: moduleDef.name,
        description: moduleDef.description,
        category: moduleDef.category,
      },
    };

    set({
      nodes: [...get().nodes, newNode],
    });

    return newNode;
  },

  // 移除节点
  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  // 更新节点配置
  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              ...config,
              params: {
                ...node.data.params,
                ...(config.params || {}),
              },
            },
          }
          : node
      ),
    });
  },

  // 选中节点
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  // 清空策略
  clearStrategy: () => {
    set({
      nodes: [],
      edges: [],
      strategyId: generateId(),
      strategyName: '新策略',
      selectedNodeId: null,
    });
  },

  // 设置策略名称
  setStrategyName: (name) => {
    set({ strategyName: name });
  },

  // 导出策略配置
  exportStrategy: () => {
    const { nodes, edges, strategyId, strategyName } = get();
    const now = Date.now();

    return {
      id: strategyId,
      name: strategyName,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.moduleType,
        position: node.position,
        data: {
          moduleType: node.data.moduleType,
          params: node.data.params,
        },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || '',
        targetHandle: edge.targetHandle || '',
      })),
      createdAt: now,
      updatedAt: now,
    };
  },

  // 导入策略配置
  importStrategy: (config) => {
    const flowNodes: StrategyFlowNode[] = config.nodes.map((node) => {
      const moduleDef = moduleSystem.getModuleDefinition(node.type);
      return {
        id: node.id,
        type: 'moduleNode',
        position: node.position,
        data: {
          ...node.data,
          label: moduleDef.name,
          description: moduleDef.description,
          category: moduleDef.category,
        },
      };
    });

    const flowEdges: StrategyFlowEdge[] = config.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: true,
    }));

    set({
      nodes: flowNodes,
      edges: flowEdges,
      strategyId: config.id,
      strategyName: config.name,
      selectedNodeId: null,
    });
  },

  // 保存策略到 localStorage
  saveStrategy: () => {
    const config = get().exportStrategy();
    return saveStrategyToStorage(config);
  },

  // 从 localStorage 加载策略
  loadStrategy: (strategyId) => {
    const config = loadStrategyFromStorage(strategyId);
    if (config) {
      get().importStrategy(config);
      return true;
    }
    return false;
  },

  // 从 localStorage 删除策略
  deleteStrategy: (strategyId) => {
    return deleteStrategyFromStorage(strategyId);
  },

  // 获取已保存的策略列表
  getSavedStrategyList: () => {
    return getSavedStrategies();
  },

  // 设置玩家等级
  setPlayerLevel: (level) => {
    set({ playerLevel: level });
  },

  // 设置关卡可用模块限制
  setAllowedModuleTypes: (moduleTypes) => {
    set({ allowedModuleTypes: moduleTypes });
  },
}));

/**
 * 根据端口数据类型获取边的颜色
 */
function getEdgeColor(dataType: string): string {
  switch (dataType) {
    case 'fund':
      return '#22c55e'; // green-500
    case 'signal':
      return '#f59e0b'; // amber-500
    case 'data':
      return '#3b82f6'; // blue-500
    default:
      return '#6b7280'; // gray-500
  }
}

export default useStrategyBuilderStore;
