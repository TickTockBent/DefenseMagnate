// Production Line type definitions

import type { ManufacturingMethod, ProductState, ProductionStepInstance } from './manufacturing';

export interface ProductionLine {
  id: string;
  facilityId?: string; // Optional for facility-embedded lines
  productId: string | null;
  quantity?: number;
  status?: 'idle' | 'active' | 'paused' | 'blocked' | 'completed' | 'failed';
  blockReason?: string; // e.g., "Missing material: steel"
  
  // Game-time production tracking
  startGameTime: number; // game hours when production started
  durationHours: number; // how many game hours this takes
  
  // Legacy fields for compatibility with facility system
  materials_loaded?: boolean;
  labor_assigned?: number;
  
  // Multi-step manufacturing (optional - for backwards compatibility)
  manufacturing_method?: ManufacturingMethod; // Which method is being used
  current_step_index?: number; // Which step is currently active (0-based)
  step_instances?: ProductionStepInstance[]; // Runtime state for each step
  input_product_state?: ProductState; // State of input product if method requires one
  input_materials_loaded?: Record<string, number>; // Materials loaded for production
  expected_output_state?: ProductState;
  expected_quality_range?: [number, number];
  actual_output_quality?: number; // Determined when production completes
  
  // Computed properties (calculated from startTime + duration)
  // progress: calculated in real-time
  // timeRemaining: calculated in real-time
}