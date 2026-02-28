/**
 * Module Executor
 * 模块执行器
 *
 * @description 执行单个模块的逻辑
 * @requirements 2.1, 2.2
 */

import { ModuleType, ModuleConfig, Transaction, TransactionStatus } from '@/types';
import { ExecutionContext, ModuleExecutionResult } from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建交易记录
 */
export function createTransaction(
  type: string,
  amount: number,
  from: string,
  to: string,
  status: TransactionStatus = 'success'
): Transaction {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    amount,
    from,
    to,
    status,
  };
}

/**
 * 执行买入模块
 */
function executeBuy(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const amount = config.params.amount as number;
  const amountType = config.params.amountType as string;
  const asset = config.params.asset as string;

  let buyAmount: number;
  if (amountType === 'percent') {
    buyAmount = (context.funds * amount) / 100;
  } else {
    buyAmount = Math.min(amount, context.funds);
  }

  if (buyAmount <= 0) {
    return {
      success: false,
      fundsChange: 0,
      error: '资金不足，无法执行买入操作',
    };
  }

  return {
    success: true,
    fundsChange: -buyAmount,
    outputData: {
      asset,
      amount: buyAmount,
      action: 'buy',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行卖出模块
 */
function executeSell(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  const amount = config.params.amount as number;
  const amountType = config.params.amountType as string;
  const asset = config.params.asset as string;

  // 模拟卖出获得资金
  let sellAmount: number;
  if (amountType === 'percent') {
    // 假设持有的资产价值等于之前买入的金额
    const holdingValue = (inputData.amount as number) || 100;
    sellAmount = (holdingValue * amount) / 100;
  } else {
    sellAmount = amount;
  }

  return {
    success: true,
    fundsChange: sellAmount,
    outputData: {
      asset,
      amount: sellAmount,
      action: 'sell',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行转账模块
 */
function executeTransfer(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const amount = config.params.amount as number;
  const toAddress = config.params.toAddress as string;

  if (amount > context.funds) {
    return {
      success: false,
      fundsChange: 0,
      error: '资金不足，无法执行转账操作',
    };
  }

  return {
    success: true,
    fundsChange: -amount,
    outputData: {
      toAddress,
      amount,
      action: 'transfer',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行持有模块
 */
function executeHold(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  void inputData;
  const duration = config.params.duration as number;

  return {
    success: true,
    fundsChange: 0,
    outputData: {
      duration,
      action: 'hold',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行条件判断模块
 */
function executeCondition(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  const operator = config.params.operator as string;
  const threshold = config.params.threshold as number;
  const dataSource = config.params.dataSource as string;

  // 获取要比较的值
  let value: number;
  if (dataSource === 'price') {
    // 模拟价格数据
    value = (inputData.price as number) || 100;
  } else if (dataSource === 'balance') {
    value = context.funds;
  } else {
    value = (inputData.value as number) || 0;
  }

  // 执行比较
  let conditionMet: boolean;
  switch (operator) {
    case 'gt':
      conditionMet = value > threshold;
      break;
    case 'gte':
      conditionMet = value >= threshold;
      break;
    case 'lt':
      conditionMet = value < threshold;
      break;
    case 'lte':
      conditionMet = value <= threshold;
      break;
    case 'eq':
      conditionMet = value === threshold;
      break;
    default:
      conditionMet = false;
  }

  return {
    success: true,
    fundsChange: 0,
    outputData: {
      conditionMet,
      value,
      threshold,
      operator,
    },
    nextOutputPort: conditionMet ? 'signal_true' : 'signal_false',
  };
}

/**
 * 执行兑换模块
 */
function executeSwap(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const fromToken = config.params.fromToken as string;
  const toToken = config.params.toToken as string;
  const amount = config.params.amount as number;
  const slippage = config.params.slippageTolerance as number;

  if (amount > context.funds) {
    return {
      success: false,
      fundsChange: 0,
      error: '资金不足，无法执行兑换操作',
    };
  }

  // 模拟兑换，考虑滑点
  const slippageFactor = 1 - slippage / 100;
  const receivedAmount = amount * slippageFactor;

  return {
    success: true,
    fundsChange: receivedAmount - amount, // 净变化
    outputData: {
      fromToken,
      toToken,
      sentAmount: amount,
      receivedAmount,
      action: 'swap',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行添加流动性模块
 */
function executeLiquidityAdd(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const amountA = config.params.amountA as number;
  const amountB = config.params.amountB as number;
  const totalAmount = amountA + amountB;

  if (totalAmount > context.funds) {
    return {
      success: false,
      fundsChange: 0,
      error: '资金不足，无法添加流动性',
    };
  }

  return {
    success: true,
    fundsChange: -totalAmount,
    outputData: {
      lpTokens: totalAmount, // 简化：LP代币数量等于投入金额
      action: 'liquidity_add',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行移除流动性模块
 */
function executeLiquidityRemove(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  const percentage = config.params.percentage as number;
  const lpTokens = (inputData.lpTokens as number) || 100;

  const removedAmount = (lpTokens * percentage) / 100;

  return {
    success: true,
    fundsChange: removedAmount,
    outputData: {
      removedLpTokens: removedAmount,
      action: 'liquidity_remove',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行质押模块
 */
function executeStake(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const amount = config.params.amount as number;

  if (amount > context.funds) {
    return {
      success: false,
      fundsChange: 0,
      error: '资金不足，无法执行质押操作',
    };
  }

  return {
    success: true,
    fundsChange: -amount,
    outputData: {
      stakedAmount: amount,
      action: 'stake',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行解除质押模块
 */
function executeUnstake(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  const percentage = config.params.percentage as number;
  const stakedAmount = (inputData.stakedAmount as number) || 100;

  const unstakedAmount = (stakedAmount * percentage) / 100;

  return {
    success: true,
    fundsChange: unstakedAmount,
    outputData: {
      unstakedAmount,
      action: 'unstake',
    },
    nextOutputPort: 'signal_out',
  };
}

/**
 * 执行止损模块
 */
function executeStopLoss(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  const stopLossPercent = config.params.stopLossPercent as number;
  const currentPrice = (inputData.price as number) || 100;
  const entryPrice = (inputData.entryPrice as number) || 100;

  const lossPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
  const triggered = lossPercent >= stopLossPercent;

  return {
    success: true,
    fundsChange: 0,
    outputData: {
      triggered,
      lossPercent,
      action: 'stop_loss',
    },
    nextOutputPort: triggered ? 'signal_triggered' : 'fund_out',
  };
}

/**
 * 执行止盈模块
 */
function executeTakeProfit(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void context;
  const takeProfitPercent = config.params.takeProfitPercent as number;
  const currentPrice = (inputData.price as number) || 100;
  const entryPrice = (inputData.entryPrice as number) || 100;

  const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  const triggered = profitPercent >= takeProfitPercent;

  return {
    success: true,
    fundsChange: 0,
    outputData: {
      triggered,
      profitPercent,
      action: 'take_profit',
    },
    nextOutputPort: triggered ? 'signal_triggered' : 'fund_out',
  };
}

/**
 * 执行仓位管理模块
 */
function executePositionSize(
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown>
): ModuleExecutionResult {
  void inputData;
  const riskPerTrade = config.params.riskPerTrade as number;
  const maxPositionSize = config.params.maxPositionSize as number;

  // 计算建议仓位大小
  const riskBasedSize = (context.funds * riskPerTrade) / 100;
  const maxSize = (context.funds * maxPositionSize) / 100;
  const recommendedSize = Math.min(riskBasedSize, maxSize);

  return {
    success: true,
    fundsChange: 0,
    outputData: {
      recommendedSize,
      riskPerTrade,
      maxPositionSize,
      action: 'position_size',
    },
    nextOutputPort: 'fund_out',
  };
}

/**
 * 模块执行器映射
 */
const moduleExecutors: Record<
  ModuleType,
  (
    config: ModuleConfig,
    context: ExecutionContext,
    inputData: Record<string, unknown>
  ) => ModuleExecutionResult
> = {
  [ModuleType.BUY]: executeBuy,
  [ModuleType.SELL]: executeSell,
  [ModuleType.TRANSFER]: executeTransfer,
  [ModuleType.HOLD]: executeHold,
  [ModuleType.CONDITION]: executeCondition,
  [ModuleType.SWAP]: executeSwap,
  [ModuleType.LIQUIDITY_ADD]: executeLiquidityAdd,
  [ModuleType.LIQUIDITY_REMOVE]: executeLiquidityRemove,
  [ModuleType.STAKE]: executeStake,
  [ModuleType.UNSTAKE]: executeUnstake,
  [ModuleType.STOP_LOSS]: executeStopLoss,
  [ModuleType.TAKE_PROFIT]: executeTakeProfit,
  [ModuleType.POSITION_SIZE]: executePositionSize,
};

/**
 * 执行模块
 *
 * @param moduleType 模块类型
 * @param config 模块配置
 * @param context 执行上下文
 * @param inputData 输入数据
 * @returns 执行结果
 */
export function executeModule(
  moduleType: ModuleType,
  config: ModuleConfig,
  context: ExecutionContext,
  inputData: Record<string, unknown> = {}
): ModuleExecutionResult {
  const executor = moduleExecutors[moduleType];

  if (!executor) {
    return {
      success: false,
      fundsChange: 0,
      error: `未知的模块类型: ${moduleType}`,
    };
  }

  try {
    return executor(config, context, inputData);
  } catch (error) {
    return {
      success: false,
      fundsChange: 0,
      error: `模块执行错误: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
