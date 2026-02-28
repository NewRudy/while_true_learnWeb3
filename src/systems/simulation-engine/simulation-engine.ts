/**
 * Simulation Engine Implementation
 * 模拟引擎实现
 *
 * @description 实现 ISimulationEngine 接口，执行策略模拟
 * @requirements 2.1, 2.2
 */

import {
  StrategyConfig,
  SimulationState,
  SimulationResult,
  SimulationError,
  ISimulationEngine,
} from '@/types';
import {
  StateChangeCallback,
  ExecutionContext,
  ExecutionQueueItem,
  ExecutionGraph,
  SimulationEngineConfig,
  DEFAULT_CONFIG,
} from './types';
import { buildExecutionGraph, getDownstreamNodes, estimateTotalSteps, validateExecutionGraph } from './execution-graph';
import { executeModule, createTransaction } from './module-executor';

/**
 * 创建初始模拟状态
 */
function createInitialState(): SimulationState {
  return {
    status: 'idle',
    currentStep: 0,
    totalSteps: 0,
    funds: 0,
    transactions: [],
    activeNodeId: null,
  };
}

/**
 * Simulation Engine 实现类
 */
export class SimulationEngine implements ISimulationEngine {
  private config: Required<SimulationEngineConfig>;
  private state: SimulationState;
  private strategy: StrategyConfig | null = null;
  private executionGraph: ExecutionGraph | null = null;
  private executionQueue: ExecutionQueueItem[] = [];
  private initialFunds: number = 0;
  private startTime: number = 0;
  private speed: number;
  private stepTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<StateChangeCallback> = new Set();
  private errors: SimulationError[] = [];

  constructor(config: SimulationEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = createInitialState();
    this.speed = this.config.defaultSpeed;
  }

  /**
   * 加载策略
   */
  loadStrategy(config: StrategyConfig): void {
    this.strategy = config;
    this.executionGraph = buildExecutionGraph(config);
    this.state = {
      ...createInitialState(),
      totalSteps: estimateTotalSteps(this.executionGraph),
    };
    this.errors = [];
    this.notifyListeners();
  }

  /**
   * 开始模拟
   */
  start(initialFunds: number): void {
    if (!this.strategy || !this.executionGraph) {
      this.addError('NO_STRATEGY', '没有加载策略');
      return;
    }

    if (this.state.status === 'running') {
      return;
    }

    // 验证策略有效性 (Requirement 2.4: 检测无效策略)
    const validation = validateExecutionGraph(this.executionGraph);
    if (!validation.valid) {
      this.errors = [];
      for (const errorMsg of validation.errors) {
        this.addError('INVALID_STRATEGY', errorMsg);
      }
      this.state = {
        ...this.state,
        status: 'error',
        activeNodeId: this.executionGraph.entryNodes[0] || null,
      };
      this.notifyListeners();
      return;
    }

    this.initialFunds = initialFunds;
    this.startTime = Date.now();
    this.errors = [];

    // 初始化执行队列，从入口节点开始
    this.executionQueue = this.executionGraph.entryNodes.map((nodeId) => ({
      nodeId,
      inputData: { funds: initialFunds },
    }));

    // 更新状态
    this.state = {
      status: 'running',
      currentStep: 0,
      totalSteps: estimateTotalSteps(this.executionGraph),
      funds: initialFunds,
      transactions: [],
      activeNodeId: null,
    };

    this.notifyListeners();
    this.scheduleNextStep();
  }

  /**
   * 暂停模拟
   */
  pause(): void {
    if (this.state.status !== 'running') {
      return;
    }

    this.clearStepTimer();
    this.state = {
      ...this.state,
      status: 'paused',
    };
    this.notifyListeners();
  }

  /**
   * 恢复模拟
   */
  resume(): void {
    if (this.state.status !== 'paused') {
      return;
    }

    this.state = {
      ...this.state,
      status: 'running',
    };
    this.notifyListeners();
    this.scheduleNextStep();
  }

  /**
   * 停止模拟
   */
  stop(): void {
    this.clearStepTimer();
    this.executionQueue = [];

    this.state = {
      ...this.state,
      status: 'completed',
      activeNodeId: null,
    };
    this.notifyListeners();
  }

  /**
   * 设置模拟速度
   */
  setSpeed(speed: number): void {
    this.speed = Math.max(1, Math.min(10, speed));

    // 如果正在运行，重新调度下一步
    if (this.state.status === 'running') {
      this.clearStepTimer();
      this.scheduleNextStep();
    }
  }

  /**
   * 获取当前状态
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * 获取模拟结果
   */
  getResult(): SimulationResult | null {
    if (this.state.status !== 'completed' && this.state.status !== 'error') {
      return null;
    }

    const executionTime = Date.now() - this.startTime;
    const profitLoss = this.state.funds - this.initialFunds;
    const profitLossPercent =
      this.initialFunds > 0 ? (profitLoss / this.initialFunds) * 100 : 0;

    return {
      success: this.state.status === 'completed' && this.errors.length === 0,
      finalFunds: this.state.funds,
      profitLoss,
      profitLossPercent,
      transactionCount: this.state.transactions.length,
      executedModuleTypes: Array.from(
        new Set(this.state.transactions.map((transaction) => transaction.type))
      ),
      executionTime,
      errors: [...this.errors],
    };
  }

  /**
   * 订阅状态变化
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 执行单步
   */
  private executeStep(): void {
    if (this.state.status !== 'running' || !this.executionGraph) {
      return;
    }

    // 检查是否还有待执行的节点
    if (this.executionQueue.length === 0) {
      this.completeSimulation();
      return;
    }

    // 检查是否超过最大步骤数
    if (this.state.currentStep >= this.config.maxSteps) {
      this.addError('MAX_STEPS_EXCEEDED', '超过最大执行步骤数');
      this.completeSimulation();
      return;
    }

    // 取出下一个要执行的节点
    const queueItem = this.executionQueue.shift()!;
    const node = this.executionGraph.nodes.get(queueItem.nodeId);

    if (!node) {
      this.addError('NODE_NOT_FOUND', `节点 ${queueItem.nodeId} 不存在`);
      this.scheduleNextStep();
      return;
    }

    // 更新当前活跃节点
    this.state = {
      ...this.state,
      activeNodeId: node.id,
      currentStep: this.state.currentStep + 1,
    };
    this.notifyListeners();

    // 创建执行上下文
    const context: ExecutionContext = {
      funds: this.state.funds,
      step: this.state.currentStep,
      startTime: this.startTime,
      speed: this.speed,
    };

    // 执行模块
    const result = executeModule(node.type, node.data, context, queueItem.inputData);

    if (!result.success) {
      // 执行失败
      this.addError('EXECUTION_ERROR', result.error || '模块执行失败', node.id);

      // 创建失败的交易记录
      const transaction = createTransaction(
        node.type,
        0,
        'wallet',
        node.id,
        'failed'
      );
      this.state = {
        ...this.state,
        transactions: [...this.state.transactions, transaction],
        status: 'error',
        activeNodeId: node.id,
      };
      this.notifyListeners();
      return;
    }

    // 更新资金
    const newFunds = this.state.funds + result.fundsChange;

    // 创建交易记录
    const transaction = createTransaction(
      node.type,
      Math.abs(result.fundsChange),
      result.fundsChange < 0 ? 'wallet' : node.id,
      result.fundsChange < 0 ? node.id : 'wallet',
      'success'
    );

    // 更新状态
    this.state = {
      ...this.state,
      funds: newFunds,
      transactions: [...this.state.transactions, transaction],
    };
    this.notifyListeners();

    // 将下游节点加入执行队列
    const downstreamNodes = getDownstreamNodes(
      this.executionGraph,
      node.id,
      result.nextOutputPort
    );

    for (const downstreamNodeId of downstreamNodes) {
      this.executionQueue.push({
        nodeId: downstreamNodeId,
        inputData: {
          ...queueItem.inputData,
          ...result.outputData,
          funds: newFunds,
        },
        sourcePort: result.nextOutputPort,
      });
    }

    // 调度下一步
    this.scheduleNextStep();
  }

  /**
   * 调度下一步执行
   */
  private scheduleNextStep(): void {
    if (this.state.status !== 'running') {
      return;
    }

    // 计算步骤间隔时间（速度越快，间隔越短）
    const interval = this.config.baseStepInterval / this.speed;

    this.stepTimer = setTimeout(() => {
      this.executeStep();
    }, interval);
  }

  /**
   * 清除步骤定时器
   */
  private clearStepTimer(): void {
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  /**
   * 完成模拟
   */
  private completeSimulation(): void {
    this.clearStepTimer();
    this.state = {
      ...this.state,
      status: this.errors.length > 0 ? 'error' : 'completed',
      activeNodeId: null,
    };
    this.notifyListeners();
  }

  /**
   * 添加错误
   */
  private addError(code: string, message: string, nodeId?: string): void {
    this.errors.push({ code, message, nodeId });
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(stateCopy);
      } catch (error) {
        console.error('State change listener error:', error);
      }
    }
  }

  /**
   * 重置引擎状态
   */
  reset(): void {
    this.clearStepTimer();
    this.strategy = null;
    this.executionGraph = null;
    this.executionQueue = [];
    this.errors = [];
    this.state = createInitialState();
    this.notifyListeners();
  }

  /**
   * 获取当前速度
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * 获取错误列表
   */
  getErrors(): SimulationError[] {
    return [...this.errors];
  }

  /**
   * 验证策略有效性
   * 在开始模拟前检测无效策略
   * @requirements 2.4
   */
  validateStrategy(): { valid: boolean; errors: SimulationError[] } {
    if (!this.strategy || !this.executionGraph) {
      return {
        valid: false,
        errors: [{ code: 'NO_STRATEGY', message: '没有加载策略' }],
      };
    }

    const validation = validateExecutionGraph(this.executionGraph);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors.map((msg) => ({
          code: 'INVALID_STRATEGY',
          message: msg,
        })),
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * 检查是否可以开始模拟
   */
  canStart(): boolean {
    return this.strategy !== null && this.state.status !== 'running';
  }

  /**
   * 检查是否可以暂停
   */
  canPause(): boolean {
    return this.state.status === 'running';
  }

  /**
   * 检查是否可以恢复
   */
  canResume(): boolean {
    return this.state.status === 'paused';
  }
}

/**
 * 模拟引擎单例
 */
export const simulationEngine = new SimulationEngine();

/**
 * 创建模拟引擎实例（用于测试）
 */
export function createSimulationEngine(
  config?: SimulationEngineConfig
): SimulationEngine {
  return new SimulationEngine(config);
}
