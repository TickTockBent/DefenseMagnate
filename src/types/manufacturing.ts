// Manufacturing system type definitions

import { ProductState, LaborSkill } from '../constants/enums';

// Re-export these for barrel export
export type { ProductState, LaborSkill } from '../constants/enums';
import type { TagRequirement } from './equipment';

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