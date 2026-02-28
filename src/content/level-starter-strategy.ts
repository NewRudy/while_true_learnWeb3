import { getModuleDefinitionByType } from '@/systems/module-system';
import { ModuleType, type LevelDefinition, type StrategyConfig, type StrategyEdge, type StrategyNode } from '@/types';

type ObjectiveMetrics = {
  minTransactions: number;
  minUniqueModules: number;
  minProfitPercent: number;
};

const SIGNAL_CHAIN_CANDIDATES: ModuleType[] = [
  ModuleType.HOLD,
  ModuleType.CONDITION,
  ModuleType.UNSTAKE,
  ModuleType.LIQUIDITY_REMOVE,
  ModuleType.SWAP,
  ModuleType.TRANSFER,
  ModuleType.STAKE,
  ModuleType.LIQUIDITY_ADD,
];

const CONDITION_MODULE: ModuleType = ModuleType.CONDITION;

function getObjectiveMetrics(level: LevelDefinition): ObjectiveMetrics {
  let minTransactions = 1;
  let minUniqueModules = 1;
  let minProfitPercent = 0;

  for (const objective of level.objectives) {
    if (objective.type === 'transaction_count') {
      minTransactions = Math.max(minTransactions, objective.target);
    } else if (objective.type === 'use_module') {
      minUniqueModules = Math.max(minUniqueModules, objective.target);
    } else if (objective.type === 'profit') {
      minProfitPercent = Math.max(minProfitPercent, objective.target);
    }
  }

  return { minTransactions, minUniqueModules, minProfitPercent };
}

function hasSignalInput(type: ModuleType): boolean {
  return getModuleDefinitionByType(type)?.inputs.some((port) => port.id === 'signal_in') ?? false;
}

function getSignalOutputHandle(type: ModuleType): string | null {
  if (type === CONDITION_MODULE) return 'signal_true';
  const outputs = getModuleDefinitionByType(type)?.outputs ?? [];
  return outputs.some((port) => port.id === 'signal_out') ? 'signal_out' : null;
}

function createNode(
  id: string,
  type: ModuleType,
  index: number,
  params: Record<string, number | string | boolean>
): StrategyNode {
  return {
    id,
    type,
    position: { x: 180 + index * 220, y: 220 },
    data: {
      moduleType: type,
      params,
    },
  };
}

function createEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string
): StrategyEdge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
  };
}

export function buildStarterStrategy(level: LevelDefinition): StrategyConfig {
  const now = Date.now();
  const metrics = getObjectiveMetrics(level);
  const available = new Set(level.availableModules);

  const chainTypes: ModuleType[] = [];

  if (available.has(ModuleType.BUY)) {
    chainTypes.push(ModuleType.BUY);
  } else if (level.availableModules.length > 0) {
    const fallbackType = level.availableModules[0];
    if (fallbackType) {
      chainTypes.push(fallbackType);
    }
  }

  if (
    metrics.minProfitPercent > 0 &&
    available.has(ModuleType.SELL) &&
    !chainTypes.includes(ModuleType.SELL)
  ) {
    chainTypes.push(ModuleType.SELL);
  }

  for (const candidate of SIGNAL_CHAIN_CANDIDATES) {
    if (!available.has(candidate)) continue;
    if (chainTypes.includes(candidate)) continue;
    if (!hasSignalInput(candidate)) continue;
    if (getSignalOutputHandle(candidate) === null) continue;
    chainTypes.push(candidate);
    if (new Set(chainTypes).size >= metrics.minUniqueModules) {
      break;
    }
  }

  // 对高交易次数关卡优先补充卖出模块，保证收益目标和成交目标可同时达成。
  while (chainTypes.length < metrics.minTransactions) {
    if (available.has(ModuleType.SELL)) {
      chainTypes.push(ModuleType.SELL);
      continue;
    }

    if (available.has(ModuleType.HOLD)) {
      chainTypes.push(ModuleType.HOLD);
      continue;
    }

    const fallbackType = chainTypes[chainTypes.length - 1] ?? level.availableModules[0];
    if (!fallbackType) break;
    chainTypes.push(fallbackType);
  }

  const uniqueTypes = new Set(chainTypes);
  if (uniqueTypes.size < metrics.minUniqueModules) {
    for (const moduleType of level.availableModules) {
      if (uniqueTypes.has(moduleType)) continue;
      if (!hasSignalInput(moduleType) || getSignalOutputHandle(moduleType) === null) continue;
      chainTypes.push(moduleType);
      uniqueTypes.add(moduleType);
      if (uniqueTypes.size >= metrics.minUniqueModules) break;
    }
  }

  const buyAmount = Math.max(50, Math.min(level.initialFunds, Math.floor(level.initialFunds * 0.12)));
  const requiredProfitCash = Math.ceil((level.initialFunds * metrics.minProfitPercent) / 100);
  const sellCount = chainTypes.filter((type) => type === ModuleType.SELL).length;
  const sellAmountPerNode =
    sellCount > 0
      ? Math.ceil((requiredProfitCash + buyAmount + 60) / sellCount)
      : 0;

  const nodes: StrategyNode[] = [];
  const edges: StrategyEdge[] = [];

  for (let index = 0; index < chainTypes.length; index += 1) {
    const type = chainTypes[index];
    if (!type) continue;
    const defaultParams = { ...(getModuleDefinitionByType(type)?.defaultParams ?? {}) };
    const nodeId = `starter_${index + 1}_${type}`;

    if (type === ModuleType.BUY) {
      defaultParams.amountType = 'fixed';
      defaultParams.amount = buyAmount;
    }

    if (type === ModuleType.SELL) {
      defaultParams.amountType = 'fixed';
      defaultParams.amount = Math.max(100, sellAmountPerNode);
    }

    if (type === ModuleType.SWAP) {
      defaultParams.amount = 10;
      defaultParams.slippageTolerance = 0;
    }

    if (type === ModuleType.TRANSFER) {
      defaultParams.amount = 10;
      defaultParams.toAddress = '0x000000000000000000000000000000000000dEaD';
    }

    if (type === ModuleType.STAKE) {
      defaultParams.amount = 10;
    }

    if (type === ModuleType.LIQUIDITY_ADD) {
      defaultParams.amountA = 5;
      defaultParams.amountB = 5;
    }

    nodes.push(createNode(nodeId, type, index, defaultParams));

    if (index > 0) {
      const previousType = chainTypes[index - 1];
      if (!previousType) continue;
      const sourceHandle = getSignalOutputHandle(previousType);
      const previousNode = nodes[index - 1];
      if (sourceHandle && hasSignalInput(type) && previousNode) {
        edges.push(
          createEdge(
            `starter_edge_${index}`,
            previousNode.id,
            nodeId,
            sourceHandle,
            'signal_in'
          )
        );
      }
    }
  }

  return {
    id: `starter_${level.id}`,
    name: `${level.name} · 新手模板`,
    nodes,
    edges,
    createdAt: now,
    updatedAt: now,
  };
}
