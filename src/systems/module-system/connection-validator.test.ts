/**
 * Connection Validator Tests
 * 连接验证器测试
 *
 * @description 测试连接验证功能
 * @requirements 7.6, 1.3, 1.5
 */

import { describe, it, expect } from 'vitest';
import { ModuleType, PortDefinition } from '@/types';
import {
  validateConnection,
  validateModuleConnection,
  arePortTypesCompatible,
  getPortTypeName,
  getIncompatibleTypeMessage,
  getAllPortDataTypes,
  isValidPortDataType,
  getModuleConnectionPorts,
  findValidConnections,
  canModulesConnect,
  ConnectionErrorCode,
} from './connection-validator';

describe('validateConnection', () => {
  describe('compatible port types', () => {
    it('should allow fund-to-fund connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'fund' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'fund' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
      expect(result.sourceDataType).toBe('fund');
      expect(result.targetDataType).toBe('fund');
    });

    it('should allow signal-to-signal connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'signal' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'signal' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(true);
      expect(result.sourceDataType).toBe('signal');
      expect(result.targetDataType).toBe('signal');
    });

    it('should allow data-to-data connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'data' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'data' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(true);
      expect(result.sourceDataType).toBe('data');
      expect(result.targetDataType).toBe('data');
    });
  });

  describe('incompatible port types', () => {
    it('should reject fund-to-signal connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'fund' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'signal' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
      expect(result.errorMessage).toBeDefined();
      expect(result.sourceDataType).toBe('fund');
      expect(result.targetDataType).toBe('signal');
    });

    it('should reject fund-to-data connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'fund' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'data' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
    });

    it('should reject signal-to-fund connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'signal' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'fund' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
    });

    it('should reject signal-to-data connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'signal' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'data' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
    });

    it('should reject data-to-fund connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'data' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'fund' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
    });

    it('should reject data-to-signal connections', () => {
      const source: PortDefinition = { id: 'out', name: 'Output', dataType: 'data' };
      const target: PortDefinition = { id: 'in', name: 'Input', dataType: 'signal' };

      const result = validateConnection(source, target);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
    });
  });
});


describe('validateModuleConnection', () => {
  it('should validate valid BUY to SELL fund connection', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'remaining',
      ModuleType.SELL,
      'fund_in'
    );

    expect(result.valid).toBe(true);
    expect(result.sourceDataType).toBe('fund');
    expect(result.targetDataType).toBe('fund');
  });

  it('should validate valid BUY to HOLD signal connection', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'signal_out',
      ModuleType.HOLD,
      'signal_in'
    );

    expect(result.valid).toBe(true);
    expect(result.sourceDataType).toBe('signal');
    expect(result.targetDataType).toBe('signal');
  });

  it('should reject self-connection', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'signal_out',
      ModuleType.BUY,
      'signal_in',
      'node-1',
      'node-1'
    );

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe(ConnectionErrorCode.SELF_CONNECTION_NOT_ALLOWED);
  });

  it('should reject non-existent source port', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'non_existent_port',
      ModuleType.SELL,
      'fund_in'
    );

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe(ConnectionErrorCode.SOURCE_PORT_NOT_FOUND);
  });

  it('should reject non-existent target port', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'remaining',
      ModuleType.SELL,
      'non_existent_port'
    );

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe(ConnectionErrorCode.TARGET_PORT_NOT_FOUND);
  });

  it('should reject incompatible port types between modules', () => {
    const result = validateModuleConnection(
      ModuleType.BUY,
      'remaining',
      ModuleType.CONDITION,
      'signal_in'
    );

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
  });

  it('should validate LIQUIDITY_ADD to LIQUIDITY_REMOVE data connection', () => {
    const result = validateModuleConnection(
      ModuleType.LIQUIDITY_ADD,
      'lp_out',
      ModuleType.LIQUIDITY_REMOVE,
      'lp_in'
    );

    expect(result.valid).toBe(true);
    expect(result.sourceDataType).toBe('data');
    expect(result.targetDataType).toBe('data');
  });

  it('should validate STAKE to UNSTAKE data connection', () => {
    const result = validateModuleConnection(
      ModuleType.STAKE,
      'stake_receipt',
      ModuleType.UNSTAKE,
      'stake_in'
    );

    expect(result.valid).toBe(true);
    expect(result.sourceDataType).toBe('data');
    expect(result.targetDataType).toBe('data');
  });
});


describe('arePortTypesCompatible', () => {
  it('should return true for same types', () => {
    expect(arePortTypesCompatible('fund', 'fund')).toBe(true);
    expect(arePortTypesCompatible('signal', 'signal')).toBe(true);
    expect(arePortTypesCompatible('data', 'data')).toBe(true);
  });

  it('should return false for different types', () => {
    expect(arePortTypesCompatible('fund', 'signal')).toBe(false);
    expect(arePortTypesCompatible('fund', 'data')).toBe(false);
    expect(arePortTypesCompatible('signal', 'fund')).toBe(false);
    expect(arePortTypesCompatible('signal', 'data')).toBe(false);
    expect(arePortTypesCompatible('data', 'fund')).toBe(false);
    expect(arePortTypesCompatible('data', 'signal')).toBe(false);
  });
});

describe('getPortTypeName', () => {
  it('should return Chinese names for port types', () => {
    expect(getPortTypeName('fund')).toBe('资金流');
    expect(getPortTypeName('signal')).toBe('信号流');
    expect(getPortTypeName('data')).toBe('数据流');
  });
});

describe('getIncompatibleTypeMessage', () => {
  it('should return descriptive error message', () => {
    const message = getIncompatibleTypeMessage('fund', 'signal');

    expect(message).toContain('资金流');
    expect(message).toContain('信号流');
    expect(message).toContain('fund');
    expect(message).toContain('signal');
  });
});

describe('getAllPortDataTypes', () => {
  it('should return all three port data types', () => {
    const types = getAllPortDataTypes();

    expect(types).toHaveLength(3);
    expect(types).toContain('fund');
    expect(types).toContain('signal');
    expect(types).toContain('data');
  });
});

describe('isValidPortDataType', () => {
  it('should return true for valid port data types', () => {
    expect(isValidPortDataType('fund')).toBe(true);
    expect(isValidPortDataType('signal')).toBe(true);
    expect(isValidPortDataType('data')).toBe(true);
  });

  it('should return false for invalid port data types', () => {
    expect(isValidPortDataType('invalid')).toBe(false);
    expect(isValidPortDataType('')).toBe(false);
    expect(isValidPortDataType('FUND')).toBe(false);
  });
});

describe('getModuleConnectionPorts', () => {
  it('should return ports for valid module type', () => {
    const ports = getModuleConnectionPorts(ModuleType.BUY);

    expect(ports).not.toBeNull();
    expect(ports!.inputs).toHaveLength(2);
    expect(ports!.outputs).toHaveLength(2);
  });

  it('should return null for invalid module type', () => {
    const ports = getModuleConnectionPorts('invalid' as ModuleType);

    expect(ports).toBeNull();
  });
});

describe('findValidConnections', () => {
  it('should find valid connections between BUY and SELL', () => {
    const connections = findValidConnections(ModuleType.BUY, ModuleType.SELL);

    expect(connections.length).toBeGreaterThan(0);

    const fundConnection = connections.find(
      (c) => c.sourcePortId === 'remaining' && c.targetPortId === 'fund_in'
    );
    expect(fundConnection).toBeDefined();
    expect(fundConnection!.dataType).toBe('fund');

    const signalConnection = connections.find(
      (c) => c.sourcePortId === 'signal_out' && c.targetPortId === 'signal_in'
    );
    expect(signalConnection).toBeDefined();
    expect(signalConnection!.dataType).toBe('signal');
  });

  it('should find signal connection between TRANSFER and CONDITION', () => {
    const connections = findValidConnections(ModuleType.TRANSFER, ModuleType.CONDITION);

    expect(connections.length).toBe(1);
    const [firstConnection] = connections;
    if (!firstConnection) {
      throw new Error('Expected connection');
    }
    expect(firstConnection.dataType).toBe('signal');
  });

  it('should return empty array for invalid module types', () => {
    const connections = findValidConnections('invalid' as ModuleType, ModuleType.BUY);

    expect(connections).toHaveLength(0);
  });
});

describe('canModulesConnect', () => {
  it('should return true for modules that can connect', () => {
    expect(canModulesConnect(ModuleType.BUY, ModuleType.SELL)).toBe(true);
    expect(canModulesConnect(ModuleType.HOLD, ModuleType.SWAP)).toBe(true);
    expect(canModulesConnect(ModuleType.LIQUIDITY_ADD, ModuleType.LIQUIDITY_REMOVE)).toBe(true);
  });

  it('should return false for invalid module types', () => {
    expect(canModulesConnect('invalid' as ModuleType, ModuleType.BUY)).toBe(false);
  });
});
