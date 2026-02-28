/**
 * Module Executor Tests
 * 模块执行器单元测试
 *
 * @description 测试各模块的执行逻辑
 * @requirements 2.1, 2.2
 */

import { describe, it, expect } from 'vitest';
import { executeModule, createTransaction } from './module-executor';
import { ModuleType, ModuleConfig } from '@/types';
import { ExecutionContext } from './types';

/**
 * 创建测试用的执行上下文
 */
function createTestContext(funds: number = 1000): ExecutionContext {
  return {
    funds,
    step: 1,
    startTime: Date.now(),
    speed: 5,
  };
}

/**
 * 创建测试用的模块配置
 */
function createModuleConfig(
  type: ModuleType,
  params: Record<string, unknown>
): ModuleConfig {
  return {
    moduleType: type,
    params: params as Record<string, number | string | boolean>,
  };
}

describe('createTransaction', () => {
  it('should create a transaction with correct properties', () => {
    const tx = createTransaction('buy', 100, 'wallet', 'exchange', 'success');

    expect(tx.id).toBeDefined();
    expect(tx.timestamp).toBeDefined();
    expect(tx.type).toBe('buy');
    expect(tx.amount).toBe(100);
    expect(tx.from).toBe('wallet');
    expect(tx.to).toBe('exchange');
    expect(tx.status).toBe('success');
  });

  it('should generate unique IDs', () => {
    const tx1 = createTransaction('buy', 100, 'a', 'b', 'success');
    const tx2 = createTransaction('buy', 100, 'a', 'b', 'success');

    expect(tx1.id).not.toBe(tx2.id);
  });
});

describe('executeModule - BUY', () => {
  it('should execute buy with fixed amount', () => {
    const config = createModuleConfig(ModuleType.BUY, {
      amount: 100,
      amountType: 'fixed',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.BUY, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-100);
    expect(result.outputData?.action).toBe('buy');
  });

  it('should execute buy with percentage amount', () => {
    const config = createModuleConfig(ModuleType.BUY, {
      amount: 50,
      amountType: 'percent',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.BUY, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-500); // 50% of 1000
  });

  it('should limit buy to available funds', () => {
    const config = createModuleConfig(ModuleType.BUY, {
      amount: 2000,
      amountType: 'fixed',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.BUY, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-1000); // Limited to available funds
  });

  it('should fail when funds are zero', () => {
    const config = createModuleConfig(ModuleType.BUY, {
      amount: 100,
      amountType: 'fixed',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(0);

    const result = executeModule(ModuleType.BUY, config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('executeModule - SELL', () => {
  it('should execute sell with fixed amount', () => {
    const config = createModuleConfig(ModuleType.SELL, {
      amount: 100,
      amountType: 'fixed',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.SELL, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(100);
    expect(result.outputData?.action).toBe('sell');
  });

  it('should execute sell with percentage amount', () => {
    const config = createModuleConfig(ModuleType.SELL, {
      amount: 50,
      amountType: 'percent',
      asset: 'ETH',
      orderType: 'market',
    });
    const context = createTestContext(1000);
    const inputData = { amount: 200 }; // Holding 200 worth

    const result = executeModule(ModuleType.SELL, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(100); // 50% of 200
  });
});

describe('executeModule - TRANSFER', () => {
  it('should execute transfer successfully', () => {
    const config = createModuleConfig(ModuleType.TRANSFER, {
      amount: 100,
      toAddress: '0x123',
      asset: 'ETH',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.TRANSFER, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-100);
    expect(result.outputData?.action).toBe('transfer');
  });

  it('should fail transfer with insufficient funds', () => {
    const config = createModuleConfig(ModuleType.TRANSFER, {
      amount: 2000,
      toAddress: '0x123',
      asset: 'ETH',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.TRANSFER, config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('executeModule - HOLD', () => {
  it('should execute hold without changing funds', () => {
    const config = createModuleConfig(ModuleType.HOLD, {
      duration: 5,
      durationType: 'blocks',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.HOLD, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(0);
    expect(result.outputData?.action).toBe('hold');
  });
});

describe('executeModule - CONDITION', () => {
  it('should evaluate greater than condition correctly', () => {
    const config = createModuleConfig(ModuleType.CONDITION, {
      operator: 'gt',
      threshold: 50,
      dataSource: 'balance',
    });
    const context = createTestContext(100);

    const result = executeModule(ModuleType.CONDITION, config, context);

    expect(result.success).toBe(true);
    expect(result.outputData?.conditionMet).toBe(true);
    expect(result.nextOutputPort).toBe('signal_true');
  });

  it('should evaluate less than condition correctly', () => {
    const config = createModuleConfig(ModuleType.CONDITION, {
      operator: 'lt',
      threshold: 50,
      dataSource: 'balance',
    });
    const context = createTestContext(100);

    const result = executeModule(ModuleType.CONDITION, config, context);

    expect(result.success).toBe(true);
    expect(result.outputData?.conditionMet).toBe(false);
    expect(result.nextOutputPort).toBe('signal_false');
  });

  it('should use price data when specified', () => {
    const config = createModuleConfig(ModuleType.CONDITION, {
      operator: 'gte',
      threshold: 100,
      dataSource: 'price',
    });
    const context = createTestContext(1000);
    const inputData = { price: 150 };

    const result = executeModule(ModuleType.CONDITION, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.outputData?.conditionMet).toBe(true);
  });
});

describe('executeModule - SWAP', () => {
  it('should execute swap with slippage', () => {
    const config = createModuleConfig(ModuleType.SWAP, {
      fromToken: 'ETH',
      toToken: 'USDC',
      amount: 100,
      slippageTolerance: 1,
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.SWAP, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-1); // 100 * 0.01 slippage
    expect(result.outputData?.action).toBe('swap');
  });

  it('should fail swap with insufficient funds', () => {
    const config = createModuleConfig(ModuleType.SWAP, {
      fromToken: 'ETH',
      toToken: 'USDC',
      amount: 2000,
      slippageTolerance: 0.5,
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.SWAP, config, context);

    expect(result.success).toBe(false);
  });
});

describe('executeModule - LIQUIDITY_ADD', () => {
  it('should add liquidity successfully', () => {
    const config = createModuleConfig(ModuleType.LIQUIDITY_ADD, {
      tokenA: 'ETH',
      tokenB: 'USDC',
      amountA: 100,
      amountB: 100,
      pool: 'uniswap_v3',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.LIQUIDITY_ADD, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-200); // amountA + amountB
    expect(result.outputData?.lpTokens).toBe(200);
  });

  it('should fail with insufficient funds', () => {
    const config = createModuleConfig(ModuleType.LIQUIDITY_ADD, {
      tokenA: 'ETH',
      tokenB: 'USDC',
      amountA: 600,
      amountB: 600,
      pool: 'uniswap_v3',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.LIQUIDITY_ADD, config, context);

    expect(result.success).toBe(false);
  });
});

describe('executeModule - LIQUIDITY_REMOVE', () => {
  it('should remove liquidity successfully', () => {
    const config = createModuleConfig(ModuleType.LIQUIDITY_REMOVE, {
      percentage: 50,
    });
    const context = createTestContext(1000);
    const inputData = { lpTokens: 200 };

    const result = executeModule(ModuleType.LIQUIDITY_REMOVE, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(100); // 50% of 200
  });
});

describe('executeModule - STAKE', () => {
  it('should stake successfully', () => {
    const config = createModuleConfig(ModuleType.STAKE, {
      token: 'ETH',
      amount: 100,
      lockPeriod: 30,
      protocol: 'lido',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.STAKE, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(-100);
    expect(result.outputData?.stakedAmount).toBe(100);
  });

  it('should fail stake with insufficient funds', () => {
    const config = createModuleConfig(ModuleType.STAKE, {
      token: 'ETH',
      amount: 2000,
      lockPeriod: 30,
      protocol: 'lido',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.STAKE, config, context);

    expect(result.success).toBe(false);
  });
});

describe('executeModule - UNSTAKE', () => {
  it('should unstake successfully', () => {
    const config = createModuleConfig(ModuleType.UNSTAKE, {
      percentage: 100,
    });
    const context = createTestContext(1000);
    const inputData = { stakedAmount: 100 };

    const result = executeModule(ModuleType.UNSTAKE, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(100);
    expect(result.outputData?.unstakedAmount).toBe(100);
  });
});

describe('executeModule - STOP_LOSS', () => {
  it('should trigger stop loss when loss exceeds threshold', () => {
    const config = createModuleConfig(ModuleType.STOP_LOSS, {
      stopLossPercent: 10,
      stopLossType: 'fixed',
      triggerPrice: 0,
    });
    const context = createTestContext(1000);
    const inputData = { price: 85, entryPrice: 100 }; // 15% loss

    const result = executeModule(ModuleType.STOP_LOSS, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.outputData?.triggered).toBe(true);
    expect(result.nextOutputPort).toBe('signal_triggered');
  });

  it('should not trigger when loss is below threshold', () => {
    const config = createModuleConfig(ModuleType.STOP_LOSS, {
      stopLossPercent: 10,
      stopLossType: 'fixed',
      triggerPrice: 0,
    });
    const context = createTestContext(1000);
    const inputData = { price: 95, entryPrice: 100 }; // 5% loss

    const result = executeModule(ModuleType.STOP_LOSS, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.outputData?.triggered).toBe(false);
    expect(result.nextOutputPort).toBe('fund_out');
  });
});

describe('executeModule - TAKE_PROFIT', () => {
  it('should trigger take profit when profit exceeds threshold', () => {
    const config = createModuleConfig(ModuleType.TAKE_PROFIT, {
      takeProfitPercent: 20,
      takeProfitType: 'fixed',
      triggerPrice: 0,
    });
    const context = createTestContext(1000);
    const inputData = { price: 125, entryPrice: 100 }; // 25% profit

    const result = executeModule(ModuleType.TAKE_PROFIT, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.outputData?.triggered).toBe(true);
    expect(result.nextOutputPort).toBe('signal_triggered');
  });

  it('should not trigger when profit is below threshold', () => {
    const config = createModuleConfig(ModuleType.TAKE_PROFIT, {
      takeProfitPercent: 20,
      takeProfitType: 'fixed',
      triggerPrice: 0,
    });
    const context = createTestContext(1000);
    const inputData = { price: 110, entryPrice: 100 }; // 10% profit

    const result = executeModule(ModuleType.TAKE_PROFIT, config, context, inputData);

    expect(result.success).toBe(true);
    expect(result.outputData?.triggered).toBe(false);
    expect(result.nextOutputPort).toBe('fund_out');
  });
});

describe('executeModule - POSITION_SIZE', () => {
  it('should calculate position size correctly', () => {
    const config = createModuleConfig(ModuleType.POSITION_SIZE, {
      riskPerTrade: 2,
      maxPositionSize: 10,
      sizingMethod: 'percent',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.POSITION_SIZE, config, context);

    expect(result.success).toBe(true);
    expect(result.fundsChange).toBe(0);
    expect(result.outputData?.recommendedSize).toBe(20); // 2% of 1000
  });

  it('should respect max position size', () => {
    const config = createModuleConfig(ModuleType.POSITION_SIZE, {
      riskPerTrade: 20, // 20% risk
      maxPositionSize: 10, // But max is 10%
      sizingMethod: 'percent',
    });
    const context = createTestContext(1000);

    const result = executeModule(ModuleType.POSITION_SIZE, config, context);

    expect(result.success).toBe(true);
    expect(result.outputData?.recommendedSize).toBe(100); // Limited to 10% of 1000
  });
});

describe('executeModule - unknown type', () => {
  it('should handle unknown module type gracefully', () => {
    const config = createModuleConfig('unknown' as ModuleType, {});
    const context = createTestContext(1000);

    const result = executeModule('unknown' as ModuleType, config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('未知的模块类型');
  });
});
