/**
 * Module Node Component
 * 模块节点组件
 *
 * @description 自定义 React Flow 节点组件，用于显示策略模块
 * @requirements 1.1, 1.2
 */

import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { moduleSystem } from '@/systems';
import type { StrategyFlowNode } from './StrategyBuilderStore';

/**
 * 模块类别颜色映射
 */
const categoryColors = {
  basic: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    header: 'bg-emerald-500',
    text: 'text-emerald-300',
  },
  advanced: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    header: 'bg-blue-500',
    text: 'text-blue-300',
  },
  risk: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    header: 'bg-amber-500',
    text: 'text-amber-300',
  },
};

/**
 * 端口数据类型颜色映射
 */
const portColors = {
  fund: 'bg-green-500',
  signal: 'bg-amber-500',
  data: 'bg-blue-500',
};

/**
 * 模块节点组件
 */
function ModuleNode({ data, selected }: NodeProps<StrategyFlowNode>) {
  const colors = categoryColors[data.category];
  const moduleDef = useMemo(
    () => moduleSystem.getModuleDefinition(data.moduleType),
    [data.moduleType]
  );

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 shadow-lg backdrop-blur-sm
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
        transition-all duration-200
      `}
    >
      {/* 节点头部 */}
      <div className={`${colors.header} px-3 py-2 rounded-t-md`}>
        <h3 className="text-white font-semibold text-sm">{data.label}</h3>
      </div>

      {/* 节点内容 */}
      <div className="p-3">
        <p className="text-xs text-gray-300 mb-2 line-clamp-2">{data.description}</p>

        {/* 输入端口 */}
        <div className="space-y-1 mb-2">
          {moduleDef.inputs.map((input) => (
            <div key={input.id} className="flex items-center gap-2 relative">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className={`!w-3 !h-3 !-left-1.5 ${portColors[input.dataType]} !border-2 !border-white`}
              />
              <span className="text-xs text-gray-400 pl-2">{input.name}</span>
            </div>
          ))}
        </div>

        {/* 输出端口 */}
        <div className="space-y-1">
          {moduleDef.outputs.map((output) => (
            <div key={output.id} className="flex items-center justify-end gap-2 relative">
              <span className="text-xs text-gray-400 pr-2">{output.name}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className={`!w-3 !h-3 !-right-1.5 ${portColors[output.dataType]} !border-2 !border-white`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 类别标签 */}
      <div className={`px-3 py-1 text-xs ${colors.text} border-t border-white/10`}>
        {data.category === 'basic' && '基础模块'}
        {data.category === 'advanced' && '高级模块'}
        {data.category === 'risk' && '风控模块'}
      </div>
    </div>
  );
}

export default memo(ModuleNode);
