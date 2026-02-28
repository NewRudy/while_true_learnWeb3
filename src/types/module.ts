/**
 * Module System Types
 * 模块系统相关类型定义
 *
 * @description 定义模块类型枚举、模块配置和模块定义接口
 * @requirements 7.1, 7.2, 7.3, 7.6
 */

/**
 * 模块类型枚举
 * 定义所有可用的策略模块类型
 */
export enum ModuleType {
  // 基础模块 (Basic Modules)
  /** 买入模块 - 执行买入操作 */
  BUY = 'buy',
  /** 卖出模块 - 执行卖出操作 */
  SELL = 'sell',
  /** 转账模块 - 执行资金转移 */
  TRANSFER = 'transfer',
  /** 持有模块 - 保持当前仓位 */
  HOLD = 'hold',
  /** 条件模块 - 条件判断分支 */
  CONDITION = 'condition',

  // 高级模块 (Advanced Modules)
  /** 兑换模块 - 代币兑换 */
  SWAP = 'swap',
  /** 添加流动性模块 */
  LIQUIDITY_ADD = 'liquidity_add',
  /** 移除流动性模块 */
  LIQUIDITY_REMOVE = 'liquidity_remove',
  /** 质押模块 */
  STAKE = 'stake',
  /** 解除质押模块 */
  UNSTAKE = 'unstake',

  // 风控模块 (Risk Management Modules)
  /** 止损模块 - 自动止损 */
  STOP_LOSS = 'stop_loss',
  /** 止盈模块 - 自动止盈 */
  TAKE_PROFIT = 'take_profit',
  /** 仓位管理模块 - 控制仓位大小 */
  POSITION_SIZE = 'position_size',
}

/**
 * 模块类别
 */
export type ModuleCategory = 'basic' | 'advanced' | 'risk';

/**
 * 端口数据类型
 * 定义模块端口可以传输的数据类型
 */
export type PortDataType = 'fund' | 'signal' | 'data';

/**
 * 端口定义
 * 定义模块的输入/输出端口
 */
export interface PortDefinition {
  /** 端口唯一标识符 */
  id: string;
  /** 端口显示名称 */
  name: string;
  /** 端口数据类型 */
  dataType: PortDataType;
}

/**
 * 模块参数值类型
 */
export type ModuleParamValue = number | string | boolean;

/**
 * 模块配置
 * 模块实例的配置数据
 */
export interface ModuleConfig {
  /** 模块类型 */
  moduleType: ModuleType;
  /** 模块参数 */
  params: Record<string, ModuleParamValue>;
}

/**
 * 模块定义
 * 模块的完整定义，包含元数据和端口信息
 */
export interface ModuleDefinition {
  /** 模块类型 */
  type: ModuleType;
  /** 模块显示名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 模块类别 */
  category: ModuleCategory;
  /** 输入端口列表 */
  inputs: PortDefinition[];
  /** 输出端口列表 */
  outputs: PortDefinition[];
  /** 默认参数值 */
  defaultParams: Record<string, ModuleParamValue>;
  /** 解锁所需等级 */
  unlockLevel: number;
}

/**
 * Module System 接口
 * 模块系统的核心操作接口
 */
export interface IModuleSystem {
  /** 获取指定等级可用的模块列表 */
  getAvailableModules(unlockedLevel: number): ModuleDefinition[];
  /** 获取模块定义 */
  getModuleDefinition(type: ModuleType): ModuleDefinition;
  /** 验证两个端口是否可以连接 */
  validateConnection(source: PortDefinition, target: PortDefinition): boolean;
  /** 创建模块实例 */
  createModuleInstance(type: ModuleType): ModuleConfig;
}
