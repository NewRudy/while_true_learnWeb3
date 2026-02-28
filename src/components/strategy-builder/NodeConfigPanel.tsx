/**
 * Node Config Panel Component
 * 节点配置面板组件
 *
 * @description 显示选中节点的参数配置界面，支持参数验证和错误提示
 * @requirements 1.4
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import { moduleSystem } from '@/systems';
import type { ModuleParamValue, ModuleDefinition } from '@/types';

/**
 * 参数验证错误类型
 */
interface ParamValidationError {
  field: string;
  message: string;
}

/**
 * 参数字段配置
 */
interface ParamFieldConfig {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
}

/**
 * 获取参数字段配置
 * 根据模块类型和参数名称返回字段配置
 */
function getParamFieldConfig(
  _moduleDef: ModuleDefinition,
  paramKey: string,
  defaultValue: ModuleParamValue
): ParamFieldConfig {
  const baseConfig: ParamFieldConfig = {
    key: paramKey,
    label: getParamLabel(paramKey),
    type: typeof defaultValue === 'boolean' ? 'boolean' : typeof defaultValue === 'number' ? 'number' : 'string',
    required: true,
  };

  // 根据参数名称添加特定配置
  switch (paramKey) {
    case 'amount':
    case 'amountA':
    case 'amountB':
      return {
        ...baseConfig,
        type: 'number',
        min: 0,
        step: 1,
        placeholder: '输入金额',
      };
    case 'amountType':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'fixed', label: '固定金额' },
          { value: 'percent', label: '百分比' },
        ],
      };
    case 'asset':
    case 'token':
    case 'fromToken':
    case 'toToken':
    case 'tokenA':
    case 'tokenB':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'ETH', label: 'ETH' },
          { value: 'USDC', label: 'USDC' },
          { value: 'USDT', label: 'USDT' },
          { value: 'BTC', label: 'BTC' },
          { value: 'DAI', label: 'DAI' },
        ],
      };
    case 'orderType':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'market', label: '市价单' },
          { value: 'limit', label: '限价单' },
        ],
      };
    case 'operator':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'gt', label: '大于 (>)' },
          { value: 'gte', label: '大于等于 (>=)' },
          { value: 'lt', label: '小于 (<)' },
          { value: 'lte', label: '小于等于 (<=)' },
          { value: 'eq', label: '等于 (=)' },
        ],
      };
    case 'dataSource':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'price', label: '价格' },
          { value: 'balance', label: '余额' },
          { value: 'volume', label: '交易量' },
        ],
      };
    case 'durationType':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'blocks', label: '区块数' },
          { value: 'seconds', label: '秒' },
          { value: 'minutes', label: '分钟' },
        ],
      };
    case 'duration':
    case 'lockPeriod':
      return {
        ...baseConfig,
        type: 'number',
        min: 0,
        step: 1,
        placeholder: '输入时长',
      };
    case 'percentage':
    case 'stopLossPercent':
    case 'takeProfitPercent':
    case 'riskPerTrade':
    case 'maxPositionSize':
      return {
        ...baseConfig,
        type: 'number',
        min: 0,
        max: 100,
        step: 0.1,
        placeholder: '输入百分比',
      };
    case 'slippageTolerance':
      return {
        ...baseConfig,
        type: 'number',
        min: 0,
        max: 50,
        step: 0.1,
        placeholder: '滑点容忍度 (%)',
      };
    case 'threshold':
    case 'triggerPrice':
      return {
        ...baseConfig,
        type: 'number',
        min: 0,
        step: 0.01,
        placeholder: '输入阈值',
      };
    case 'toAddress':
      return {
        ...baseConfig,
        type: 'string',
        placeholder: '输入钱包地址 (0x...)',
      };
    case 'pool':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'uniswap_v3', label: 'Uniswap V3' },
          { value: 'uniswap_v2', label: 'Uniswap V2' },
          { value: 'sushiswap', label: 'SushiSwap' },
        ],
      };
    case 'protocol':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'lido', label: 'Lido' },
          { value: 'rocketpool', label: 'Rocket Pool' },
          { value: 'aave', label: 'Aave' },
        ],
      };
    case 'stopLossType':
    case 'takeProfitType':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'fixed', label: '固定价格' },
          { value: 'trailing', label: '追踪止损/止盈' },
        ],
      };
    case 'sizingMethod':
      return {
        ...baseConfig,
        type: 'select',
        options: [
          { value: 'percent', label: '百分比' },
          { value: 'fixed', label: '固定金额' },
          { value: 'kelly', label: 'Kelly公式' },
        ],
      };
    default:
      return baseConfig;
  }
}

/**
 * 获取参数显示标签
 */
function getParamLabel(paramKey: string): string {
  const labels: Record<string, string> = {
    amount: '金额',
    amountA: '代币A金额',
    amountB: '代币B金额',
    amountType: '金额类型',
    asset: '资产',
    token: '代币',
    fromToken: '源代币',
    toToken: '目标代币',
    tokenA: '代币A',
    tokenB: '代币B',
    orderType: '订单类型',
    operator: '比较运算符',
    threshold: '阈值',
    dataSource: '数据源',
    duration: '持续时间',
    durationType: '时间单位',
    percentage: '百分比',
    slippageTolerance: '滑点容忍度',
    pool: '流动性池',
    protocol: '协议',
    lockPeriod: '锁定期(天)',
    stopLossPercent: '止损百分比',
    stopLossType: '止损类型',
    takeProfitPercent: '止盈百分比',
    takeProfitType: '止盈类型',
    triggerPrice: '触发价格',
    riskPerTrade: '单笔风险(%)',
    maxPositionSize: '最大仓位(%)',
    sizingMethod: '仓位计算方式',
    toAddress: '目标地址',
  };
  return labels[paramKey] || paramKey;
}

/**
 * 验证参数值
 */
function validateParamValue(
  config: ParamFieldConfig,
  value: ModuleParamValue
): ParamValidationError | null {
  // 必填验证
  if (config.required && (value === '' || value === undefined || value === null)) {
    return { field: config.key, message: `${config.label}不能为空` };
  }

  // 数字类型验证
  if (config.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { field: config.key, message: `${config.label}必须是有效数字` };
    }
    if (config.min !== undefined && numValue < config.min) {
      return { field: config.key, message: `${config.label}不能小于 ${config.min}` };
    }
    if (config.max !== undefined && numValue > config.max) {
      return { field: config.key, message: `${config.label}不能大于 ${config.max}` };
    }
  }

  // 地址格式验证
  if (config.key === 'toAddress' && value && typeof value === 'string') {
    if (value && !value.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { field: config.key, message: '请输入有效的以太坊地址 (0x...)' };
    }
  }

  return null;
}

/**
 * 参数输入字段组件
 */
interface ParamFieldProps {
  config: ParamFieldConfig;
  value: ModuleParamValue;
  error?: string;
  onChange: (key: string, value: ModuleParamValue) => void;
}

function ParamField({ config, value, error, onChange }: ParamFieldProps) {
  const handleChange = useCallback(
    (newValue: ModuleParamValue) => {
      onChange(config.key, newValue);
    },
    [config.key, onChange]
  );

  const baseInputClass = `
    w-full px-3 py-2 bg-gray-800 border rounded-md text-white text-sm
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    transition-colors
    ${error ? 'border-red-500' : 'border-white/10 hover:border-white/20'}
  `;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {config.label}
        {config.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {config.type === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-gray-800 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-400">启用</span>
        </label>
      ) : config.type === 'select' ? (
        <select
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          className={baseInputClass}
        >
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : config.type === 'number' ? (
        <input
          type="number"
          value={value as number}
          onChange={(e) => handleChange(e.target.valueAsNumber || 0)}
          min={config.min}
          max={config.max}
          step={config.step}
          placeholder={config.placeholder}
          className={baseInputClass}
        />
      ) : (
        <input
          type="text"
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config.placeholder}
          className={baseInputClass}
        />
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 节点配置面板组件
 */
export default function NodeConfigPanel() {
  const selectedNodeId = useStrategyBuilderStore((state) => state.selectedNodeId);
  const nodes = useStrategyBuilderStore((state) => state.nodes);
  const updateNodeConfig = useStrategyBuilderStore((state) => state.updateNodeConfig);
  const removeNode = useStrategyBuilderStore((state) => state.removeNode);
  const selectNode = useStrategyBuilderStore((state) => state.selectNode);

  // 验证错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取选中的节点
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  // 获取模块定义
  const moduleDef = useMemo(() => {
    if (!selectedNode) return null;
    return moduleSystem.getModuleDefinition(selectedNode.data.moduleType);
  }, [selectedNode]);

  // 获取参数字段配置列表
  const paramFields = useMemo(() => {
    if (!moduleDef || !selectedNode) return [];
    return Object.entries(moduleDef.defaultParams).map(([key, defaultValue]) =>
      getParamFieldConfig(moduleDef, key, defaultValue)
    );
  }, [moduleDef, selectedNode]);

  // 清除错误当节点变化时
  useEffect(() => {
    setErrors({});
  }, [selectedNodeId]);

  // 处理参数变更
  const handleParamChange = useCallback(
    (key: string, value: ModuleParamValue) => {
      if (!selectedNodeId || !moduleDef) return;

      // 获取字段配置
      const fieldConfig = paramFields.find((f) => f.key === key);
      if (!fieldConfig) return;

      // 验证新值
      const validationError = validateParamValue(fieldConfig, value);

      // 更新错误状态
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (validationError) {
          newErrors[key] = validationError.message;
        } else {
          delete newErrors[key];
        }
        return newErrors;
      });

      // 更新节点配置（即使有错误也更新，让用户看到输入）
      updateNodeConfig(selectedNodeId, {
        params: { [key]: value },
      });
    },
    [selectedNodeId, moduleDef, paramFields, updateNodeConfig]
  );

  // 处理删除节点
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
    }
  }, [selectedNodeId, removeNode]);

  // 处理关闭面板
  const handleClose = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // 如果没有选中节点，不显示面板
  if (!selectedNode || !moduleDef) {
    return null;
  }

  // 获取类别颜色
  const categoryColors = {
    basic: 'bg-emerald-500',
    advanced: 'bg-blue-500',
    risk: 'bg-amber-500',
  };

  const categoryLabels = {
    basic: '基础模块',
    advanced: '高级模块',
    risk: '风控模块',
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-white/10 flex flex-col h-full">
      {/* 面板头部 */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${categoryColors[moduleDef.category]}`} />
            <h3 className="text-white font-semibold">{moduleDef.name}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="关闭面板"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400">{moduleDef.description}</p>
        <div className="mt-2">
          <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[moduleDef.category]} text-white`}>
            {categoryLabels[moduleDef.category]}
          </span>
        </div>
      </div>

      {/* 参数配置区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          参数配置
        </h4>

        {paramFields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">此模块没有可配置的参数</p>
        ) : (
          <div className="space-y-4">
            {paramFields.map((fieldConfig) => (
              <ParamField
                key={fieldConfig.key}
                config={fieldConfig}
                value={selectedNode.data.params[fieldConfig.key] ?? ''}
                error={errors[fieldConfig.key]}
                onChange={handleParamChange}
              />
            ))}
          </div>
        )}

        {/* 验证状态提示 */}
        {hasErrors && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-xs text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              请修正上述错误后再运行策略
            </p>
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={handleDeleteNode}
          className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          删除此模块
        </button>
      </div>
    </div>
  );
}
