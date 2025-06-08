// Gap Analysis Engine - Manufacturing v2
// Calculates component gaps between requirements and availability

import { 
  ComponentGap, 
  ConditionAnalysis,
  ItemManufacturingType
} from '../types';
import { ItemInstance, ItemTag, ComponentRequirement } from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from './manufacturingRules';

export class GapAnalyzer {
  /**
   * Calculate component gaps for manufacturing a target product
   */
  static calculateComponentGaps(
    targetProductId: string,
    targetQuantity: number,
    availableInventory: ItemInstance[],
    inputAnalysis: ConditionAnalysis[]
  ): ComponentGap[] {
    const baseItem = getBaseItem(targetProductId);
    
    if (!baseItem || !baseItem.assemblyComponents) {
      throw new Error(`${targetProductId} is not a valid assembly item`);
    }
    
    const gaps: ComponentGap[] = [];
    
    // Calculate requirements for each component
    for (const requirement of baseItem.assemblyComponents) {
      const gap = this.calculateSingleComponentGap(
        requirement,
        targetQuantity,
        availableInventory,
        inputAnalysis
      );
      gaps.push(gap);
    }
    
    return gaps;
  }
  
  /**
   * Calculate gap for a single component type
   */
  private static calculateSingleComponentGap(
    requirement: ComponentRequirement,
    targetQuantity: number,
    availableInventory: ItemInstance[],
    inputAnalysis: ConditionAnalysis[]
  ): ComponentGap {
    const totalRequired = requirement.quantity * targetQuantity;
    
    // Calculate available components in inventory
    const available = this.countAvailableComponents(
      requirement.componentId,
      requirement.requiredTags,
      requirement.maxQuality,
      availableInventory
    );
    
    // Calculate recoverable components from input analysis
    const recoverable = this.countRecoverableComponents(
      requirement.componentId,
      requirement.requiredTags,
      requirement.maxQuality,
      inputAnalysis
    );
    
    const needToManufacture = Math.max(0, totalRequired - available - recoverable);
    
    return {
      componentType: requirement.componentId,
      required: totalRequired,
      available,
      recoverable,
      needToManufacture
    };
  }
  
  /**
   * Count available components in inventory that match requirements
   */
  private static countAvailableComponents(
    componentId: string,
    requiredTags?: ItemTag[],
    maxQuality?: number,
    inventory: ItemInstance[]
  ): number {
    return inventory
      .filter(item => item.baseItemId === componentId)
      .filter(item => this.itemMatchesRequirements(item, requiredTags, maxQuality))
      .reduce((sum, item) => sum + item.quantity, 0);
  }
  
  /**
   * Count recoverable components from input analysis
   */
  private static countRecoverableComponents(
    componentId: string,
    requiredTags?: ItemTag[],
    maxQuality?: number,
    inputAnalysis: ConditionAnalysis[]
  ): number {
    let totalRecoverable = 0;
    
    for (const analysis of inputAnalysis) {
      for (const recovery of analysis.estimatedRecovery) {
        if (recovery.componentType === componentId) {
          // Check if recovered component would meet requirements
          const wouldMeetRequirements = this.recoveredComponentMeetsRequirements(
            recovery,
            requiredTags,
            maxQuality
          );
          
          if (wouldMeetRequirements) {
            totalRecoverable += recovery.estimatedQuantity;
          }
        }
      }
    }
    
    return totalRecoverable;
  }
  
  /**
   * Check if an item instance matches the requirements
   */
  private static itemMatchesRequirements(
    item: ItemInstance,
    requiredTags?: ItemTag[],
    maxQuality?: number
  ): boolean {
    // Check quality requirement
    if (maxQuality !== undefined && item.quality > maxQuality) {
      return false;
    }
    
    // Check required tags
    if (requiredTags && requiredTags.length > 0) {
      const hasAllRequiredTags = requiredTags.every(tag => item.tags.includes(tag));
      if (!hasAllRequiredTags) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if a recovered component would meet requirements
   */
  private static recoveredComponentMeetsRequirements(
    recovery: any, // ComponentRecovery
    requiredTags?: ItemTag[],
    maxQuality?: number
  ): boolean {
    // Check quality requirement
    if (maxQuality !== undefined && recovery.expectedQuality > maxQuality) {
      return false;
    }
    
    // For now, assume recovered components will have the required tags
    // This could be made more sophisticated based on the recovery process
    
    return true;
  }
  
  /**
   * Calculate total manufacturing time needed to fill gaps
   */
  static estimateManufacturingTime(gaps: ComponentGap[]): number {
    let totalTime = 0;
    
    for (const gap of gaps) {
      if (gap.needToManufacture > 0) {
        const componentTime = this.estimateComponentManufacturingTime(
          gap.componentType,
          gap.needToManufacture
        );
        totalTime += componentTime;
      }
    }
    
    return totalTime;
  }
  
  /**
   * Estimate time to manufacture a specific number of components
   */
  private static estimateComponentManufacturingTime(
    componentType: string,
    quantity: number
  ): number {
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem) {
      return 0;
    }
    
    // Base time estimates by manufacturing type
    switch (baseItem.manufacturingType) {
      case ItemManufacturingType.SHAPED_MATERIAL:
        // Shaped materials: 30-60 minutes per unit depending on complexity
        const shapingTime = this.getShapingTime(componentType);
        return shapingTime * quantity;
        
      case ItemManufacturingType.ASSEMBLY:
        // Assemblies: time for components + assembly time
        let assemblyTime = 0.5; // 30 minutes base assembly time
        
        if (baseItem.assemblyComponents) {
          // Add time for sub-components (recursive)
          const subGaps = baseItem.assemblyComponents.map(comp => ({
            componentType: comp.componentId,
            required: comp.quantity * quantity,
            available: 0,
            recoverable: 0,
            needToManufacture: comp.quantity * quantity
          }));
          
          assemblyTime += this.estimateManufacturingTime(subGaps);
        }
        
        return assemblyTime;
        
      default:
        return 0;
    }
  }
  
  /**
   * Get estimated shaping time for different materials
   */
  private static getShapingTime(componentType: string): number {
    // Time estimates in game hours
    const shapingTimes: Record<string, number> = {
      'mechanical-component': 0.75,  // 45 minutes
      'plastic-casing': 0.5,         // 30 minutes
      'machined_parts': 1.0,         // 60 minutes
      'precision_spares': 1.25,      // 75 minutes
      'basic_electronics': 0.33,     // 20 minutes
      'advanced_electronics': 1.5,   // 90 minutes
    };
    
    return shapingTimes[componentType] || 0.5; // Default 30 minutes
  }
  
  /**
   * Identify which components are bottlenecks
   */
  static identifyBottlenecks(gaps: ComponentGap[]): ComponentGap[] {
    return gaps
      .filter(gap => gap.needToManufacture > 0)
      .sort((a, b) => {
        // Sort by manufacturing time needed (complexity)
        const timeA = this.estimateComponentManufacturingTime(a.componentType, a.needToManufacture);
        const timeB = this.estimateComponentManufacturingTime(b.componentType, b.needToManufacture);
        return timeB - timeA; // Descending order
      });
  }
  
  /**
   * Get gap analysis summary for UI display
   */
  static getGapSummary(gaps: ComponentGap[]): string {
    const totalRequired = gaps.reduce((sum, gap) => sum + gap.required, 0);
    const totalAvailable = gaps.reduce((sum, gap) => sum + gap.available, 0);
    const totalRecoverable = gaps.reduce((sum, gap) => sum + gap.recoverable, 0);
    const totalToManufacture = gaps.reduce((sum, gap) => sum + gap.needToManufacture, 0);
    
    const availablePercent = Math.round((totalAvailable / totalRequired) * 100);
    const recoverablePercent = Math.round((totalRecoverable / totalRequired) * 100);
    const manufacturePercent = Math.round((totalToManufacture / totalRequired) * 100);
    
    return `Required: ${totalRequired}, Available: ${totalAvailable} (${availablePercent}%), Recoverable: ${totalRecoverable} (${recoverablePercent}%), Need to make: ${totalToManufacture} (${manufacturePercent}%)`;
  }
  
  /**
   * Check if all gaps can be filled with current resources
   */
  static canFillAllGaps(gaps: ComponentGap[]): boolean {
    return gaps.every(gap => gap.needToManufacture === 0);
  }
}