// Facility Migration Utilities
// Converts facilities from legacy storage to new inventory system

import { Facility } from '../types';
import { inventoryManager } from './inventoryManager';
import { legacyConverter } from './legacyItemMigration';

export class FacilityMigrationManager {
  
  // Migrate a single facility to the new inventory system
  migrateFacility(facility: Facility): Facility {
    if (facility.inventory) {
      // Already migrated
      return facility;
    }
    
    // Create new inventory from legacy storage
    const newInventory = legacyConverter.convertLegacyStorage(facility.current_storage);
    
    // Set storage capacity based on facility storage_capacity
    newInventory.storageCapacity = facility.storage_capacity;
    
    // Validate migration
    const isValid = legacyConverter.validateMigration(facility.current_storage, newInventory);
    
    if (!isValid) {
      console.error(`Migration validation failed for facility: ${facility.name}`);
      // Return facility unchanged if migration fails
      return facility;
    }
    
    // Return facility with new inventory system
    const migratedFacility: Facility = {
      ...facility,
      inventory: newInventory,
      // Keep legacy storage for compatibility during transition
      current_storage: { ...facility.current_storage }
    };
    
    console.log(`Successfully migrated facility: ${facility.name}`);
    console.log(`- Legacy items: ${Object.keys(facility.current_storage).length}`);
    console.log(`- New inventory groups: ${newInventory.groups.size}`);
    console.log(`- Total items: ${newInventory.totalItems}`);
    console.log(`- Total value: ${newInventory.totalValue} credits`);
    
    return migratedFacility;
  }
  
  // Migrate all facilities in an array
  migrateAllFacilities(facilities: Facility[]): Facility[] {
    return facilities.map(facility => this.migrateFacility(facility));
  }
  
  // Check if a facility needs migration
  needsMigration(facility: Facility): boolean {
    return !facility.inventory && Object.keys(facility.current_storage).length > 0;
  }
  
  // Sync changes from legacy storage to new inventory (for transition period)
  syncLegacyToInventory(facility: Facility): Facility {
    if (!facility.inventory) {
      // No inventory to sync to, perform full migration
      return this.migrateFacility(facility);
    }
    
    // Compare legacy storage with current inventory to detect changes
    const currentLegacyStorage = this.extractLegacyStorageFromInventory(facility.inventory);
    const hasChanges = this.compareLegacyStorage(facility.current_storage, currentLegacyStorage);
    
    if (hasChanges) {
      // Re-migrate to incorporate changes
      console.log(`Detected changes in legacy storage for ${facility.name}, re-migrating...`);
      
      // Create fresh inventory from current legacy storage
      const updatedInventory = legacyConverter.convertLegacyStorage(facility.current_storage);
      updatedInventory.storageCapacity = facility.inventory.storageCapacity;
      
      return {
        ...facility,
        inventory: updatedInventory
      };
    }
    
    return facility;
  }
  
  // Extract legacy storage format from new inventory (for comparison)
  private extractLegacyStorageFromInventory(inventory: any): Record<string, number> {
    const legacyStorage: Record<string, number> = {};
    
    // This is a simplified extraction - in practice, we'd need to map
    // items back to their legacy storage keys based on tags and quality
    // For now, this serves as a placeholder for the migration transition period
    
    return legacyStorage;
  }
  
  // Compare two legacy storage objects
  private compareLegacyStorage(storage1: Record<string, number>, storage2: Record<string, number>): boolean {
    const keys1 = Object.keys(storage1);
    const keys2 = Object.keys(storage2);
    
    if (keys1.length !== keys2.length) return true;
    
    for (const key of keys1) {
      if (storage1[key] !== storage2[key]) return true;
    }
    
    return false;
  }
  
  // Get migration status for a facility
  getMigrationStatus(facility: Facility): {
    isMigrated: boolean;
    hasLegacyData: boolean;
    requiresSync: boolean;
    itemCount: number;
    inventoryValue: number;
  } {
    const hasLegacyData = Object.keys(facility.current_storage).length > 0;
    const isMigrated = !!facility.inventory;
    
    return {
      isMigrated,
      hasLegacyData,
      requiresSync: hasLegacyData && isMigrated,
      itemCount: facility.inventory?.totalItems || 0,
      inventoryValue: facility.inventory?.totalValue || 0
    };
  }
  
  // Create a facility with both legacy and new inventory systems initialized
  initializeDualSystemFacility(legacyStorage: Record<string, number>, storageCapacity: number = 1000): {
    legacyStorage: Record<string, number>;
    inventory: any;
  } {
    const inventory = legacyConverter.convertLegacyStorage(legacyStorage);
    inventory.storageCapacity = storageCapacity;
    
    return {
      legacyStorage: { ...legacyStorage },
      inventory
    };
  }
  
  // Gradually remove legacy storage once migration is complete and tested
  removeLegacyStorage(facility: Facility): Facility {
    if (!facility.inventory) {
      console.warn(`Cannot remove legacy storage from ${facility.name}: no new inventory system present`);
      return facility;
    }
    
    console.log(`Removing legacy storage from ${facility.name}`);
    
    return {
      ...facility,
      current_storage: {} // Clear legacy storage
    };
  }
  
  // Validate facility inventory integrity
  validateFacilityInventory(facility: Facility): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!facility.inventory) {
      errors.push('No inventory system present');
      return { isValid: false, errors, warnings };
    }
    
    // Check inventory consistency
    let calculatedTotal = 0;
    let calculatedValue = 0;
    
    for (const group of facility.inventory.groups.values()) {
      calculatedTotal += group.totalItems;
      calculatedValue += group.totalValue;
      
      // Validate each slot
      for (const slot of group.slots) {
        const slotTotal = slot.stack.instances.reduce((sum, inst) => sum + inst.quantity, 0);
        if (slotTotal !== slot.stack.totalQuantity) {
          errors.push(`Slot ${slot.baseItemId}: calculated total ${slotTotal} != stored total ${slot.stack.totalQuantity}`);
        }
        
        if (slot.available + slot.reserved !== slot.stack.totalQuantity) {
          warnings.push(`Slot ${slot.baseItemId}: available + reserved != total quantity`);
        }
      }
    }
    
    if (calculatedTotal !== facility.inventory.totalItems) {
      errors.push(`Calculated total items ${calculatedTotal} != stored total ${facility.inventory.totalItems}`);
    }
    
    if (Math.abs(calculatedValue - facility.inventory.totalValue) > 1) {
      warnings.push(`Calculated value ${calculatedValue} != stored value ${facility.inventory.totalValue}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const facilityMigrationManager = new FacilityMigrationManager();