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
    console.log(`WorkflowGenerator: Starting plan generation for ${targetProductId} (quantity: ${targetQuantity})`);
    
    // Step 1: Analyze input items
    const inputAnalysis = ConditionAnalyzer.analyzeItems(inputItems);
    console.log(`WorkflowGenerator: Input analysis completed - ${inputAnalysis.length} items`);
    
    // Step 2: Calculate component gaps
    const componentGaps = GapAnalyzer.calculateComponentGaps(
      targetProductId,
      targetQuantity,
      availableInventory,
      inputAnalysis
    );
    console.log(`WorkflowGenerator: Component gaps calculated - ${componentGaps.length} gaps:`, 
      componentGaps.map(gap => `${gap.componentType}: need ${gap.needToManufacture}`));
    
    // Step 3: Generate operations to fill gaps
    const requiredOperations = this.generateOperationsForGaps(
      componentGaps,
      inputAnalysis
    );
    console.log(`WorkflowGenerator: Generated ${requiredOperations.length} operations for gaps:`, 
      requiredOperations.map(op => op.name));
    
    // Step 4: Add final assembly operation
    const finalAssemblyOp = this.generateFinalAssemblyOperation(
      targetProductId,
      targetQuantity
    );
    requiredOperations.push(finalAssemblyOp);
    console.log(`WorkflowGenerator: Added final assembly operation: ${finalAssemblyOp.name}`);
    
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
    console.log(`WorkflowGenerator: Generating operations for ${componentType} (quantity: ${quantity})`);
    const operations: DynamicOperation[] = [];
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem) {
      console.log(`WorkflowGenerator: No base item found for ${componentType}`);
      return operations;
    }
    
    console.log(`WorkflowGenerator: ${componentType} has manufacturing type: ${baseItem.manufacturingType}`);
    
    switch (baseItem.manufacturingType) {
      case ItemManufacturingType.SHAPED_MATERIAL:
        console.log(`WorkflowGenerator: Creating shaping operation for ${componentType}`);
        
        // First, check if we need to create prerequisite materials
        if (baseItem.materialSource) {
          const sourceItem = getBaseItem(baseItem.materialSource);
          if (sourceItem && sourceItem.manufacturingType === ItemManufacturingType.SHAPED_MATERIAL) {
            console.log(`WorkflowGenerator: ${componentType} needs prerequisite material: ${baseItem.materialSource}`);
            // Calculate needed quantity based on material ratio from shaping method
            const shapingMethod = this.getShapingMethod(componentType);
            const neededSourceQuantity = Math.ceil(quantity * shapingMethod.materialRatio);
            console.log(`WorkflowGenerator: Need ${neededSourceQuantity} ${baseItem.materialSource} for ${quantity} ${componentType} (ratio: ${shapingMethod.materialRatio})`);
            
            // Recursively generate operations for the source material first
            const sourceOps = this.generateComponentManufacturingOperations(
              baseItem.materialSource,
              neededSourceQuantity
            );
            operations.push(...sourceOps);
          }
        }
        
        // Then generate shaping operation from source material
        operations.push(this.createShapingOperation(componentType, quantity));
        break;
        
      case ItemManufacturingType.ASSEMBLY:
        console.log(`WorkflowGenerator: Creating assembly operations for ${componentType}`);
        // Recursively generate operations for sub-components, then assembly
        if (baseItem.assemblyComponents) {
          console.log(`WorkflowGenerator: ${componentType} has ${baseItem.assemblyComponents.length} sub-components:`, 
            baseItem.assemblyComponents.map(comp => `${comp.componentId} (${comp.quantity})`));
          
          for (const subComponent of baseItem.assemblyComponents) {
            // Create tag-specific operations if component has required tags
            if (subComponent.requiredTags && subComponent.requiredTags.length > 0) {
              console.log(`WorkflowGenerator: Generating tag-specific operations for ${subComponent.componentId} with tags: ${subComponent.requiredTags}`);
              const subOps = this.generateTagSpecificOperations(
                subComponent.componentId,
                subComponent.quantity * quantity,
                subComponent.requiredTags
              );
              operations.push(...subOps);
            } else {
              console.log(`WorkflowGenerator: Recursively generating operations for ${subComponent.componentId}`);
              const subOps = this.generateComponentManufacturingOperations(
                subComponent.componentId,
                subComponent.quantity * quantity
              );
              operations.push(...subOps);
            }
          }
          
          // Add assembly operation
          console.log(`WorkflowGenerator: Adding assembly operation for ${componentType}`);
          operations.push(this.createAssemblyOperation(componentType, quantity));
        } else {
          console.log(`WorkflowGenerator: ${componentType} is an assembly but has no assemblyComponents defined`);
        }
        break;
      
      default:
        console.log(`WorkflowGenerator: Unknown manufacturing type for ${componentType}: ${baseItem.manufacturingType}`);
        break;
    }
    
    console.log(`WorkflowGenerator: Generated ${operations.length} operations for ${componentType}:`, 
      operations.map(op => op.name));
    return operations;
  }
  
  /**
   * Generate operations for components with specific tag requirements
   */
  private static generateTagSpecificOperations(
    componentType: string,
    quantity: number,
    requiredTags: ItemTag[]
  ): DynamicOperation[] {
    console.log(`WorkflowGenerator: Generating tag-specific operations for ${componentType} (quantity: ${quantity}) with tags: ${requiredTags}`);
    const operations: DynamicOperation[] = [];
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem || baseItem.manufacturingType !== ItemManufacturingType.SHAPED_MATERIAL) {
      // Fallback to normal generation for non-shaped materials
      return this.generateComponentManufacturingOperations(componentType, quantity);
    }
    
    // First, check if we need to create prerequisite materials (same logic as generateComponentManufacturingOperations)
    if (baseItem.materialSource) {
      const sourceItem = getBaseItem(baseItem.materialSource);
      if (sourceItem && sourceItem.manufacturingType === ItemManufacturingType.SHAPED_MATERIAL) {
        console.log(`WorkflowGenerator: ${componentType} needs prerequisite material: ${baseItem.materialSource}`);
        // Calculate needed quantity based on material ratio from shaping method
        const shapingMethod = this.getShapingMethod(componentType);
        const neededSourceQuantity = Math.ceil(quantity * shapingMethod.materialRatio);
        console.log(`WorkflowGenerator: Need ${neededSourceQuantity} ${baseItem.materialSource} for ${quantity} ${componentType} (ratio: ${shapingMethod.materialRatio})`);
        
        // Recursively generate operations for the source material first
        const sourceOps = this.generateComponentManufacturingOperations(
          baseItem.materialSource,
          neededSourceQuantity
        );
        operations.push(...sourceOps);
      }
    }
    
    // Then create tag-specific shaping operation
    const shapingOp = this.createTagSpecificShapingOperation(componentType, quantity, requiredTags);
    operations.push(shapingOp);
    
    return operations;
  }
  
  /**
   * Create a shaping operation that outputs components with specific tags
   */
  private static createTagSpecificShapingOperation(
    componentType: string,
    quantity: number,
    requiredTags: ItemTag[]
  ): DynamicOperation {
    const baseItem = getBaseItem(componentType);
    const sourceMaterial = baseItem?.materialSource || 'steel';
    
    // Determine which shaping method to use based on required tags
    let methodKey = componentType;
    if (componentType === 'mechanical-component' && requiredTags.includes(ItemTag.PRECISION)) {
      methodKey = 'mechanical-component-precision';
    }
    
    const shapingMethods = this.getShapingMethod(methodKey);
    
    return {
      id: `shaping_${this.operationIdCounter++}_${componentType}_${requiredTags.join('_')}`,
      name: `${shapingMethods.name} (${requiredTags.join(', ')})`,
      description: `${shapingMethods.description} with ${requiredTags.join(', ')} tags`,
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
        tags: requiredTags.length > 0 ? requiredTags : shapingMethods.outputTags
      }],
      can_fail: true,
      failure_chance: shapingMethods.failureChance,
      labor_skill: shapingMethods.laborSkill,
      generatedReason: `Manufacturing ${quantity} ${componentType} with ${requiredTags.join(', ')} tags from ${sourceMaterial}`,
      isConditional: false
    };
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
   * Create an assembly operation - Manufacturing v2 Clean Hierarchy
   */
  private static createAssemblyOperation(componentType: string, quantity: number): DynamicOperation {
    const baseItem = getBaseItem(componentType);
    
    if (!baseItem?.assemblyComponents) {
      throw new Error(`${componentType} has no assembly components defined`);
    }
    
    const assemblyReqs = this.getAssemblyRequirements(componentType);
    
    return {
      id: `assembly_${this.operationIdCounter++}_${componentType}`,
      name: `Assemble ${baseItem.name}`,
      description: assemblyReqs.description,
      operationType: OperationType.ASSEMBLY,
      requiredTag: assemblyReqs.requiredTag,
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
        tags: baseItem.defaultTags.length > 0 ? baseItem.defaultTags : [ItemTag.LOW_TECH],
        inheritQuality: true
      }],
      can_fail: true,
      failure_chance: 0.02, // 2% base failure rate for assembly
      labor_skill: assemblyReqs.laborSkill,
      generatedReason: `${assemblyReqs.description} - ${quantity} ${componentType}`,
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
   * Get shaping method details for a component type - Manufacturing v2 Clean Hierarchy
   * Exact specifications from Manufacturing-v2-details.md
   */
  private static getShapingMethod(componentType: string) {
    const shapingMethods: Record<string, any> = {
      // Tier 2A: Basic steel stock preparation (15-20 minutes)
      'small-steel-billet': {
        name: 'Form Steel Billet',
        description: 'Basic steel stock preparation for component machining',
        requiredTag: { category: TagCategory.MILLING, minimum: 5 },
        baseDuration: 15, // minutes per unit - exact from docs
        materialRatio: 0.1, // 0.1 units of steel per billet - exact from docs
        outputQuality: 70,
        outputTags: [],
        failureChance: 0.02,
        laborSkill: 'skilled_technician'
      },
      
      'small-steel-cylinder': {
        name: 'Turn Steel Cylinder',
        description: 'Round steel stock for boring operations',
        requiredTag: { category: TagCategory.TURNING, minimum: 5 },
        baseDuration: 20, // minutes per unit - exact from docs
        materialRatio: 0.1, // 0.1 units of steel per cylinder - exact from docs
        outputQuality: 70,
        outputTags: [],
        failureChance: 0.03,
        laborSkill: 'skilled_technician'
      },
      
      // Tier 2B: Precision component manufacturing (25-30 minutes)
      'mechanical-component': {
        name: 'Machine Components',
        description: 'Basic machined mechanical parts',
        requiredTag: { category: TagCategory.MILLING, minimum: 5 },
        baseDuration: 25, // minutes per unit - exact from docs
        materialRatio: 1.0, // 1 billet per component
        outputQuality: 75,
        outputTags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
        failureChance: 0.04,
        laborSkill: 'skilled_technician'
      },
      
      'small-tube': {
        name: 'Bore Tube',
        description: 'Hollow cylindrical component created by boring',
        requiredTag: { category: TagCategory.BORING, minimum: 5 },
        baseDuration: 30, // minutes per unit - exact from docs
        materialRatio: 1.0, // 1 cylinder per tube
        outputQuality: 80,
        outputTags: [],
        failureChance: 0.05,
        laborSkill: 'skilled_technician'
      },
      
      'small-casing': {
        name: 'Mill Casing',
        description: 'Molded plastic housing component',
        requiredTag: { category: TagCategory.MILLING, minimum: 3 },
        baseDuration: 18, // minutes per unit - exact from docs
        materialRatio: 0.3, // 0.3 units of plastic per casing - exact from docs
        outputQuality: 75,
        outputTags: [],
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
   * Get assembly time and requirements for a component type - Manufacturing v2 Clean Hierarchy
   * Exact specifications from Manufacturing-v2-details.md
   */
  private static getAssemblyTime(componentType: string): number {
    const assemblyTimes: Record<string, number> = {
      'mechanical-assembly': 45, // minutes - Basic assembly of 10 components - exact from docs
      'basic_sidearm': 35, // minutes - Precision assembly of 3 components - exact from docs
      'tactical_knife': 15
    };
    
    return assemblyTimes[componentType] || 20;
  }
  
  /**
   * Get assembly operation requirements for a component type
   * Based on Assembly [Basic] vs Assembly [Precision] specifications
   */
  private static getAssemblyRequirements(componentType: string) {
    const assemblyRequirements: Record<string, any> = {
      'mechanical-assembly': {
        requiredTag: { category: TagCategory.BASIC_MANIPULATION, minimum: 8 },
        laborSkill: 'skilled_technician',
        description: 'Assembly [Basic] - Combined mechanical components forming internal mechanism'
      },
      'basic_sidearm': {
        requiredTag: { category: TagCategory.PRECISION_MANIPULATION, minimum: 5 },
        laborSkill: 'skilled_technician',
        description: 'Assembly [Precision] - Complete low-tech sidearm weapon'
      }
    };
    
    return assemblyRequirements[componentType] || {
      requiredTag: { category: TagCategory.BASIC_MANIPULATION, minimum: 5 },
      laborSkill: 'skilled_technician',
      description: 'Standard assembly operation'
    };
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
   * Calculate material requirements from operations - Manufacturing v2 only requires raw materials upfront
   */
  private static calculateMaterialRequirements(operations: DynamicOperation[]) {
    const requirements: any[] = []; // MaterialRequirement[]
    
    for (const operation of operations) {
      if (operation.materialConsumption) {
        for (const consumption of operation.materialConsumption) {
          // Only require raw materials upfront - intermediate materials will be created during workflow
          const baseItem = getBaseItem(consumption.itemId);
          if (baseItem?.manufacturingType === ItemManufacturingType.RAW_MATERIAL) {
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