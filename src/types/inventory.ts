// Inventory System Types
// New grouped inventory system to replace simple storage dictionaries

import { ItemCategory, ItemInstance, ItemStack, ItemFilter, ItemSort } from './items';

export interface InventorySlot {
  baseItemId: string;           // Base item type this slot contains
  stack: ItemStack;             // Grouped instances of this item type
  reserved: number;             // Quantity reserved for active jobs/contracts
  available: number;            // Quantity available for use
}

export interface InventoryGroup {
  category: ItemCategory;       // Material, Product, or Component
  slots: InventorySlot[];       // All inventory slots in this category
  totalItems: number;           // Total items across all slots in category
  totalValue: number;           // Total estimated value of items in category
}

export interface FacilityInventory {
  groups: Map<ItemCategory, InventoryGroup>; // Organized by category
  totalItems: number;           // Total items across all categories
  totalValue: number;           // Total estimated value of entire inventory
  lastUpdated: number;          // Game time when inventory was last modified
  storageCapacity: number;      // Maximum items that can be stored
  usedCapacity: number;         // Current items stored
}

export interface InventoryOperation {
  type: 'add' | 'remove' | 'move' | 'modify';
  itemInstanceId: string;
  quantity?: number;
  fromSlot?: string;            // For move operations
  toSlot?: string;              // For move operations
  newTags?: string[];           // For modify operations
  newQuality?: number;          // For modify operations
}

export interface InventorySearchResult {
  slot: InventorySlot;
  instances: ItemInstance[];
  totalQuantity: number;
  averageQuality: number;
  bestQuality: number;
  worstQuality: number;
}

export interface InventoryView {
  filter: ItemFilter;
  sort: ItemSort;
  groupBy: 'category' | 'tag' | 'quality' | 'none';
  showEmpty: boolean;           // Show slots with zero quantity
  expandedGroups: Set<string>;  // Which groups are expanded in UI
}

// Inventory management functions interface
export interface InventoryManager {
  // Core operations
  addItem(inventory: FacilityInventory, item: ItemInstance): boolean;
  removeItem(inventory: FacilityInventory, itemInstanceId: string, quantity?: number): boolean;
  moveItem(inventory: FacilityInventory, fromSlot: string, toSlot: string, quantity: number): boolean;
  
  // Search and filter
  findItems(inventory: FacilityInventory, filter: ItemFilter): InventorySearchResult[];
  getAvailableQuantity(inventory: FacilityInventory, baseItemId: string, filter?: ItemFilter): number;
  getBestQualityItems(inventory: FacilityInventory, baseItemId: string, quantity: number): ItemInstance[];
  
  // Utility functions
  calculateInventoryValue(inventory: FacilityInventory): number;
  getInventoryUsage(inventory: FacilityInventory): { used: number; capacity: number; percentage: number };
  optimizeStorage(inventory: FacilityInventory): InventoryOperation[];
  
  // Reservation system (for jobs and contracts)
  reserveItems(inventory: FacilityInventory, baseItemId: string, quantity: number, reservationId: string): boolean;
  releaseReservation(inventory: FacilityInventory, reservationId: string): void;
  getReservedQuantity(inventory: FacilityInventory, baseItemId: string): number;
}

// Legacy storage conversion
export interface LegacyStorageConverter {
  convertLegacyStorage(oldStorage: Record<string, number>): FacilityInventory;
  migrateStorageData(oldStorage: Record<string, number>, targetInventory: FacilityInventory): void;
  validateMigration(oldStorage: Record<string, number>, newInventory: FacilityInventory): boolean;
}