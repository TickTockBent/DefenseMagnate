// Legacy Item Migration Utilities
// Converts old storage system to new unified item system

import { 
  ItemInstance, 
  ItemTag, 
  FacilityInventory,
  InventorySlot,
  InventoryGroup,
  ItemCategory,
  LegacyItemMapping
} from '../types';
import { baseItems, getBaseItem } from '../data/baseItems';
import { createItemInstance } from './itemSystem';

// Legacy storage key mappings to new item system
export const legacyMappings: LegacyItemMapping[] = [
  // Basic Sidearm variants
  {
    oldKey: 'basic_sidearm_pristine',
    baseItemId: 'basic_sidearm',
    tags: [ItemTag.FORGED],
    qualityRange: [90, 95]
  },
  {
    oldKey: 'basic_sidearm_standard',
    baseItemId: 'basic_sidearm',
    tags: [ItemTag.FORGED],
    qualityRange: [75, 85]
  },
  {
    oldKey: 'basic_sidearm_functional',
    baseItemId: 'basic_sidearm',
    tags: [ItemTag.RESTORED],
    qualityRange: [60, 70]
  },
  {
    oldKey: 'basic_sidearm_junk',
    baseItemId: 'basic_sidearm',
    tags: [ItemTag.JUNK],
    qualityRange: [30, 45]
  },
  
  // Tactical Knife variants
  {
    oldKey: 'tactical_knife_pristine',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.FORGED],
    qualityRange: [90, 95]
  },
  {
    oldKey: 'tactical_knife_standard',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.FORGED],
    qualityRange: [75, 85]
  },
  {
    oldKey: 'tactical_knife_functional',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.RESTORED],
    qualityRange: [60, 70]
  },
  {
    oldKey: 'tactical_knife_junk',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.JUNK],
    qualityRange: [30, 45]
  },
  
  // Raw materials (assign standard quality grades)
  {
    oldKey: 'steel',
    baseItemId: 'steel',
    tags: [ItemTag.STANDARD],
    qualityRange: [80, 90]
  },
  {
    oldKey: 'aluminum',
    baseItemId: 'aluminum',
    tags: [ItemTag.STANDARD],
    qualityRange: [80, 90]
  },
  {
    oldKey: 'plastic',
    baseItemId: 'plastic',
    tags: [ItemTag.STANDARD],
    qualityRange: [75, 85]
  },
  {
    oldKey: 'titanium',
    baseItemId: 'titanium',
    tags: [ItemTag.PREMIUM],
    qualityRange: [90, 95]
  },
  
  // Electronic components
  {
    oldKey: 'basic_electronics',
    baseItemId: 'basic_electronics',
    tags: [ItemTag.STANDARD],
    qualityRange: [70, 85]
  },
  {
    oldKey: 'advanced_electronics',
    baseItemId: 'advanced_electronics',
    tags: [ItemTag.PREMIUM],
    qualityRange: [85, 95]
  },
  
  // Mechanical components
  {
    oldKey: 'machined_parts',
    baseItemId: 'machined_parts',
    tags: [ItemTag.STANDARD],
    qualityRange: [75, 90]
  },
  {
    oldKey: 'low_tech_spares',
    baseItemId: 'low_tech_spares',
    tags: [ItemTag.SALVAGED],
    qualityRange: [50, 70]
  },
  {
    oldKey: 'precision_spares',
    baseItemId: 'precision_spares',
    tags: [ItemTag.PREMIUM],
    qualityRange: [85, 95]
  },
  
  // Damaged items (map to base items with damage tags)
  {
    oldKey: 'damaged_basic_sidearm',
    baseItemId: 'basic_sidearm',
    tags: [ItemTag.DAMAGED],
    qualityRange: [10, 25]
  },
  {
    oldKey: 'damaged_tactical_knife',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.DAMAGED],
    qualityRange: [10, 25]
  },
  {
    oldKey: 'dull_tactical_knife',
    baseItemId: 'tactical_knife',
    tags: [ItemTag.SALVAGED],
    qualityRange: [45, 60]
  },
  
  // Composite and chemical materials
  {
    oldKey: 'composite_materials',
    baseItemId: 'composite_materials',
    tags: [ItemTag.PREMIUM],
    qualityRange: [85, 95]
  },
  {
    oldKey: 'industrial_chemicals',
    baseItemId: 'industrial_chemicals',
    tags: [ItemTag.STANDARD],
    qualityRange: [70, 85]
  }
];

// Convert legacy storage to new inventory system
export class LegacyStorageConverter {
  
  // Main conversion function
  convertLegacyStorage(oldStorage: Record<string, number>): FacilityInventory {
    const groups = new Map<ItemCategory, InventoryGroup>();
    
    // Initialize empty groups for all categories
    for (const category of Object.values(ItemCategory)) {
      groups.set(category, {
        category,
        slots: [],
        totalItems: 0,
        totalValue: 0
      });
    }
    
    // Convert each storage entry
    for (const [storageKey, quantity] of Object.entries(oldStorage)) {
      if (quantity <= 0) continue;
      
      const mapping = this.findMapping(storageKey);
      if (!mapping) {
        console.warn(`No mapping found for legacy storage key: ${storageKey}`);
        continue;
      }
      
      const baseItem = getBaseItem(mapping.baseItemId);
      if (!baseItem) {
        console.warn(`Base item not found: ${mapping.baseItemId}`);
        continue;
      }
      
      // Create item instances for this storage entry
      const instances = this.createInstancesFromLegacy(mapping, quantity);
      
      // Add to appropriate inventory group
      const group = groups.get(baseItem.category);
      if (group) {
        this.addInstancesToGroup(group, instances);
      }
    }
    
    // Calculate totals
    let totalItems = 0;
    let totalValue = 0;
    
    for (const group of groups.values()) {
      totalItems += group.totalItems;
      totalValue += group.totalValue;
    }
    
    return {
      groups,
      totalItems,
      totalValue,
      lastUpdated: Date.now(),
      storageCapacity: 1000, // Default capacity
      usedCapacity: totalItems
    };
  }
  
  // Find mapping for a legacy storage key
  private findMapping(storageKey: string): LegacyItemMapping | undefined {
    // First try exact match
    let mapping = legacyMappings.find(m => m.oldKey === storageKey);
    
    // If no exact match, try to infer from base item
    if (!mapping) {
      // Check if the key matches a base item directly
      const baseItem = getBaseItem(storageKey);
      if (baseItem) {
        return {
          oldKey: storageKey,
          baseItemId: storageKey,
          tags: [ItemTag.STANDARD],
          qualityRange: [75, 85]
        };
      }
    }
    
    return mapping;
  }
  
  // Create item instances from legacy mapping
  private createInstancesFromLegacy(
    mapping: LegacyItemMapping, 
    totalQuantity: number
  ): ItemInstance[] {
    const baseItem = getBaseItem(mapping.baseItemId);
    if (!baseItem) return [];
    
    // For stackable items, create one instance with full quantity
    if (baseItem.stackable) {
      const quality = this.randomInRange(mapping.qualityRange);
      
      return [createItemInstance({
        baseItemId: mapping.baseItemId,
        tags: mapping.tags,
        quality,
        quantity: totalQuantity,
        metadata: { migratedFrom: mapping.oldKey }
      })];
    }
    
    // For non-stackable items, create individual instances
    const instances: ItemInstance[] = [];
    for (let i = 0; i < totalQuantity; i++) {
      const quality = this.randomInRange(mapping.qualityRange);
      
      instances.push(createItemInstance({
        baseItemId: mapping.baseItemId,
        tags: mapping.tags,
        quality,
        quantity: 1,
        metadata: { migratedFrom: mapping.oldKey }
      }));
    }
    
    return instances;
  }
  
  // Add instances to inventory group
  private addInstancesToGroup(group: InventoryGroup, instances: ItemInstance[]): void {
    if (instances.length === 0) return;
    
    const baseItemId = instances[0].baseItemId;
    
    // Find existing slot for this base item
    let slot = group.slots.find(s => s.baseItemId === baseItemId);
    
    if (!slot) {
      // Create new slot
      slot = {
        baseItemId,
        stack: {
          baseItemId,
          instances: [],
          totalQuantity: 0,
          averageQuality: 0,
          uniqueTags: []
        },
        reserved: 0,
        available: 0
      };
      group.slots.push(slot);
    }
    
    // Add instances to slot
    slot.stack.instances.push(...instances);
    
    // Recalculate slot totals
    this.updateSlotTotals(slot);
    
    // Update group totals
    this.updateGroupTotals(group);
  }
  
  // Update slot calculated fields
  private updateSlotTotals(slot: InventorySlot): void {
    const instances = slot.stack.instances;
    
    slot.stack.totalQuantity = instances.reduce((sum, inst) => sum + inst.quantity, 0);
    slot.available = slot.stack.totalQuantity - slot.reserved;
    
    if (instances.length > 0) {
      // Calculate weighted average quality
      const totalQualityPoints = instances.reduce((sum, inst) => 
        sum + (inst.quality * inst.quantity), 0
      );
      slot.stack.averageQuality = Math.round(totalQualityPoints / slot.stack.totalQuantity);
      
      // Collect unique tags
      slot.stack.uniqueTags = [...new Set(instances.flatMap(inst => inst.tags))];
    } else {
      slot.stack.averageQuality = 0;
      slot.stack.uniqueTags = [];
    }
  }
  
  // Update group calculated fields
  private updateGroupTotals(group: InventoryGroup): void {
    group.totalItems = group.slots.reduce((sum, slot) => sum + slot.stack.totalQuantity, 0);
    
    // Calculate total value (simplified - would need price calculation)
    group.totalValue = group.slots.reduce((sum, slot) => {
      const baseItem = getBaseItem(slot.baseItemId);
      if (!baseItem) return sum;
      
      const avgValue = baseItem.baseValue * (slot.stack.averageQuality / 100);
      return sum + (avgValue * slot.stack.totalQuantity);
    }, 0);
  }
  
  // Generate random number within range
  private randomInRange([min, max]: [number, number]): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Migrate existing facility storage in-place
  migrateStorageData(
    oldStorage: Record<string, number>, 
    targetInventory: FacilityInventory
  ): void {
    const convertedInventory = this.convertLegacyStorage(oldStorage);
    
    // Merge converted inventory into target
    for (const [category, convertedGroup] of convertedInventory.groups.entries()) {
      const targetGroup = targetInventory.groups.get(category);
      
      if (targetGroup) {
        // Merge slots
        for (const slot of convertedGroup.slots) {
          const existingSlot = targetGroup.slots.find(s => s.baseItemId === slot.baseItemId);
          
          if (existingSlot) {
            // Merge instances into existing slot
            existingSlot.stack.instances.push(...slot.stack.instances);
            this.updateSlotTotals(existingSlot);
          } else {
            // Add new slot
            targetGroup.slots.push(slot);
          }
        }
        
        this.updateGroupTotals(targetGroup);
      } else {
        // Add entire group
        targetInventory.groups.set(category, convertedGroup);
      }
    }
    
    // Update inventory totals
    let totalItems = 0;
    let totalValue = 0;
    
    for (const group of targetInventory.groups.values()) {
      totalItems += group.totalItems;
      totalValue += group.totalValue;
    }
    
    targetInventory.totalItems = totalItems;
    targetInventory.totalValue = totalValue;
    targetInventory.usedCapacity = totalItems;
    targetInventory.lastUpdated = Date.now();
  }
  
  // Validate migration results
  validateMigration(
    oldStorage: Record<string, number>, 
    newInventory: FacilityInventory
  ): boolean {
    // Check that total quantities are preserved
    let oldTotal = 0;
    let newTotal = 0;
    
    for (const quantity of Object.values(oldStorage)) {
      oldTotal += quantity;
    }
    
    for (const group of newInventory.groups.values()) {
      for (const slot of group.slots) {
        newTotal += slot.stack.totalQuantity;
      }
    }
    
    if (oldTotal !== newTotal) {
      console.error(`Migration quantity mismatch: ${oldTotal} old vs ${newTotal} new`);
      return false;
    }
    
    // Check that no items were lost in conversion
    for (const [storageKey, quantity] of Object.entries(oldStorage)) {
      if (quantity <= 0) continue;
      
      const mapping = this.findMapping(storageKey);
      if (!mapping) {
        console.warn(`No mapping found for ${storageKey}, migration may be incomplete`);
        continue;
      }
      
      // Find corresponding items in new inventory
      const baseItem = getBaseItem(mapping.baseItemId);
      if (!baseItem) continue;
      
      const group = newInventory.groups.get(baseItem.category);
      if (!group) {
        console.error(`No group found for category ${baseItem.category}`);
        return false;
      }
      
      const slot = group.slots.find(s => s.baseItemId === mapping.baseItemId);
      if (!slot) {
        console.error(`No slot found for base item ${mapping.baseItemId}`);
        return false;
      }
      
      // Check that instances exist with migration metadata
      const migratedInstances = slot.stack.instances.filter(inst => 
        inst.metadata?.migratedFrom === storageKey
      );
      
      const migratedQuantity = migratedInstances.reduce((sum, inst) => sum + inst.quantity, 0);
      
      if (migratedQuantity !== quantity) {
        console.error(`Quantity mismatch for ${storageKey}: ${quantity} expected, ${migratedQuantity} found`);
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
export const legacyConverter = new LegacyStorageConverter();