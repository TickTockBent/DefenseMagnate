// Inventory Action Discovery System - Manufacturing v2 Phase 3
// Analyzes items and determines valid operations automatically

import {
  ItemInstance,
  BaseItem,
  ItemTag,
  ItemCategory,
  ItemManufacturingType,
  Facility,
  Equipment,
  EquipmentInstance,
  TagCategory
} from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from '../systems/manufacturingRules';
import { aggregateEquipmentTags } from '../types';

// Available action types for any item
export enum ActionType {
  MANUFACTURE_NEW = 'manufacture_new',     // Create new item from raw materials
  REPAIR = 'repair',                       // Fix damaged items
  DISASSEMBLE = 'disassemble',            // Break down assemblies into components
  REFURBISH = 'refurbish',                // Improve condition/quality of functional items
  CLEAN = 'clean',                        // Remove environmental damage tags
  RECYCLE = 'recycle',                    // Break down to base materials (future)
  PREPARE_STOCK = 'prepare_stock',        // Shape raw materials into stock forms
  USE_IN_ASSEMBLY = 'use_in_assembly',    // Show products that can use this component
  ANALYZE = 'analyze',                    // Learn about unknown items
  SCRAP = 'scrap'                         // Emergency disposal for credits
}

// Discovered action with context
export interface DiscoveredAction {
  type: ActionType;
  name: string;
  description: string;
  feasible: boolean;                      // Can we actually do this with current equipment?
  estimatedTime: number;                  // Rough time estimate in minutes
  estimatedCost: number;                  // Rough material cost estimate
  estimatedValue: number;                 // Expected value of result
  requirements: ActionRequirement[];      // What's needed to perform this action
  riskFactors: ActionRisk[];             // Potential complications
  confidence: number;                     // 0-1 how sure we are about this analysis
}

export interface ActionRequirement {
  type: 'equipment' | 'material' | 'skill' | 'knowledge';
  description: string;
  satisfied: boolean;
  alternatives?: string[];                // Alternative ways to meet this requirement
}

export interface ActionRisk {
  description: string;
  probability: number;                    // 0-1
  impact: 'minor' | 'moderate' | 'severe';
  mitigation?: string;                    // How to reduce this risk
}

export class InventoryActionDiscovery {
  
  /**
   * Main entry point: analyze an item and return all possible actions
   */
  static analyzeItem(
    item: ItemInstance, 
    facility: Facility,
    equipmentDatabase: Map<string, Equipment>
  ): DiscoveredAction[] {
    const baseItem = getBaseItem(item.baseItemId);
    if (!baseItem) {
      console.warn(`Unknown base item: ${item.baseItemId}`);
      return [];
    }

    const actions: DiscoveredAction[] = [];
    const facilityCapabilities = aggregateEquipmentTags(facility.equipment, equipmentDatabase);
    
    console.log(`InventoryActionDiscovery: Analyzing ${baseItem.name} [${item.tags.join(', ')}]`);

    // Tier-based action discovery
    switch (baseItem.manufacturingType) {
      case ItemManufacturingType.RAW_MATERIAL:
        actions.push(...this.analyzeRawMaterial(item, baseItem, facility, facilityCapabilities));
        break;
      
      case ItemManufacturingType.SHAPED_MATERIAL:
        actions.push(...this.analyzeShapedMaterial(item, baseItem, facility, facilityCapabilities));
        break;
      
      case ItemManufacturingType.ASSEMBLY:
        actions.push(...this.analyzeAssembly(item, baseItem, facility, facilityCapabilities));
        break;
    }

    // Universal actions available for any item
    actions.push(...this.analyzeUniversalActions(item, baseItem, facility, facilityCapabilities));

    // Sort by feasibility and value
    return actions.sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      return b.estimatedValue - a.estimatedValue;
    });
  }

  /**
   * Analyze actions for raw materials (Tier 1)
   */
  private static analyzeRawMaterial(
    item: ItemInstance,
    baseItem: BaseItem,
    facility: Facility,
    capabilities: Map<TagCategory, number>
  ): DiscoveredAction[] {
    const actions: DiscoveredAction[] = [];

    // PREPARE_STOCK - Shape raw materials into useful forms
    const canShape = capabilities.has(TagCategory.SURFACE) || capabilities.has(TagCategory.BASIC_MANIPULATION);
    
    actions.push({
      type: ActionType.PREPARE_STOCK,
      name: `Prepare ${baseItem.name} Stock`,
      description: `Shape raw ${baseItem.name.toLowerCase()} into billets, cylinders, sheets, or wire for manufacturing`,
      feasible: canShape,
      estimatedTime: 15 * item.quantity, // 15 min per unit
      estimatedCost: 0, // No additional materials needed
      estimatedValue: item.quantity * baseItem.baseValue * 1.2, // Slight value increase from shaping
      requirements: [
        {
          type: 'equipment',
          description: 'Basic shaping tools (workbench, hand tools)',
          satisfied: canShape,
          alternatives: canShape ? [] : ['Basic Workbench', 'Hand Tools']
        }
      ],
      riskFactors: [
        {
          description: 'Material waste during shaping',
          probability: 0.1,
          impact: 'minor',
          mitigation: 'Use precision tools for better efficiency'
        }
      ],
      confidence: 0.9
    });

    return actions;
  }

  /**
   * Analyze actions for shaped materials (Tier 2)
   */
  private static analyzeShapedMaterial(
    item: ItemInstance,
    baseItem: BaseItem,
    facility: Facility,
    capabilities: Map<TagCategory, number>
  ): DiscoveredAction[] {
    const actions: DiscoveredAction[] = [];

    // FURTHER_SHAPING - Can be processed further if we have better equipment
    const canMachine = capabilities.has(TagCategory.TURNING) || capabilities.has(TagCategory.MILLING);
    
    if (canMachine) {
      actions.push({
        type: ActionType.REFURBISH,
        name: `Precision Machine ${baseItem.name}`,
        description: `Further refine this component with precision machining for better quality`,
        feasible: true,
        estimatedTime: 30 * item.quantity,
        estimatedCost: 5 * item.quantity, // Tool wear
        estimatedValue: item.quantity * baseItem.baseValue * 1.4, // Quality improvement
        requirements: [
          {
            type: 'equipment',
            description: 'Precision machining equipment (lathe, mill)',
            satisfied: true
          }
        ],
        riskFactors: [
          {
            description: 'Risk of over-machining and ruining component',
            probability: 0.05,
            impact: 'moderate',
            mitigation: 'Use careful feeds and speeds'
          }
        ],
        confidence: 0.8
      });
    }

    // USE_IN_ASSEMBLY - Show what products could use this component
    actions.push({
      type: ActionType.USE_IN_ASSEMBLY,
      name: `Use in Assembly`,
      description: `See which products can be made using this ${baseItem.name.toLowerCase()}`,
      feasible: true,
      estimatedTime: 0, // Just analysis
      estimatedCost: 0,
      estimatedValue: 0, // Analysis only
      requirements: [],
      riskFactors: [],
      confidence: 1.0
    });

    return actions;
  }

  /**
   * Analyze actions for assemblies (Tier 3)
   */
  private static analyzeAssembly(
    item: ItemInstance,
    baseItem: BaseItem,
    facility: Facility,
    capabilities: Map<TagCategory, number>
  ): DiscoveredAction[] {
    const actions: DiscoveredAction[] = [];

    // REPAIR - Fix damaged assemblies
    if (this.isDamaged(item)) {
      const canRepair = capabilities.has(TagCategory.BASIC_MANIPULATION);
      
      actions.push({
        type: ActionType.REPAIR,
        name: `Repair ${baseItem.name}`,
        description: `Disassemble, replace damaged components, and rebuild`,
        feasible: canRepair,
        estimatedTime: this.estimateRepairTime(item, baseItem),
        estimatedCost: this.estimateRepairCost(item, baseItem),
        estimatedValue: this.estimateRepairedValue(item, baseItem),
        requirements: [
          {
            type: 'equipment',
            description: 'Basic assembly tools',
            satisfied: canRepair,
            alternatives: canRepair ? [] : ['Basic Hand Tools', 'Workbench']
          },
          {
            type: 'material',
            description: 'Replacement components and materials',
            satisfied: false, // Would need detailed analysis
            alternatives: ['Purchase materials', 'Manufacture components']
          }
        ],
        riskFactors: [
          {
            description: 'Some damage may be irreparable',
            probability: 0.2,
            impact: 'moderate',
            mitigation: 'Careful inspection before starting'
          }
        ],
        confidence: 0.7
      });
    }

    // DISASSEMBLE - Break down into components
    const canDisassemble = capabilities.has(TagCategory.BASIC_MANIPULATION);
    
    actions.push({
      type: ActionType.DISASSEMBLE,
      name: `Disassemble ${baseItem.name}`,
      description: `Carefully break down into recoverable components`,
      feasible: canDisassemble,
      estimatedTime: this.estimateDisassemblyTime(item, baseItem),
      estimatedCost: 0, // No materials needed for disassembly
      estimatedValue: this.estimateComponentValue(item, baseItem),
      requirements: [
        {
          type: 'equipment',
          description: 'Basic disassembly tools',
          satisfied: canDisassemble,
          alternatives: canDisassemble ? [] : ['Basic Hand Tools']
        }
      ],
      riskFactors: [
        {
          description: 'Component damage during disassembly',
          probability: 0.15,
          impact: 'minor',
          mitigation: 'Use proper disassembly sequence'
        }
      ],
      confidence: 0.85
    });

    // REFURBISH - Improve condition if functional
    if (!this.isDamaged(item) && item.quality < 90) {
      const canRefurbish = capabilities.has(TagCategory.PRECISION_MANIPULATION);
      
      actions.push({
        type: ActionType.REFURBISH,
        name: `Refurbish ${baseItem.name}`,
        description: `Clean, adjust, and tune for improved performance`,
        feasible: canRefurbish,
        estimatedTime: 45 * item.quantity,
        estimatedCost: 10 * item.quantity,
        estimatedValue: item.quantity * baseItem.baseValue * 1.3,
        requirements: [
          {
            type: 'equipment',
            description: 'Precision tools for adjustment and cleaning',
            satisfied: canRefurbish,
            alternatives: canRefurbish ? [] : ['Precision Hand Tools', 'Measuring Equipment']
          }
        ],
        riskFactors: [
          {
            description: 'Risk of over-adjustment affecting performance',
            probability: 0.1,
            impact: 'minor'
          }
        ],
        confidence: 0.75
      });
    }

    return actions;
  }

  /**
   * Universal actions available for any item
   */
  private static analyzeUniversalActions(
    item: ItemInstance,
    baseItem: BaseItem,
    facility: Facility,
    capabilities: Map<TagCategory, number>
  ): DiscoveredAction[] {
    const actions: DiscoveredAction[] = [];

    // CLEAN - Remove environmental damage tags
    if (this.hasEnvironmentalDamage(item)) {
      const canClean = capabilities.has(TagCategory.BASIC_MANIPULATION);
      
      actions.push({
        type: ActionType.CLEAN,
        name: `Clean ${baseItem.name}`,
        description: `Remove environmental contamination and restore condition`,
        feasible: canClean,
        estimatedTime: 20 * item.quantity,
        estimatedCost: 5 * item.quantity, // Cleaning supplies
        estimatedValue: this.estimateCleanedValue(item, baseItem),
        requirements: [
          {
            type: 'equipment',
            description: 'Cleaning equipment and workspace',
            satisfied: canClean
          }
        ],
        riskFactors: [
          {
            description: 'Some contamination may be permanent',
            probability: 0.1,
            impact: 'minor'
          }
        ],
        confidence: 0.9
      });
    }

    // ANALYZE - Learn about unknown or complex items
    actions.push({
      type: ActionType.ANALYZE,
      name: `Analyze ${baseItem.name}`,
      description: `Study construction and identify improvement opportunities`,
      feasible: true,
      estimatedTime: 10,
      estimatedCost: 0,
      estimatedValue: 0, // Knowledge value
      requirements: [],
      riskFactors: [],
      confidence: 1.0
    });

    // SCRAP - Emergency disposal
    actions.push({
      type: ActionType.SCRAP,
      name: `Scrap ${baseItem.name}`,
      description: `Emergency disposal for immediate credits (low value)`,
      feasible: true,
      estimatedTime: 5,
      estimatedCost: 0,
      estimatedValue: baseItem.baseValue * 0.1, // Very low scrap value
      requirements: [],
      riskFactors: [
        {
          description: 'Permanent destruction of item',
          probability: 1.0,
          impact: 'severe',
          mitigation: 'Consider other options first'
        }
      ],
      confidence: 1.0
    });

    return actions;
  }

  // Helper methods for condition analysis
  private static isDamaged(item: ItemInstance): boolean {
    return item.tags.includes(ItemTag.DAMAGED) || item.tags.includes(ItemTag.JUNK);
  }

  private static hasEnvironmentalDamage(item: ItemInstance): boolean {
    // Would check for [drenched], [corroded], [heat-damaged] etc when we add those tags
    return item.tags.some(tag => ['drenched', 'corroded', 'heat_damaged'].includes(tag));
  }

  // Estimation methods (placeholder logic for now)
  private static estimateRepairTime(item: ItemInstance, baseItem: BaseItem): number {
    const baseTime = 60; // 1 hour base
    const qualityPenalty = (100 - item.quality) / 100; // Worse condition = longer repair
    return Math.round(baseTime * (1 + qualityPenalty) * item.quantity);
  }

  private static estimateRepairCost(item: ItemInstance, baseItem: BaseItem): number {
    const baseCost = baseItem.baseValue * 0.3; // 30% of item value
    const qualityPenalty = (100 - item.quality) / 100;
    return Math.round(baseCost * (1 + qualityPenalty) * item.quantity);
  }

  private static estimateRepairedValue(item: ItemInstance, baseItem: BaseItem): number {
    // Repaired items typically reach 70-80% of pristine value
    return Math.round(baseItem.baseValue * 0.75 * item.quantity);
  }

  private static estimateDisassemblyTime(item: ItemInstance, baseItem: BaseItem): number {
    // Disassembly is typically faster than assembly
    return Math.round(20 * item.quantity); // 20 minutes per item
  }

  private static estimateComponentValue(item: ItemInstance, baseItem: BaseItem): number {
    // Components typically worth 60-80% of assembled value depending on condition
    const conditionMultiplier = this.isDamaged(item) ? 0.6 : 0.8;
    return Math.round(baseItem.baseValue * conditionMultiplier * item.quantity);
  }

  private static estimateCleanedValue(item: ItemInstance, baseItem: BaseItem): number {
    // Cleaning typically restores 10-20% of lost value
    const currentValue = baseItem.baseValue * (item.quality / 100);
    const potentialGain = baseItem.baseValue * 0.15; // 15% potential improvement
    return Math.round((currentValue + potentialGain) * item.quantity);
  }
}