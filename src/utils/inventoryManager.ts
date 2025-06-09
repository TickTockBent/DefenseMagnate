// Inventory Manager
// Core operations for the new grouped inventory system

import {
  FacilityInventory,
  InventorySlot,
  InventoryGroup,
  ItemInstance,
  ItemCategory,
  ItemFilter,
  InventorySearchResult,
  InventoryOperation,
  ItemTag
} from '../types';
import { baseItems, getBaseItem } from '../data/baseItems';
import { createItemInstance, calculateMarketValue, combineCompatibleItems } from './itemSystem';

export class InventoryManager {
  
  // Create empty inventory
  createEmptyInventory(storageCapacity: number = 1000): FacilityInventory {
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
    
    return {
      groups,
      totalItems: 0,
      totalValue: 0,
      lastUpdated: Date.now(),
      storageCapacity,
      usedCapacity: 0
    };
  }
  
  // Add item to inventory
  addItem(inventory: FacilityInventory, item: ItemInstance): boolean {
    const baseItem = getBaseItem(item.baseItemId);
    if (!baseItem) {
      console.error(`Invalid base item ID: ${item.baseItemId}`);
      return false;
    }
    
    // Check capacity
    if (inventory.usedCapacity + item.quantity > inventory.storageCapacity) {
      console.warn('Insufficient storage capacity');
      return false;
    }
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) {
      console.error(`No group found for category: ${baseItem.category}`);
      return false;
    }
    
    // Find existing slot for this base item
    let slot = group.slots.find(s => s.baseItemId === item.baseItemId);
    
    if (!slot) {
      // Create new slot
      slot = this.createEmptySlot(item.baseItemId);
      group.slots.push(slot);
    }
    
    // For stackable items, try to combine with existing instances
    if (baseItem.stackable) {
      const compatibleInstance = slot.stack.instances.find(inst => 
        this.areInstancesCompatible(inst, item)
      );
      
      if (compatibleInstance) {
        // Combine with existing instance
        compatibleInstance.quantity += item.quantity;
        compatibleInstance.lastModified = Date.now();
      } else {
        // Add as new instance
        slot.stack.instances.push(item);
      }
    } else {
      // Non-stackable items are always added separately
      slot.stack.instances.push(item);
    }
    
    // Update calculated fields
    this.updateSlotTotals(slot);
    this.updateGroupTotals(group);
    this.updateInventoryTotals(inventory);
    
    inventory.lastUpdated = Date.now();
    return true;
  }
  
  // Remove item from inventory
  removeItem(inventory: FacilityInventory, itemInstanceId: string, quantity?: number): boolean {
    // Find the item instance
    const location = this.findItemInstance(inventory, itemInstanceId);
    if (!location) {
      console.error(`Item instance not found: ${itemInstanceId}`);
      return false;
    }
    
    const { group, slot, instance } = location;
    const removeQuantity = quantity || instance.quantity;
    
    if (removeQuantity > instance.quantity) {
      console.error(`Cannot remove ${removeQuantity}, only ${instance.quantity} available`);
      return false;
    }
    
    if (removeQuantity === instance.quantity) {
      // Remove entire instance
      slot.stack.instances = slot.stack.instances.filter(inst => inst.id !== itemInstanceId);
      
      // If slot is now empty, remove it
      if (slot.stack.instances.length === 0) {
        group.slots = group.slots.filter(s => s.baseItemId !== slot.baseItemId);
      }
    } else {
      // Reduce quantity
      instance.quantity -= removeQuantity;
      instance.lastModified = Date.now();
    }
    
    // Update calculated fields
    this.updateSlotTotals(slot);
    this.updateGroupTotals(group);
    this.updateInventoryTotals(inventory);
    
    inventory.lastUpdated = Date.now();
    return true;
  }
  
  // Move item between slots (for reorganization)
  moveItem(inventory: FacilityInventory, fromSlot: string, toSlot: string, quantity: number): boolean {
    // Implementation would depend on specific slot identification scheme
    // For now, this is a placeholder
    console.log('Move item operation not yet implemented');
    return false;
  }
  
  // Find items matching filter criteria
  findItems(inventory: FacilityInventory, filter: ItemFilter): InventorySearchResult[] {
    const results: InventorySearchResult[] = [];
    
    for (const group of inventory.groups.values()) {
      // Category filter
      if (filter.categories && !filter.categories.includes(group.category)) {
        continue;
      }
      
      for (const slot of group.slots) {
        const baseItem = getBaseItem(slot.baseItemId);
        if (!baseItem) continue;
        
        // Filter instances in this slot
        const matchingInstances = slot.stack.instances.filter(instance => {
          // Tag filter
          if (filter.tags && !filter.tags.every(tag => instance.tags.includes(tag))) {
            return false;
          }
          
          // Quality filter
          if (filter.minQuality !== undefined && instance.quality < filter.minQuality) {
            return false;
          }
          if (filter.maxQuality !== undefined && instance.quality > filter.maxQuality) {
            return false;
          }
          
          // Text search
          if (filter.searchText) {
            const searchText = filter.searchText.toLowerCase();
            const name = baseItem.name.toLowerCase();
            const description = baseItem.description.toLowerCase();
            
            if (!name.includes(searchText) && !description.includes(searchText)) {
              return false;
            }
          }
          
          return true;
        });
        
        if (matchingInstances.length > 0) {
          const totalQuantity = matchingInstances.reduce((sum, inst) => sum + inst.quantity, 0);
          const qualities = matchingInstances.map(inst => inst.quality);
          
          results.push({
            slot,
            instances: matchingInstances,
            totalQuantity,
            averageQuality: Math.round(
              matchingInstances.reduce((sum, inst) => sum + inst.quality * inst.quantity, 0) / totalQuantity
            ),
            bestQuality: Math.max(...qualities),
            worstQuality: Math.min(...qualities)
          });
        }
      }
    }
    
    return results;
  }
  
  // Get available quantity of a specific item
  getAvailableQuantity(inventory: FacilityInventory, baseItemId: string, filter?: ItemFilter): number {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return 0;
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return 0;
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    if (!slot) return 0;
    
    if (!filter) {
      return slot.available;
    }
    
    // Apply filter to get specific quantity
    const searchResults = this.findItems(inventory, {
      ...filter,
      categories: [baseItem.category]
    });
    
    const matchingSlot = searchResults.find(result => result.slot.baseItemId === baseItemId);
    return matchingSlot?.totalQuantity || 0;
  }
  
  // Get available quantity of items with specific tags and quality constraints
  getAvailableQuantityWithTags(inventory: FacilityInventory, baseItemId: string, requiredTags: ItemTag[], maxQuality?: number): number {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return 0;
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return 0;
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    if (!slot) return 0;
    
    // Sum quantities of instances that have all required tags and meet quality constraints
    return slot.stack.instances
      .filter(instance => {
        const hasRequiredTags = requiredTags.every(tag => instance.tags.includes(tag));
        const meetsQualityConstraint = maxQuality === undefined || instance.quality <= maxQuality;
        return hasRequiredTags && meetsQualityConstraint;
      })
      .reduce((sum, instance) => sum + instance.quantity, 0);
  }
  
  // Get best quality items with specific tags up to specified quantity
  getBestQualityItemsWithTags(inventory: FacilityInventory, baseItemId: string, quantity: number, requiredTags: ItemTag[], maxQuality?: number): ItemInstance[] {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return [];
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return [];
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    if (!slot) return [];
    
    // Filter instances that have all required tags and meet quality constraints, then sort by quality (highest first)
    const matchingInstances = slot.stack.instances
      .filter(instance => {
        const hasRequiredTags = requiredTags.every(tag => instance.tags.includes(tag));
        const meetsQualityConstraint = maxQuality === undefined || instance.quality <= maxQuality;
        return hasRequiredTags && meetsQualityConstraint;
      })
      .sort((a, b) => b.quality - a.quality);
    
    // Collect items up to the required quantity
    const result: ItemInstance[] = [];
    let remainingNeeded = quantity;
    
    for (const instance of matchingInstances) {
      if (remainingNeeded <= 0) break;
      
      const takeQuantity = Math.min(instance.quantity, remainingNeeded);
      if (takeQuantity > 0) {
        result.push({
          ...instance,
          quantity: takeQuantity
        });
        remainingNeeded -= takeQuantity;
      }
    }
    
    return result;
  }
  
  // Get best quality items up to specified quantity
  getBestQualityItems(inventory: FacilityInventory, baseItemId: string, quantity: number): ItemInstance[] {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return [];
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return [];
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    if (!slot) return [];
    
    // Sort instances by quality (descending)
    const sortedInstances = [...slot.stack.instances].sort((a, b) => b.quality - a.quality);
    
    const selectedItems: ItemInstance[] = [];
    let remainingQuantity = quantity;
    
    for (const instance of sortedInstances) {
      if (remainingQuantity <= 0) break;
      
      const takeQuantity = Math.min(instance.quantity, remainingQuantity);
      
      if (takeQuantity === instance.quantity) {
        selectedItems.push(instance);
      } else {
        // Create partial instance
        selectedItems.push({
          ...instance,
          id: `${instance.id}-partial-${Date.now()}`,
          quantity: takeQuantity,
          lastModified: Date.now()
        });
      }
      
      remainingQuantity -= takeQuantity;
    }
    
    return selectedItems;
  }
  
  // Calculate total inventory value
  calculateInventoryValue(inventory: FacilityInventory): number {
    let totalValue = 0;
    
    for (const group of inventory.groups.values()) {
      for (const slot of group.slots) {
        for (const instance of slot.stack.instances) {
          totalValue += calculateMarketValue(instance) * instance.quantity;
        }
      }
    }
    
    return totalValue;
  }
  
  // Get inventory usage statistics
  getInventoryUsage(inventory: FacilityInventory): { used: number; capacity: number; percentage: number } {
    return {
      used: inventory.usedCapacity,
      capacity: inventory.storageCapacity,
      percentage: Math.round((inventory.usedCapacity / inventory.storageCapacity) * 100)
    };
  }

  // Get all items in inventory as a flat array
  getAllItems(inventory: FacilityInventory): ItemInstance[] {
    const allItems: ItemInstance[] = [];
    
    for (const group of inventory.groups.values()) {
      for (const slot of group.slots) {
        allItems.push(...slot.stack.instances);
      }
    }
    
    return allItems;
  }
  
  // Optimize storage by combining compatible items
  optimizeStorage(inventory: FacilityInventory): InventoryOperation[] {
    const operations: InventoryOperation[] = [];
    
    for (const group of inventory.groups.values()) {
      for (const slot of group.slots) {
        const originalCount = slot.stack.instances.length;
        slot.stack.instances = combineCompatibleItems(slot.stack.instances);
        
        if (slot.stack.instances.length < originalCount) {
          // Record optimization operation
          operations.push({
            type: 'modify',
            itemInstanceId: slot.baseItemId,
            fromSlot: slot.baseItemId,
            toSlot: slot.baseItemId
          });
        }
        
        this.updateSlotTotals(slot);
      }
      
      this.updateGroupTotals(group);
    }
    
    this.updateInventoryTotals(inventory);
    return operations;
  }
  
  // Reserve items for jobs and contracts
  reserveItems(inventory: FacilityInventory, baseItemId: string, quantity: number, reservationId: string): boolean {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return false;
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return false;
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    if (!slot) return false;
    
    if (slot.available < quantity) return false;
    
    slot.reserved += quantity;
    slot.available = slot.stack.totalQuantity - slot.reserved;
    
    // TODO: Track reservation ID for later release
    inventory.lastUpdated = Date.now();
    return true;
  }
  
  // Release reservation
  releaseReservation(inventory: FacilityInventory, reservationId: string): void {
    // TODO: Implement reservation tracking and release
    console.log(`Release reservation: ${reservationId}`);
  }
  
  // Get reserved quantity for an item
  getReservedQuantity(inventory: FacilityInventory, baseItemId: string): number {
    const baseItem = getBaseItem(baseItemId);
    if (!baseItem) return 0;
    
    const group = inventory.groups.get(baseItem.category);
    if (!group) return 0;
    
    const slot = group.slots.find(s => s.baseItemId === baseItemId);
    return slot?.reserved || 0;
  }
  
  // Helper methods
  
  private createEmptySlot(baseItemId: string): InventorySlot {
    return {
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
  }
  
  private areInstancesCompatible(a: ItemInstance, b: ItemInstance): boolean {
    if (a.baseItemId !== b.baseItemId) return false;
    if (a.tags.length !== b.tags.length) return false;
    
    // Check if all tags match
    const aTagsSet = new Set(a.tags);
    const bTagsSet = new Set(b.tags);
    
    for (const tag of aTagsSet) {
      if (!bTagsSet.has(tag)) return false;
    }
    
    // Check quality compatibility (within 10% range)
    const qualityDiff = Math.abs(a.quality - b.quality);
    if (qualityDiff > 10) return false;
    
    return true;
  }
  
  private findItemInstance(inventory: FacilityInventory, itemInstanceId: string): {
    group: InventoryGroup;
    slot: InventorySlot;
    instance: ItemInstance;
  } | null {
    for (const group of inventory.groups.values()) {
      for (const slot of group.slots) {
        for (const instance of slot.stack.instances) {
          if (instance.id === itemInstanceId) {
            return { group, slot, instance };
          }
        }
      }
    }
    return null;
  }
  
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
  
  private updateGroupTotals(group: InventoryGroup): void {
    group.totalItems = group.slots.reduce((sum, slot) => sum + slot.stack.totalQuantity, 0);
    
    group.totalValue = group.slots.reduce((sum, slot) => {
      return sum + slot.stack.instances.reduce((slotSum, instance) => 
        slotSum + (calculateMarketValue(instance) * instance.quantity), 0
      );
    }, 0);
  }
  
  private updateInventoryTotals(inventory: FacilityInventory): void {
    inventory.totalItems = 0;
    inventory.totalValue = 0;
    
    for (const group of inventory.groups.values()) {
      inventory.totalItems += group.totalItems;
      inventory.totalValue += group.totalValue;
    }
    
    inventory.usedCapacity = inventory.totalItems;
  }
}

// Export singleton instance
export const inventoryManager = new InventoryManager();