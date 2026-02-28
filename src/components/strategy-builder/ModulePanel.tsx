import { useMemo, type DragEvent } from 'react';
import { moduleSystem } from '@/systems';
import { ModuleType, type ModuleDefinition } from '@/types';
import { useStrategyBuilderStore } from './StrategyBuilderStore';

const categoryConfig = {
  basic: {
    name: '基础模块',
    color: 'border-emerald-500 bg-emerald-500/10',
    hoverColor: 'hover:bg-emerald-500/20',
  },
  advanced: {
    name: '进阶模块',
    color: 'border-blue-500 bg-blue-500/10',
    hoverColor: 'hover:bg-blue-500/20',
  },
  risk: {
    name: '风控模块',
    color: 'border-amber-500 bg-amber-500/10',
    hoverColor: 'hover:bg-amber-500/20',
  },
} as const;

const moduleIconMap: Record<ModuleType, string> = {
  [ModuleType.BUY]: 'B',
  [ModuleType.SELL]: 'S',
  [ModuleType.TRANSFER]: 'T',
  [ModuleType.HOLD]: 'H',
  [ModuleType.CONDITION]: 'C',
  [ModuleType.SWAP]: 'SW',
  [ModuleType.LIQUIDITY_ADD]: 'LA',
  [ModuleType.LIQUIDITY_REMOVE]: 'LR',
  [ModuleType.STAKE]: 'ST',
  [ModuleType.UNSTAKE]: 'US',
  [ModuleType.STOP_LOSS]: 'SL',
  [ModuleType.TAKE_PROFIT]: 'TP',
  [ModuleType.POSITION_SIZE]: 'PS',
};

interface DraggableModuleProps {
  module: ModuleDefinition;
}

function getKeyParams(module: ModuleDefinition): string[] {
  const entries = Object.entries(module.defaultParams).slice(0, 2);
  return entries.map(([key, value]) => `${key}: ${String(value)}`);
}

function DraggableModule({ module }: DraggableModuleProps) {
  const config = categoryConfig[module.category];
  const keyParams = getKeyParams(module);

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', module.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab rounded-lg border-2 p-3 transition-all duration-200 active:cursor-grabbing hover:scale-[1.01] ${config.color} ${config.hoverColor}`}
    >
      <div className="flex items-start gap-2">
        <span className="rounded border border-white/20 bg-black/20 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {moduleIconMap[module.type]}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">{module.name}</h4>
          <p className="mt-1 line-clamp-2 text-xs text-gray-300">{module.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {keyParams.map((item) => (
              <span
                key={`${module.type}-${item}`}
                className="rounded border border-white/20 bg-black/20 px-1.5 py-0.5 text-[10px] text-gray-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModuleCategoryGroupProps {
  category: 'basic' | 'advanced' | 'risk';
  modules: ModuleDefinition[];
}

function ModuleCategoryGroup({ category, modules }: ModuleCategoryGroupProps) {
  const config = categoryConfig[category];
  if (modules.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-2 px-1 text-sm font-semibold text-gray-300">
        {config.name} ({modules.length})
      </h3>
      <div className="space-y-2">
        {modules.map((module) => (
          <DraggableModule key={module.type} module={module} />
        ))}
      </div>
    </div>
  );
}

export default function ModulePanel() {
  const playerLevel = useStrategyBuilderStore((state) => state.playerLevel);
  const allowedModuleTypes = useStrategyBuilderStore((state) => state.allowedModuleTypes);

  const availableModules = useMemo(() => {
    const unlockedByLevel = moduleSystem.getAvailableModules(playerLevel);
    if (!allowedModuleTypes) {
      return unlockedByLevel;
    }
    return unlockedByLevel.filter((module) => allowedModuleTypes.includes(module.type));
  }, [allowedModuleTypes, playerLevel]);

  const groupedModules = useMemo(() => {
    const groups: Record<'basic' | 'advanced' | 'risk', ModuleDefinition[]> = {
      basic: [],
      advanced: [],
      risk: [],
    };

    availableModules.forEach((module) => {
      groups[module.category].push(module);
    });

    return groups;
  }, [availableModules]);

  return (
    <div className="flex h-full w-80 flex-col border-r border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-bold text-white">策略模块</h2>
        <p className="mt-1 text-xs text-gray-300">拖拽模块到中间画布；每个卡片已显示关键参数。</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ModuleCategoryGroup category="basic" modules={groupedModules.basic} />
        <ModuleCategoryGroup category="advanced" modules={groupedModules.advanced} />
        <ModuleCategoryGroup category="risk" modules={groupedModules.risk} />
      </div>

      <div className="border-t border-white/10 bg-gray-900/50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">当前等级</span>
          <span className="font-semibold text-primary-300">Lv.{playerLevel}</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">可用模块: {availableModules.length}</p>
      </div>
    </div>
  );
}
