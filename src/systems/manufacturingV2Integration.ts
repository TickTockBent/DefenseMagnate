// Manufacturing v2 Integration Layer
// Direct integration of Manufacturing v2 with machine workspace system

import { WorkflowGenerator } from './workflowGenerator';
import { ManufacturingPlan, DynamicOperation, MachineBasedMethod } from '../types';
import { ItemInstance, ItemTag } from '../types';
import { TagCategory, LaborSkill } from '../constants/enums';

export class ManufacturingV2Integration {
  /**
   * Convert a Manufacturing v2 plan into a MachineBasedMethod
   * This integrates the new dynamic system with existing job infrastructure
   */
  static convertPlanToMethod(plan: ManufacturingPlan): MachineBasedMethod {
    const operations = plan.requiredOperations.map(op => this.convertDynamicOperation(op));
    
    return {
      id: `dynamic_${plan.targetProduct}_${Date.now()}`,
      name: `Dynamic ${plan.targetProduct} (v2)`,
      description: `Dynamically generated workflow for ${plan.targetProduct} (Manufacturing v2)`,
      outputTags: [ItemTag.FORGED, ItemTag.LOW_TECH],
      qualityRange: [60, 90], // Conservative range
      operations,
      output_state: 'functional',
      output_quality_range: [60, 90],
      labor_cost_multiplier: 1.0,
      complexity_rating: Math.min(10, Math.max(1, plan.requiredOperations.length)),
      profit_margin_modifier: 1.0,
      customer_appeal: ['dynamic_manufacturing', 'component_specialists']
    };
  }
  
  /**
   * Convert a dynamic operation to machine operation format
   */
  private static convertDynamicOperation(op: DynamicOperation): any {
    return {
      id: op.id,
      name: op.name,
      description: op.description,
      requiredTag: op.requiredTag,
      baseDurationMinutes: op.baseDurationMinutes,
      
      // Convert material consumption/production to legacy format
      materialConsumption: op.materialConsumption,
      materialProduction: op.materialProduction,
      
      // Material requirements (for machine workspace compatibility)
      material_requirements: op.materialConsumption?.map(consumption => ({
        material_id: consumption.itemId,
        quantity: consumption.count,
        consumed_at_start: true,
        required_tags: consumption.tags,
        max_quality: consumption.maxQuality
      })) || [],
      
      can_fail: op.can_fail,
      failure_chance: op.failure_chance,
      labor_skill: op.labor_skill
    };
  }
  
  /**
   * Generate a dynamic manufacturing method for a product
   * This is the main entry point for the UI to use Manufacturing v2
   */
  static generateDynamicMethod(
    targetProductId: string,
    targetQuantity: number = 1,
    inputItems: ItemInstance[] = [],
    availableInventory: ItemInstance[] = []
  ): MachineBasedMethod {
    const plan = WorkflowGenerator.generateManufacturingPlan(
      targetProductId,
      targetQuantity,
      inputItems,
      availableInventory
    );
    
    return this.convertPlanToMethod(plan);
  }
  
  /**
   * Check if Manufacturing v2 can handle a specific product
   */
  static canHandleProduct(productId: string): boolean {
    try {
      const plan = WorkflowGenerator.generateManufacturingPlan(
        productId,
        1,
        [],
        []
      );
      return plan.requiredOperations.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get a preview of what Manufacturing v2 would do for a product
   */
  static getManufacturingPreview(
    targetProductId: string,
    inputItems: ItemInstance[] = [],
    availableInventory: ItemInstance[] = []
  ): {
    canManufacture: boolean;
    estimatedTime: number;
    requiredMaterials: string[];
    operationCount: number;
    confidence: number;
    summary: string;
  } {
    try {
      const plan = WorkflowGenerator.generateManufacturingPlan(
        targetProductId,
        1,
        inputItems,
        availableInventory
      );
      
      const requiredMaterials = plan.materialRequirements.map(req => 
        `${req.quantity}x ${req.material_id}`
      );
      
      const summary = `Manufacturing v2 can create ${targetProductId} using ${plan.requiredOperations.length} operations in ~${Math.round(plan.estimatedDuration * 60)} minutes with ${Math.round(plan.confidence * 100)}% confidence.`;
      
      return {
        canManufacture: true,
        estimatedTime: plan.estimatedDuration * 60, // Convert to minutes
        requiredMaterials,
        operationCount: plan.requiredOperations.length,
        confidence: plan.confidence,
        summary
      };
    } catch (error) {
      return {
        canManufacture: false,
        estimatedTime: 0,
        requiredMaterials: [],
        operationCount: 0,
        confidence: 0,
        summary: `Manufacturing v2 cannot manufacture ${targetProductId}: ${error}`
      };
    }
  }
  
  /**
   * Create a "smart" manufacturing method that uses v2 intelligence
   * This method analyzes inputs at job creation time
   */
  static createSmartMethod(targetProductId: string): MachineBasedMethod {
    return {
      id: `smart_${targetProductId}`,
      name: `Smart Manufacturing (${targetProductId})`,
      description: `Intelligent manufacturing that adapts workflow based on available inputs`,
      outputTags: [ItemTag.FORGED, ItemTag.LOW_TECH],
      qualityRange: [70, 95],
      
      // This would be a placeholder operation that gets replaced at runtime
      operations: [{
        id: 'smart_analysis',
        name: 'Analyze Inputs & Generate Workflow',
        description: 'Manufacturing v2 analyzes available inputs and generates optimal workflow',
        requiredTag: {
          category: TagCategory.BASIC_MANIPULATION,
          minimum: 1
        },
        baseDurationMinutes: 5, // Just for analysis
        can_fail: false,
        failure_chance: 0,
        labor_skill: LaborSkill.UNSKILLED
      }],
      
      output_state: 'functional',
      output_quality_range: [70, 95],
      labor_cost_multiplier: 1.0,
      complexity_rating: 5,
      profit_margin_modifier: 1.1, // Slight bonus for smart manufacturing
      customer_appeal: ['intelligent_manufacturing', 'adaptive_production']
    };
  }
}