// Condition Treatment Planner - Manufacturing v2 Phase 3
// Handles environmental damage tags and special conditions automatically

import {
  ItemInstance,
  BaseItem,
  ItemTag,
  Equipment,
  TagCategory,
  LaborSkill
} from '../types';

// Environmental damage tags that can be treated
export enum EnvironmentalCondition {
  DRENCHED = 'drenched',               // Water damage - needs drying
  CORRODED = 'corroded',               // Corrosion damage - needs chemical treatment
  HEAT_DAMAGED = 'heat_damaged',       // Heat damage - may need re-tempering
  CONTAMINATED = 'contaminated',       // Chemical contamination - needs specialized cleaning
  FROZEN = 'frozen',                   // Cold damage - needs careful thawing
  RADIATION_EXPOSED = 'radiation_exposed', // Radiation damage - needs decontamination
  IMPACT_DAMAGED = 'impact_damaged',   // Physical trauma - structural assessment needed
  WORN = 'worn'                        // General wear - refurbishment needed
}

// Treatment operation definition
export interface TreatmentOperation {
  id: string;
  name: string;
  description: string;
  targetCondition: EnvironmentalCondition;
  requiredEquipment: TagCategory[];
  alternativeEquipment?: TagCategory[][]; // Alternative equipment combinations
  estimatedTime: number; // minutes
  materialRequirements: Array<{
    materialId: string;
    quantity: number;
    description: string;
  }>;
  successProbability: number; // 0-1
  qualityImprovement: number; // Expected quality gain
  riskFactors: TreatmentRisk[];
  laborSkill: LaborSkill;
  prerequisites?: string[]; // Other treatments that must happen first
}

export interface TreatmentRisk {
  description: string;
  probability: number; // 0-1
  impact: 'component_loss' | 'quality_reduction' | 'time_increase' | 'material_waste';
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}

// Complete treatment plan for an item
export interface TreatmentPlan {
  itemId: string;
  detectedConditions: EnvironmentalCondition[];
  requiredTreatments: TreatmentOperation[];
  treatmentSequence: string[]; // Order of operations
  totalEstimatedTime: number;
  totalMaterialCost: number;
  expectedQualityGain: number;
  overallSuccessProbability: number;
  equipment_feasible: boolean;
  missingEquipment: TagCategory[];
  riskAssessment: {
    low: TreatmentRisk[];
    medium: TreatmentRisk[];
    high: TreatmentRisk[];
  };
}

export class ConditionTreatmentPlanner {
  
  // Treatment operation database
  private static treatmentDatabase: Map<EnvironmentalCondition, TreatmentOperation> = new Map([
    
    [EnvironmentalCondition.DRENCHED, {
      id: 'treatment_drying',
      name: 'Drying Process',
      description: 'Remove moisture and prevent further water damage',
      targetCondition: EnvironmentalCondition.DRENCHED,
      requiredEquipment: [TagCategory.BASIC_MANIPULATION],
      alternativeEquipment: [[TagCategory.SURFACE]], // Heated surface for drying
      estimatedTime: 45,
      materialRequirements: [
        { materialId: 'absorbent_materials', quantity: 1, description: 'Drying cloths and absorbents' }
      ],
      successProbability: 0.95,
      qualityImprovement: 10,
      riskFactors: [
        {
          description: 'Rapid drying may cause material stress',
          probability: 0.1,
          impact: 'quality_reduction',
          severity: 'low',
          mitigation: 'Use gradual temperature increase'
        }
      ],
      laborSkill: 'unskilled'
    }],
    
    [EnvironmentalCondition.CORRODED, {
      id: 'treatment_corrosion_removal',
      name: 'Corrosion Removal',
      description: 'Chemical treatment to remove rust and corrosion',
      targetCondition: EnvironmentalCondition.CORRODED,
      requiredEquipment: [TagCategory.BASIC_MANIPULATION],
      estimatedTime: 60,
      materialRequirements: [
        { materialId: 'rust_remover', quantity: 2, description: 'Chemical rust removal compounds' },
        { materialId: 'protective_coating', quantity: 1, description: 'Anti-corrosion coating' }
      ],
      successProbability: 0.85,
      qualityImprovement: 15,
      riskFactors: [
        {
          description: 'Chemical damage to other components',
          probability: 0.15,
          impact: 'component_loss',
          severity: 'medium',
          mitigation: 'Careful component isolation'
        },
        {
          description: 'Deep corrosion may be irreversible',
          probability: 0.2,
          impact: 'quality_reduction',
          severity: 'medium',
          mitigation: 'Pre-assessment of corrosion depth'
        }
      ],
      laborSkill: 'skilled_technician',
      prerequisites: ['treatment_drying'] // Must be dry before chemical treatment
    }],
    
    [EnvironmentalCondition.HEAT_DAMAGED, {
      id: 'treatment_heat_repair',
      name: 'Heat Damage Repair',
      description: 'Re-tempering and structural repair for heat-damaged components',
      targetCondition: EnvironmentalCondition.HEAT_DAMAGED,
      requiredEquipment: [TagCategory.SURFACE, TagCategory.BASIC_MANIPULATION],
      alternativeEquipment: [[TagCategory.TURNING, TagCategory.BASIC_MANIPULATION]], // Alternative heat treatment
      estimatedTime: 90,
      materialRequirements: [
        { materialId: 'tempering_compounds', quantity: 1, description: 'Heat treatment materials' }
      ],
      successProbability: 0.7,
      qualityImprovement: 20,
      riskFactors: [
        {
          description: 'Further heat damage during treatment',
          probability: 0.25,
          impact: 'quality_reduction',
          severity: 'high',
          mitigation: 'Precise temperature control'
        },
        {
          description: 'Warping or dimensional changes',
          probability: 0.15,
          impact: 'component_loss',
          severity: 'medium',
          mitigation: 'Controlled cooling rates'
        }
      ],
      laborSkill: 'skilled_machinist'
    }],
    
    [EnvironmentalCondition.CONTAMINATED, {
      id: 'treatment_decontamination',
      name: 'Chemical Decontamination',
      description: 'Remove chemical contamination and residues',
      targetCondition: EnvironmentalCondition.CONTAMINATED,
      requiredEquipment: [TagCategory.BASIC_MANIPULATION],
      estimatedTime: 75,
      materialRequirements: [
        { materialId: 'decontamination_solution', quantity: 3, description: 'Specialized cleaning solutions' },
        { materialId: 'neutralizing_agent', quantity: 1, description: 'Chemical neutralization compounds' }
      ],
      successProbability: 0.8,
      qualityImprovement: 12,
      riskFactors: [
        {
          description: 'Unknown contaminant reactions',
          probability: 0.1,
          impact: 'material_waste',
          severity: 'medium',
          mitigation: 'Test small area first'
        }
      ],
      laborSkill: 'specialist'
    }],
    
    [EnvironmentalCondition.FROZEN, {
      id: 'treatment_thawing',
      name: 'Controlled Thawing',
      description: 'Gradual temperature restoration to prevent thermal shock',
      targetCondition: EnvironmentalCondition.FROZEN,
      requiredEquipment: [TagCategory.SURFACE], // Heated surface for controlled warming
      estimatedTime: 30,
      materialRequirements: [
        { materialId: 'thermal_protection', quantity: 1, description: 'Thermal shock prevention materials' }
      ],
      successProbability: 0.9,
      qualityImprovement: 8,
      riskFactors: [
        {
          description: 'Thermal shock from rapid temperature change',
          probability: 0.15,
          impact: 'quality_reduction',
          severity: 'medium',
          mitigation: 'Gradual temperature increase'
        }
      ],
      laborSkill: 'skilled_technician'
    }],
    
    [EnvironmentalCondition.WORN, {
      id: 'treatment_refurbishment',
      name: 'General Refurbishment',
      description: 'Address general wear and restore performance',
      targetCondition: EnvironmentalCondition.WORN,
      requiredEquipment: [TagCategory.PRECISION_MANIPULATION, TagCategory.MEASURING],
      estimatedTime: 40,
      materialRequirements: [
        { materialId: 'lubricants', quantity: 1, description: 'Precision lubricants and cleaners' },
        { materialId: 'replacement_parts', quantity: 1, description: 'Small replacement components' }
      ],
      successProbability: 0.85,
      qualityImprovement: 15,
      riskFactors: [
        {
          description: 'Over-adjustment affecting performance',
          probability: 0.1,
          impact: 'quality_reduction',
          severity: 'low',
          mitigation: 'Careful calibration and testing'
        }
      ],
      laborSkill: 'skilled_technician'
    }]
  ]);

  /**
   * Analyze an item and generate a complete treatment plan
   */
  static generateTreatmentPlan(
    item: ItemInstance,
    baseItem: BaseItem,
    availableEquipment: Map<TagCategory, number>
  ): TreatmentPlan | null {
    
    // Detect environmental conditions (this would be expanded with actual tag detection)
    const detectedConditions = this.detectEnvironmentalConditions(item);
    
    if (detectedConditions.length === 0) {
      return null; // No treatment needed
    }

    console.log(`ConditionTreatmentPlanner: Detected conditions for ${baseItem.name}: ${detectedConditions.join(', ')}`);

    const requiredTreatments: TreatmentOperation[] = [];
    const missingEquipment: TagCategory[] = [];
    let equipment_feasible = true;

    // Get treatment operations for each detected condition
    detectedConditions.forEach(condition => {
      const treatment = this.treatmentDatabase.get(condition);
      if (treatment) {
        requiredTreatments.push(treatment);
        
        // Check equipment requirements
        const hasRequired = treatment.requiredEquipment.every(req => 
          availableEquipment.has(req) && (availableEquipment.get(req) || 0) > 0
        );
        
        if (!hasRequired) {
          // Check alternative equipment
          let hasAlternative = false;
          if (treatment.alternativeEquipment) {
            hasAlternative = treatment.alternativeEquipment.some(altSet =>
              altSet.every(req => availableEquipment.has(req) && (availableEquipment.get(req) || 0) > 0)
            );
          }
          
          if (!hasAlternative) {
            equipment_feasible = false;
            treatment.requiredEquipment.forEach(req => {
              if (!availableEquipment.has(req) || (availableEquipment.get(req) || 0) === 0) {
                missingEquipment.push(req);
              }
            });
          }
        }
      }
    });

    // Generate optimal treatment sequence
    const treatmentSequence = this.optimizeTreatmentSequence(requiredTreatments);

    // Calculate totals
    const totalEstimatedTime = requiredTreatments.reduce((sum, t) => sum + t.estimatedTime, 0);
    const totalMaterialCost = this.calculateMaterialCosts(requiredTreatments);
    const expectedQualityGain = Math.min(
      requiredTreatments.reduce((sum, t) => sum + t.qualityImprovement, 0),
      100 - item.quality // Can't exceed 100% quality
    );
    const overallSuccessProbability = requiredTreatments.reduce((prob, t) => prob * t.successProbability, 1.0);

    // Categorize risks
    const allRisks = requiredTreatments.flatMap(t => t.riskFactors);
    const riskAssessment = {
      low: allRisks.filter(r => r.severity === 'low'),
      medium: allRisks.filter(r => r.severity === 'medium'),
      high: allRisks.filter(r => r.severity === 'high')
    };

    return {
      itemId: item.id,
      detectedConditions,
      requiredTreatments,
      treatmentSequence,
      totalEstimatedTime,
      totalMaterialCost,
      expectedQualityGain,
      overallSuccessProbability,
      equipment_feasible,
      missingEquipment: [...new Set(missingEquipment)], // Remove duplicates
      riskAssessment
    };
  }

  /**
   * Get treatment operation by condition type
   */
  static getTreatmentOperation(condition: EnvironmentalCondition): TreatmentOperation | undefined {
    return this.treatmentDatabase.get(condition);
  }

  /**
   * Check if a condition can be treated with available equipment
   */
  static canTreatCondition(
    condition: EnvironmentalCondition,
    availableEquipment: Map<TagCategory, number>
  ): boolean {
    const treatment = this.treatmentDatabase.get(condition);
    if (!treatment) return false;

    // Check primary requirements
    const hasRequired = treatment.requiredEquipment.every(req => 
      availableEquipment.has(req) && (availableEquipment.get(req) || 0) > 0
    );

    if (hasRequired) return true;

    // Check alternatives
    if (treatment.alternativeEquipment) {
      return treatment.alternativeEquipment.some(altSet =>
        altSet.every(req => availableEquipment.has(req) && (availableEquipment.get(req) || 0) > 0)
      );
    }

    return false;
  }

  // Helper methods

  private static detectEnvironmentalConditions(item: ItemInstance): EnvironmentalCondition[] {
    const conditions: EnvironmentalCondition[] = [];
    
    // This would be expanded to detect actual environmental condition tags
    // For now, detect based on existing tags and quality
    
    if (item.tags.some(tag => ['drenched', 'wet', 'waterlogged'].includes(tag))) {
      conditions.push(EnvironmentalCondition.DRENCHED);
    }
    
    if (item.tags.some(tag => ['corroded', 'rusted', 'oxidized'].includes(tag))) {
      conditions.push(EnvironmentalCondition.CORRODED);
    }
    
    if (item.tags.some(tag => ['heat_damaged', 'overheated', 'burned'].includes(tag))) {
      conditions.push(EnvironmentalCondition.HEAT_DAMAGED);
    }
    
    if (item.tags.some(tag => ['contaminated', 'polluted', 'toxic'].includes(tag))) {
      conditions.push(EnvironmentalCondition.CONTAMINATED);
    }
    
    if (item.tags.some(tag => ['frozen', 'ice_damaged', 'frost_damaged'].includes(tag))) {
      conditions.push(EnvironmentalCondition.FROZEN);
    }
    
    // General wear detection
    if (item.quality < 60 && !item.tags.includes(ItemTag.DAMAGED)) {
      conditions.push(EnvironmentalCondition.WORN);
    }
    
    return conditions;
  }

  private static optimizeTreatmentSequence(treatments: TreatmentOperation[]): string[] {
    // Sort treatments based on prerequisites and logical order
    const sorted = [...treatments];
    
    // Simple dependency resolution - treatments with prerequisites go after their dependencies
    sorted.sort((a, b) => {
      if (a.prerequisites && a.prerequisites.includes(b.id)) return 1;
      if (b.prerequisites && b.prerequisites.includes(a.id)) return -1;
      
      // Default order: structural treatments first, then cleaning, then refinishing
      const order = ['drying', 'corrosion_removal', 'heat_repair', 'decontamination', 'thawing', 'refurbishment'];
      const aIndex = order.findIndex(o => a.id.includes(o));
      const bIndex = order.findIndex(o => b.id.includes(o));
      
      return aIndex - bIndex;
    });
    
    return sorted.map(t => t.id);
  }

  private static calculateMaterialCosts(treatments: TreatmentOperation[]): number {
    // Placeholder calculation - would integrate with actual material pricing
    return treatments.reduce((total, treatment) => {
      return total + treatment.materialRequirements.reduce((sum, req) => sum + req.quantity * 10, 0); // 10 credits per material unit
    }, 0);
  }

  /**
   * Get all available treatment operations
   */
  static getAllTreatmentOperations(): TreatmentOperation[] {
    return Array.from(this.treatmentDatabase.values());
  }

  /**
   * Get treatment recommendations for an item
   */
  static getTreatmentRecommendations(
    item: ItemInstance,
    baseItem: BaseItem,
    availableEquipment: Map<TagCategory, number>
  ): Array<{
    condition: EnvironmentalCondition;
    treatment: TreatmentOperation;
    feasible: boolean;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }> {
    const detectedConditions = this.detectEnvironmentalConditions(item);
    
    return detectedConditions.map(condition => {
      const treatment = this.treatmentDatabase.get(condition)!;
      const feasible = this.canTreatCondition(condition, availableEquipment);
      
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let reasoning = '';
      
      // Determine priority and reasoning
      if (condition === EnvironmentalCondition.CORRODED) {
        priority = 'high';
        reasoning = 'Corrosion will worsen over time and affect other components';
      } else if (condition === EnvironmentalCondition.DRENCHED) {
        priority = 'high';
        reasoning = 'Water damage can lead to corrosion and electrical problems';
      } else if (condition === EnvironmentalCondition.HEAT_DAMAGED) {
        priority = 'medium';
        reasoning = 'Heat damage affects structural integrity and performance';
      } else if (condition === EnvironmentalCondition.WORN) {
        priority = 'low';
        reasoning = 'General wear affects performance but not critical function';
      } else {
        reasoning = 'Environmental damage should be addressed to prevent degradation';
      }
      
      return {
        condition,
        treatment,
        feasible,
        priority,
        reasoning
      };
    }).sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}