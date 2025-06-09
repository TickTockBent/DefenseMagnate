// Manufacturing Rules System - Manufacturing v2
// Validates operations based on three-tier hierarchy

import { ItemManufacturingType, ManufacturingRule, OperationType } from '../types';
import { getBaseItem } from '../data/baseItems';

export class ManufacturingRulesEngine {
  /**
   * Get the manufacturing rules for a specific item
   */
  static getManufacturingRules(itemId: string): ManufacturingRule {
    const baseItem = getBaseItem(itemId);
    
    if (!baseItem) {
      throw new Error(`Unknown item: ${itemId}`);
    }
    
    switch (baseItem.manufacturingType) {
      case ItemManufacturingType.RAW_MATERIAL:
        return {
          canDisassemble: false,
          canShape: true,  // Raw materials can be shaped into other forms
          canAssemble: false, // Raw materials cannot be assembled directly
          reason: 'raw_material'
        };
        
      case ItemManufacturingType.SHAPED_MATERIAL:
        return {
          canDisassemble: false, // Shaped materials cannot be disassembled back to raw
          canShape: true,  // Can be further processed/refined
          canAssemble: true, // Can be used in assemblies
          reason: 'shaped_material'
        };
        
      case ItemManufacturingType.ASSEMBLY:
        return {
          canDisassemble: true, // Assemblies CAN be disassembled
          canShape: false, // Assemblies cannot be "shaped" (they're combinations)
          canAssemble: true, // Assemblies can be used in larger assemblies
          reason: 'assembly'
        };
        
      default:
        throw new Error(`Unknown manufacturing type: ${baseItem.manufacturingType}`);
    }
  }
  
  /**
   * Validate if a specific operation is allowed on an item
   */
  static validateOperation(itemId: string, operationType: OperationType): boolean {
    const rules = this.getManufacturingRules(itemId);
    
    switch (operationType) {
      case OperationType.SHAPING:
        return rules.canShape;
        
      case OperationType.ASSEMBLY:
        return rules.canAssemble;
        
      case OperationType.DISASSEMBLY:
        return rules.canDisassemble;
        
      default:
        return false;
    }
  }
  
  /**
   * Get human-readable explanation of why an operation is not allowed
   */
  static getOperationDenialReason(itemId: string, operationType: OperationType): string {
    const rules = this.getManufacturingRules(itemId);
    const baseItem = getBaseItem(itemId);
    
    if (!baseItem) {
      return `Unknown item: ${itemId}`;
    }
    
    switch (operationType) {
      case OperationType.DISASSEMBLY:
        if (!rules.canDisassemble) {
          switch (rules.reason) {
            case 'raw_material':
              return `${baseItem.name} is a raw material and cannot be disassembled further`;
            case 'shaped_material':
              return `${baseItem.name} is a shaped material - it IS the raw material, just processed`;
            default:
              return `${baseItem.name} cannot be disassembled`;
          }
        }
        break;
        
      case OperationType.SHAPING:
        if (!rules.canShape) {
          return `${baseItem.name} cannot be shaped (it's already an assembly)`;
        }
        break;
        
      case OperationType.ASSEMBLY:
        if (!rules.canAssemble) {
          return `${baseItem.name} cannot be used in assemblies`;
        }
        break;
    }
    
    return 'Operation is allowed';
  }
  
  /**
   * Get valid disassembly components for an assembly
   */
  static getDisassemblyComponents(itemId: string): string[] {
    const baseItem = getBaseItem(itemId);
    
    if (!baseItem || !this.validateOperation(itemId, OperationType.DISASSEMBLY)) {
      return [];
    }
    
    return baseItem.assemblyComponents?.map(comp => comp.componentId) || [];
  }
  
  /**
   * Get the material source for a shaped material
   */
  static getMaterialSource(itemId: string): string | null {
    const baseItem = getBaseItem(itemId);
    
    if (!baseItem || baseItem.manufacturingType !== ItemManufacturingType.SHAPED_MATERIAL) {
      return null;
    }
    
    return baseItem.materialSource || null;
  }
  
  /**
   * Validate the entire manufacturing hierarchy for consistency
   */
  static validateHierarchyConsistency(): string[] {
    const issues: string[] = [];
    const baseItems = require('../data/baseItems').baseItems;
    
    for (const [itemId, itemData] of Object.entries(baseItems)) {
      const item = itemData as any; // Type assertion for baseItems values
      // Check if assemblies have valid component references
      if (item.manufacturingType === ItemManufacturingType.ASSEMBLY && item.assemblyComponents) {
        for (const component of item.assemblyComponents) {
          const componentItem = getBaseItem(component.componentId);
          if (!componentItem) {
            issues.push(`${itemId}: references unknown component ${component.componentId}`);
            continue;
          }
          
          // Components should be shaped materials or other assemblies
          if (componentItem.manufacturingType === ItemManufacturingType.RAW_MATERIAL) {
            issues.push(`${itemId}: directly uses raw material ${component.componentId} (should use shaped material)`);
          }
        }
      }
      
      // Check if shaped materials have valid material sources
      if (item.manufacturingType === ItemManufacturingType.SHAPED_MATERIAL && item.materialSource) {
        const sourceItem = getBaseItem(item.materialSource);
        if (!sourceItem) {
          issues.push(`${itemId}: references unknown material source ${item.materialSource}`);
        } else if (sourceItem.manufacturingType !== ItemManufacturingType.RAW_MATERIAL) {
          issues.push(`${itemId}: material source ${item.materialSource} is not a raw material`);
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Get all items of a specific manufacturing type
   */
  static getItemsByManufacturingType(type: ItemManufacturingType): string[] {
    const baseItems = require('../data/baseItems').baseItems;
    
    return Object.entries(baseItems)
      .filter(([_, itemData]) => (itemData as any).manufacturingType === type)
      .map(([itemId, _]) => itemId);
  }
}