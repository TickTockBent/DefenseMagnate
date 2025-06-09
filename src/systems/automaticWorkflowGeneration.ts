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
  LaborSkill
} from '../types';
import { getBaseItem } from '../data/baseItems';
import { ManufacturingRulesEngine } from '../systems/manufacturingRules';

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description: string;
  operations: DynamicOperation[];
  estimatedDuration: number; // total time in hours
  materialRequirements: MaterialRequirement[];
  expectedOutputs: Array<{
    itemId: string;
    quantity: number;
    tags: ItemTag[];
    quality: number;
  }>;
  confidence: number; // 0-1 how reliable this workflow is
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
      id: `repair_${baseItem.id}_${Date.now()}`,
      name: `Repair ${baseItem.name}`,
      description: `Complete repair workflow: disassembly → analysis → treatment → component replacement → reassembly`,
      operations,
      estimatedDuration: totalDuration / 60, // Convert to hours
      materialRequirements,
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: item.quantity,
        tags: [ItemTag.RESTORED], // Repaired items get restored tag
        quality: Math.min(targetQuality, 85) // Repairs typically cap at 85% quality
      }],
      confidence: 0.75, // Repair outcomes can be unpredictable
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

    console.log(`AutomaticWorkflowGeneration: Generating disassembly workflow for ${baseItem.name}`);

    const operations: DynamicOperation[] = [];
    let totalDuration = 0;

    // Step 1: Careful disassembly
    const disassemblyMethod = preserveQuality ? 'careful' : 'fast';
    const disassemblyOp = this.createDisassemblyOperation(item, baseItem, disassemblyMethod);
    operations.push(disassemblyOp);
    totalDuration += disassemblyOp.baseDurationMinutes;

    // Step 2: Component sorting and cataloging
    const sortingOp = this.createSortingOperation(item, baseItem);
    operations.push(sortingOp);
    totalDuration += sortingOp.baseDurationMinutes;

    // Step 3: Cleaning if needed
    if (this.needsCleaning(item)) {
      const cleaningOp = this.createCleaningOperation(item, baseItem);
      operations.push(cleaningOp);
      totalDuration += cleaningOp.baseDurationMinutes;
    }

    // Predict component recovery based on assembly definition
    const expectedComponents = this.predictComponentRecovery(item, baseItem, preserveQuality);

    return {
      id: `disassemble_${baseItem.id}_${Date.now()}`,
      name: `Disassemble ${baseItem.name}`,
      description: `Systematic disassembly: ${disassemblyMethod} breakdown → component sorting → cleaning`,
      operations,
      estimatedDuration: totalDuration / 60,
      materialRequirements: [], // Disassembly doesn't consume materials
      expectedOutputs: expectedComponents,
      confidence: preserveQuality ? 0.85 : 0.7, // Careful disassembly is more predictable
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
      id: `manufacture_${baseItem.id}_${Date.now()}`,
      name: `Manufacture ${baseItem.name}`,
      description: `Complete manufacturing workflow: material preparation → processing → assembly → finishing`,
      operations,
      estimatedDuration: totalDuration / 60, // Convert to hours
      materialRequirements,
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: quantity,
        tags: [],
        quality: 75 // Standard manufacturing quality
      }],
      confidence: 0.85, // Manufacturing is generally more predictable than repair
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
      id: `treatment_${baseItem.id}_${Date.now()}`,
      name: `Treat ${baseItem.name}`,
      description: `Environmental damage treatment: ${conditions.join(' + ')} removal → quality assessment`,
      operations,
      estimatedDuration: totalDuration / 60,
      materialRequirements: this.getTreatmentMaterials(conditions),
      expectedOutputs: [{
        itemId: baseItem.id,
        quantity: item.quantity,
        tags: item.tags.filter(tag => !conditions.includes(tag)), // Remove treated conditions
        quality: Math.min(item.quality + 15, 100) // Treatment can improve quality
      }],
      confidence: 0.8,
      riskFactors: [
        'Some environmental damage may be permanent',
        'Treatment chemicals may affect other components'
      ]
    };
  }

  // Helper methods for creating specific operations

  private static createDisassemblyOperation(
    item: ItemInstance, 
    baseItem: BaseItem, 
    method: 'inspection' | 'careful' | 'fast'
  ): DynamicOperation {
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
    // Estimate material needs based on item condition
    const materialNeeded = Math.round(baseItem.baseValue * 0.3 * (100 - item.quality) / 100);
    
    // Add estimated material requirements
    materialRequirements.push({
      material_id: 'steel', // Primary structural material
      quantity: materialNeeded,
      consumed_at_start: false
    });

    return {
      id: `component_repair_${Date.now()}`,
      name: 'Component Repair/Replacement',
      description: 'Replace damaged components and repair repairable ones',
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 5
      },
      baseDurationMinutes: 45 * item.quantity,
      materialConsumption: [{
        itemId: 'steel',
        count: materialNeeded,
        tags: []
      }],
      can_fail: true,
      failure_chance: 0.15,
      labor_skill: 'skilled_technician',
      generatedReason: 'Component replacement for repair',
      isConditional: false
    };
  }

  private static createReassemblyOperation(item: ItemInstance, baseItem: BaseItem): DynamicOperation {
    return {
      id: `reassemble_${Date.now()}`,
      name: 'Final Assembly',
      description: 'Reassemble all components into complete item',
      operationType: OperationType.ASSEMBLY,
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 3
      },
      baseDurationMinutes: 35 * item.quantity,
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

  private static generateDisassemblyOutputs(
    item: ItemInstance, 
    baseItem: BaseItem, 
    qualityRetention: number
  ): Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> {
    // This would ideally read the assembly definition from baseItem.assemblyComponents
    // For now, generate plausible components based on item type
    
    const outputs: Array<{ itemId: string; count: number; tags?: ItemTag[]; quality?: number }> = [];
    
    if (baseItem.id === 'basic_sidearm') {
      outputs.push(
        {
          itemId: 'mechanical_assembly',
          count: item.quantity,
          tags: item.tags.includes(ItemTag.DAMAGED) ? [ItemTag.DAMAGED] : [],
          quality: Math.round(item.quality * qualityRetention)
        },
        {
          itemId: 'small_tube',
          count: item.quantity,
          quality: Math.round(item.quality * qualityRetention * 1.1) // Tubes are usually more durable
        },
        {
          itemId: 'small_casing',
          count: item.quantity,
          tags: item.tags.includes(ItemTag.DAMAGED) ? [ItemTag.DAMAGED] : [],
          quality: Math.round(item.quality * qualityRetention * 0.9) // Casings are more fragile
        }
      );
    } else {
      // Generic assembly breakdown
      outputs.push({
        itemId: 'mechanical_components',
        count: item.quantity * 3, // Assume 3 components per assembly
        quality: Math.round(item.quality * qualityRetention)
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