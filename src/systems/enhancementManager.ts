// Enhancement Manager - Manufacturing v2 Phase 2
// Discovers available enhancements based on equipment and capabilities

import { 
  Enhancement, 
  EnhancementDiscovery, 
  EnhancementRequirement,
  EnhancementSelection,
  Facility,
  Equipment,
  EquipmentInstance,
  ItemInstance
} from '../types';
import { 
  enhancementDefinitions, 
  getAllEnhancements, 
  getEnhancement,
  areEnhancementsCompatible 
} from '../data/enhancements';

export class EnhancementManager {
  private equipmentDatabase: Map<string, Equipment>;
  
  constructor(equipmentDatabase: Map<string, Equipment>) {
    this.equipmentDatabase = equipmentDatabase;
  }
  
  /**
   * Static convenience method for discovering available enhancements
   */
  static discoverAvailableEnhancements(facility: Facility): Enhancement[] {
    // Use a default instance with empty equipment database for now
    const manager = new EnhancementManager(new Map());
    const discovery = manager.discoverEnhancements('basic_sidearm', facility, []);
    return discovery.availableEnhancements;
  }
  
  /**
   * Discover available enhancements for a product based on facility capabilities
   */
  discoverEnhancements(
    productId: string, 
    facility: Facility, 
    availableInventory: ItemInstance[] = []
  ): EnhancementDiscovery {
    console.log(`EnhancementManager: Discovering enhancements for ${productId} in facility ${facility.id}`);
    
    const allEnhancements = getAllEnhancements();
    const availableEnhancements: Enhancement[] = [];
    const lockedEnhancements: Array<{enhancement: Enhancement; missingRequirements: EnhancementRequirement[]}> = [];
    
    for (const enhancement of allEnhancements) {
      const { canApply, missingRequirements } = this.checkEnhancementRequirements(
        enhancement, 
        facility, 
        availableInventory
      );
      
      if (canApply) {
        availableEnhancements.push(enhancement);
        console.log(`EnhancementManager: ${enhancement.name} is available`);
      } else {
        lockedEnhancements.push({ enhancement, missingRequirements });
        console.log(`EnhancementManager: ${enhancement.name} is locked - missing:`, 
          missingRequirements.map(req => `${req.type}:${req.id}`));
      }
    }
    
    console.log(`EnhancementManager: Found ${availableEnhancements.length} available, ${lockedEnhancements.length} locked enhancements`);
    
    return {
      productId,
      availableEnhancements,
      lockedEnhancements,
      discoveryTime: Date.now()
    };
  }
  
  /**
   * Check if an enhancement's requirements are met
   */
  private checkEnhancementRequirements(
    enhancement: Enhancement,
    facility: Facility,
    availableInventory: ItemInstance[]
  ): { canApply: boolean; missingRequirements: EnhancementRequirement[] } {
    const missingRequirements: EnhancementRequirement[] = [];
    
    for (const requirement of enhancement.requirements) {
      switch (requirement.type) {
        case 'equipment':
          if (!this.hasRequiredEquipment(facility, requirement.id, requirement.level)) {
            missingRequirements.push(requirement);
          }
          break;
          
        case 'material':
          if (!this.hasRequiredMaterial(availableInventory, requirement.id, requirement.quantity || 1)) {
            missingRequirements.push(requirement);
          }
          break;
          
        case 'skill':
          // For now, assume all skills are available (future implementation)
          // Could check facility worker skills or unlocked capabilities
          break;
          
        case 'research':
          // For now, assume all research is available (future implementation)
          // Could check unlocked technologies or research progress
          break;
      }
    }
    
    return {
      canApply: missingRequirements.length === 0,
      missingRequirements
    };
  }
  
  /**
   * Check if facility has required equipment
   */
  private hasRequiredEquipment(facility: Facility, equipmentId: string, minLevel?: number): boolean {
    const hasEquipment = facility.equipment.some(equipment => equipment.equipmentId === equipmentId);
    
    if (!hasEquipment) {
      return false;
    }
    
    // For now, ignore level requirements (could check equipment condition/tier in future)
    // In a more advanced system, this could check equipment quality, condition, or upgrade level
    return true;
  }
  
  /**
   * Check if required materials are available
   */
  private hasRequiredMaterial(inventory: ItemInstance[], materialId: string, quantity: number): boolean {
    const available = inventory
      .filter(item => item.baseItemId === materialId)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    return available >= quantity;
  }
  
  /**
   * Validate an enhancement selection for compatibility
   */
  validateEnhancementSelection(selectedEnhancements: Enhancement[]): {
    isValid: boolean;
    conflicts: Array<{enhancement1: string; enhancement2: string; reason: string}>;
  } {
    const conflicts: Array<{enhancement1: string; enhancement2: string; reason: string}> = [];
    
    // Check all pairs for compatibility
    for (let i = 0; i < selectedEnhancements.length; i++) {
      for (let j = i + 1; j < selectedEnhancements.length; j++) {
        const enh1 = selectedEnhancements[i];
        const enh2 = selectedEnhancements[j];
        
        if (!areEnhancementsCompatible(enh1.id, enh2.id)) {
          conflicts.push({
            enhancement1: enh1.id,
            enhancement2: enh2.id,
            reason: `${enh1.name} conflicts with ${enh2.name}`
          });
        }
      }
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }
  
  /**
   * Calculate the combined effects of multiple enhancements
   */
  calculateCombinedEffects(enhancements: Enhancement[]): {
    totalTimeModifier: number;
    totalComplexityModifier: number;
    totalQualityModifier: number;
    combinedOutputTags: string[];
    maxQualityCap: number;
  } {
    let totalTimeModifier = 1.0;
    let totalComplexityModifier = 1.0;
    let totalQualityModifier = 0;
    const outputTags = new Set<string>();
    let maxQualityCap = 100; // Default cap
    
    for (const enhancement of enhancements) {
      // Multiply time and complexity modifiers
      totalTimeModifier *= enhancement.timeModifier;
      totalComplexityModifier *= enhancement.complexityModifier;
      
      // Add quality modifiers
      totalQualityModifier += enhancement.qualityModifier;
      
      // Collect output tags
      enhancement.outputTags.forEach(tag => outputTags.add(tag));
      
      // Use the most restrictive quality cap
      if (enhancement.qualityCap && enhancement.qualityCap < maxQualityCap) {
        maxQualityCap = enhancement.qualityCap;
      }
    }
    
    return {
      totalTimeModifier,
      totalComplexityModifier,
      totalQualityModifier,
      combinedOutputTags: Array.from(outputTags),
      maxQualityCap
    };
  }
  
  /**
   * Create an enhancement selection for a job
   */
  createEnhancementSelection(
    jobId: string,
    selectedEnhancements: Enhancement[]
  ): EnhancementSelection {
    const validation = this.validateEnhancementSelection(selectedEnhancements);
    
    if (!validation.isValid) {
      throw new Error(`Invalid enhancement selection: ${validation.conflicts.map(c => c.reason).join(', ')}`);
    }
    
    const effects = this.calculateCombinedEffects(selectedEnhancements);
    
    // Calculate additional costs from all enhancements
    const additionalCosts = selectedEnhancements.flatMap(enhancement => enhancement.costs);
    
    return {
      jobId,
      selectedEnhancements,
      totalTimeModifier: effects.totalTimeModifier,
      totalComplexityModifier: effects.totalComplexityModifier,
      totalQualityModifier: effects.totalQualityModifier,
      additionalCosts,
      additionalTags: effects.combinedOutputTags.map(tag => tag as any) // Type assertion for ItemTag
    };
  }
  
  /**
   * Get enhancement recommendations based on equipment capabilities
   */
  getEnhancementRecommendations(
    productId: string,
    facility: Facility,
    availableInventory: ItemInstance[] = []
  ): {
    recommended: Enhancement[];
    advanced: Enhancement[];
    reasoning: string[];
  } {
    const discovery = this.discoverEnhancements(productId, facility, availableInventory);
    const available = discovery.availableEnhancements;
    
    // Basic recommendations - simple enhancements with good value
    const recommended = available.filter(enh => 
      enh.timeModifier <= 1.3 && // Not too time-consuming
      enh.complexityModifier <= 1.15 && // Not too complex
      enh.qualityModifier >= 5 // Decent quality boost
    );
    
    // Advanced recommendations - complex but high-value enhancements
    const advanced = available.filter(enh =>
      enh.timeModifier > 1.3 || 
      enh.complexityModifier > 1.15 ||
      enh.qualityModifier >= 20
    );
    
    const reasoning = [
      `Found ${available.length} available enhancements`,
      `${recommended.length} recommended for ease of use`,
      `${advanced.length} advanced options for experienced users`,
      `${discovery.lockedEnhancements.length} enhancements require additional equipment`
    ];
    
    return {
      recommended,
      advanced,
      reasoning
    };
  }
}