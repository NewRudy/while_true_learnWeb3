/**
 * Module System Tests
 * 模块系统单元测试
 *
 * @description 测试模块系统的核心功能
 * @requirements 7.1, 7.2, 7.3, 7.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleSystem, moduleSystem } from './module-system';
import {
  moduleDefinitions,
  getAllModuleDefinitions,
  getModulesByCategory,
} from './module-definitions';
import { ModuleType, PortDefinition } from '../../types';

describe('ModuleSystem', () => {
  let system: ModuleSystem;

  beforeEach(() => {
    system = new ModuleSystem();
  });

  describe('getModuleDefinition', () => {
    it('should return correct definition for BUY module', () => {
      const definition = system.getModuleDefinition(ModuleType.BUY);
      expect(definition.type).toBe(ModuleType.BUY);
      expect(definition.name).toBe('买入');
      expect(definition.category).toBe('basic');
    });

    it('should return correct definition for SWAP module', () => {
      const definition = system.getModuleDefinition(ModuleType.SWAP);
      expect(definition.type).toBe(ModuleType.SWAP);
      expect(definition.name).toBe('兑换');
      expect(definition.category).toBe('advanced');
    });

    it('should return correct definition for STOP_LOSS module', () => {
      const definition = system.getModuleDefinition(ModuleType.STOP_LOSS);
      expect(definition.type).toBe(ModuleType.STOP_LOSS);
      expect(definition.name).toBe('止损');
      expect(definition.category).toBe('risk');
    });

    it('should throw error for invalid module type', () => {
      expect(() => {
        system.getModuleDefinition('invalid' as ModuleType);
      }).toThrow('Module type "invalid" not found');
    });
  });

  describe('getAvailableModules', () => {
    it('should return only level 1 modules for level 1', () => {
      const modules = system.getAvailableModules(1);
      expect(modules.length).toBeGreaterThan(0);
      modules.forEach((module) => {
        expect(module.unlockLevel).toBeLessThanOrEqual(1);
      });
    });

    it('should return more modules for higher levels', () => {
      const level1Modules = system.getAvailableModules(1);
      const level5Modules = system.getAvailableModules(5);
      expect(level5Modules.length).toBeGreaterThan(level1Modules.length);
    });

    it('should return all modules for max level', () => {
      const allModules = getAllModuleDefinitions();
      const maxLevel = Math.max(...allModules.map((m) => m.unlockLevel));
      const availableModules = system.getAvailableModules(maxLevel);
      expect(availableModules.length).toBe(allModules.length);
    });

    it('should return empty array for level 0', () => {
      const modules = system.getAvailableModules(0);
      expect(modules.length).toBe(0);
    });
  });

  describe('validateConnection', () => {
    it('should allow connection between same data types (fund)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'fund' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'fund' };
      expect(system.validateConnection(source, target)).toBe(true);
    });

    it('should allow connection between same data types (signal)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'signal' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'signal' };
      expect(system.validateConnection(source, target)).toBe(true);
    });

    it('should allow connection between same data types (data)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'data' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'data' };
      expect(system.validateConnection(source, target)).toBe(true);
    });

    it('should reject connection between different data types (fund to signal)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'fund' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'signal' };
      expect(system.validateConnection(source, target)).toBe(false);
    });

    it('should reject connection between different data types (signal to data)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'signal' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'data' };
      expect(system.validateConnection(source, target)).toBe(false);
    });

    it('should reject connection between different data types (data to fund)', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'data' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'fund' };
      expect(system.validateConnection(source, target)).toBe(false);
    });
  });

  describe('createModuleInstance', () => {
    it('should create BUY module instance with default params', () => {
      const instance = system.createModuleInstance(ModuleType.BUY);
      expect(instance.moduleType).toBe(ModuleType.BUY);
      expect(instance.params).toHaveProperty('amount');
      expect(instance.params).toHaveProperty('amountType');
      expect(instance.params).toHaveProperty('asset');
    });

    it('should create SWAP module instance with default params', () => {
      const instance = system.createModuleInstance(ModuleType.SWAP);
      expect(instance.moduleType).toBe(ModuleType.SWAP);
      expect(instance.params).toHaveProperty('fromToken');
      expect(instance.params).toHaveProperty('toToken');
      expect(instance.params).toHaveProperty('slippageTolerance');
    });

    it('should create STOP_LOSS module instance with default params', () => {
      const instance = system.createModuleInstance(ModuleType.STOP_LOSS);
      expect(instance.moduleType).toBe(ModuleType.STOP_LOSS);
      expect(instance.params).toHaveProperty('stopLossPercent');
      expect(instance.params).toHaveProperty('stopLossType');
    });

    it('should create independent instances (not sharing params)', () => {
      const instance1 = system.createModuleInstance(ModuleType.BUY);
      const instance2 = system.createModuleInstance(ModuleType.BUY);
      instance1.params.amount = 999;
      expect(instance2.params.amount).not.toBe(999);
    });
  });

  describe('isModuleUnlocked', () => {
    it('should return true for BUY module at level 1', () => {
      expect(system.isModuleUnlocked(ModuleType.BUY, 1)).toBe(true);
    });

    it('should return false for SWAP module at level 1', () => {
      expect(system.isModuleUnlocked(ModuleType.SWAP, 1)).toBe(false);
    });

    it('should return true for SWAP module at level 3', () => {
      expect(system.isModuleUnlocked(ModuleType.SWAP, 3)).toBe(true);
    });

    it('should return true for STAKE module at level 5', () => {
      expect(system.isModuleUnlocked(ModuleType.STAKE, 5)).toBe(true);
    });
  });

  describe('getModuleInputs and getModuleOutputs', () => {
    it('should return inputs for BUY module', () => {
      const inputs = system.getModuleInputs(ModuleType.BUY);
      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs.some((p) => p.dataType === 'fund')).toBe(true);
    });

    it('should return outputs for BUY module', () => {
      const outputs = system.getModuleOutputs(ModuleType.BUY);
      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should return multiple inputs for LIQUIDITY_ADD module', () => {
      const inputs = system.getModuleInputs(ModuleType.LIQUIDITY_ADD);
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findPort', () => {
    it('should find input port by id', () => {
      const port = system.findPort(ModuleType.BUY, 'fund_in', 'input');
      expect(port).toBeDefined();
      expect(port?.dataType).toBe('fund');
    });

    it('should find output port by id', () => {
      const port = system.findPort(ModuleType.BUY, 'remaining', 'output');
      expect(port).toBeDefined();
      expect(port?.dataType).toBe('fund');
    });

    it('should return undefined for non-existent port', () => {
      const port = system.findPort(ModuleType.BUY, 'non_existent', 'input');
      expect(port).toBeUndefined();
    });
  });

  describe('getModuleCategoryName', () => {
    it('should return Chinese name for basic category', () => {
      const name = system.getModuleCategoryName(ModuleType.BUY);
      expect(name).toBe('基础模块');
    });

    it('should return Chinese name for advanced category', () => {
      const name = system.getModuleCategoryName(ModuleType.SWAP);
      expect(name).toBe('高级模块');
    });

    it('should return Chinese name for risk category', () => {
      const name = system.getModuleCategoryName(ModuleType.STOP_LOSS);
      expect(name).toBe('风控模块');
    });
  });
});

describe('Module Definitions', () => {
  describe('Basic Modules (Requirement 7.1)', () => {
    const basicModules = [
      ModuleType.BUY,
      ModuleType.SELL,
      ModuleType.TRANSFER,
      ModuleType.HOLD,
      ModuleType.CONDITION,
    ];

    it('should have all 5 basic modules defined', () => {
      basicModules.forEach((type) => {
        expect(moduleDefinitions[type]).toBeDefined();
        expect(moduleDefinitions[type].category).toBe('basic');
      });
    });

    it('should have Chinese names for all basic modules', () => {
      basicModules.forEach((type) => {
        expect(moduleDefinitions[type].name).toBeTruthy();
        // Check that name contains Chinese characters
        expect(/[\u4e00-\u9fa5]/.test(moduleDefinitions[type].name)).toBe(true);
      });
    });

    it('should have descriptions for all basic modules', () => {
      basicModules.forEach((type) => {
        expect(moduleDefinitions[type].description).toBeTruthy();
        expect(moduleDefinitions[type].description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Advanced Modules (Requirement 7.2)', () => {
    const advancedModules = [
      ModuleType.SWAP,
      ModuleType.LIQUIDITY_ADD,
      ModuleType.LIQUIDITY_REMOVE,
      ModuleType.STAKE,
      ModuleType.UNSTAKE,
    ];

    it('should have all 5 advanced modules defined', () => {
      advancedModules.forEach((type) => {
        expect(moduleDefinitions[type]).toBeDefined();
        expect(moduleDefinitions[type].category).toBe('advanced');
      });
    });

    it('should have Chinese names for all advanced modules', () => {
      advancedModules.forEach((type) => {
        expect(moduleDefinitions[type].name).toBeTruthy();
        expect(/[\u4e00-\u9fa5]/.test(moduleDefinitions[type].name)).toBe(true);
      });
    });

    it('should have higher unlock levels than basic modules', () => {
      advancedModules.forEach((type) => {
        expect(moduleDefinitions[type].unlockLevel).toBeGreaterThan(2);
      });
    });
  });

  describe('Risk Modules (Requirement 7.3)', () => {
    const riskModules = [
      ModuleType.STOP_LOSS,
      ModuleType.TAKE_PROFIT,
      ModuleType.POSITION_SIZE,
    ];

    it('should have all 3 risk modules defined', () => {
      riskModules.forEach((type) => {
        expect(moduleDefinitions[type]).toBeDefined();
        expect(moduleDefinitions[type].category).toBe('risk');
      });
    });

    it('should have Chinese names for all risk modules', () => {
      riskModules.forEach((type) => {
        expect(moduleDefinitions[type].name).toBeTruthy();
        expect(/[\u4e00-\u9fa5]/.test(moduleDefinitions[type].name)).toBe(true);
      });
    });

    it('should have appropriate default params for risk management', () => {
      expect(moduleDefinitions[ModuleType.STOP_LOSS].defaultParams).toHaveProperty('stopLossPercent');
      expect(moduleDefinitions[ModuleType.TAKE_PROFIT].defaultParams).toHaveProperty('takeProfitPercent');
      expect(moduleDefinitions[ModuleType.POSITION_SIZE].defaultParams).toHaveProperty('riskPerTrade');
    });
  });

  describe('All Modules', () => {
    it('should have exactly 13 modules defined', () => {
      const allModules = getAllModuleDefinitions();
      expect(allModules.length).toBe(13);
    });

    it('should have unique types for all modules', () => {
      const allModules = getAllModuleDefinitions();
      const types = allModules.map((m) => m.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('should have inputs and outputs for all modules', () => {
      const allModules = getAllModuleDefinitions();
      allModules.forEach((module) => {
        expect(module.inputs.length).toBeGreaterThan(0);
        expect(module.outputs.length).toBeGreaterThan(0);
      });
    });

    it('should have valid port definitions for all modules', () => {
      const allModules = getAllModuleDefinitions();
      const validDataTypes = ['fund', 'signal', 'data'];

      allModules.forEach((module) => {
        module.inputs.forEach((port) => {
          expect(port.id).toBeTruthy();
          expect(port.name).toBeTruthy();
          expect(validDataTypes).toContain(port.dataType);
        });
        module.outputs.forEach((port) => {
          expect(port.id).toBeTruthy();
          expect(port.name).toBeTruthy();
          expect(validDataTypes).toContain(port.dataType);
        });
      });
    });
  });

  describe('getModulesByCategory', () => {
    it('should return 5 basic modules', () => {
      const basicModules = getModulesByCategory('basic');
      expect(basicModules.length).toBe(5);
      basicModules.forEach((m) => expect(m.category).toBe('basic'));
    });

    it('should return 5 advanced modules', () => {
      const advancedModules = getModulesByCategory('advanced');
      expect(advancedModules.length).toBe(5);
      advancedModules.forEach((m) => expect(m.category).toBe('advanced'));
    });

    it('should return 3 risk modules', () => {
      const riskModules = getModulesByCategory('risk');
      expect(riskModules.length).toBe(3);
      riskModules.forEach((m) => expect(m.category).toBe('risk'));
    });
  });
});

describe('moduleSystem singleton', () => {
  it('should be an instance of ModuleSystem', () => {
    expect(moduleSystem).toBeInstanceOf(ModuleSystem);
  });

  it('should work correctly', () => {
    const definition = moduleSystem.getModuleDefinition(ModuleType.BUY);
    expect(definition.type).toBe(ModuleType.BUY);
  });
});
