/**
 * Module System Implementation
 * 模块系统实现
 *
 * @description 实现 IModuleSystem 接口，管理所有策略模块
 * @requirements 7.1, 7.2, 7.3, 7.6
 */

import {
  ModuleType,
  ModuleConfig,
  ModuleDefinition,
  PortDefinition,
  IModuleSystem,
} from '@/types';
import { moduleDefinitions, getAllModuleDefinitions } from './module-definitions';

/**
 * 类别名称映射
 */
const categoryNames: Record<string, string> = {
  basic: '基础模块',
  advanced: '高级模块',
  risk: '风控模块',
};

/**
 * Module System 实现类
 */
export class ModuleSystem implements IModuleSystem {
  /**
   * 获取指定等级可用的模块列表
   * @param unlockedLevel 当前解锁等级
   * @returns 可用的模块定义列表
   */
  getAvailableModules(unlockedLevel: number): ModuleDefinition[] {
    return getAllModuleDefinitions().filter((m) => m.unlockLevel <= unlockedLevel);
  }

  /**
   * 获取模块定义
   * @param type 模块类型
   * @returns 模块定义
   * @throws 如果模块类型不存在
   */
  getModuleDefinition(type: ModuleType): ModuleDefinition {
    const definition = moduleDefinitions[type];
    if (!definition) {
      throw new Error(`Module type "${type}" not found`);
    }
    return definition;
  }

  /**
   * 验证两个端口是否可以连接
   * 只有相同数据类型的端口才能连接
   * @param source 源端口
   * @param target 目标端口
   * @returns 是否可以连接
   */
  validateConnection(source: PortDefinition, target: PortDefinition): boolean {
    return source.dataType === target.dataType;
  }

  /**
   * 创建模块实例
   * @param type 模块类型
   * @returns 模块配置实例
   */
  createModuleInstance(type: ModuleType): ModuleConfig {
    const definition = this.getModuleDefinition(type);
    return {
      moduleType: type,
      params: { ...definition.defaultParams },
    };
  }

  /**
   * 检查模块是否已解锁
   * @param type 模块类型
   * @param currentLevel 当前等级
   * @returns 是否已解锁
   */
  isModuleUnlocked(type: ModuleType, currentLevel: number): boolean {
    const definition = this.getModuleDefinition(type);
    return definition.unlockLevel <= currentLevel;
  }

  /**
   * 获取模块的输入端口
   * @param type 模块类型
   * @returns 输入端口列表
   */
  getModuleInputs(type: ModuleType): PortDefinition[] {
    const definition = this.getModuleDefinition(type);
    return definition.inputs;
  }

  /**
   * 获取模块的输出端口
   * @param type 模块类型
   * @returns 输出端口列表
   */
  getModuleOutputs(type: ModuleType): PortDefinition[] {
    const definition = this.getModuleDefinition(type);
    return definition.outputs;
  }

  /**
   * 查找指定模块的端口
   * @param type 模块类型
   * @param portId 端口ID
   * @param direction 端口方向
   * @returns 端口定义或undefined
   */
  findPort(
    type: ModuleType,
    portId: string,
    direction: 'input' | 'output'
  ): PortDefinition | undefined {
    const definition = this.getModuleDefinition(type);
    const ports = direction === 'input' ? definition.inputs : definition.outputs;
    return ports.find((p) => p.id === portId);
  }

  /**
   * 获取模块类别的中文名称
   * @param type 模块类型
   * @returns 类别中文名称
   */
  getModuleCategoryName(type: ModuleType): string {
    const definition = this.getModuleDefinition(type);
    return categoryNames[definition.category] || definition.category;
  }
}

/**
 * 模块系统单例
 */
export const moduleSystem = new ModuleSystem();

/**
 * 导出模块系统创建函数（用于测试）
 */
export function createModuleSystem(): IModuleSystem {
  return new ModuleSystem();
}
