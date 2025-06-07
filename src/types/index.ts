// Barrel exports for all types - single import point

// High-level game state (import this for main game logic)
export * from './game';

// Core game types
export * from './shared';
export * from './facility';
export * from './material';
export * from './product';
export * from './productionLine';

// Manufacturing system types (selective exports to avoid conflicts)
export type { 
  ManufacturingMethod, 
  ManufacturingStep, 
  ProductWithMethods,
  MaterialRequirement,
  ProductState,
  LaborSkill
} from './manufacturing';

export type {
  ProductionJob,
  ProductionQueue,
  StepProgress,
  SchedulingDecision
} from './productionJob';

export {
  calculateStepDuration,
  getNextWaitingStep,
  calculateJobProgress,
  estimateJobCompletion,
  compareJobPriority,
  canStartNextStep
} from './productionJob';

export type {
  Equipment,
  EquipmentInstance,
  EquipmentTag,
  TagRequirement,
  EfficiencyPenalty
} from './equipment';

export {
  EquipmentTier,
  EquipmentStatus,
  aggregateEquipmentTags,
  meetsTagRequirements,
  getEfficiencyPenalty,
  calculateEfficiencyRatio
} from './equipment';

// Re-export enums and constants for convenience
export * from '../constants/enums';

// Machine slot system types
export * from './machineSlot';

// Market and contracts system types
export * from './market';
export * from './contracts';

// Unified item system types
export * from './items';
export * from './inventory';

// Re-export common utilities
export * from '../utils/formatters';