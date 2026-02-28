/**
 * Module System Exports
 * 模块系统导出
 */

export { ModuleSystem, moduleSystem, createModuleSystem } from './module-system';
export {
  moduleDefinitions,
  getAllModuleDefinitions,
  getModulesByCategory,
  getModuleDefinitionByType,
} from './module-definitions';
export {
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
  type ConnectionValidationResult,
} from './connection-validator';
