// Dynamic Workflow Generator - Manufacturing v2
// Generates custom operation sequences based on analysis

import { 
  DynamicOperation, 
  ManufacturingPlan,
  ConditionAnalysis,
  ComponentGap,
  OperationType,
  ItemManufacturingType,
  ItemInstance, 
  ItemTag,
  TagCategory
} from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from './manufacturingRules';
import { ConditionAnalyzer } from './conditionAnalyzer';
import { GapAnalyzer } from './gapAnalyzer';

export class WorkflowGenerator {
  private static operationIdCounter = 0;
  
  /**
   * Generate a complete manufacturing plan for a target product
   */
  static generateManufacturingPlan(
    targetProductId: string,
    targetQuantity: number,
    inputItems: ItemInstance[],
    availableInventory: ItemInstance[]
  ): ManufacturingPlan {
    // Step 1: Analyze input items
    const inputAnalysis = ConditionAnalyzer.analyzeItems(inputItems);
    
    // Step 2: Calculate component gaps
    const componentGaps = GapAnalyzer.calculateComponentGaps(
      targetProductId,
      targetQuantity,
      availableInventory,
      inputAnalysis
    );
    
    // Step 3: Generate operations to fill gaps
    const requiredOperations = this.generateOperationsForGaps(
      componentGaps,
      inputAnalysis
    );
    
    // Step 4: Add final assembly operation
    const finalAssemblyOp = this.generateFinalAssemblyOperation(
      targetProductId,
      targetQuantity
    );
    requiredOperations.push(finalAssemblyOp);
    
    // Step 5: Calculate total time and material requirements
    const estimatedDuration = requiredOperations.reduce(
      (sum, op) => sum + (op.baseDurationMinutes / 60), // Convert to hours
      0
    );
    
    const materialRequirements = this.calculateMaterialRequirements(requiredOperations);
    
    return {
      targetProduct: targetProductId,
      targetQuantity,
      inputAnalysis,
      componentGaps,
      requiredOperations,
      estimatedDuration,
      materialRequirements,
      planningTime: Date.now(),
      plannerVersion: 'v2.0.0',
      confidence: this.calculatePlanConfidence(inputAnalysis, componentGaps)
    };
  }
  
  /**
   * Generate operations to fill component gaps
   */
  private static generateOperationsForGaps(
    gaps: ComponentGap[],
    inputAnalysis: ConditionAnalysis[]
  ): DynamicOperation[] {
    const operations: DynamicOperation[] = [];
    
    // First: Add treatment and disassembly operations for input items
    operations.push(...this.generateInputProcessingOperations(inputAnalysis));
    
    // Second: Add manufacturing operations for missing components
    for (const gap of gaps) {
      if (gap.needToManufacture > 0) {
        const manufacturingOps = this.generateComponentManufacturingOperations(
          gap.componentType,
          gap.needToManufacture
        );
        operations.push(...manufacturingOps);
      }
    }
    
    return operations;
  }
  
  /**
   * Generate operations to process input items (treatment + disassembly)
   */
  private static generateInputProcessingOperations(
    inputAnalysis: ConditionAnalysis[]
  ): DynamicOperation[] {
    const operations: DynamicOperation[] = [];
    
    for (const analysis of inputAnalysis) {
      // Add treatment operations if needed
      for (const treatment of analysis.treatmentRequirements) {
        if (treatment.required) {
          operations.push(this.createTreatmentOperation(treatment, analysis));
        }
      }
      
      // Add disassembly operation if applicable
      if (analysis.manufacturingType === ItemManufacturingType.ASSEMBLY) {
        operations.push(this.createDisassemblyOperation(analysis));
      }
    }
    
    return operations;
  }
  
  /**
   * Generate operations to manufacture missing components
   */
  private static generateComponentManufacturingOperations(
    componentType: string,
    quantity: number
  ): DynamicOperation[] {
    const operations: DynamicOperation[] = [];
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem) {
      return operations;
    }
    
    switch (baseItem.manufacturingType) {
      case ItemManufacturingType.SHAPED_MATERIAL:
        // Generate shaping operation from raw material
        operations.push(this.createShapingOperation(componentType, quantity));
        break;
        
      case ItemManufacturingType.ASSEMBLY:
        // Recursively generate operations for sub-components, then assembly
        if (baseItem.assemblyComponents) {
          for (const subComponent of baseItem.assemblyComponents) {
            const subOps = this.generateComponentManufacturingOperations(
              subComponent.componentId,
              subComponent.quantity * quantity
            );
            operations.push(...subOps);
          }
          
          // Add assembly operation
          operations.push(this.createAssemblyOperation(componentType, quantity));
        }
        break;
    }
    
    return operations;
  }
  
  /**
   * Create a treatment operation from treatment requirements
   */
  private static createTreatmentOperation(
    treatment: any, // TreatmentOperation
    analysis: ConditionAnalysis
  ): DynamicOperation {
    return {
      id: `treatment_${this.operationIdCounter++}_${treatment.id}`,
      name: treatment.name,
      description: `${treatment.name} for ${analysis.itemType}`,
      operationType: OperationType.SHAPING, // Treatment is a form of processing
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 5
      },
      baseDurationMinutes: treatment.estimatedTime * 60, // Convert hours to minutes
      can_fail: true,
      failure_chance: 1 - treatment.successProbability,
      labor_skill: 'skilled_technician',
      generatedReason: `Treatment required for ${analysis.condition.join(', ')} condition`,
      isConditional: true
    };
  }
  
  /**
   * Create a disassembly operation
   */
  private static createDisassemblyOperation(analysis: ConditionAnalysis): DynamicOperation {
    const baseItem = getBaseItem(analysis.itemType);
    const itemName = baseItem?.name || analysis.itemType;
    
    return {
      id: `disassembly_${this.operationIdCounter++}_${analysis.itemType}`,
      name: `Disassemble ${itemName}`,
      description: `Carefully disassemble ${itemName} to recover components`,
      operationType: OperationType.DISASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: this.getDisassemblyTime(analysis.itemType, analysis.condition),
      materialConsumption: [{
        itemId: analysis.itemType,
        count: 1,
        tags: analysis.condition
      }],
      materialProduction: analysis.estimatedRecovery.map(recovery => ({
        itemId: recovery.componentType,
        count: recovery.estimatedQuantity,
        quality: recovery.expectedQuality,
        tags: [ItemTag.SALVAGED]
      })),
      can_fail: analysis.risks.some(risk => risk.impact === 'component_loss'),
      failure_chance: this.calculateDisassemblyFailureChance(analysis),
      labor_skill: 'skilled_technician',
      generatedReason: `Disassembly to recover components from ${analysis.condition.join(', ')} ${itemName}`,
      isConditional: false
    };
  }
  
  /**
   * Create a shaping operation (raw material → shaped material)
   */
  private static createShapingOperation(componentType: string, quantity: number): DynamicOperation {
    const baseItem = getBaseItem(componentType);
    const sourceMaterial = baseItem?.materialSource || 'steel';
    
    const shapingMethods = this.getShapingMethod(componentType);
    
    return {
      id: `shaping_${this.operationIdCounter++}_${componentType}`,
      name: shapingMethods.name,
      description: `${shapingMethods.description} to create ${componentType}`,
      operationType: OperationType.SHAPING,
      requiredTag: shapingMethods.requiredTag,
      baseDurationMinutes: shapingMethods.baseDuration * quantity,
      materialConsumption: [{
        itemId: sourceMaterial,
        count: quantity * shapingMethods.materialRatio
      }],
      materialProduction: [{
        itemId: componentType,
        count: quantity,
        quality: shapingMethods.outputQuality,
        tags: shapingMethods.outputTags
      }],
      can_fail: true,
      failure_chance: shapingMethods.failureChance,
      labor_skill: shapingMethods.laborSkill,
      generatedReason: `Manufacturing ${quantity} ${componentType} from ${sourceMaterial}`,
      isConditional: false
    };
  }
  
  /**
   * Create an assembly operation
   */
  private static createAssemblyOperation(componentType: string, quantity: number): DynamicOperation {
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem?.assemblyComponents) {
      throw new Error(`${componentType} has no assembly components defined`);
    }
    
    return {
      id: `assembly_${this.operationIdCounter++}_${componentType}`,
      name: `Assemble ${baseItem.name}`,
      description: `Combine components to create ${baseItem.name}`,
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10
      },
      baseDurationMinutes: this.getAssemblyTime(componentType) * quantity,
      materialConsumption: baseItem.assemblyComponents.map(comp => ({
        itemId: comp.componentId,
        count: comp.quantity * quantity,
        tags: comp.requiredTags,
        maxQuality: comp.maxQuality
      })),
      materialProduction: [{
        itemId: componentType,
        count: quantity,
        tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH],
        inheritQuality: true
      }],
      can_fail: true,
      failure_chance: 0.02, // 2% base failure rate for assembly
      labor_skill: 'skilled_technician',
      generatedReason: `Assembly of ${quantity} ${componentType} from components`,
      isConditional: false
    };
  }
  
  /**
   * Generate final assembly operation for the target product
   */
  private static generateFinalAssemblyOperation(
    targetProductId: string,
    quantity: number
  ): DynamicOperation {
    return this.createAssemblyOperation(targetProductId, quantity);
  }
  
  /**
   * Get shaping method details for a component type
   */
  private static getShapingMethod(componentType: string) {
    const shapingMethods: Record<string, any> = {
      'mechanical-component': {
        name: 'Machine Components',
        description: 'Mill and turn steel into mechanical components',
        requiredTag: { category: TagCategory.MILLING, minimum: 10 },
        baseDuration: 45, // minutes per unit
        materialRatio: 0.8, // 0.8 units of steel per component
        outputQuality: 75,
        outputTags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
        failureChance: 0.05,
        laborSkill: 'skilled_machinist'
      },
      'plastic-casing': {
        name: 'Shape Casing',
        description: 'Mold plastic into protective casing',
        requiredTag: { category: TagCategory.SURFACE, minimum: 2 },
        baseDuration: 30,
        materialRatio: 0.5,
        outputQuality: 80,
        outputTags: [ItemTag.CASING, ItemTag.LOW_TECH],
        failureChance: 0.02,
        laborSkill: 'skilled_technician'
      }
    };
    
    return shapingMethods[componentType] || {
      name: 'Shape Material',
      description: 'Process raw material into shaped component',
      requiredTag: { category: TagCategory.BASIC_MANIPULATION, minimum: 5 },
      baseDuration: 30,
      materialRatio: 1.0,
      outputQuality: 70,
      outputTags: [ItemTag.STANDARD],
      failureChance: 0.03,
      laborSkill: 'skilled_technician'
    };
  }
  
  /**
   * Get disassembly time based on item type and condition
   */
  private static getDisassemblyTime(itemType: string, condition: ItemTag[]): number {
    let baseTime = 20; // 20 minutes base
    
    if (condition.includes(ItemTag.DAMAGED)) {
      baseTime *= 1.5; // 50% longer for damaged items
    }
    
    if (condition.includes(ItemTag.JUNK)) {
      baseTime *= 1.8; // 80% longer for junk items
    }
    
    if (condition.includes(ItemTag.MILITARY_GRADE)) {
      baseTime *= 0.8; // 20% faster for well-built items
    }
    
    return Math.round(baseTime);
  }
  
  /**
   * Get assembly time for a component type
   */
  private static getAssemblyTime(componentType: string): number {
    const assemblyTimes: Record<string, number> = {
      'mechanical-assembly': 25, // minutes
      'basic_sidearm': 15,
      'tactical_knife': 10
    };
    
    return assemblyTimes[componentType] || 20;
  }
  
  /**
   * Calculate disassembly failure chance based on analysis
   */
  private static calculateDisassemblyFailureChance(analysis: ConditionAnalysis): number {
    let failureChance = 0.02; // 2% base
    
    const damageRisks = analysis.risks.filter(risk => 
      risk.impact === 'component_loss' && risk.severity === 'high'
    );
    
    failureChance += damageRisks.length * 0.05; // +5% per high-severity risk
    
    return Math.min(0.25, failureChance); // Cap at 25%
  }
  
  /**
   * Calculate material requirements from operations
   */
  private static calculateMaterialRequirements(operations: DynamicOperation[]) {
    const requirements: any[] = []; // MaterialRequirement[]
    
    for (const operation of operations) {
      if (operation.materialConsumption) {
        for (const consumption of operation.materialConsumption) {
          const existing = requirements.find(req => req.material_id === consumption.itemId);
          if (existing) {
            existing.quantity += consumption.count;
          } else {
            requirements.push({
              material_id: consumption.itemId,
              quantity: consumption.count,
              consumed_at_start: true
            });
          }
        }
      }
    }
    
    return requirements;
  }
  
  /**
   * Calculate plan confidence based on input quality and risks
   */
  private static calculatePlanConfidence(
    inputAnalysis: ConditionAnalysis[],
    gaps: ComponentGap[]
  ): number {
    let confidence = 0.9; // Start at 90%
    
    // Reduce confidence for risky inputs
    for (const analysis of inputAnalysis) {
      const highRisks = analysis.risks.filter(risk => risk.severity === 'high');
      confidence -= highRisks.length * 0.1; // -10% per high risk
    }
    
    // Reduce confidence for large manufacturing gaps
    const manufactureRatio = gaps.reduce((sum, gap) => sum + gap.needToManufacture, 0) /
                            gaps.reduce((sum, gap) => sum + gap.required, 1);
    confidence -= manufactureRatio * 0.2; // Up to -20% for manufacturing everything
    
    return Math.max(0.1, confidence); // Minimum 10% confidence
  }
}