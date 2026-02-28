/**
 * Strategy Canvas Component
 * 策略画布组件
 *
 * @description 使用 React Flow 创建的策略构建画布
 * @requirements 1.1, 1.2
 */

import { useCallback, useRef, DragEvent, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { ModuleType } from '@/types';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import ModuleNode from './ModuleNode';

/**
 * 自定义节点类型映射
 */
const nodeTypes = {
  moduleNode: ModuleNode,
};

/**
 * 画布内部组件
 */
function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // 从 store 获取状态和方法
  const nodes = useStrategyBuilderStore((state) => state.nodes);
  const edges = useStrategyBuilderStore((state) => state.edges);
  const onNodesChange = useStrategyBuilderStore((state) => state.onNodesChange);
  const onEdgesChange = useStrategyBuilderStore((state) => state.onEdgesChange);
  const onConnect = useStrategyBuilderStore((state) => state.onConnect);
  const addNode = useStrategyBuilderStore((state) => state.addNode);
  const selectNode = useStrategyBuilderStore((state) => state.selectNode);

  /**
   * 处理拖拽放置
   */
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * 处理放置事件
   */
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // 获取拖拽的模块类型
      const moduleType = event.dataTransfer.getData('application/reactflow') as ModuleType;

      // 检查是否有有效的模块类型
      if (!moduleType || !Object.values(ModuleType).includes(moduleType)) {
        return;
      }

      // 计算放置位置（转换为画布坐标）
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 添加节点
      addNode(moduleType, position);
    },
    [screenToFlowPosition, addNode]
  );

  /**
   * 处理节点选中
   */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  /**
   * 处理画布点击（取消选中）
   */
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  /**
   * MiniMap 节点颜色
   */
  const nodeColor = useCallback((node: { data?: { category?: string } }) => {
    switch (node.data?.category) {
      case 'basic':
        return '#10b981'; // emerald-500
      case 'advanced':
        return '#3b82f6'; // blue-500
      case 'risk':
        return '#f59e0b'; // amber-500
      default:
        return '#6b7280'; // gray-500
    }
  }, []);

  /**
   * 默认边选项
   */
  const defaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { strokeWidth: 2 },
    }),
    []
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-gray-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />
        <Controls
          className="!bg-gray-800/80 !border-white/10 !rounded-lg"
          showZoom
          showFitView
          showInteractive
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!bg-gray-800/80 !border-white/10 !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * 策略画布组件（带 Provider）
 */
export default function StrategyCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
