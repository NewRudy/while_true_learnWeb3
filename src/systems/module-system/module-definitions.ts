/**
 * Module Definitions
 * 模块定义数据
 *
 * @description 定义所有可用的策略模块
 * @requirements 7.1, 7.2, 7.3
 */

import { ModuleType, ModuleDefinition, ModuleCategory } from '@/types';

/**
 * 模块定义映射表
 * 使用 ModuleType 作为键，方便快速查找
 */
export const moduleDefinitions: Record<ModuleType, ModuleDefinition> = {
  // 基础模块 (Basic Modules) - Requirements 7.1
  [ModuleType.BUY]: {
    type: ModuleType.BUY,
    name: '买入',
    description: '使用指定金额或比例购买目标资产，支持市价单和限价单',
    category: 'basic',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'remaining', name: '剩余资金', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      amount: 100,
      amountType: 'fixed',
      asset: 'ETH',
      orderType: 'market',
    },
    unlockLevel: 1,
  },
  [ModuleType.SELL]: {
    type: ModuleType.SELL,
    name: '卖出',
    description: '卖出指定数量或比例的持仓资产，支持市价单和限价单',
    category: 'basic',
    inputs: [
      { id: 'fund_in', name: '资产输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      amount: 100,
      amountType: 'percent',
      asset: 'ETH',
      orderType: 'market',
    },
    unlockLevel: 1,
  },
  [ModuleType.TRANSFER]: {
    type: ModuleType.TRANSFER,
    name: '转账',
    description: '将资金从当前钱包转移到指定地址，支持多种代币类型',
    category: 'basic',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      amount: 100,
      toAddress: '',
      asset: 'ETH',
    },
    unlockLevel: 1,
  },
  [ModuleType.HOLD]: {
    type: ModuleType.HOLD,
    name: '持有',
    description: '保持当前仓位不变，等待指定时间或条件后继续执行',
    category: 'basic',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      duration: 1,
      durationType: 'blocks',
    },
    unlockLevel: 1,
  },
  [ModuleType.CONDITION]: {
    type: ModuleType.CONDITION,
    name: '条件判断',
    description: '根据价格、余额或其他数据条件分支执行不同的策略路径',
    category: 'basic',
    inputs: [
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
      { id: 'data_in', name: '数据输入', dataType: 'data' },
    ],
    outputs: [
      { id: 'signal_true', name: '条件为真', dataType: 'signal' },
      { id: 'signal_false', name: '条件为假', dataType: 'signal' },
    ],
    defaultParams: {
      operator: 'gt',
      threshold: 0,
      dataSource: 'price',
    },
    unlockLevel: 2,
  },

  // 高级模块 (Advanced Modules) - Requirements 7.2
  [ModuleType.SWAP]: {
    type: ModuleType.SWAP,
    name: '兑换',
    description: '在去中心化交易所上将一种代币兑换为另一种代币',
    category: 'advanced',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      fromToken: 'ETH',
      toToken: 'USDC',
      amount: 100,
      slippageTolerance: 0.5,
    },
    unlockLevel: 3,
  },
  [ModuleType.LIQUIDITY_ADD]: {
    type: ModuleType.LIQUIDITY_ADD,
    name: '添加流动性',
    description: '向流动性池添加代币对，获取LP代币和交易手续费收益',
    category: 'advanced',
    inputs: [
      { id: 'fund_in_a', name: '代币A输入', dataType: 'fund' },
      { id: 'fund_in_b', name: '代币B输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'lp_out', name: 'LP代币', dataType: 'data' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      tokenA: 'ETH',
      tokenB: 'USDC',
      amountA: 100,
      amountB: 100,
      pool: 'uniswap_v3',
    },
    unlockLevel: 4,
  },
  [ModuleType.LIQUIDITY_REMOVE]: {
    type: ModuleType.LIQUIDITY_REMOVE,
    name: '移除流动性',
    description: '从流动性池移除LP代币，取回原始代币对',
    category: 'advanced',
    inputs: [
      { id: 'lp_in', name: 'LP代币输入', dataType: 'data' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out_a', name: '代币A输出', dataType: 'fund' },
      { id: 'fund_out_b', name: '代币B输出', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      percentage: 100,
    },
    unlockLevel: 4,
  },
  [ModuleType.STAKE]: {
    type: ModuleType.STAKE,
    name: '质押',
    description: '将代币质押到协议中获取质押收益和治理权益',
    category: 'advanced',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'stake_receipt', name: '质押凭证', dataType: 'data' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      token: 'ETH',
      amount: 100,
      lockPeriod: 30,
      protocol: 'lido',
    },
    unlockLevel: 5,
  },
  [ModuleType.UNSTAKE]: {
    type: ModuleType.UNSTAKE,
    name: '解除质押',
    description: '解除质押并取回原始代币，可能需要等待解锁期',
    category: 'advanced',
    inputs: [
      { id: 'stake_in', name: '质押凭证输入', dataType: 'data' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_out', name: '完成信号', dataType: 'signal' },
    ],
    defaultParams: {
      percentage: 100,
    },
    unlockLevel: 5,
  },

  // 风控模块 (Risk Modules) - Requirements 7.3
  [ModuleType.STOP_LOSS]: {
    type: ModuleType.STOP_LOSS,
    name: '止损',
    description: '当价格下跌到设定阈值时自动卖出，限制最大损失',
    category: 'risk',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'price_in', name: '价格数据', dataType: 'data' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_triggered', name: '触发信号', dataType: 'signal' },
    ],
    defaultParams: {
      stopLossPercent: 10,
      stopLossType: 'trailing',
      triggerPrice: 0,
    },
    unlockLevel: 3,
  },
  [ModuleType.TAKE_PROFIT]: {
    type: ModuleType.TAKE_PROFIT,
    name: '止盈',
    description: '当价格上涨到设定阈值时自动卖出，锁定利润',
    category: 'risk',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'price_in', name: '价格数据', dataType: 'data' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'signal_triggered', name: '触发信号', dataType: 'signal' },
    ],
    defaultParams: {
      takeProfitPercent: 20,
      takeProfitType: 'fixed',
      triggerPrice: 0,
    },
    unlockLevel: 3,
  },
  [ModuleType.POSITION_SIZE]: {
    type: ModuleType.POSITION_SIZE,
    name: '仓位管理',
    description: '根据风险参数计算并控制单次交易的仓位大小',
    category: 'risk',
    inputs: [
      { id: 'fund_in', name: '资金输入', dataType: 'fund' },
      { id: 'signal_in', name: '触发信号', dataType: 'signal' },
    ],
    outputs: [
      { id: 'fund_out', name: '资金输出', dataType: 'fund' },
      { id: 'position_data', name: '仓位数据', dataType: 'data' },
    ],
    defaultParams: {
      riskPerTrade: 2,
      maxPositionSize: 10,
      sizingMethod: 'percent',
    },
    unlockLevel: 2,
  },
};

/**
 * 获取所有模块定义
 */
export function getAllModuleDefinitions(): ModuleDefinition[] {
  return Object.values(moduleDefinitions);
}

/**
 * 根据类别获取模块定义
 */
export function getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
  return getAllModuleDefinitions().filter((m) => m.category === category);
}

/**
 * 根据类型获取模块定义
 */
export function getModuleDefinitionByType(type: ModuleType): ModuleDefinition | undefined {
  return moduleDefinitions[type];
}
