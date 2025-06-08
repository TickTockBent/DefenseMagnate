// Base Items Database
// Standardized item definitions for unified material system

import { BaseItem, ItemCategory } from '../types';

export const baseItems: Record<string, BaseItem> = {
  // Raw Materials
  steel: {
    id: 'steel',
    name: 'Steel',
    category: ItemCategory.MATERIAL,
    baseValue: 12,
    description: 'High-strength carbon steel alloy, primary construction material',
    stackable: true,
    defaultTags: []
  },
  
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum',
    category: ItemCategory.MATERIAL,
    baseValue: 8,
    description: 'Lightweight aluminum alloy, corrosion resistant',
    stackable: true,
    defaultTags: []
  },
  
  plastic: {
    id: 'plastic',
    name: 'Polymer Plastic',
    category: ItemCategory.MATERIAL,
    baseValue: 3,
    description: 'High-density polymer plastic for grips and housings',
    stackable: true,
    defaultTags: []
  },
  
  titanium: {
    id: 'titanium',
    name: 'Titanium',
    category: ItemCategory.MATERIAL,
    baseValue: 45,
    description: 'Premium titanium alloy, exceptional strength-to-weight ratio',
    stackable: true,
    defaultTags: []
  },
  
  // Electronic Components
  basic_electronics: {
    id: 'basic_electronics',
    name: 'Basic Electronics',
    category: ItemCategory.COMPONENT,
    baseValue: 15,
    description: 'Basic electronic components and circuitry',
    stackable: true,
    defaultTags: []
  },
  
  advanced_electronics: {
    id: 'advanced_electronics',
    name: 'Advanced Electronics',
    category: ItemCategory.COMPONENT,
    baseValue: 65,
    description: 'Sophisticated electronic systems and targeting components',
    stackable: true,
    defaultTags: []
  },
  
  // Mechanical Components
  machined_parts: {
    id: 'machined_parts',
    name: 'Machined Parts',
    category: ItemCategory.COMPONENT,
    baseValue: 25,
    description: 'Precision machined mechanical components',
    stackable: true,
    defaultTags: []
  },
  
  low_tech_spares: {
    id: 'low_tech_spares',
    name: 'Low-Tech Spares',
    category: ItemCategory.COMPONENT,
    baseValue: 8,
    description: 'Simple mechanical parts and hardware',
    stackable: true,
    defaultTags: []
  },
  
  precision_spares: {
    id: 'precision_spares',
    name: 'Precision Spares',
    category: ItemCategory.COMPONENT,
    baseValue: 35,
    description: 'High-precision mechanical components',
    stackable: true,
    defaultTags: []
  },
  
  // NEW: Component-based manufacturing items
  'mechanical-component': {
    id: 'mechanical-component',
    name: 'Mechanical Component',
    category: ItemCategory.COMPONENT,
    baseValue: 5,
    description: 'Basic mechanical component differentiated by manufacturing state',
    stackable: true,
    defaultTags: []
  },
  
  'mechanical-assembly': {
    id: 'mechanical-assembly',
    name: 'Mechanical Assembly',
    category: ItemCategory.COMPONENT,
    baseValue: 50,
    description: 'Combined mechanical components forming a sub-assembly',
    stackable: true,
    defaultTags: []
  },
  
  'plastic-casing': {
    id: 'plastic-casing',
    name: 'Plastic Casing',
    category: ItemCategory.COMPONENT,
    baseValue: 10,
    description: 'Molded plastic housing for external protection',
    stackable: true,
    defaultTags: []
  },
  
  // Scrap materials from restoration
  'plastic-scrap': {
    id: 'plastic-scrap',
    name: 'Plastic Scrap',
    category: ItemCategory.MATERIAL,
    baseValue: 1,
    description: 'Recovered plastic fragments from disassembly',
    stackable: true,
    defaultTags: []
  },
  
  'steel-scrap': {
    id: 'steel-scrap',
    name: 'Steel Scrap',
    category: ItemCategory.MATERIAL,
    baseValue: 4,
    description: 'Recovered steel fragments from disassembly',
    stackable: true,
    defaultTags: []
  },
  
  // Finished Products
  basic_sidearm: {
    id: 'basic_sidearm',
    name: 'Basic Sidearm',
    category: ItemCategory.PRODUCT,
    baseValue: 180,
    description: 'Standard-issue sidearm pistol, reliable and effective',
    stackable: false,
    defaultTags: []
  },
  
  tactical_knife: {
    id: 'tactical_knife',
    name: 'Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 85,
    description: 'Military-grade combat knife with versatile blade design',
    stackable: false,
    defaultTags: []
  },
  
  heavy_rifle: {
    id: 'heavy_rifle',
    name: 'Heavy Rifle',
    category: ItemCategory.PRODUCT,
    baseValue: 650,
    description: 'High-powered military rifle for long-range combat',
    stackable: false,
    defaultTags: []
  },
  
  // Legacy Damaged Items (for restoration methods)
  damaged_basic_sidearm: {
    id: 'damaged_basic_sidearm',
    name: 'Damaged Basic Sidearm',
    category: ItemCategory.PRODUCT,
    baseValue: 25,
    description: 'Broken sidearm requiring restoration to functional condition',
    stackable: false,
    defaultTags: []
  },
  
  damaged_tactical_knife: {
    id: 'damaged_tactical_knife',
    name: 'Damaged Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 12,
    description: 'Damaged knife with chipped blade, needs restoration',
    stackable: false,
    defaultTags: []
  },
  
  dull_tactical_knife: {
    id: 'dull_tactical_knife',
    name: 'Dull Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 35,
    description: 'Functional knife with dull edge, needs sharpening',
    stackable: false,
    defaultTags: []
  },
  
  // Composite Materials
  composite_materials: {
    id: 'composite_materials',
    name: 'Composite Materials',
    category: ItemCategory.MATERIAL,
    baseValue: 28,
    description: 'Advanced composite materials for specialized applications',
    stackable: true,
    defaultTags: []
  },
  
  // Chemical Compounds
  industrial_chemicals: {
    id: 'industrial_chemicals',
    name: 'Industrial Chemicals',
    category: ItemCategory.MATERIAL,
    baseValue: 18,
    description: 'Chemical compounds for manufacturing processes',
    stackable: true,
    defaultTags: []
  }
};

// Helper functions for working with base items
export function getBaseItem(itemId: string): BaseItem | undefined {
  return baseItems[itemId];
}

export function getItemsByCategory(category: ItemCategory): BaseItem[] {
  return Object.values(baseItems).filter(item => item.category === category);
}

export function getMaterials(): BaseItem[] {
  return getItemsByCategory(ItemCategory.MATERIAL);
}

export function getProducts(): BaseItem[] {
  return getItemsByCategory(ItemCategory.PRODUCT);
}

export function getComponents(): BaseItem[] {
  return getItemsByCategory(ItemCategory.COMPONENT);
}

// Validation helper
export function isValidBaseItemId(itemId: string): boolean {
  return itemId in baseItems;
}