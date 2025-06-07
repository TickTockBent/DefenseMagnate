// Machine Slot System Types

import type { ProductionJob } from './productionJob';
import type { EquipmentInstance } from './equipment';
import type { TagCategory, JobPriority } from '../constants/enums';

// Represents a single work slot on a machine
export interface MachineSlot {
  id: string;
  machineId: string; // Reference to EquipmentInstance
  currentJob?: ProductionJob; // Job currently being processed
  maxCapacity: number; // Usually 1 for basic machines
  
  // Current work progress
  currentProgress?: {
    stepIndex: number;
    startTime: number;
    estimatedCompletion: number;
  };
}

// Manages all machines in a facility
export interface MachineWorkspace {
  facilityId: string;
  machines: Map<string, MachineSlot>; // EquipmentInstance.id -> MachineSlot
  jobQueue: MachineSlotJob[]; // Facility-wide job queue (sorted by priority)
  completedJobs: MachineSlotJob[]; // Jobs that have finished all operations
}

// Single-machine operation (replaces complex multi-tag steps)
export interface MachineOperation {
  id: string;
  name: string;
  description: string;
  
  // Single machine requirement
  requiredTag: {
    category: TagCategory;
    minimum: number | boolean;
    optimal?: number;
  };
  
  // Time and resources
  baseDurationMinutes: number; // In game minutes
  material_requirements: Array<{
    material_id: string;
    quantity: number;
    consumed_at_start: boolean;
  }>;
  
  // Quality and failure
  can_fail: boolean;
  failure_chance: number;
  failure_result?: 'scrap' | 'rework' | 'downgrade';
  
  // Worker requirements
  labor_skill?: 'unskilled' | 'skilled_technician' | 'skilled_machinist' | 'specialist';
}

// Manufacturing method with machine operations
export interface MachineBasedMethod {
  id: string;
  name: string;
  description: string;
  
  // Sequential operations (each uses one machine)
  operations: MachineOperation[];
  
  // Product outcome
  output_state: 'pristine' | 'functional' | 'damaged' | 'junk';
  output_quality_range: [number, number];
  
  // Economics
  labor_cost_multiplier: number;
  complexity_rating: number;
  profit_margin_modifier: number;
  
  // Requirements
  required_facility_traits?: string[];
  customer_appeal: string[];
}


// Enhanced production job for machine slots
export interface MachineSlotJob extends ProductionJob {
  priority: JobPriority;
  rushOrder: boolean; // Can jump queues
  currentMachineId?: string; // Which machine is processing this
  currentOperationIndex: number; // Which operation we're on
  completedOperations: string[]; // IDs of completed operations
}