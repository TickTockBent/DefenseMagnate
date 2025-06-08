// Base Items Database
// Standardized item definitions for unified material system

import { BaseItem, ItemCategory, ItemManufacturingType, ItemTag } from '../types';

export const baseItems: Record<string, BaseItem> = {
  // Raw Materials - Tier 1: Cannot be disassembled
  steel: {
    id: 'steel',
    name: 'Steel',
    category: ItemCategory.MATERIAL,
    baseValue: 12,
    description: 'High-strength carbon steel alloy, primary construction material',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum',
    category: ItemCategory.MATERIAL,
    baseValue: 8,
    description: 'Lightweight aluminum alloy, corrosion resistant',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  plastic: {
    id: 'plastic',
    name: 'Polymer Plastic',
    category: ItemCategory.MATERIAL,
    baseValue: 3,
    description: 'High-density polymer plastic for grips and housings',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  titanium: {
    id: 'titanium',
    name: 'Titanium',
    category: ItemCategory.MATERIAL,
    baseValue: 45,
    description: 'Premium titanium alloy, exceptional strength-to-weight ratio',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  // Electronic Components - Tier 2: Shaped materials
  basic_electronics: {
    id: 'basic_electronics',
    name: 'Basic Electronics',
    category: ItemCategory.COMPONENT,
    baseValue: 15,
    description: 'Basic electronic components and circuitry',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'industrial_chemicals'
  },
  
  advanced_electronics: {
    id: 'advanced_electronics',
    name: 'Advanced Electronics',
    category: ItemCategory.COMPONENT,
    baseValue: 65,
    description: 'Sophisticated electronic systems and targeting components',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'industrial_chemicals'
  },
  
  // Mechanical Components - Tier 2: Shaped materials
  machined_parts: {
    id: 'machined_parts',
    name: 'Machined Parts',
    category: ItemCategory.COMPONENT,
    baseValue: 25,
    description: 'Precision machined mechanical components',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'steel'
  },
  
  low_tech_spares: {
    id: 'low_tech_spares',
    name: 'Low-Tech Spares',
    category: ItemCategory.COMPONENT,
    baseValue: 8,
    description: 'Simple mechanical parts and hardware',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'steel'
  },
  
  precision_spares: {
    id: 'precision_spares',
    name: 'Precision Spares',
    category: ItemCategory.COMPONENT,
    baseValue: 35,
    description: 'High-precision mechanical components',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'steel'
  },
  
  // Manufacturing v2 Clean Hierarchy - Tier 2: Shaped Materials
  
  // Basic intermediate materials from raw materials
  'small-steel-billet': {
    id: 'small-steel-billet',
    name: 'Small Steel Billet',
    category: ItemCategory.COMPONENT,
    baseValue: 2,
    description: 'Small formed steel billet ready for machining',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'steel'
  },
  
  'small-steel-cylinder': {
    id: 'small-steel-cylinder',
    name: 'Small Steel Cylinder',
    category: ItemCategory.COMPONENT,
    baseValue: 2,
    description: 'Small turned steel cylinder for further processing',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'steel'
  },
  
  // Processed components from intermediate materials
  'mechanical-component': {
    id: 'mechanical-component',
    name: 'Mechanical Component',
    category: ItemCategory.COMPONENT,
    baseValue: 5,
    description: 'Basic mechanical component with rough finishing',
    stackable: true,
    defaultTags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'small-steel-billet'
  },
  
  'small-tube': {
    id: 'small-tube',
    name: 'Small Tube',
    category: ItemCategory.COMPONENT,
    baseValue: 8,
    description: 'Small bored tube for mechanical assemblies',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'small-steel-cylinder'
  },
  
  'small-casing': {
    id: 'small-casing',
    name: 'Small Casing',
    category: ItemCategory.COMPONENT,
    baseValue: 3,
    description: 'Small plastic casing for external protection',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.SHAPED_MATERIAL,
    materialSource: 'plastic'
  },
  
  // Manufacturing v2 Clean Hierarchy - Tier 3: Assemblies
  
  'mechanical-assembly': {
    id: 'mechanical-assembly',
    name: 'Mechanical Assembly',
    category: ItemCategory.COMPONENT,
    baseValue: 60,
    description: 'Assembly of mechanical components with low-tech finish',
    stackable: true,
    defaultTags: [ItemTag.LOW_TECH],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'mechanical-component', quantity: 10, requiredTags: [ItemTag.ROUGH, ItemTag.LOW_TECH] }
    ]
  },
  
  basic_sidearm: {
    id: 'basic_sidearm',
    name: 'Basic Sidearm',
    category: ItemCategory.PRODUCT,
    baseValue: 180,
    description: 'Standard-issue sidearm pistol with low-tech components',
    stackable: false,
    defaultTags: [ItemTag.LOW_TECH],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'mechanical-assembly', quantity: 1, requiredTags: [ItemTag.LOW_TECH] },
      { componentId: 'small-tube', quantity: 1 },
      { componentId: 'small-casing', quantity: 1 }
    ]
  },
  
  // Legacy materials for migration support
  'plastic-scrap': {
    id: 'plastic-scrap',
    name: 'Plastic Scrap',
    category: ItemCategory.MATERIAL,
    baseValue: 1,
    description: 'Recovered plastic fragments from disassembly',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  'steel-scrap': {
    id: 'steel-scrap',
    name: 'Steel Scrap',
    category: ItemCategory.MATERIAL,
    baseValue: 4,
    description: 'Recovered steel fragments from disassembly',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  tactical_knife: {
    id: 'tactical_knife',
    name: 'Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 85,
    description: 'Military-grade combat knife with versatile blade design',
    stackable: false,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'blade-finished', quantity: 1 },
      { componentId: 'knife-handle', quantity: 1 }
    ]
  },
  
  heavy_rifle: {
    id: 'heavy_rifle',
    name: 'Heavy Rifle',
    category: ItemCategory.PRODUCT,
    baseValue: 650,
    description: 'High-powered military rifle for long-range combat',
    stackable: false,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'heavy-barrel', quantity: 1 },
      { componentId: 'rifle-assembly', quantity: 1 },
      { componentId: 'composite-stock', quantity: 1 }
    ]
  },
  
  // Legacy Damaged Items (for restoration methods) - Tier 3: Assemblies with damaged condition
  damaged_basic_sidearm: {
    id: 'damaged_basic_sidearm',
    name: 'Damaged Basic Sidearm',
    category: ItemCategory.PRODUCT,
    baseValue: 25,
    description: 'Broken sidearm requiring restoration to functional condition',
    stackable: false,
    defaultTags: [ItemTag.DAMAGED],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'mechanical-assembly', quantity: 1, requiredTags: [ItemTag.ASSEMBLY, ItemTag.DAMAGED] },
      { componentId: 'plastic-scrap', quantity: 1, requiredTags: [ItemTag.SALVAGED] }
    ]
  },
  
  damaged_tactical_knife: {
    id: 'damaged_tactical_knife',
    name: 'Damaged Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 12,
    description: 'Damaged knife with chipped blade, needs restoration',
    stackable: false,
    defaultTags: [ItemTag.DAMAGED],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'blade-damaged', quantity: 1 },
      { componentId: 'knife-handle', quantity: 1 }
    ]
  },
  
  dull_tactical_knife: {
    id: 'dull_tactical_knife',
    name: 'Dull Tactical Knife',
    category: ItemCategory.PRODUCT,
    baseValue: 35,
    description: 'Functional knife with dull edge, needs sharpening',
    stackable: false,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.ASSEMBLY,
    assemblyComponents: [
      { componentId: 'blade-dull', quantity: 1 },
      { componentId: 'knife-handle', quantity: 1 }
    ]
  },
  
  // Composite Materials - Tier 1: Raw materials
  composite_materials: {
    id: 'composite_materials',
    name: 'Composite Materials',
    category: ItemCategory.MATERIAL,
    baseValue: 28,
    description: 'Advanced composite materials for specialized applications',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
  },
  
  // Chemical Compounds - Tier 1: Raw materials
  industrial_chemicals: {
    id: 'industrial_chemicals',
    name: 'Industrial Chemicals',
    category: ItemCategory.MATERIAL,
    baseValue: 18,
    description: 'Chemical compounds for manufacturing processes',
    stackable: true,
    defaultTags: [],
    manufacturingType: ItemManufacturingType.RAW_MATERIAL
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