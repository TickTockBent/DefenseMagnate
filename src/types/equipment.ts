// Equipment and Tag System Types

import { TagCategory } from '../constants/enums';

// Tag value types
export type TagValue = number | boolean;

// Equipment tag with value and optional metadata
export interface EquipmentTag {
  category: TagCategory;
  value: TagValue;
  unit?: string; // e.g., '%', 'm²', 'm³', 'tons'
  consumable?: boolean; // Does this capacity get consumed during use?
}

// Equipment tier for progression
export enum EquipmentTier {
  IMPROVISED = 'improvised',
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  CUTTING_EDGE = 'cutting_edge',
  EXPERIMENTAL = 'experimental'
}

// Equipment condition affects performance
export interface EquipmentCondition {
  current: number; // 0-100
  degradationRate: number; // % per hour of use
  maintenanceCost: number; // $ per maintenance
  failureThreshold: number; // Below this, equipment may fail
}

// Complete equipment definition
export interface Equipment {
  id: string;
  name: string;
  description: string;
  tier: EquipmentTier;
  
  // Tags define capabilities
  tags: EquipmentTag[];
  
  // Physical and economic properties
  footprint: number; // m² of facility space required
  powerRequirement: number; // kW
  purchaseCost: number;
  installationCost: number;
  dailyOperatingCost: number;
  
  // Condition and maintenance
  condition: EquipmentCondition;
  
  // Optional specialized properties
  requiresFoundation?: boolean; // Heavy equipment
  requiresVentilation?: boolean; // Chemical/heat producing
  requiresCoolant?: boolean; // High-precision equipment
  noiseLevel?: number; // dB - affects worker morale
  
  // Operator requirements
  minSkillLevel?: number; // 0-100
  operatorsRequired?: number; // How many workers to run
  
  // Upgrade paths
  upgradesFrom?: string[]; // Equipment IDs this can replace
  upgradesTo?: string[]; // Equipment IDs that can replace this
}

// Tag requirements for manufacturing steps
export interface TagRequirement {
  category: TagCategory;
  minimum: number | boolean; // Minimum value needed
  optimal?: number; // Value for optimal performance (no penalties)
  consumes?: number; // How much capacity is consumed during operation
}

// Penalty calculation based on equipment efficiency
export interface EfficiencyPenalty {
  timeMultiplier: number; // 1.0 = normal, 2.0 = twice as long
  qualityMultiplier: number; // 1.0 = normal, 0.8 = 20% quality loss
  failureRiskIncrease: number; // Additional % chance of failure
}

// Calculate efficiency ratio and penalties
export function calculateEfficiencyRatio(available: number, required: number, optimal?: number): number {
  const target = optimal || required;
  return available / target;
}

export function getEfficiencyPenalty(ratio: number): EfficiencyPenalty {
  if (ratio >= 0.8) {
    // 80-100% - Optimal range
    return {
      timeMultiplier: 1.0,
      qualityMultiplier: 1.0,
      failureRiskIncrease: 0
    };
  } else if (ratio >= 0.6) {
    // 60-79% - Suboptimal
    return {
      timeMultiplier: 1.5,
      qualityMultiplier: 0.9,
      failureRiskIncrease: 5
    };
  } else if (ratio >= 0.4) {
    // 40-59% - Poor tools
    return {
      timeMultiplier: 2.0,
      qualityMultiplier: 0.8,
      failureRiskIncrease: 10
    };
  } else if (ratio >= 0.2) {
    // 20-39% - Inadequate tools
    return {
      timeMultiplier: 3.0,
      qualityMultiplier: 0.65,
      failureRiskIncrease: 25
    };
  } else {
    // Below 20% - Barely functional
    return {
      timeMultiplier: 5.0,
      qualityMultiplier: 0.5,
      failureRiskIncrease: 50
    };
  }
}

// Equipment instance in a facility
export enum EquipmentStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved', // Reserved for a job but not yet in use
  IN_USE = 'in_use',     // Currently being used by a job
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken'
}

export interface EquipmentInstance {
  id: string; // Unique instance ID
  equipmentId: string; // References Equipment definition
  facilityId: string;
  
  // Current state
  condition: number; // Current condition %
  lastMaintenance: number; // Game time timestamp
  totalOperatingHours: number;
  
  // Reservation and usage tracking
  status: EquipmentStatus;
  reservedBy?: string; // Job ID that has reserved this equipment
  currentlyUsedBy?: string[]; // Job IDs using this equipment (for shared equipment)
  utilizationHistory: Array<{
    timestamp: number;
    utilization: number; // 0-100%
  }>;
  
  // Custom modifications (future feature)
  modifications?: Array<{
    name: string;
    effect: Partial<EquipmentTag>;
    cost: number;
  }>;
}


// Helper to get total available tags from equipment list
export function aggregateEquipmentTags(equipment: EquipmentInstance[], definitions: Map<string, Equipment>): Map<TagCategory, number> {
  const aggregated = new Map<TagCategory, number>();
  
  for (const instance of equipment) {
    const def = definitions.get(instance.equipmentId);
    if (!def) continue;
    
    // Apply condition modifier
    const conditionModifier = instance.condition / 100;
    
    for (const tag of def.tags) {
      if (typeof tag.value === 'number') {
        const current = aggregated.get(tag.category) || 0;
        const adjustedValue = tag.value * conditionModifier;
        
        // For consumable tags, track total available
        // For non-consumable, take the maximum
        if (tag.consumable) {
          aggregated.set(tag.category, current + adjustedValue);
        } else {
          aggregated.set(tag.category, Math.max(current, adjustedValue));
        }
      } else if (typeof tag.value === 'boolean' && tag.value) {
        // Boolean tags are present if any equipment has them
        aggregated.set(tag.category, 1);
      }
    }
  }
  
  return aggregated;
}

// Check if equipment meets requirements
export function meetsTagRequirements(
  available: Map<TagCategory, number>,
  requirements: TagRequirement[]
): { meets: boolean; penalties: Map<TagCategory, EfficiencyPenalty> } {
  let meets = true;
  const penalties = new Map<TagCategory, EfficiencyPenalty>();
  
  for (const req of requirements) {
    const availableValue = available.get(req.category) || 0;
    
    if (typeof req.minimum === 'boolean') {
      // Boolean requirement
      if (req.minimum && availableValue === 0) {
        meets = false;
      }
    } else {
      // Numeric requirement
      if (availableValue < req.minimum * 0.2) {
        // Below 20% of requirement - technically possible but terrible
        meets = true; // Still technically possible
      }
      
      const ratio = calculateEfficiencyRatio(availableValue, req.minimum, req.optimal);
      const penalty = getEfficiencyPenalty(ratio);
      penalties.set(req.category, penalty);
    }
  }
  
  return { meets, penalties };
}