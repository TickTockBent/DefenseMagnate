// Machine Slot System Types

// LEGACY import - commented out during migration
// import type { ProductionJob } from './productionJob';
import type { EquipmentInstance } from './equipment';
import type { TagCategory, JobPriority } from '../constants/enums';
import type { ItemTag } from './items';

// Represents a single work slot on a machine
export interface MachineSlot {
  id: string;
  machineId: string; // Reference to EquipmentInstance
  currentJob?: MachineSlotJob; // Job currently being processed
  maxCapacity: number; // Usually 1 for basic machines
  
  // Current work progress
  currentProgress?: {
    stepIndex: number;
    startTime: number;
    estimatedCompletion: number;
    lastUpdateTime?: number; // Real-time timestamp for interpolation
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
    required_tags?: ItemTag[]; // Items must have these tags to be consumed
    max_quality?: number; // Items must be below this quality level to be consumed
  }>;
  
  // Quality and failure
  can_fail: boolean;
  failure_chance: number;
  failure_result?: 'scrap' | 'rework' | 'downgrade';
  
  // Worker requirements
  labor_skill?: 'unskilled' | 'skilled_technician' | 'skilled_machinist' | 'specialist' | 'quality_inspector';
}

// Manufacturing method with machine operations
export interface MachineBasedMethod {
  id: string;
  name: string;
  description: string;
  
  // Sequential operations (each uses one machine)
  operations: MachineOperation[];
  
  // Product outcome (ENHANCED)
  output_state: 'pristine' | 'functional' | 'damaged' | 'junk';
  output_quality_range: [number, number];
  outputTags?: ItemTag[]; // NEW: Tags to apply to produced items
  qualityRange?: [number, number]; // NEW: Alias for output_quality_range for consistency
  qualityCap?: number; // NEW: Maximum quality achievable with this method
  
  // Economics
  labor_cost_multiplier: number;
  complexity_rating: number;
  profit_margin_modifier: number;
  
  // Requirements
  required_facility_traits?: string[];
  customer_appeal: string[];
}


// Enhanced production job for machine slots (CURRENT SYSTEM)
export interface MachineSlotJob {
  id: string;
  facilityId: string;
  
  // Product information
  productId: string;
  method: MachineBasedMethod; // Uses new machine-based methods
  quantity: number;
  
  // Job metadata
  priority: JobPriority;
  rushOrder: boolean; // Can jump queues
  createdAt: number; // Game time
  startedAt?: number;
  completedAt?: number;
  
  // Machine workspace specific
  state: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  currentMachineId?: string; // Which machine is processing this
  currentOperationIndex: number; // Which operation we're on
  completedOperations: string[]; // IDs of completed operations
  
  // Material tracking (for legacy compatibility)
  consumedMaterials?: Map<string, number>;
  finalQuality?: number;
}

// LEGACY - Comment out after migration
// export interface MachineSlotJob extends ProductionJob {
//   priority: JobPriority;
//   rushOrder: boolean; // Can jump queues
//   currentMachineId?: string; // Which machine is processing this
//   currentOperationIndex: number; // Which operation we're on
//   completedOperations: string[]; // IDs of completed operations
// }