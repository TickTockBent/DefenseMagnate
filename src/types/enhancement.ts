// Enhancement System Types - Manufacturing v2 Phase 2
// Dynamic enhancement discovery and integration

import { ItemTag, ItemInstance } from './items';

// Enhancement categories for organization
export type EnhancementCategory = 'performance' | 'aesthetic' | 'functional';

// Enhancement requirement types
export type EnhancementRequirementType = 'equipment' | 'skill' | 'research' | 'material';

// Core enhancement definition
export interface Enhancement {
  id: string;
  name: string;
  description: string;
  category: EnhancementCategory;
  
  // What's needed to unlock this enhancement
  requirements: EnhancementRequirement[];
  
  // What this enhancement does
  effects: EnhancementEffect[];
  
  // Additional costs for applying this enhancement
  costs: EnhancementCost[];
  
  // How much this affects base production time
  timeModifier: number; // 1.0 = no change, 1.5 = 50% longer, 0.8 = 20% faster
  
  // How much this affects failure chance
  complexityModifier: number; // 1.0 = no change, 1.2 = 20% more likely to fail
  
  // Tags applied to enhanced products
  outputTags: ItemTag[];
  
  // Quality impact
  qualityModifier: number; // Additive to base quality (e.g., +10 for 10% quality boost)
  qualityCap?: number; // Maximum quality achievable with this enhancement
}

// Requirements to unlock an enhancement
export interface EnhancementRequirement {
  type: EnhancementRequirementType;
  id: string; // Equipment ID, skill name, research ID, or material ID
  level?: number; // Minimum level/quality required
  quantity?: number; // For materials
}

// Effects of applying an enhancement
export interface EnhancementEffect {
  property: string; // 'damage', 'durability', 'accuracy', etc.
  modifier: number; // How much to modify the property (+10, -5, etc.)
  description: string; // Human-readable description
  isPercentage?: boolean; // Whether modifier is percentage-based
}

// Additional costs for enhancements
export interface EnhancementCost {
  type: 'material' | 'time' | 'credits';
  itemId?: string; // For material costs
  quantity: number;
  description: string;
}

// Available enhancements for a specific product/workflow
export interface EnhancementDiscovery {
  productId: string;
  availableEnhancements: Enhancement[];
  lockedEnhancements: Array<{
    enhancement: Enhancement;
    missingRequirements: EnhancementRequirement[];
  }>;
  discoveryTime: number; // When this was calculated
}

// Player's selection of enhancements for a job
export interface EnhancementSelection {
  jobId: string;
  selectedEnhancements: Enhancement[];
  totalTimeModifier: number;
  totalComplexityModifier: number;
  totalQualityModifier: number;
  additionalCosts: EnhancementCost[];
  additionalTags: ItemTag[];
}

// Enhanced operation - regular operation with enhancements applied
export interface EnhancedOperation {
  baseOperationId: string;
  appliedEnhancements: Enhancement[];
  modifiedDuration: number;
  modifiedFailureChance: number;
  additionalMaterialRequirements: EnhancementCost[];
  enhancedOutputTags: ItemTag[];
  enhancedQuality: number;
}