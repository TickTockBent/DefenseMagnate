// LEGACY UTILITIES - Production constraint analyzer - TO BE REMOVED AFTER V1 TESTING
// Uses old ManufacturingStep.required_tags structure, replaced by machine workspace analytics
// DISABLED during v1 migration due to interface incompatibilities

import { 
  Equipment, 
  EquipmentInstance,
  ManufacturingMethod,
  ManufacturingStep,
  TagCategory,
  Facility
} from '../types';

// LEGACY INTERFACES - Stub implementations to prevent build errors
export interface ProductionAnalysis {
  maxPossibleQuantity: number;
  constraints: any[];
  requiredEquipment: any[];
}

export interface ConstraintAnalysis {
  canProduce: boolean;
  limitingFactors: string[];
  recommendations: string[];
  efficiencyScore: number;
  maxPossibleQuantity: number;
  constraints: any[];
  requiredEquipment: any[];
}

export interface BottleneckAnalysis {
  category: TagCategory;
  demand: number;
  capacity: number;
  utilizationRate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// LEGACY FUNCTIONS - Stubbed during v1 migration
export function analyzeProductionConstraints(
  method: ManufacturingMethod, 
  facility: Facility,
  quantity?: number,
  existingJobs?: any[],
  targetTime?: number,
  currentTime?: number
): ConstraintAnalysis {
  // STUB: Return placeholder data to prevent errors
  return {
    canProduce: true,
    limitingFactors: ['LEGACY ANALYZER DISABLED'],
    recommendations: ['Use new machine workspace system'],
    efficiencyScore: 0,
    maxPossibleQuantity: 0,
    constraints: [],
    requiredEquipment: []
  };
}

export function findBottlenecks(
  methods: ManufacturingMethod[], 
  facility: Facility
): BottleneckAnalysis[] {
  // STUB: Return empty array to prevent errors
  return [];
}

export function optimizeProductionMix(
  availableMethods: ManufacturingMethod[], 
  facility: Facility,
  targetOutput: Record<string, number>
): Record<string, number> {
  // STUB: Return empty optimization
  return {};
}

// Additional stub exports for any other functions that might be imported
export function calculateThroughput(): number { return 0; }
export function predictCompletion(): number { return 0; }
export function analyzeResourceUtilization(): any { return {}; }
export function analyzeBottlenecks(): any[] { return []; }