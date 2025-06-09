// Manufacturing system type definitions

import { ProductState, LaborSkill } from '../constants/enums';
import { ItemTag } from './items';

// Re-export these for barrel export
export type { ProductState, LaborSkill } from '../constants/enums';
import type { TagRequirement } from './equipment';

// ===== MANUFACTURING V2 TYPES =====

// Manufacturing hierarchy for v2 system
export enum ItemManufacturingType {
  RAW_MATERIAL = 'raw_material',      // Steel, aluminum, plastic - cannot be disassembled
  SHAPED_MATERIAL = 'shaped_material', // Steel billet, precision component - cannot be disassembled 
  ASSEMBLY = 'assembly'               // Mechanical assembly, sidearm - CAN be disassembled
}

// Manufacturing operation types
export enum OperationType {
  SHAPING = 'shaping',        // Raw → Shaped OR Shaped → Better Shaped
  ASSEMBLY = 'assembly',      // Components → Assembly  
  DISASSEMBLY = 'disassembly' // Assembly → Components (reverse of assembly only)
}

// Rules for what operations are allowed on each item type
export interface ManufacturingRule {
  canDisassemble: boolean;
  canShape: boolean;
  canAssemble: boolean;
  reason: 'raw_material' | 'shaped_material' | 'assembly';
}

// Component recovery prediction from condition analysis
export interface ComponentRecovery {
  componentType: string;
  estimatedQuantity: number;
  expectedQuality: number;
  confidenceLevel: number; // 0-1 how confident we are in this estimate
}

// Treatment operations for special conditions
export interface TreatmentOperation {
  id: string;
  name: string;
  required: boolean;
  estimatedTime: number; // in game hours
  materialRequirements: MaterialRequirement[];
  successProbability: number; // 0-1
  equipmentRequirements: string[]; // Required equipment tags
}

// Analysis of input item condition for workflow generation
export interface ConditionAnalysis {
  itemId: string;
  itemType: string;
  condition: ItemTag[]; // Status tags like [damaged], [drenched], etc.
  estimatedRecovery: ComponentRecovery[];
  treatmentRequirements: TreatmentOperation[];
  risks: RecoveryRisk[];
  manufacturingType: ItemManufacturingType;
}

// Risk factors in manufacturing/disassembly
export interface RecoveryRisk {
  description: string;
  probability: number; // 0-1
  impact: 'component_loss' | 'quality_reduction' | 'time_increase' | 'material_waste';
  severity: 'low' | 'medium' | 'high';
}

// Gap between what we need and what we have
export interface ComponentGap {
  componentType: string;
  required: number;
  available: number;
  recoverable: number;
  needToManufacture: number;
  sourceOperation?: string; // Which operation will create this component
}

// Dynamic operation created by workflow generator
export interface DynamicOperation {
  id: string;
  name: string;
  description: string;
  operationType: OperationType;
  requiredTag: TagRequirement;
  baseDurationMinutes: number;
  
  // Material transformations
  materialConsumption?: Array<{
    itemId: string;
    count: number;
    tags?: ItemTag[];
    maxQuality?: number;
  }>;
  materialProduction?: Array<{
    itemId: string;
    count: number;
    tags?: ItemTag[];
    quality?: number;
    inheritQuality?: boolean;
  }>;
  
  // Failure mechanics
  can_fail: boolean;
  failure_chance: number;
  labor_skill: LaborSkill;
  
  // Dynamic operation metadata
  generatedReason: string; // Why this operation was created
  isConditional: boolean; // Whether this operation depends on conditions
}

// Complete manufacturing plan generated dynamically
export interface ManufacturingPlan {
  targetProduct: string;
  targetQuantity: number;
  inputAnalysis: ConditionAnalysis[];
  componentGaps: ComponentGap[];
  requiredOperations: DynamicOperation[];
  estimatedDuration: number; // total time in game hours
  materialRequirements: MaterialRequirement[];
  enhancementOptions?: import('./enhancement').Enhancement[]; // Available enhancements for this plan
  
  // Planning metadata
  planningTime: number; // When this plan was generated
  plannerVersion: string; // Version of planning system used
  confidence: number; // 0-1 confidence in this plan
}

// DEPRECATED: Enhancement types moved to enhancement.ts (Manufacturing v2 Phase 2)
// These are kept for temporary compatibility only

// Material requirement for a manufacturing step
export interface MaterialRequirement {
  material_id: string;
  quantity: number;
  consumed_at_start: boolean; // If true, consumed when step begins; if false, consumed when step completes
}

// Individual step in a manufacturing process
export interface ManufacturingStep {
  id: string;
  name: string;
  duration_percentage: number; // Percentage of total production time
  material_requirements: MaterialRequirement[];
  labor_skill: LaborSkill;
  labor_intensity?: number; // 0-1, how much attention needed (default 1)
  
  // Equipment requirements using tag system
  required_tags?: TagRequirement[]; // Optional for backward compatibility
  
  // Failure mechanics
  can_fail: boolean;
  failure_chance: number; // 0.0 to 1.0 (0% to 100%)
  failure_result?: 'scrap' | 'downgrade' | 'wasted_materials'; // What happens on failure
  
  // Special step properties
  requires_continuous_operation?: boolean; // Can't be paused
  requires_quality_check?: boolean; // Needs QC before proceeding
  batchable?: boolean; // Can process multiple items together
  
  description?: string; // Optional description of what this step does
}

// Complete manufacturing method for a product
export interface ManufacturingMethod {
  id: string;
  name: string;
  description: string;
  
  // Input/Output specifications
  input_state?: ProductState; // Required input state (undefined means no input product needed)
  output_state: ProductState;
  output_quality_range: [number, number]; // Min and max quality rating (1-100)
  
  // Requirements
  required_facility_traits: string[]; // Facility traits needed for this method
  required_tools: string[]; // Tool types needed
  
  // Process definition
  steps: ManufacturingStep[];
  total_duration_hours: number; // Base duration in game hours
  
  // Economics
  labor_cost_multiplier: number; // Multiplier for base labor costs
  complexity_rating: number; // 1-10 scale
  
  // Strategic considerations
  customer_appeal: string[]; // Which customer types prefer this method's output
  profit_margin_modifier: number; // Modifier to base profit calculations
}

// Enhanced product definition with manufacturing methods
export interface ProductWithMethods {
  // All existing Product fields
  id: string;
  name: string;
  // ... (other Product fields would be inherited)
  
  // New manufacturing-specific fields
  manufacturing_methods: ManufacturingMethod[];
  default_method_id: string; // Which method to use by default
  
  // Product variants by state
  state_variants: Record<ProductState, {
    name_suffix: string; // e.g., "Damaged" for damaged state
    quality_modifier: number; // Multiplier for base quality
    price_modifier: number; // Multiplier for base price
    description_override?: string;
  }>;
}

// Production step instance (runtime state)
export interface ProductionStepInstance {
  step_id: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  start_game_time?: number; // When this step started
  materials_consumed: boolean; // Whether materials have been consumed
  labor_assigned: boolean; // Whether required labor is assigned
  failure_rolled: boolean; // Whether failure check has been performed
}

// Enhanced production line for multi-step manufacturing
export interface MultiStepProductionLine {
  id: string;
  facility_id: string;
  
  // Method being used
  manufacturing_method: ManufacturingMethod;
  product_id: string;
  quantity: number;
  
  // Overall status
  status: 'idle' | 'active' | 'paused' | 'blocked' | 'completed' | 'failed';
  block_reason?: string;
  
  // Timing
  start_game_time: number;
  total_duration_hours: number;
  
  // Step tracking
  current_step_index: number; // Which step is currently active (0-based)
  step_instances: ProductionStepInstance[]; // Runtime state for each step
  
  // Input materials
  input_product_state?: ProductState; // State of input product if method requires one
  input_materials_loaded: Record<string, number>; // Materials loaded for production
  
  // Output tracking
  expected_output_state: ProductState;
  expected_quality_range: [number, number];
  actual_output_quality?: number; // Determined when production completes
}

// Helper type for step progress calculation (legacy)
export interface LegacyStepProgress {
  step_index: number;
  step_name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress_percentage: number; // 0-100 for this individual step
  start_time?: number;
  duration_hours: number;
  materials_needed: MaterialRequirement[];
  materials_satisfied: boolean;
  labor_satisfied: boolean;
  can_fail: boolean;
  failure_chance: number;
}