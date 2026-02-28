/**
 * Connection Validator Property Tests
 * 连接验证器属性测试
 *
 * Feature: web3-learning-game, Property 3: Connection Validation Consistency
 * **Validates: Requirements 1.3, 1.5, 7.6**
 *
 * @description 验证连接验证的确定性和一致性属性
 *
 * Property 3: Connection Validation Consistency
 * For any two module ports, the connection validation result SHALL be deterministic
 * and consistent: compatible ports always connect successfully, incompatible ports
 * always fail with an appropriate error.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateConnection,
  ConnectionErrorCode,
  ConnectionValidationResult,
} from './connection-validator';
import { PortDefinition, PortDataType } from '@/types';

/**
 * Arbitrary for generating valid PortDataType values
 * 生成有效的端口数据类型
 */
const portDataTypeArb: fc.Arbitrary<PortDataType> = fc.constantFrom('fund', 'signal', 'data');

/**
 * Arbitrary for generating valid PortDefinition objects
 * 生成有效的端口定义对象
 */
const portDefinitionArb: fc.Arbitrary<PortDefinition> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  dataType: portDataTypeArb,
});

/**
 * Helper function to compare two ConnectionValidationResult objects for equality
 * 比较两个连接验证结果是否相等
 */
function areResultsEqual(
  result1: ConnectionValidationResult,
  result2: ConnectionValidationResult
): boolean {
  return (
    result1.valid === result2.valid &&
    result1.errorCode === result2.errorCode &&
    result1.sourceDataType === result2.sourceDataType &&
    result1.targetDataType === result2.targetDataType
  );
}

describe('Connection Validator Property Tests', () => {
  // Feature: web3-learning-game, Property 3: Connection Validation Consistency
  // **Validates: Requirements 1.3, 1.5, 7.6**

  describe('Property 3.1: Determinism - Same inputs always produce same outputs', () => {
    it('validateConnection should return identical results for the same port pair', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (sourcePort, targetPort) => {
          // Call validateConnection twice with the same inputs
          const result1 = validateConnection(sourcePort, targetPort);
          const result2 = validateConnection(sourcePort, targetPort);

          // Results should be identical (deterministic)
          expect(areResultsEqual(result1, result2)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('validateConnection should be deterministic across multiple calls', () => {
      fc.assert(
        fc.property(
          portDefinitionArb,
          portDefinitionArb,
          fc.integer({ min: 3, max: 10 }),
          (sourcePort, targetPort, numCalls) => {
            // Call validateConnection multiple times
            const results: ConnectionValidationResult[] = [];
            for (let i = 0; i < numCalls; i++) {
              results.push(validateConnection(sourcePort, targetPort));
            }

            // All results should be identical
            const firstResult = results[0];
            if (!firstResult) {
              throw new Error('Expected validation result');
            }
            for (const result of results) {
              expect(areResultsEqual(result, firstResult)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3.2: Consistency - Compatible types (same dataType) always succeed', () => {
    it('ports with the same dataType should always connect successfully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          portDataTypeArb,
          (sourceId, sourceName, targetId, targetName, sharedDataType) => {
            // Create two ports with the same dataType
            const sourcePort: PortDefinition = {
              id: sourceId,
              name: sourceName,
              dataType: sharedDataType,
            };
            const targetPort: PortDefinition = {
              id: targetId,
              name: targetName,
              dataType: sharedDataType,
            };

            const result = validateConnection(sourcePort, targetPort);

            // Connection should always be valid for same dataType
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeUndefined();
            expect(result.errorMessage).toBeUndefined();
            expect(result.sourceDataType).toBe(sharedDataType);
            expect(result.targetDataType).toBe(sharedDataType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('fund-to-fund connections should always succeed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (sourceId, sourceName, targetId, targetName) => {
            const sourcePort: PortDefinition = {
              id: sourceId,
              name: sourceName,
              dataType: 'fund',
            };
            const targetPort: PortDefinition = {
              id: targetId,
              name: targetName,
              dataType: 'fund',
            };

            const result = validateConnection(sourcePort, targetPort);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('signal-to-signal connections should always succeed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (sourceId, sourceName, targetId, targetName) => {
            const sourcePort: PortDefinition = {
              id: sourceId,
              name: sourceName,
              dataType: 'signal',
            };
            const targetPort: PortDefinition = {
              id: targetId,
              name: targetName,
              dataType: 'signal',
            };

            const result = validateConnection(sourcePort, targetPort);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('data-to-data connections should always succeed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (sourceId, sourceName, targetId, targetName) => {
            const sourcePort: PortDefinition = {
              id: sourceId,
              name: sourceName,
              dataType: 'data',
            };
            const targetPort: PortDefinition = {
              id: targetId,
              name: targetName,
              dataType: 'data',
            };

            const result = validateConnection(sourcePort, targetPort);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3.3: Consistency - Incompatible types (different dataType) always fail with error', () => {
    /**
     * Arbitrary for generating two different PortDataType values
     * 生成两个不同的端口数据类型
     */
    const differentDataTypesArb: fc.Arbitrary<[PortDataType, PortDataType]> = fc
      .tuple(portDataTypeArb, portDataTypeArb)
      .filter(([a, b]) => a !== b);

    it('ports with different dataTypes should always fail with INCOMPATIBLE_PORT_TYPES error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          differentDataTypesArb,
          (sourceId, sourceName, targetId, targetName, [sourceDataType, targetDataType]) => {
            const sourcePort: PortDefinition = {
              id: sourceId,
              name: sourceName,
              dataType: sourceDataType,
            };
            const targetPort: PortDefinition = {
              id: targetId,
              name: targetName,
              dataType: targetDataType,
            };

            const result = validateConnection(sourcePort, targetPort);

            // Connection should always be invalid for different dataTypes
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage!.length).toBeGreaterThan(0);
            expect(result.sourceDataType).toBe(sourceDataType);
            expect(result.targetDataType).toBe(targetDataType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('fund-to-signal connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'fund' };
          const targetPort: PortDefinition = { ...target, dataType: 'signal' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });

    it('fund-to-data connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'fund' };
          const targetPort: PortDefinition = { ...target, dataType: 'data' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });

    it('signal-to-fund connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'signal' };
          const targetPort: PortDefinition = { ...target, dataType: 'fund' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });

    it('signal-to-data connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'signal' };
          const targetPort: PortDefinition = { ...target, dataType: 'data' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });

    it('data-to-fund connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'data' };
          const targetPort: PortDefinition = { ...target, dataType: 'fund' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });

    it('data-to-signal connections should always fail', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (source, target) => {
          const sourcePort: PortDefinition = { ...source, dataType: 'data' };
          const targetPort: PortDefinition = { ...target, dataType: 'signal' };

          const result = validateConnection(sourcePort, targetPort);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3 Combined: Full validation consistency', () => {
    it('validation result validity should match dataType equality', () => {
      fc.assert(
        fc.property(portDefinitionArb, portDefinitionArb, (sourcePort, targetPort) => {
          const result = validateConnection(sourcePort, targetPort);
          const typesMatch = sourcePort.dataType === targetPort.dataType;

          // The validity of the result should always match whether the types are equal
          expect(result.valid).toBe(typesMatch);

          if (typesMatch) {
            // Valid connections should not have error information
            expect(result.errorCode).toBeUndefined();
            expect(result.errorMessage).toBeUndefined();
          } else {
            // Invalid connections should have proper error information
            expect(result.errorCode).toBe(ConnectionErrorCode.INCOMPATIBLE_PORT_TYPES);
            expect(result.errorMessage).toBeDefined();
          }

          // Data types should always be recorded in the result
          expect(result.sourceDataType).toBe(sourcePort.dataType);
          expect(result.targetDataType).toBe(targetPort.dataType);
        }),
        { numRuns: 100 }
      );
    });
  });
});
