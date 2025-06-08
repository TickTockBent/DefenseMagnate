// Equipment definitions for the tag-based manufacturing system

import { Equipment, EquipmentTier, TagCategory } from '../types';

// Helper function to create equipment
function createEquipment(partial: Partial<Equipment> & Pick<Equipment, 'id' | 'name' | 'tags'>): Equipment {
  return {
    description: '',
    tier: EquipmentTier.BASIC,
    footprint: 0,
    powerRequirement: 0,
    purchaseCost: 0,
    installationCost: 0,
    dailyOperatingCost: 0,
    condition: {
      current: 100,
      degradationRate: 0.5,
      maintenanceCost: 10,
      failureThreshold: 20
    },
    ...partial
  };
}

// Basic Hand Tools
export const handToolsBasic = createEquipment({
  id: 'hand_tools_basic',
  name: 'Basic Hand Tools',
  description: 'Essential hand tools for simple assembly and repair work',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.BASIC_MANIPULATION, value: 10, unit: '%' },
    { category: TagCategory.MANUAL, value: true }
  ],
  footprint: 0, // Stored in toolbox
  purchaseCost: 200,
  dailyOperatingCost: 0
});

export const handToolsPrecision = createEquipment({
  id: 'hand_tools_precision',
  name: 'Precision Hand Tools',
  description: 'High-quality hand tools for detailed work',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.BASIC_MANIPULATION, value: 15, unit: '%' },
    { category: TagCategory.PRECISION_MANIPULATION, value: 8, unit: '%' },
    { category: TagCategory.MANUAL, value: true }
  ],
  footprint: 0.5,
  purchaseCost: 800,
  dailyOperatingCost: 1
});

// Workbenches
export const workbenchBasic = createEquipment({
  id: 'workbench_basic',
  name: 'Basic Workbench',
  description: 'Simple work surface with built-in vise',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.SURFACE, value: 2, unit: 'm²', consumable: true },
    { category: TagCategory.HOLDING, value: true },
    { category: TagCategory.STORAGE, value: 0.5, unit: 'm³' }
  ],
  footprint: 3,
  purchaseCost: 500,
  dailyOperatingCost: 0
});

export const workbenchHeavyDuty = createEquipment({
  id: 'workbench_heavy_duty',
  name: 'Heavy-Duty Workbench',
  description: 'Reinforced workbench for heavy components',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.SURFACE, value: 3, unit: 'm²', consumable: true },
    { category: TagCategory.HOLDING, value: true },
    { category: TagCategory.STORAGE, value: 1, unit: 'm³' },
    { category: TagCategory.HEAVY_MANIPULATION, value: 20, unit: '%' }
  ],
  footprint: 4,
  purchaseCost: 1200,
  dailyOperatingCost: 0,
  requiresFoundation: true
});

// Manual Machining Equipment
export const latheManual = createEquipment({
  id: 'lathe_manual',
  name: 'Manual Lathe',
  description: 'Traditional hand-operated lathe for turning operations',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.TURNING, value: 8, unit: '%', consumable: true },
    { category: TagCategory.MANUAL, value: true }
  ],
  footprint: 3,
  purchaseCost: 1500,
  dailyOperatingCost: 2,
  minSkillLevel: 20
});

export const latheBenchtop = createEquipment({
  id: 'lathe_benchtop',
  name: 'Benchtop Lathe',
  description: 'Small powered lathe for precision turning',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.TURNING, value: 25, unit: '%', consumable: true },
    { category: TagCategory.POWERED, value: true },
    { category: TagCategory.SURFACE, value: 1, unit: 'm²' },
    { category: TagCategory.HOLDING, value: true }
  ],
  footprint: 2,
  powerRequirement: 1.5,
  purchaseCost: 4500,
  dailyOperatingCost: 8,
  minSkillLevel: 30
});

export const millManual = createEquipment({
  id: 'mill_manual',
  name: 'Manual Mill',
  description: 'Hand-operated milling machine',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.MILLING, value: 10, unit: '%', consumable: true },
    { category: TagCategory.DRILLING, value: 15, unit: '%', consumable: true },
    { category: TagCategory.BORING, value: 8, unit: '%', consumable: true },
    { category: TagCategory.MANUAL, value: true }
  ],
  footprint: 3,
  purchaseCost: 2000,
  dailyOperatingCost: 3,
  minSkillLevel: 25
});

export const millBenchtop = createEquipment({
  id: 'mill_benchtop',
  name: 'Benchtop Mill',
  description: 'Compact powered milling machine',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.MILLING, value: 30, unit: '%', consumable: true },
    { category: TagCategory.DRILLING, value: 35, unit: '%', consumable: true },
    { category: TagCategory.POWERED, value: true },
    { category: TagCategory.SURFACE, value: 1.5, unit: 'm²' },
    { category: TagCategory.HOLDING, value: true }
  ],
  footprint: 2.5,
  powerRequirement: 2,
  purchaseCost: 6000,
  dailyOperatingCost: 12,
  minSkillLevel: 35
});

// CNC Equipment
export const cncMillBasic = createEquipment({
  id: 'cnc_mill_basic',
  name: 'Basic CNC Mill',
  description: '3-axis CNC milling machine',
  tier: EquipmentTier.ADVANCED,
  tags: [
    { category: TagCategory.MILLING, value: 70, unit: '%', consumable: true },
    { category: TagCategory.DRILLING, value: 80, unit: '%', consumable: true },
    { category: TagCategory.POWERED, value: true },
    { category: TagCategory.COMPUTER_CONTROLLED, value: true },
    { category: TagCategory.SURFACE, value: 2, unit: 'm²' },
    { category: TagCategory.HOLDING, value: true },
    { category: TagCategory.PRECISION_MANIPULATION, value: 45, unit: '%' }
  ],
  footprint: 8,
  powerRequirement: 5,
  purchaseCost: 45000,
  installationCost: 5000,
  dailyOperatingCost: 50,
  minSkillLevel: 40,
  requiresFoundation: true
});

export const cncCenterAdvanced = createEquipment({
  id: 'cnc_center_advanced',
  name: 'Advanced CNC Machining Center',
  description: '5-axis CNC with automatic tool changer',
  tier: EquipmentTier.CUTTING_EDGE,
  tags: [
    { category: TagCategory.MILLING, value: 95, unit: '%', consumable: true },
    { category: TagCategory.TURNING, value: 85, unit: '%', consumable: true },
    { category: TagCategory.DRILLING, value: 95, unit: '%', consumable: true },
    { category: TagCategory.GRINDING, value: 60, unit: '%', consumable: true },
    { category: TagCategory.POWERED, value: true },
    { category: TagCategory.AUTOMATED, value: true },
    { category: TagCategory.COMPUTER_CONTROLLED, value: true },
    { category: TagCategory.SURFACE, value: 4, unit: 'm²' },
    { category: TagCategory.HOLDING, value: true },
    { category: TagCategory.PRECISION_MANIPULATION, value: 90, unit: '%' },
    { category: TagCategory.MATERIAL_FEED, value: true }
  ],
  footprint: 25,
  powerRequirement: 15,
  purchaseCost: 350000,
  installationCost: 25000,
  dailyOperatingCost: 150,
  minSkillLevel: 60,
  operatorsRequired: 1,
  requiresFoundation: true,
  requiresCoolant: true
});

// Quality Control Equipment
export const measuringToolsBasic = createEquipment({
  id: 'measuring_tools_basic',
  name: 'Basic Measuring Tools',
  description: 'Calipers, micrometers, and gauges',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.MEASURING, value: true },
    { category: TagCategory.QUALITY_CONTROL, value: true },
    { category: TagCategory.MANUAL, value: true }
  ],
  footprint: 0.5,
  purchaseCost: 500,
  dailyOperatingCost: 0
});

export const cmmBasic = createEquipment({
  id: 'cmm_basic',
  name: 'Coordinate Measuring Machine',
  description: 'Precision measurement system for quality control',
  tier: EquipmentTier.ADVANCED,
  tags: [
    { category: TagCategory.MEASURING, value: true },
    { category: TagCategory.QUALITY_CONTROL, value: true },
    { category: TagCategory.DIMENSIONAL_INSPECTION, value: true },
    { category: TagCategory.POWERED, value: true },
    { category: TagCategory.COMPUTER_CONTROLLED, value: true },
    { category: TagCategory.PRECISION_MANIPULATION, value: 95, unit: '%' }
  ],
  footprint: 6,
  powerRequirement: 2,
  purchaseCost: 80000,
  installationCost: 10000,
  dailyOperatingCost: 30,
  minSkillLevel: 50,
  requiresFoundation: true,
  requiresVentilation: true
});

// Storage Equipment
export const shelvingBasic = createEquipment({
  id: 'shelving_basic',
  name: 'Basic Storage Shelving',
  description: 'Simple metal shelving units',
  tier: EquipmentTier.BASIC,
  tags: [
    { category: TagCategory.STORAGE, value: 8, unit: 'm³', consumable: true }
  ],
  footprint: 2,
  purchaseCost: 300,
  dailyOperatingCost: 0
});

export const storageIndustrial = createEquipment({
  id: 'storage_industrial',
  name: 'Industrial Storage System',
  description: 'Heavy-duty racking with organization system',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.STORAGE, value: 25, unit: 'm³', consumable: true },
    { category: TagCategory.HEAVY_MANIPULATION, value: 10, unit: '%' }
  ],
  footprint: 6,
  purchaseCost: 2000,
  dailyOperatingCost: 1,
  requiresFoundation: true
});

// Material Handling
export const overheadCrane = createEquipment({
  id: 'overhead_crane',
  name: 'Overhead Crane System',
  description: '5-ton overhead crane for heavy lifting',
  tier: EquipmentTier.STANDARD,
  tags: [
    { category: TagCategory.HEAVY_LIFTING, value: true },
    { category: TagCategory.HEAVY_MANIPULATION, value: 80, unit: '%' },
    { category: TagCategory.POWERED, value: true }
  ],
  footprint: 0, // Overhead installation
  powerRequirement: 5,
  purchaseCost: 25000,
  installationCost: 15000,
  dailyOperatingCost: 20,
  minSkillLevel: 30,
  operatorsRequired: 1,
  requiresFoundation: true
});

// Specialized Equipment
export const cleanRoomBasic = createEquipment({
  id: 'clean_room_basic',
  name: 'Basic Clean Room',
  description: 'Class 10000 clean room for electronics assembly',
  tier: EquipmentTier.ADVANCED,
  tags: [
    { category: TagCategory.CLEAN_ROOM, value: true },
    { category: TagCategory.TEMPERATURE_CONTROLLED, value: true },
    { category: TagCategory.SURFACE, value: 20, unit: 'm²' }
  ],
  footprint: 25,
  powerRequirement: 10,
  purchaseCost: 100000,
  installationCost: 50000,
  dailyOperatingCost: 100,
  requiresVentilation: true
});

// Export all equipment as a map for easy lookup
export const equipmentDatabase = new Map<string, Equipment>([
  [handToolsBasic.id, handToolsBasic],
  [handToolsPrecision.id, handToolsPrecision],
  [workbenchBasic.id, workbenchBasic],
  [workbenchHeavyDuty.id, workbenchHeavyDuty],
  [latheManual.id, latheManual],
  [latheBenchtop.id, latheBenchtop],
  [millManual.id, millManual],
  [millBenchtop.id, millBenchtop],
  [cncMillBasic.id, cncMillBasic],
  [cncCenterAdvanced.id, cncCenterAdvanced],
  [measuringToolsBasic.id, measuringToolsBasic],
  [cmmBasic.id, cmmBasic],
  [shelvingBasic.id, shelvingBasic],
  [storageIndustrial.id, storageIndustrial],
  [overheadCrane.id, overheadCrane],
  [cleanRoomBasic.id, cleanRoomBasic]
]);

// Equipment sets for starting scenarios
export const starterEquipmentSets = {
  garage: [
    handToolsBasic.id,
    handToolsPrecision.id,    // For precision work
    workbenchBasic.id,
    shelvingBasic.id,
    latheManual.id,           // For turning operations
    millManual.id,            // For milling operations
    measuringToolsBasic.id    // For quality control
  ],
  workshop: [
    handToolsBasic.id,
    handToolsPrecision.id,
    workbenchBasic.id,
    workbenchHeavyDuty.id,
    latheManual.id,
    millManual.id,
    measuringToolsBasic.id,
    shelvingBasic.id
  ],
  smallFactory: [
    handToolsPrecision.id,
    workbenchHeavyDuty.id,
    latheBenchtop.id,
    millBenchtop.id,
    cncMillBasic.id,
    measuringToolsBasic.id,
    storageIndustrial.id,
    overheadCrane.id
  ]
};