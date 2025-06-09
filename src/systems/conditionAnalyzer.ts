// Condition Analysis System - Manufacturing v2
// Analyzes input items and predicts component recovery

import { 
  ConditionAnalysis, 
  ComponentRecovery, 
  TreatmentOperation, 
  RecoveryRisk,
  ItemManufacturingType,
  OperationType
} from '../types';
import { ItemInstance, ItemTag } from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from './manufacturingRules';

export class ConditionAnalyzer {
  /**
   * Analyze an item instance and predict what can be recovered from it
   */
  static analyzeItem(itemInstance: ItemInstance): ConditionAnalysis {
    const baseItem = getBaseItem(itemInstance.baseItemId);
    
    if (!baseItem) {
      throw new Error(`Unknown item: ${itemInstance.baseItemId}`);
    }
    
    const conditionTags = this.extractConditionTags(itemInstance.tags);
    const estimatedRecovery = this.predictComponentRecovery(itemInstance);
    const treatmentRequirements = this.determineTreatmentRequirements(itemInstance);
    const risks = this.assessRecoveryRisks(itemInstance);
    
    return {
      itemId: itemInstance.id,
      itemType: itemInstance.baseItemId,
      condition: conditionTags,
      estimatedRecovery,
      treatmentRequirements,
      risks,
      manufacturingType: baseItem.manufacturingType
    };
  }
  
  /**
   * Extract condition-related tags from an item
   */
  private static extractConditionTags(tags: ItemTag[]): ItemTag[] {
    const conditionTags = [
      ItemTag.DAMAGED, 
      ItemTag.JUNK, 
      ItemTag.RESTORED, 
      ItemTag.FORGED,
      ItemTag.HAND_FORGED,
      ItemTag.MILITARY_GRADE,
      ItemTag.SALVAGED,
      ItemTag.REFURBISHED,
      ItemTag.ANTIQUE
    ];
    
    return tags.filter(tag => conditionTags.includes(tag));
  }
  
  /**
   * Predict what components can be recovered from disassembly
   */
  private static predictComponentRecovery(itemInstance: ItemInstance): ComponentRecovery[] {
    const baseItem = getBaseItem(itemInstance.baseItemId);
    
    if (!baseItem || !ManufacturingRulesEngine.validateOperation(itemInstance.baseItemId, OperationType.DISASSEMBLY)) {
      return [];
    }
    
    const recoveries: ComponentRecovery[] = [];
    
    // If it's an assembly, predict component recovery based on condition
    if (baseItem.assemblyComponents) {
      for (const component of baseItem.assemblyComponents) {
        const recovery = this.predictComponentRecoveryRate(itemInstance, component.componentId, component.quantity);
        recoveries.push(recovery);
      }
    }
    
    return recoveries;
  }
  
  /**
   * Predict recovery rate for a specific component type
   */
  private static predictComponentRecoveryRate(
    itemInstance: ItemInstance, 
    componentType: string, 
    originalQuantity: number
  ): ComponentRecovery {
    const quality = itemInstance.quality;
    const tags = itemInstance.tags;
    
    let recoveryRate = 0.7; // Base 70% recovery rate
    let qualityModifier = 1.0;
    let confidenceLevel = 0.8;
    
    // Adjust based on condition tags
    if (tags.includes(ItemTag.DAMAGED)) {
      recoveryRate *= 0.4; // Only 40% of original recovery rate
      qualityModifier *= 0.3; // Components will be much lower quality
      confidenceLevel = 0.6; // Less confident in damaged items
    }
    
    if (tags.includes(ItemTag.JUNK)) {
      recoveryRate *= 0.2; // Only 20% recovery rate
      qualityModifier *= 0.2;
      confidenceLevel = 0.4;
    }
    
    if (tags.includes(ItemTag.MILITARY_GRADE)) {
      recoveryRate *= 1.2; // Better construction = better recovery
      qualityModifier *= 1.1;
      confidenceLevel = 0.9;
    }
    
    if (tags.includes(ItemTag.FORGED) || tags.includes(ItemTag.HAND_FORGED)) {
      recoveryRate *= 1.1; // Well-made items disassemble better
      qualityModifier *= 1.05;
    }
    
    // Quality affects both recovery rate and component quality
    const qualityFactor = quality / 100;
    recoveryRate *= (0.5 + 0.5 * qualityFactor); // 50-100% based on quality
    
    const estimatedQuantity = Math.max(0, Math.floor(originalQuantity * recoveryRate));
    const expectedQuality = Math.max(5, quality * qualityModifier * 0.8); // Components are usually lower quality
    
    return {
      componentType,
      estimatedQuantity,
      expectedQuality: Math.min(100, expectedQuality),
      confidenceLevel
    };
  }
  
  /**
   * Determine what treatment operations are needed
   */
  private static determineTreatmentRequirements(itemInstance: ItemInstance): TreatmentOperation[] {
    const treatments: TreatmentOperation[] = [];
    const tags = itemInstance.tags;
    
    // Add treatments based on condition tags
    // Note: These would be expanded with actual special condition tags like [drenched], [corroded], etc.
    
    if (tags.includes(ItemTag.DAMAGED)) {
      treatments.push({
        id: 'damage_assessment',
        name: 'Damage Assessment',
        required: true,
        estimatedTime: 0.25, // 15 minutes
        materialRequirements: [],
        successProbability: 0.95,
        equipmentRequirements: ['MEASURING']
      });
    }
    
    if (tags.includes(ItemTag.JUNK)) {
      treatments.push({
        id: 'salvage_evaluation',
        name: 'Salvage Evaluation',
        required: true,
        estimatedTime: 0.33, // 20 minutes
        materialRequirements: [],
        successProbability: 0.8,
        equipmentRequirements: ['MEASURING', 'BASIC_MANIPULATION']
      });
    }
    
    // Future: Add treatments for special conditions like [drenched], [corroded], etc.
    
    return treatments;
  }
  
  /**
   * Assess risks in the recovery process
   */
  private static assessRecoveryRisks(itemInstance: ItemInstance): RecoveryRisk[] {
    const risks: RecoveryRisk[] = [];
    const quality = itemInstance.quality;
    const tags = itemInstance.tags;
    
    if (quality < 30) {
      risks.push({
        description: 'Very low quality may result in component destruction',
        probability: 0.3,
        impact: 'component_loss',
        severity: 'high'
      });
    }
    
    if (tags.includes(ItemTag.DAMAGED)) {
      risks.push({
        description: 'Damaged items may have hidden structural failures',
        probability: 0.4,
        impact: 'component_loss',
        severity: 'medium'
      });
      
      risks.push({
        description: 'Disassembly may take longer due to stuck or broken parts',
        probability: 0.6,
        impact: 'time_increase',
        severity: 'low'
      });
    }
    
    if (tags.includes(ItemTag.JUNK)) {
      risks.push({
        description: 'Junk items may crumble during disassembly',
        probability: 0.5,
        impact: 'component_loss',
        severity: 'high'
      });
      
      risks.push({
        description: 'May recover mostly scrap material instead of components',
        probability: 0.7,
        impact: 'quality_reduction',
        severity: 'medium'
      });
    }
    
    return risks;
  }
  
  /**
   * Batch analyze multiple items
   */
  static analyzeItems(itemInstances: ItemInstance[]): ConditionAnalysis[] {
    return itemInstances.map(item => this.analyzeItem(item));
  }
  
  /**
   * Get condition summary for UI display
   */
  static getConditionSummary(analysis: ConditionAnalysis): string {
    const quality = analysis.estimatedRecovery.reduce((sum, recovery) => 
      sum + recovery.expectedQuality, 0) / Math.max(1, analysis.estimatedRecovery.length);
    
    const totalComponents = analysis.estimatedRecovery.reduce((sum, recovery) => 
      sum + recovery.estimatedQuantity, 0);
    
    const confidence = analysis.estimatedRecovery.reduce((sum, recovery) => 
      sum + recovery.confidenceLevel, 0) / Math.max(1, analysis.estimatedRecovery.length);
    
    const riskLevel = analysis.risks.reduce((maxSeverity, risk) => {
      const severityScore = { low: 1, medium: 2, high: 3 }[risk.severity];
      return Math.max(maxSeverity, severityScore);
    }, 0);
    
    const riskDescription = ['No risk', 'Low risk', 'Medium risk', 'High risk'][riskLevel];
    
    return `Expected: ${totalComponents} components, ~${Math.round(quality)}% quality, ${Math.round(confidence * 100)}% confidence, ${riskDescription}`;
  }
}