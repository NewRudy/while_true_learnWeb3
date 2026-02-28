/**
 * Connection Validator
 * 连接验证器
 *
 * @description 提供全面的模块连接验证功能，供策略构建器使用
 * @requirements 7.6, 1.3, 1.5
 */

import { PortDefinition, PortDataType, ModuleType } from '@/types';
import { moduleDefinitions } from './module-definitions';

/**
 * 连接验证结果
 */
export interface ConnectionValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误代码（如果无效） */
  errorCode?: ConnectionErrorCode;
  /** 错误消息（如果无效） */
  errorMessage?: string;
  /** 源端口数据类型 */
  sourceDataType?: PortDataType;
  /** 目标端口数据类型 */
  targetDataType?: PortDataType;
}

/**
 * 连接错误代码
 */
export enum ConnectionErrorCode {
  /** 端口类型不兼容 */
  INCOMPATIBLE_PORT_TYPES = 'INCOMPATIBLE_PORT_TYPES',
  /** 源端口不存在 */
  SOURCE_PORT_NOT_FOUND = 'SOURCE_PORT_NOT_FOUND',
  /** 目标端口不存在 */
  TARGET_PORT_NOT_FOUND = 'TARGET_PORT_NOT_FOUND',
  /** 源模块不存在 */
  SOURCE_MODULE_NOT_FOUND = 'SOURCE_MODULE_NOT_FOUND',
  /** 目标模块不存在 */
  TARGET_MODULE_NOT_FOUND = 'TARGET_MODULE_NOT_FOUND',
  /** 自连接不允许 */
  SELF_CONNECTION_NOT_ALLOWED = 'SELF_CONNECTION_NOT_ALLOWED',
  /** 连接方向错误（输出到输出或输入到输入） */
  INVALID_CONNECTION_DIRECTION = 'INVALID_CONNECTION_DIRECTION',
}

/**
 * 错误消息映射
 */
const errorMessages: Record<ConnectionErrorCode, string> = {
  [ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES]: '端口类型不兼容：只有相同类型的端口才能连接',
  [ConnectionErrorCode.SOURCE_PORT_NOT_FOUND]: '源端口不存在',
  [ConnectionErrorCode.TARGET_PORT_NOT_FOUND]: '目标端口不存在',
  [ConnectionErrorCode.SOURCE_MODULE_NOT_FOUND]: '源模块不存在',
  [ConnectionErrorCode.TARGET_MODULE_NOT_FOUND]: '目标模块不存在',
  [ConnectionErrorCode.SELF_CONNECTION_NOT_ALLOWED]: '不允许模块自连接',
  [ConnectionErrorCode.INVALID_CONNECTION_DIRECTION]: '连接方向错误：必须从输出端口连接到输入端口',
};

/**
 * 端口类型中文名称映射
 */
const portTypeNames: Record<PortDataType, string> = {
  fund: '资金流',
  signal: '信号流',
  data: '数据流',
};

/**
 * 验证两个端口是否可以连接
 * 只有相同数据类型的端口才能连接（fund-fund, signal-signal, data-data）
 *
 * @param source 源端口定义
 * @param target 目标端口定义
 * @returns 验证结果
 *
 * @requirements 7.6 - THE Module_System SHALL validate module connections based on input/output types
 * @requirements 1.3 - WHEN a Player connects two Strategy_Modules THEN the Strategy_Builder SHALL validate the connection type
 * @requirements 1.5 - IF a Player creates an invalid connection THEN the Strategy_Builder SHALL display an error message and prevent the connection
 */
export function validateConnection(
  source: PortDefinition,
  target: PortDefinition
): ConnectionValidationResult {
  // 检查端口数据类型是否兼容
  if (source.dataType !== target.dataType) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES,
      errorMessage: getIncompatibleTypeMessage(source.dataType, target.dataType),
      sourceDataType: source.dataType,
      targetDataType: target.dataType,
    };
  }

  // 端口类型兼容，连接有效
  return {
    valid: true,
    sourceDataType: source.dataType,
    targetDataType: target.dataType,
  };
}

/**
 * 验证模块间的连接
 * 提供更全面的验证，包括模块和端口的存在性检查
 *
 * @param sourceModuleType 源模块类型
 * @param sourcePortId 源端口ID
 * @param targetModuleType 目标模块类型
 * @param targetPortId 目标端口ID
 * @param sourceNodeId 源节点ID（可选，用于检测自连接）
 * @param targetNodeId 目标节点ID（可选，用于检测自连接）
 * @returns 验证结果
 */
export function validateModuleConnection(
  sourceModuleType: ModuleType,
  sourcePortId: string,
  targetModuleType: ModuleType,
  targetPortId: string,
  sourceNodeId?: string,
  targetNodeId?: string
): ConnectionValidationResult {
  // 检查自连接
  if (sourceNodeId && targetNodeId && sourceNodeId === targetNodeId) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.SELF_CONNECTION_NOT_ALLOWED,
      errorMessage: errorMessages[ConnectionErrorCode.SELF_CONNECTION_NOT_ALLOWED],
    };
  }

  // 获取源模块定义
  const sourceModule = moduleDefinitions[sourceModuleType];
  if (!sourceModule) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.SOURCE_MODULE_NOT_FOUND,
      errorMessage: errorMessages[ConnectionErrorCode.SOURCE_MODULE_NOT_FOUND],
    };
  }

  // 获取目标模块定义
  const targetModule = moduleDefinitions[targetModuleType];
  if (!targetModule) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.TARGET_MODULE_NOT_FOUND,
      errorMessage: errorMessages[ConnectionErrorCode.TARGET_MODULE_NOT_FOUND],
    };
  }

  // 查找源端口（必须是输出端口）
  const sourcePort = sourceModule.outputs.find((p) => p.id === sourcePortId);
  if (!sourcePort) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.SOURCE_PORT_NOT_FOUND,
      errorMessage: `源模块 "${sourceModule.name}" 没有输出端口 "${sourcePortId}"`,
    };
  }

  // 查找目标端口（必须是输入端口）
  const targetPort = targetModule.inputs.find((p) => p.id === targetPortId);
  if (!targetPort) {
    return {
      valid: false,
      errorCode: ConnectionErrorCode.TARGET_PORT_NOT_FOUND,
      errorMessage: `目标模块 "${targetModule.name}" 没有输入端口 "${targetPortId}"`,
    };
  }

  // 验证端口类型兼容性
  return validateConnection(sourcePort, targetPort);
}

/**
 * 检查端口类型是否兼容
 * 简单的布尔值返回，用于快速检查
 *
 * @param sourceDataType 源端口数据类型
 * @param targetDataType 目标端口数据类型
 * @returns 是否兼容
 */
export function arePortTypesCompatible(
  sourceDataType: PortDataType,
  targetDataType: PortDataType
): boolean {
  return sourceDataType === targetDataType;
}

/**
 * 获取端口类型的中文名称
 *
 * @param dataType 端口数据类型
 * @returns 中文名称
 */
export function getPortTypeName(dataType: PortDataType): string {
  return portTypeNames[dataType] || dataType;
}

/**
 * 获取不兼容类型的错误消息
 *
 * @param sourceType 源端口类型
 * @param targetType 目标端口类型
 * @returns 详细的错误消息
 */
export function getIncompatibleTypeMessage(
  sourceType: PortDataType,
  targetType: PortDataType
): string {
  const sourceName = getPortTypeName(sourceType);
  const targetName = getPortTypeName(targetType);
  return `端口类型不兼容：无法将 ${sourceName}(${sourceType}) 连接到 ${targetName}(${targetType})。只有相同类型的端口才能连接。`;
}

/**
 * 获取所有有效的端口数据类型
 *
 * @returns 端口数据类型数组
 */
export function getAllPortDataTypes(): PortDataType[] {
  return ['fund', 'signal', 'data'];
}

/**
 * 验证端口数据类型是否有效
 *
 * @param dataType 要验证的数据类型
 * @returns 是否是有效的端口数据类型
 */
export function isValidPortDataType(dataType: string): dataType is PortDataType {
  return getAllPortDataTypes().includes(dataType as PortDataType);
}

/**
 * 获取模块的所有可连接端口信息
 * 用于UI显示可用的连接点
 *
 * @param moduleType 模块类型
 * @returns 输入和输出端口信息
 */
export function getModuleConnectionPorts(moduleType: ModuleType): {
  inputs: PortDefinition[];
  outputs: PortDefinition[];
} | null {
  const module = moduleDefinitions[moduleType];
  if (!module) {
    return null;
  }
  return {
    inputs: module.inputs,
    outputs: module.outputs,
  };
}

/**
 * 查找两个模块之间所有可能的有效连接
 * 用于自动连接建议
 *
 * @param sourceModuleType 源模块类型
 * @param targetModuleType 目标模块类型
 * @returns 所有可能的有效连接对
 */
export function findValidConnections(
  sourceModuleType: ModuleType,
  targetModuleType: ModuleType
): Array<{ sourcePortId: string; targetPortId: string; dataType: PortDataType }> {
  const sourceModule = moduleDefinitions[sourceModuleType];
  const targetModule = moduleDefinitions[targetModuleType];

  if (!sourceModule || !targetModule) {
    return [];
  }

  const validConnections: Array<{
    sourcePortId: string;
    targetPortId: string;
    dataType: PortDataType;
  }> = [];

  // 遍历所有输出端口和输入端口的组合
  for (const outputPort of sourceModule.outputs) {
    for (const inputPort of targetModule.inputs) {
      if (outputPort.dataType === inputPort.dataType) {
        validConnections.push({
          sourcePortId: outputPort.id,
          targetPortId: inputPort.id,
          dataType: outputPort.dataType,
        });
      }
    }
  }

  return validConnections;
}

/**
 * 检查是否可以在两个模块之间建立任何连接
 *
 * @param sourceModuleType 源模块类型
 * @param targetModuleType 目标模块类型
 * @returns 是否可以建立连接
 */
export function canModulesConnect(
  sourceModuleType: ModuleType,
  targetModuleType: ModuleType
): boolean {
  return findValidConnections(sourceModuleType, targetModuleType).length > 0;
}
