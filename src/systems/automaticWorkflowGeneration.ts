// Automatic Workflow Generation - Manufacturing v2 Phase 3
// Generates repair, disassembly, and treatment workflows on-demand

import {
  ItemInstance,
  BaseItem,
  ItemTag,
  MachineBasedMethod,
  MachineOperation,
  DynamicOperation,
  OperationType,
  TagCategory,
  ItemManufacturingType,
  MaterialRequirement,
  LaborSkill,
  ManufacturingPlan
} from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from '../systems/manufacturingRules';

// Unified workflow interface that extends ManufacturingPlan
export interface GeneratedWorkflow {
  // ManufacturingPlan core fields
  id: string;
  targetProduct: string;
  targetQuantity: number;
  inputAnalysis: import('../types/manufacturing').ConditionAnalysis[];
  componentGaps: import('../types/manufacturing').ComponentGap[];
  requiredOperations: DynamicOperation[];
  estimatedDuration: number; // total time in game hours
  materialRequirements: MaterialRequirement[];
  enhancementOptions?: import('../types/enhancement').Enhancement[];
  planningTime: number;
  plannerVersion: string;
  confidence: number;
  
  // Additional workflow-specific fields
  name: string;
  description: string;
  expectedOutputs: Array<{
    itemId: string;
    quantity: number;
    tags: ItemTag[];
    quality: number;
  }>;
  riskFactors: string[];
}

export class AutomaticWorkflowGeneration {

  /**
   * Generate a repair workflow for any damaged assembly
   */
  static generateRepairWorkflow(
    item: ItemInstance,
    targetQuality: number = 75
  ): GeneratedWorkflow {
    const baseItem = getBaseItem(item.baseItemId);
    if (!baseItem) throw new Error(`Unknown item: ${item.baseItemId}`);

    console.log(`AutomaticWorkflowGeneration: Generating repair workflow for ${baseItem.name}`);

    const operations: DynamicOperation[] = [];
    const materialRequirements: MaterialRequirement[] = [];
    let totalDuration = 0;

    // Step 1: Disassembly for inspection
    const disassemblyOp = this.createDisassemblyOperation(item, baseItem, 'inspection');
    operations.push(disassemblyOp);
    totalDuration += disassemblyOp.baseDurationMinutes;

    // Step 2: Component analysis and sorting
    const analysisOp = this.createAnalysisOperation(item, baseItem);
    operations.push(analysisOp);
    totalDuration += analysisOp.baseDurationMinutes;

    // Step 3: Condition treatment if needed
    if (this.needsEnvironmentalTreatment(item)) {
      const treatmentOp = this.createTreatmentOperation(item, baseItem);
      operations.push(treatmentOp);
      totalDuration += treatmentOp.baseDurationMinutes;
    }

    // Step 4: Component replacement/repair
    const componentRepairOp = this.createComponentRepairOperation(item, baseItem, materialRequirements);
    operations.push(componentRepairOp);
    totalDuration += componentRepairOp.baseDurationMinutes;

    // Step 5: Final reassembly
    const reassemblyOp = this.createReassemblyOperation(item, baseItem);
    operations.push(reassemblyOp);
    totalDuration += reassemblyOp.baseDurationMinutes;

    return {
      // Unified interface fields
      id: `repair_${baseItem.id}_${Date.now()}`,
      targetProduct: baseItem.id,
      targetQuantity: item.quantity,
      inputAnalysis: [], // Could be enhanced to analyze item condition
      componentGaps: [], // Could be enhanced to identify missing components
      requiredOperations: operations,
      estimatedDuration: totalDuration / 60, // Convert to hours
      materialRequirements,
      planningTime: Date.now(),
      plannerVersion: 'auto-repair-v3.0',
      confidence: 0.75, // Repair outcomes can be unpredictable
      
      name: `Repair ${baseItem.name}`,
      description: `Complete repair workflow: disassembly → analysis → treatment → component replacement → reassembly`,
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: item.quantity,
        tags: [ItemTag.RESTORED], // Repaired items get restored tag
        quality: Math.min(targetQuality, 85) // Repairs typically cap at 85% quality
      }],
      riskFactors: [
        'Some damage may be irreparable',
        'Component replacement may not match original quality',
        'Assembly complexity may cause delays'
      ]
    };
  }

  /**
   * Generate a disassembly workflow for any assembly
   */
  static generateDisassemblyWorkflow(
    item: ItemInstance,
    preserveQuality: boolean = true
  ): GeneratedWorkflow {
    const baseItem = getBaseItem(item.baseItemId);
    if (!baseItem) throw new Error(`Unknown item: ${item.baseItemId}`);

    if (baseItem.manufacturingType !== ItemManufacturingType.ASSEMBLY) {
      throw new Error(`Cannot disassemble ${baseItem.manufacturingType} items`);
    }

    console.log(`AutomaticWorkflowGeneration: Generating Manufacturing v2 disassembly workflow for ${baseItem.name}`);

    const operations: DynamicOperation[] = [];
    let totalDuration = 0;

    // PHASE 1: Component Extraction (without predetermined conditions)
    const disassemblyMethod = preserveQuality ? 'careful' : 'fast';
    const extractionOp = this.createComponentExtractionOperation(item, baseItem, disassemblyMethod);
    operations.push(extractionOp);
    totalDuration += extractionOp.baseDurationMinutes;

    // PHASE 2: Component Assessment (discover actual conditions)
    const assessmentOp = this.createComponentAssessmentOperation(item, baseItem);
    operations.push(assessmentOp);
    totalDuration += assessmentOp.baseDurationMinutes;

    // PHASE 3: Component Processing (adaptive - actual operations determined at runtime)
    // Note: Follow-up operations will be generated dynamically based on assessment results
    const processingOp = this.createAdaptiveProcessingOperation(item, baseItem);
    operations.push(processingOp);
    totalDuration += processingOp.baseDurationMinutes;

    return {
      // Unified interface fields
      id: `disassemble_${baseItem.id}_${Date.now()}`,
      targetProduct: `disassembled_${baseItem.id}`,
      targetQuantity: item.quantity,
      inputAnalysis: [], // Analysis happens during workflow execution
      componentGaps: [], // No gaps for disassembly
      requiredOperations: operations,
      estimatedDuration: totalDuration / 60,
      materialRequirements: [], // Disassembly doesn't consume materials
      planningTime: Date.now(),
      plannerVersion: 'manufacturing-v2-dynamic',
      confidence: 0.75, // Lower confidence due to uncertainty in component conditions
      
      name: `Disassemble ${baseItem.name}`,
      description: `Manufacturing v2 disassembly: component extraction → condition assessment → adaptive processing`,
      expectedOutputs: [], // Outputs discovered during assessment phase
      riskFactors: preserveQuality 
        ? ['Component wear during removal', 'Hidden internal damage']
        : ['Component damage from fast disassembly', 'Possible material loss']
    };
  }

  /**
   * Generate manufacturing workflow for creating new products
   */
  static generateManufacturingWorkflow(
    baseItem: BaseItem,
    quantity: number = 1
  ): GeneratedWorkflow {
    console.log(`AutomaticWorkflowGeneration: Generating manufacturing workflow for ${baseItem.name}`);

    const operations: DynamicOperation[] = [];
    const materialRequirements: MaterialRequirement[] = [];
    let totalDuration = 0;

    if (baseItem.manufacturingType === ItemManufacturingType.ASSEMBLY && baseItem.assemblyComponents) {
      // Generate assembly workflow based on component requirements
      
      // Step 1: Material preparation
      baseItem.assemblyComponents.forEach((component, index) => {
        const prepOp = this.createMaterialPreparationOperation(component, index, quantity);
        operations.push(prepOp);
        totalDuration += prepOp.baseDurationMinutes;
        
        // Add material requirements
        materialRequirements.push({
          material_id: component.componentId,
          quantity: component.quantity * quantity,
          consumed_at_start: true
        });
      });

      // Step 2: Quality inspection of components
      const inspectionOp = this.createComponentInspectionOperation(baseItem, quantity);
      operations.push(inspectionOp);
      totalDuration += inspectionOp.baseDurationMinutes;

      // Step 3: Assembly process
      const assemblyOp = this.createAssemblyOperation(baseItem, quantity);
      operations.push(assemblyOp);
      totalDuration += assemblyOp.baseDurationMinutes;

      // Step 4: Final testing and finishing
      const finishingOp = this.createFinishingOperation(baseItem, quantity);
      operations.push(finishingOp);
      totalDuration += finishingOp.baseDurationMinutes;

    } else if (baseItem.manufacturingType === ItemManufacturingType.SHAPED_MATERIAL) {
      // Generate shaping workflow from raw materials
      
      // Step 1: Raw material preparation
      const materialPrepOp = this.createRawMaterialPrepOperation(baseItem, quantity);
      operations.push(materialPrepOp);
      totalDuration += materialPrepOp.baseDurationMinutes;

      // Add material requirement for source material
      if (baseItem.materialSource) {
        materialRequirements.push({
          material_id: baseItem.materialSource,
          quantity: quantity,
          consumed_at_start: true
        });
      }

      // Step 2: Shaping operation (turning, milling, etc.)
      const shapingOp = this.createShapingOperation(baseItem, quantity);
      operations.push(shapingOp);
      totalDuration += shapingOp.baseDurationMinutes;

      // Step 3: Quality control
      const qcOp = this.createQualityControlOperation(baseItem, quantity);
      operations.push(qcOp);
      totalDuration += qcOp.baseDurationMinutes;
    }

    return {
      // Unified interface fields
      id: `manufacture_${baseItem.id}_${Date.now()}`,
      targetProduct: baseItem.id,
      targetQuantity: quantity,
      inputAnalysis: [], // Could be enhanced to analyze material condition
      componentGaps: [], // Could be enhanced to identify missing materials
      requiredOperations: operations,
      estimatedDuration: totalDuration / 60, // Convert to hours
      materialRequirements,
      planningTime: Date.now(),
      plannerVersion: 'auto-manufacturing-v3.0',
      confidence: 0.85, // Manufacturing is generally more predictable than repair
      
      name: `Manufacture ${baseItem.name}`,
      description: `Complete manufacturing workflow: material preparation → processing → assembly → finishing`,
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: quantity,
        tags: [],
        quality: 75 // Standard manufacturing quality
      }],
      riskFactors: [
        'Material quality may affect final output',
        'Complex assemblies may require additional time',
        'Equipment precision affects final quality'
      ]
    };
  }

  /**
   * Generate treatment workflow for environmental damage
   */
  static generateTreatmentWorkflow(
    item: ItemInstance,
    conditions: ItemTag[]
  ): GeneratedWorkflow {
    const baseItem = getBaseItem(item.baseItemId);
    if (!baseItem) throw new Error(`Unknown item: ${item.baseItemId}`);

    console.log(`AutomaticWorkflowGeneration: Generating treatment workflow for conditions: ${conditions.join(', ')}`);

    const operations: DynamicOperation[] = [];
    let totalDuration = 0;

    // Generate treatment operations based on detected conditions
    conditions.forEach(condition => {
      const treatmentOp = this.createSpecificTreatmentOperation(item, baseItem, condition);
      if (treatmentOp) {
        operations.push(treatmentOp);
        totalDuration += treatmentOp.baseDurationMinutes;
      }
    });

    // Final quality assessment
    const assessmentOp = this.createQualityAssessmentOperation(item, baseItem);
    operations.push(assessmentOp);
    totalDuration += assessmentOp.baseDurationMinutes;

    return {
      // Unified interface fields
      id: `treatment_${baseItem.id}_${Date.now()}`,
      targetProduct: baseItem.id,
      targetQuantity: item.quantity,
      inputAnalysis: [], // Could be enhanced to analyze contamination level
      componentGaps: [], // No gaps for treatment
      requiredOperations: operations,
      estimatedDuration: totalDuration / 60,
      materialRequirements: this.getTreatmentMaterials(conditions),
      planningTime: Date.now(),
      plannerVersion: 'auto-treatment-v3.0',
      confidence: 0.8,
      
      name: `Treat ${baseItem.name}`,
      description: `Environmental damage treatment: ${conditions.join(' + ')} removal → quality assessment`,
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: item.quantity,
        tags: item.tags.filter(tag => !conditions.includes(tag)), // Remove treated conditions
        quality: Math.min(item.quality + 15, 100) // Treatment can improve quality
      }],
      riskFactors: [
        'Some environmental damage may be permanent',
        'Treatment chemicals may affect other components'
      ]
    };
  }

  // Helper methods for creating specific operations

  // MANUFACTURING V2: Component Extraction (Phase 1)
  private static createComponentExtractionOperation(
    item: ItemInstance, 
    baseItem: BaseItem, 
    method: 'careful' | 'fast'
  ): DynamicOperation {
    const methodMultipliers = {
      careful: { time: 1.0, description: 'Carefully extract components preserving their condition' },
      fast: { time: 0.6, description: 'Quickly extract components for rapid processing' }
    };
    
    const multiplier = methodMultipliers[method];
    
    return {
      id: `extract_components_${Date.now()}`,
      name: `Component Extraction`,
      description: multiplier.description,
      operationType: OperationType.DISASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: Math.round(20 * item.quantity * multiplier.time),
      materialConsumption: [{
        itemId: item.baseItemId,
        count: item.quantity,
        tags: item.tags
      }],
      // NO materialProduction - components are moved to job inventory for assessment
      can_fail: method === 'fast',
      failure_chance: method === 'fast' ? 0.1 : 0.02,
      labor_skill: method === 'careful' ? 'skilled_technician' : 'unskilled',
      generatedReason: `Extract components from ${baseItem.name} for condition assessment`,
      isConditional: false
    };
  }

  // MANUFACTURING V2: Component Assessment (Phase 2)
  private static createComponentAssessmentOperation(
    item: ItemInstance, 
    baseItem: BaseItem
  ): DynamicOperation {
    // Generate material consumption for the extracted components
    const materialConsumption: Array<{ itemId: string; count: number; tags?: string[] }> = [];
    if (baseItem.assemblyComponents) {
      for (const component of baseItem.assemblyComponents) {
        materialConsumption.push({
          itemId: component.componentId,
          count: component.quantity * item.quantity,
          tags: [] // Accept any condition for assessment
        });
      }
    }
    
    // Create a synthetic item for assessment with reasonable base quality
    // Even damaged items have some salvageable components
    const assessmentBaseQuality = Math.max(20, item.quality || 20); // Minimum 20% for assessment
    const syntheticItemForAssessment = {
      ...item,
      quality: assessmentBaseQuality
    };
    
    return {
      id: `assess_components_${Date.now()}`,
      name: 'Component Assessment',
      description: 'Inspect extracted components to discover their actual conditions',
      operationType: OperationType.SHAPING, // Conceptual operation
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: 1
      },
      baseDurationMinutes: 15 * item.quantity, // More thorough than simple analysis
      // Assessment consumes extracted components and produces assessed components
      materialConsumption: materialConsumption as any, // TODO: Fix type mismatch with tags
      materialProduction: this.generateDiscoveredComponents(syntheticItemForAssessment, baseItem, 0.8),
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician',
      generatedReason: 'Discover actual component conditions through inspection',
      isConditional: false
    };
  }

  // MANUFACTURING V2: Adaptive Processing (Phase 3)
  private static createAdaptiveProcessingOperation(
    item: ItemInstance, 
    baseItem: BaseItem
  ): DynamicOperation {
    return {
      id: `adaptive_processing_${Date.now()}`,
      name: 'Adaptive Processing',
      description: 'Process components based on discovered conditions (cleaning, treatment, or finalization)',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 10 * item.quantity, // Variable based on what's discovered
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: 'Apply appropriate processing based on component assessment results',
      isConditional: true // This operation adapts based on previous discoveries
    };
  }

  // LEGACY: Keep for backwards compatibility but mark as deprecated
  private static createDisassemblyOperation(
    item: ItemInstance, 
    baseItem: BaseItem, 
    method: 'inspection' | 'careful' | 'fast'
  ): DynamicOperation {
    console.warn('⚠️ DEPRECATED: createDisassemblyOperation should be replaced with Manufacturing v2 operations');
    
    const methodMultipliers = {
      inspection: { time: 0.8, quality: 0.9 },
      careful: { time: 1.0, quality: 0.95 },
      fast: { time: 0.6, quality: 0.7 }
    };
    
    const multiplier = methodMultipliers[method];
    
    return {
      id: `disassemble_${method}_${Date.now()}`,
      name: `${method.charAt(0).toUpperCase() + method.slice(1)} Disassembly`,
      description: `${method === 'inspection' ? 'Partially disassemble for inspection' : method === 'careful' ? 'Carefully disassemble preserving components' : 'Quickly disassemble for rapid processing'}`,
      operationType: OperationType.DISASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: Math.round(20 * item.quantity * multiplier.time),
      materialConsumption: [{
        itemId: item.baseItemId,
        count: item.quantity,
        tags: item.tags
      }],
      materialProduction: this.generateDisassemblyOutputs(item, baseItem, multiplier.quality),
      can_fail: method === 'fast',
      failure_chance: method === 'fast' ? 0.1 : 0.02,
      labor_skill: method === 'careful' ? 'skilled_technician' : 'unskilled',
      generatedReason: `${method} disassembly for ${method === 'inspection' ? 'repair analysis' : 'component recovery'}`,
      isConditional: false
    };
  }

  private static createAnalysisOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `analyze_${Date.now()}`,
      name: 'Component Analysis',
      description: 'Assess component condition and determine repair requirements',
      operationType: OperationType.SHAPING, // Conceptual operation
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: 1
      },
      baseDurationMinutes: 10 * item.quantity,
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician',
      generatedReason: 'Component condition assessment for repair planning',
      isConditional: false
    };
  }

  private static createTreatmentOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `treatment_${Date.now()}`,
      name: 'Environmental Treatment',
      description: 'Remove environmental contamination and damage',
      operationType: OperationType.SHAPING, // Treatment is a form of processing
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 30 * item.quantity,
      materialConsumption: [{
        itemId: 'cleaning_supplies',
        count: item.quantity,
        tags: []
      }],
      can_fail: true,
      failure_chance: 0.1,
      labor_skill: 'unskilled',
      generatedReason: 'Environmental damage treatment',
      isConditional: true
    };
  }

  private static createComponentRepairOperation(
    item: ItemInstance, 
    baseItem: BaseItem,
    materialRequirements: MaterialRequirement[]
  ): DynamicOperation {
    // MANUFACTURING V2: Component repair with conditional replacement
    // This operation should:
    // 1. Consume the extracted components from job inventory (from disassembly)
    // 2. Conditionally consume replacement parts for damaged components
    // 3. Produce repaired/functional components back to job inventory
    
    const materialConsumption: Array<{ itemId: string; count: number; tags?: string[] }> = [];
    const materialProduction: Array<{ itemId: string; count: number; tags?: string[]; quality?: number }> = [];
    
    if (baseItem.assemblyComponents && baseItem.assemblyComponents.length > 0) {
      console.log(`AutomaticWorkflowGeneration: Creating Manufacturing v2 repair operation for ${baseItem.name}`);
      
      for (const component of baseItem.assemblyComponents) {
        // CONSUME: Take the disassembled component from job inventory for inspection
        materialConsumption.push({
          itemId: component.componentId,
          count: component.quantity * item.quantity,
          tags: [] // Accept any condition for inspection
        });
        
        // Determine repair strategy based on damage level
        const damagePercentage = (100 - item.quality) / 100;
        const componentDamageChance = Math.min(0.8, damagePercentage + 0.2); // More realistic damage assessment
        const needsReplacement = Math.random() < componentDamageChance;
        
        if (needsReplacement) {
          // CONSUME: Replacement parts from facility inventory  
          materialConsumption.push({
            itemId: component.componentId,
            count: component.quantity * item.quantity,
            tags: [] // New replacement components
          });
          
          // PRODUCE: New functional component
          materialProduction.push({
            itemId: component.componentId,
            count: component.quantity * item.quantity,
            tags: [], // Clean, functional component
            quality: 85 // Replacement components are good quality
          });
          
          // Add to legacy material requirements for compatibility
          materialRequirements.push({
            material_id: component.componentId,
            quantity: component.quantity * item.quantity,
            consumed_at_start: false
          });
          
          console.log(`AutomaticWorkflowGeneration: Will replace ${component.quantity}x ${component.componentId} (damaged)`);
        } else {
          // PRODUCE: Restore the existing component (just cleaned/inspected)
          materialProduction.push({
            itemId: component.componentId,
            count: component.quantity * item.quantity,
            tags: [], // Restored component
            quality: Math.min(item.quality + 10, 90) // Slight improvement from repair
          });
          
          console.log(`AutomaticWorkflowGeneration: Will restore ${component.quantity}x ${component.componentId} (repairable)`);
        }
      }
    } else {
      console.warn(`AutomaticWorkflowGeneration: No assembly components found for ${baseItem.name}, using fallback repair materials`);
      // Fallback - generic repair with simple improvement
      materialConsumption.push({
        itemId: 'low_tech_spares',
        count: Math.max(1, Math.round((100 - item.quality) / 20)),
        tags: []
      });
      
      materialRequirements.push({
        material_id: 'low_tech_spares',
        quantity: Math.max(1, Math.round((100 - item.quality) / 20)),
        consumed_at_start: false
      });
    }

    return {
      id: `component_repair_${Date.now()}`,
      name: 'Component Repair/Replacement',
      description: 'Inspect components and replace/repair as needed, then return functional components to job inventory',
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 5
      },
      baseDurationMinutes: 45 * item.quantity,
      materialConsumption: materialConsumption as any, // TODO: Fix type mismatch with tags
      materialProduction: materialProduction as any, // TODO: Fix type mismatch with tags
      can_fail: true,
      failure_chance: 0.15,
      labor_skill: 'skilled_technician',
      generatedReason: 'Component inspection, repair, and replacement for repair workflow',
      isConditional: false
    };
  }

  private static createReassemblyOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    // Use recipe-based approach: read required components from baseItem.assemblyComponents
    const materialConsumption = [];
    
    if (baseItem.assemblyComponents && baseItem.assemblyComponents.length > 0) {
      console.log(`AutomaticWorkflowGeneration: Using recipe-based assembly for ${baseItem.name}`);
      console.log(`AutomaticWorkflowGeneration: Requires ${baseItem.assemblyComponents.length} component types`);
      
      for (const component of baseItem.assemblyComponents) {
        materialConsumption.push({
          itemId: component.componentId,
          count: component.quantity * item.quantity,
          tags: [], // No damaged components allowed for final assembly
          requiredTags: component.requiredTags || [], // Use component's required tags if specified
          maxQuality: undefined // No upper limit, but system should filter out damaged items
        });
        
        console.log(`AutomaticWorkflowGeneration: Final assembly requires ${component.quantity * item.quantity}x ${component.componentId}`);
      }
    } else {
      console.warn(`AutomaticWorkflowGeneration: No assemblyComponents found for ${baseItem.name}, assembly may fail`);
      // Fallback - use generic components from baseItems
      materialConsumption.push({
        itemId: 'machined_parts', // Use defined machined parts for assembly fallback
        count: 3 * item.quantity,
        tags: []
      });
    }
    
    return {
      id: `reassemble_${Date.now()}`,
      name: 'Final Assembly',
      description: `Reassemble all components into complete ${baseItem.name}`,
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 3
      },
      baseDurationMinutes: 35 * item.quantity,
      materialConsumption,
      materialProduction: [{
        itemId: baseItem.id,
        count: item.quantity,
        tags: [ItemTag.RESTORED],
        quality: 75 // Repaired items typically achieve 75% quality
      }],
      can_fail: true,
      failure_chance: 0.1,
      labor_skill: 'skilled_technician',
      generatedReason: 'Final assembly after repair',
      isConditional: false
    };
  }

  private static createSortingOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `sort_${Date.now()}`,
      name: 'Component Sorting',
      description: 'Sort and catalog recovered components by condition',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 5 * item.quantity,
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: 'Component organization after disassembly',
      isConditional: false
    };
  }

  private static createCleaningOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `clean_${Date.now()}`,
      name: 'Component Cleaning',
      description: 'Clean and prepare components for storage or reuse',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 15 * item.quantity,
      materialConsumption: [{
        itemId: 'cleaning_supplies',
        count: Math.ceil(item.quantity / 5), // 1 unit per 5 items
        tags: []
      }],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: 'Component cleaning after disassembly',
      isConditional: false
    };
  }

  private static createSpecificTreatmentOperation(
    item: ItemInstance, 
    baseItem: BaseItem, 
    condition: ItemTag
  ): DynamicOperation | null {
    // This would be expanded to handle specific conditions like [drenched], [corroded] etc
    const treatmentMap = {
      // Future: specific treatments for specific conditions
      // 'drenched': { name: 'Drying Process', time: 45, materials: ['heat'] },
      // 'corroded': { name: 'Corrosion Removal', time: 60, materials: ['chemical_bath'] }
    };

    // For now, return generic treatment
    return {
      id: `treat_${condition}_${Date.now()}`,
      name: `Treat ${condition} Condition`,
      description: `Remove ${condition} condition from item`,
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 30,
      can_fail: true,
      failure_chance: 0.1,
      labor_skill: 'unskilled',
      generatedReason: `Treatment for ${condition} condition`,
      isConditional: true
    };
  }

  private static createQualityAssessmentOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `assess_${Date.now()}`,
      name: 'Quality Assessment',
      description: 'Final quality evaluation after treatment',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: 1
      },
      baseDurationMinutes: 10,
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: 'Quality assessment after treatment',
      isConditional: false
    };
  }

  // Helper methods for predictions and analysis

  private static needsEnvironmentalTreatment(item: ItemInstance): boolean {
    // Check for environmental damage tags
    return item.tags.some(tag => ['drenched', 'corroded', 'heat_damaged'].includes(tag));
  }

  private static needsCleaning(item: ItemInstance): boolean {
    return item.quality < 50 || this.needsEnvironmentalTreatment(item);
  }

  // MANUFACTURING V2: Generate discovered components with realistic uncertainty
  private static generateDiscoveredComponents(
    item: ItemInstance, 
    baseItem: BaseItem, 
    discoveryAccuracy: number = 0.8
  ): Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> {
    const outputs: Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> = [];
    
    // Use recipe-based approach with discovery uncertainty
    if (baseItem.assemblyComponents && baseItem.assemblyComponents.length > 0) {
      console.log(`AutomaticWorkflowGeneration: Discovering components through assessment of ${baseItem.name}`);
      console.log(`AutomaticWorkflowGeneration: Found ${baseItem.assemblyComponents.length} components in recipe`);
      
      for (const component of baseItem.assemblyComponents) {
        // Simulate discovery: add randomness to represent uncertainty in component condition
        // Ensure input quality is on 0-100 scale (not 0-1)
        const inputQuality = item.quality > 1 ? item.quality : item.quality * 100;
        const baseQuality = inputQuality * discoveryAccuracy;
        const uncertainty = 20; // ±20% uncertainty in condition assessment
        const qualityVariation = (Math.random() - 0.5) * uncertainty;
        let componentQuality = Math.round(Math.max(5, Math.min(95, baseQuality + qualityVariation)));
        
        // Determine component condition tags based on discovered quality
        const componentTags: ItemTag[] = [];
        if (componentQuality < 30) {
          componentTags.push(ItemTag.DAMAGED);
        }
        if (item.tags.includes(ItemTag.DAMAGED) && componentQuality < 50) {
          componentTags.push(ItemTag.DAMAGED);
        }
        
        outputs.push({
          itemId: component.componentId,
          count: component.quantity * item.quantity,
          tags: componentTags,
          quality: componentQuality
        });
        
        console.log(`AutomaticWorkflowGeneration: Discovered ${component.quantity}x ${component.componentId} at ${componentQuality}% quality`);
      }
    } else {
      console.warn(`AutomaticWorkflowGeneration: No assembly components defined for ${baseItem.name}`);
    }
    
    return outputs;
  }

  // LEGACY: Keep for backwards compatibility
  private static generateDisassemblyOutputs(
    item: ItemInstance, 
    baseItem: BaseItem, 
    qualityRetention: number
  ): Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> {
    const outputs: Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> = [];
    
    // Use recipe-based approach: read assemblyComponents from baseItem
    if (baseItem.assemblyComponents && baseItem.assemblyComponents.length > 0) {
      console.log(`AutomaticWorkflowGeneration: Using recipe-based disassembly for ${baseItem.name}`);
      console.log(`AutomaticWorkflowGeneration: Found ${baseItem.assemblyComponents.length} components in recipe`);
      
      for (const component of baseItem.assemblyComponents) {
        // Calculate component quality based on original item quality and component durability
        let componentQuality = Math.round(item.quality * qualityRetention);
        
        // Apply component-specific quality modifiers
        if (component.componentId.includes('tube')) {
          componentQuality = Math.round(componentQuality * 1.1); // Tubes are more durable
        } else if (component.componentId.includes('casing')) {
          componentQuality = Math.round(componentQuality * 0.9); // Casings are more fragile
        }
        
        // Ensure quality stays within bounds
        componentQuality = Math.max(1, Math.min(100, componentQuality));
        
        // Inherit damage from original item, plus component-specific damage logic
        const componentTags = [];
        if (item.tags.includes(ItemTag.DAMAGED)) {
          // Some components might be more or less likely to be damaged
          const damageChance = component.componentId.includes('casing') ? 0.9 : 0.7; // Casings break more easily
          if (Math.random() < damageChance) {
            componentTags.push(ItemTag.DAMAGED);
          }
        }
        
        outputs.push({
          itemId: component.componentId,
          count: component.quantity * item.quantity,
          tags: componentTags,
          quality: componentQuality
        });
        
        console.log(`AutomaticWorkflowGeneration: Will produce ${component.quantity * item.quantity}x ${component.componentId} at ${componentQuality}% quality`);
      }
    } else {
      // Fallback for items without assembly definitions
      console.warn(`AutomaticWorkflowGeneration: No assemblyComponents found for ${baseItem.name}, using generic breakdown`);
      // Use properly defined scrap materials from baseItems
      outputs.push({
        itemId: 'steel-scrap',
        count: item.quantity * 1, // Steel scrap from metal items
        quality: Math.round(item.quality * qualityRetention * 0.6)
      });
      outputs.push({
        itemId: 'plastic-scrap', 
        count: item.quantity * 1, // Plastic scrap from housing/casings
        quality: Math.round(item.quality * qualityRetention * 0.4)
      });
    }
    
    return outputs;
  }

  private static predictComponentRecovery(
    item: ItemInstance, 
    baseItem: BaseItem, 
    preserveQuality: boolean
  ): Array<{ itemId: string; quantity: number; tags: ItemTag[]; quality: number }> {
    const qualityRetention = preserveQuality ? 0.9 : 0.7;
    const outputs = this.generateDisassemblyOutputs(item, baseItem, qualityRetention);
    
    return outputs.map(output => ({
      itemId: output.itemId,
      quantity: output.count,
      tags: output.tags || [],
      quality: output.quality || Math.round(item.quality * qualityRetention)
    }));
  }

  private static getTreatmentMaterials(conditions: ItemTag[]): MaterialRequirement[] {
    const materials: MaterialRequirement[] = [];
    
    // Basic cleaning supplies for any treatment
    materials.push({
      material_id: 'cleaning_supplies',
      quantity: Math.ceil(conditions.length / 2),
      consumed_at_start: true
    });
    
    return materials;
  }

  // Helper methods for manufacturing workflow generation

  private static createMaterialPreparationOperation(component: any, index: number, quantity: number): DynamicOperation {
    return {
      id: `prep_material_${index}_${Date.now()}`,
      name: `Prepare ${component.componentId}`,
      description: `Prepare and verify ${component.componentId} components for assembly`,
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 5 * component.quantity * quantity,
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: `Material preparation for ${component.componentId}`,
      isConditional: false
    };
  }

  private static createComponentInspectionOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    return {
      id: `inspect_components_${Date.now()}`,
      name: 'Component Inspection',
      description: 'Inspect all components for quality and compatibility',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: 1
      },
      baseDurationMinutes: 10 * quantity,
      can_fail: true,
      failure_chance: 0.05,
      labor_skill: 'skilled_technician',
      generatedReason: 'Quality control for assembly components',
      isConditional: false
    };
  }

  private static createAssemblyOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    const complexityMultiplier = baseItem.assemblyComponents?.length || 1;
    
    return {
      id: `assemble_${Date.now()}`,
      name: 'Primary Assembly',
      description: `Assemble ${baseItem.name} from prepared components`,
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 3
      },
      baseDurationMinutes: 30 * quantity * complexityMultiplier,
      materialProduction: [{
        itemId: baseItem.id,
        count: quantity,
        tags: [],
        quality: 75
      }],
      can_fail: true,
      failure_chance: 0.1,
      labor_skill: 'skilled_technician',
      generatedReason: `Assembly of ${baseItem.name}`,
      isConditional: false
    };
  }

  private static createFinishingOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    return {
      id: `finish_${Date.now()}`,
      name: 'Finishing & QC',
      description: 'Final finishing touches and quality control',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.PRECISION_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 15 * quantity,
      can_fail: true,
      failure_chance: 0.05,
      labor_skill: 'skilled_technician',
      generatedReason: 'Final finishing and quality control',
      isConditional: false
    };
  }

  private static createRawMaterialPrepOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    return {
      id: `prep_raw_${Date.now()}`,
      name: 'Raw Material Preparation',
      description: `Prepare raw materials for ${baseItem.name} production`,
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 1
      },
      baseDurationMinutes: 10 * quantity,
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled',
      generatedReason: 'Raw material preparation',
      isConditional: false
    };
  }

  private static createShapingOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    // Determine the appropriate shaping operation based on the item
    let operationName = 'Shaping';
    let requiredTag = TagCategory.BASIC_MANIPULATION;
    let duration = 20;

    if (baseItem.id.includes('tube') || baseItem.id.includes('cylinder')) {
      operationName = 'Turning';
      requiredTag = TagCategory.TURNING;
      duration = 25;
    } else if (baseItem.id.includes('billet') || baseItem.id.includes('component')) {
      operationName = 'Milling';
      requiredTag = TagCategory.MILLING;
      duration = 30;
    } else if (baseItem.id.includes('casing')) {
      operationName = 'Forming';
      requiredTag = TagCategory.FORMING;
      duration = 15;
    }

    return {
      id: `shape_${Date.now()}`,
      name: operationName,
      description: `${operationName} operation to create ${baseItem.name}`,
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: requiredTag,
        minimum: 1
      },
      baseDurationMinutes: duration * quantity,
      materialProduction: [{
        itemId: baseItem.id,
        count: quantity,
        tags: [],
        quality: 70
      }],
      can_fail: true,
      failure_chance: 0.1,
      labor_skill: 'skilled_machinist',
      generatedReason: `${operationName} to create ${baseItem.name}`,
      isConditional: false
    };
  }

  private static createQualityControlOperation(baseItem: BaseItem, quantity: number): DynamicOperation {
    return {
      id: `qc_${Date.now()}`,
      name: 'Quality Control',
      description: 'Final dimensional and quality inspection',
      operationType: OperationType.SHAPING,
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: 1
      },
      baseDurationMinutes: 8 * quantity,
      can_fail: true,
      failure_chance: 0.05,
      labor_skill: 'skilled_technician',
      generatedReason: 'Quality control inspection',
      isConditional: false
    };
  }
}