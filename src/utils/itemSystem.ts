// Item System Utilities
// Core functions for creating and managing items in the unified system

import { 
  BaseItem, 
  ItemInstance, 
  ItemStack, 
  ItemTag, 
  CreateItemParams,
  ItemFilter,
  ItemSort
} from '../types';
import { baseItems, getBaseItem } from '../data/baseItems';
import { calculateTaggedQuality, calculateTaggedValue, getTagEffect } from '../data/itemTags';

// Core item creation function
export function createItemInstance(params: CreateItemParams): ItemInstance {
  const baseItem = getBaseItem(params.baseItemId);
  if (!baseItem) {
    throw new Error(`Invalid base item ID: ${params.baseItemId}`);
  }
  
  const tags = params.tags || [...baseItem.defaultTags];
  const baseQuality = params.quality || 85; // Default to 85% quality
  const quantity = params.quantity || 1;
  
  // Calculate final quality with tag effects
  const finalQuality = calculateTaggedQuality(baseQuality, tags);
  
  const instance: ItemInstance = {
    id: generateItemInstanceId(),
    baseItemId: params.baseItemId,
    tags,
    quality: finalQuality,
    quantity,
    acquiredAt: Date.now(), // TODO: Use game time when available
    lastModified: Date.now(),
    metadata: params.metadata || {}
  };
  
  return instance;
}

// Generate unique item instance ID
function generateItemInstanceId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Apply tag modifiers to an existing item
export function applyTagModifiers(instance: ItemInstance, newTags: ItemTag[]): ItemInstance {
  const baseItem = getBaseItem(instance.baseItemId);
  if (!baseItem) {
    throw new Error(`Invalid base item ID: ${instance.baseItemId}`);
  }
  
  // Merge new tags with existing ones (avoiding duplicates)
  const allTags = [...new Set([...instance.tags, ...newTags])];
  
  // Recalculate quality with new tags
  const newQuality = calculateTaggedQuality(instance.quality, allTags);
  
  return {
    ...instance,
    tags: allTags,
    quality: newQuality,
    lastModified: Date.now()
  };
}

// Calculate market value of an item instance
export function calculateMarketValue(instance: ItemInstance): number {
  const baseItem = getBaseItem(instance.baseItemId);
  if (!baseItem) {
    return 0;
  }
  
  return calculateTaggedValue(baseItem.baseValue, instance.quality, instance.tags);
}

// Get display name for an item instance including tags
export function getDisplayName(instance: ItemInstance): string {
  const baseItem = getBaseItem(instance.baseItemId);
  if (!baseItem) {
    return 'Unknown Item';
  }
  
  // Sort tags by importance for display
  const conditionTags = instance.tags.filter(tag => 
    [ItemTag.MILITARY_GRADE, ItemTag.HAND_FORGED, ItemTag.FORGED, ItemTag.RESTORED, ItemTag.JUNK, ItemTag.DAMAGED].includes(tag)
  );
  const materialTags = instance.tags.filter(tag => 
    [ItemTag.TITANIUM, ItemTag.COMPOSITE, ItemTag.PREMIUM, ItemTag.STANDARD, ItemTag.SALVAGED].includes(tag)
  );
  const specialTags = instance.tags.filter(tag => 
    [ItemTag.PROTOTYPE, ItemTag.CUSTOM, ItemTag.ANTIQUE].includes(tag)
  );
  
  const displayTags = [...specialTags, ...materialTags, ...conditionTags];
  
  if (displayTags.length === 0) {
    return baseItem.name;
  }
  
  // Format tags for display
  const tagText = displayTags
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).replace('_', ' '))
    .join(' ');
    
  return `${tagText} ${baseItem.name}`;
}

// Create an item stack from multiple instances of the same base item
export function createItemStack(instances: ItemInstance[]): ItemStack | null {
  if (instances.length === 0) {
    return null;
  }
  
  // Verify all instances are of the same base item
  const baseItemId = instances[0].baseItemId;
  if (!instances.every(instance => instance.baseItemId === baseItemId)) {
    throw new Error('Cannot create stack from instances of different base items');
  }
  
  const totalQuantity = instances.reduce((sum, instance) => sum + instance.quantity, 0);
  const weightedQuality = instances.reduce((sum, instance) => 
    sum + (instance.quality * instance.quantity), 0
  ) / totalQuantity;
  
  // Get all unique tags across all instances
  const uniqueTags = [...new Set(instances.flatMap(instance => instance.tags))];
  
  return {
    baseItemId,
    instances,
    totalQuantity,
    averageQuality: Math.round(weightedQuality),
    uniqueTags
  };
}

// Filter items based on criteria
export function filterItems(instances: ItemInstance[], filter: ItemFilter): ItemInstance[] {
  return instances.filter(instance => {
    const baseItem = getBaseItem(instance.baseItemId);
    if (!baseItem) return false;
    
    // Category filter
    if (filter.categories && !filter.categories.includes(baseItem.category)) {
      return false;
    }
    
    // Tag filter (item must have ALL specified tags)
    if (filter.tags && !filter.tags.every(tag => instance.tags.includes(tag))) {
      return false;
    }
    
    // Quality range filter
    if (filter.minQuality !== undefined && instance.quality < filter.minQuality) {
      return false;
    }
    if (filter.maxQuality !== undefined && instance.quality > filter.maxQuality) {
      return false;
    }
    
    // Text search filter
    if (filter.searchText) {
      const searchText = filter.searchText.toLowerCase();
      const displayName = getDisplayName(instance).toLowerCase();
      const description = baseItem.description.toLowerCase();
      
      if (!displayName.includes(searchText) && !description.includes(searchText)) {
        return false;
      }
    }
    
    return true;
  });
}

// Sort items based on criteria
export function sortItems(instances: ItemInstance[], sort: ItemSort): ItemInstance[] {
  return [...instances].sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'name':
        comparison = getDisplayName(a).localeCompare(getDisplayName(b));
        break;
      case 'quality':
        comparison = a.quality - b.quality;
        break;
      case 'value':
        comparison = calculateMarketValue(a) - calculateMarketValue(b);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'acquiredAt':
        comparison = a.acquiredAt - b.acquiredAt;
        break;
      default:
        comparison = 0;
    }
    
    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

// Combine compatible item instances (same base item and tags)
export function combineCompatibleItems(instances: ItemInstance[]): ItemInstance[] {
  if (instances.length === 0) return [];
  
  const groups = new Map<string, ItemInstance[]>();
  
  // Group instances by base item and tags
  for (const instance of instances) {
    const baseItem = getBaseItem(instance.baseItemId);
    if (!baseItem || !baseItem.stackable) {
      // Non-stackable items remain separate
      const key = instance.id;
      groups.set(key, [instance]);
      continue;
    }
    
    // For stackable items, group by base item + tags combination
    const tagsKey = [...instance.tags].sort().join(',');
    const key = `${instance.baseItemId}:${tagsKey}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(instance);
  }
  
  // Combine each group
  const combinedItems: ItemInstance[] = [];
  
  for (const group of groups.values()) {
    if (group.length === 1) {
      combinedItems.push(group[0]);
    } else {
      // Combine multiple instances into one
      const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
      const weightedQuality = group.reduce((sum, item) => 
        sum + (item.quality * item.quantity), 0
      ) / totalQuantity;
      
      const combinedItem: ItemInstance = {
        ...group[0], // Use first item as base
        quantity: totalQuantity,
        quality: Math.round(weightedQuality),
        lastModified: Date.now()
      };
      
      combinedItems.push(combinedItem);
    }
  }
  
  return combinedItems;
}

// Get quality description text
export function getQualityDescription(quality: number): string {
  if (quality >= 95) return 'Pristine';
  if (quality >= 85) return 'Excellent';
  if (quality >= 75) return 'Good';
  if (quality >= 60) return 'Fair';
  if (quality >= 45) return 'Poor';
  if (quality >= 25) return 'Damaged';
  return 'Broken';
}

// Get quality color class for UI
export function getQualityColorClass(quality: number): string {
  if (quality >= 90) return 'text-teal-400';
  if (quality >= 75) return 'text-green-400';
  if (quality >= 60) return 'text-yellow-400';
  if (quality >= 45) return 'text-orange-400';
  if (quality >= 25) return 'text-red-400';
  return 'text-gray-500';
}

// Validate item instance data
export function validateItemInstance(instance: ItemInstance): boolean {
  const baseItem = getBaseItem(instance.baseItemId);
  if (!baseItem) return false;
  
  if (instance.quality < 0 || instance.quality > 100) return false;
  if (instance.quantity <= 0) return false;
  
  // Check that all tags are valid
  for (const tag of instance.tags) {
    if (!Object.values(ItemTag).includes(tag)) {
      return false;
    }
  }
  
  return true;
}