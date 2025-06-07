// Manufacturing Methods with Single-Machine Operations

import { 
  MachineBasedMethod, 
  MachineOperation,
  TagCategory,
  ItemTag
} from '../types';

// Basic Sidearm - Forge New Method
export const basicSidearmForgeMethod: MachineBasedMethod = {
  id: 'basic_sidearm_forge',
  name: 'Forge New',
  description: 'Manufacture a new sidearm from raw materials',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.FORGED],
  qualityRange: [80, 95],
  
  operations: [
    // Operation 1: Material Preparation (Workbench)
    {
      id: 'forge_material_prep',
      name: 'Material Preparation',
      description: 'Prepare and measure raw materials',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 10, // 10 game minutes
      material_requirements: [
        { material_id: 'steel', quantity: 1.0, consumed_at_start: true },
        { material_id: 'plastic', quantity: 0.3, consumed_at_start: true }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled'
    },
    
    
    // Operation 2: Rough Milling (Mill)
    {
      id: 'forge_rough_milling',
      name: 'Rough Milling',
      description: 'Mill frame and major components',
      requiredTag: {
        category: TagCategory.MILLING,
        minimum: 10,
        optimal: 30
      },
      baseDurationMinutes: 40, // 40 game minutes
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.05,
      failure_result: 'scrap',
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 3: Precision Turning (Lathe)
    {
      id: 'forge_precision_turning',
      name: 'Precision Turning',
      description: 'Turn barrel and precision components',
      requiredTag: {
        category: TagCategory.TURNING,
        minimum: 8,
        optimal: 35
      },
      baseDurationMinutes: 35, // 35 game minutes
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.08,
      failure_result: 'scrap',
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 4: Component Assembly (Workbench)
    {
      id: 'forge_assembly',
      name: 'Component Assembly',
      description: 'Assemble all components',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 25, // 25 game minutes
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.03,
      failure_result: 'downgrade',
      labor_skill: 'skilled_technician'
    },
    
    // Operation 5: Final Assembly (Hand Tools)
    {
      id: 'forge_final_assembly',
      name: 'Final Assembly',
      description: 'Fine adjustments and fitting',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10,
        optimal: 20
      },
      baseDurationMinutes: 15, // 15 game minutes
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.02,
      failure_result: 'downgrade',
      labor_skill: 'skilled_technician'
    },
    
    // Operation 6: Quality Control (Measuring Tools)
    {
      id: 'forge_quality_control',
      name: 'Quality Control',
      description: 'Test and verify specifications',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10, // 10 game minutes
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Legacy output configuration
  output_state: 'pristine',
  output_quality_range: [80, 95],
  outputTags: [ItemTag.FORGED], // NEW: Produces forged quality items
  labor_cost_multiplier: 1.5,
  complexity_rating: 5,
  profit_margin_modifier: 1.3,
  required_facility_traits: [],
  customer_appeal: ['military', 'government', 'corporate']
};

// Basic Sidearm - Restore Method
export const basicSidearmRestoreMethod: MachineBasedMethod = {
  id: 'basic_sidearm_restore',
  name: 'Restore Damaged',
  description: 'Restore a damaged weapon to functional condition',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.RESTORED],
  qualityRange: [60, 80],
  
  operations: [
    // Operation 1: Disassembly (Workbench)
    {
      id: 'restore_disassembly',
      name: 'Disassembly',
      description: 'Carefully disassemble damaged weapon',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 15, // 15 game minutes
      material_requirements: [
        { material_id: 'basic_sidearm', quantity: 1, consumed_at_start: true, required_tags: [ItemTag.DAMAGED] }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 2: Parts Inspection (Hand Tools)
    {
      id: 'restore_inspection',
      name: 'Parts Inspection',
      description: 'Inspect and sort salvageable parts',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10,
        optimal: 15
      },
      baseDurationMinutes: 20, // 20 game minutes
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 3: Component Repair (Workbench)
    {
      id: 'restore_repair',
      name: 'Component Repair',
      description: 'Repair or replace damaged parts',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 30, // 30 game minutes
      material_requirements: [
        { material_id: 'low_tech_spares', quantity: 0.2, consumed_at_start: true }
      ],
      can_fail: true,
      failure_chance: 0.08,
      failure_result: 'downgrade',
      labor_skill: 'skilled_technician'
    },
    
    // Operation 4: Reassembly (Hand Tools)
    {
      id: 'restore_reassembly',
      name: 'Reassembly',
      description: 'Reassemble restored weapon',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8,
        optimal: 15
      },
      baseDurationMinutes: 15, // 15 game minutes
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 5: Function Test (Measuring Tools)
    {
      id: 'restore_test',
      name: 'Function Test',
      description: 'Test restored weapon functionality',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10, // 10 game minutes
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Legacy output configuration
  output_state: 'functional',
  output_quality_range: [60, 80],
  labor_cost_multiplier: 0.8,
  complexity_rating: 3,
  profit_margin_modifier: 0.9,
  required_facility_traits: [],
  customer_appeal: ['rebel', 'mercenary', 'civilian']
};

// Basic Sidearm - Cobble Method
export const basicSidearmCobbleMethod: MachineBasedMethod = {
  id: 'basic_sidearm_cobble',
  name: 'Cobble Together',
  description: 'Create a crude but functional weapon from scrap',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.JUNK],
  qualityRange: [30, 45],
  qualityCap: 45,
  
  operations: [
    // Operation 1: Improvised Assembly (Workbench)
    {
      id: 'cobble_assembly',
      name: 'Improvised Assembly',
      description: 'Cobble together functional weapon',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 15, // 15 game minutes
      material_requirements: [
        { material_id: 'steel', quantity: 0.5, consumed_at_start: true },
        { material_id: 'basic_electronics', quantity: 1, consumed_at_start: true }
      ],
      can_fail: true,
      failure_chance: 0.15,
      failure_result: 'scrap',
      labor_skill: 'unskilled'
    },
    
    // Operation 2: Basic Fitting (Hand Tools)
    {
      id: 'cobble_fitting',
      name: 'Basic Fitting',
      description: 'Make parts fit together',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 5,
        optimal: 15
      },
      baseDurationMinutes: 10, // 10 game minutes  
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.1,
      failure_result: 'scrap',
      labor_skill: 'unskilled'
    }
  ],
  
  // Legacy output configuration
  output_state: 'junk',
  output_quality_range: [30, 50],
  labor_cost_multiplier: 0.5,
  complexity_rating: 2,
  profit_margin_modifier: 0.6,
  required_facility_traits: [],
  customer_appeal: ['rebel', 'pirate', 'desperate']
};

// Export all methods for a product
export const basicSidearmMethods = [
  basicSidearmForgeMethod,
  basicSidearmRestoreMethod,
  basicSidearmCobbleMethod
];

// ===== TACTICAL KNIFE METHODS =====

// Tactical Knife - Forge New Method
export const tacticalKnifeForgeMethod: MachineBasedMethod = {
  id: 'tactical_knife_forge',
  name: 'Forge New',
  description: 'Craft a high-quality tactical knife from raw materials',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.FORGED],
  qualityRange: [85, 98],
  
  operations: [
    // Operation 1: Material Preparation (Workbench)
    {
      id: 'knife_material_prep',
      name: 'Material Preparation',
      description: 'Cut and prepare steel stock',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 8,
      material_requirements: [
        { material_id: 'steel', quantity: 0.5, consumed_at_start: true },
        { material_id: 'aluminum', quantity: 0.2, consumed_at_start: true }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled'
    },
    
    // Operation 2: Rough Shaping (Mill)
    {
      id: 'knife_rough_shaping',
      name: 'Rough Shaping',
      description: 'Mill basic blade profile',
      requiredTag: {
        category: TagCategory.MILLING,
        minimum: 8,
        optimal: 20
      },
      baseDurationMinutes: 25,
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.03,
      failure_result: 'scrap',
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 3: Blade Turning (Lathe)
    {
      id: 'knife_blade_turning',
      name: 'Blade Finishing',
      description: 'Turn and finish blade edge geometry',
      requiredTag: {
        category: TagCategory.TURNING,
        minimum: 6,
        optimal: 15
      },
      baseDurationMinutes: 20,
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.05,
      failure_result: 'downgrade',
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 4: Handle Assembly (Hand Tools)
    {
      id: 'knife_handle_assembly',
      name: 'Handle Assembly',
      description: 'Assemble and fit handle components',
      requiredTag: {
        category: TagCategory.PRECISION_MANIPULATION,
        minimum: 5,
        optimal: 12
      },
      baseDurationMinutes: 15,
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.02,
      failure_result: 'downgrade',
      labor_skill: 'skilled_technician'
    },
    
    // Operation 5: Final Sharpening (Hand Tools)
    {
      id: 'knife_final_sharpening',
      name: 'Edge Sharpening',
      description: 'Sharpen and hone final edge',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8,
        optimal: 15
      },
      baseDurationMinutes: 12,
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 6: Quality Inspection (Measuring Tools)
    {
      id: 'knife_quality_inspection',
      name: 'Quality Inspection',
      description: 'Test sharpness and verify specifications',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 5,
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Legacy output configuration
  output_state: 'pristine',
  output_quality_range: [85, 98],
  labor_cost_multiplier: 1.3,
  complexity_rating: 4,
  profit_margin_modifier: 1.4,
  required_facility_traits: [],
  customer_appeal: ['military', 'survival', 'collector']
};

// Tactical Knife - Restore Method
export const tacticalKnifeRestoreMethod: MachineBasedMethod = {
  id: 'tactical_knife_restore',
  name: 'Restore Damaged',
  description: 'Restore a damaged knife to functional condition',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.RESTORED],
  qualityRange: [70, 85],
  
  operations: [
    // Operation 1: Damage Assessment (Measuring Tools)
    {
      id: 'knife_damage_assessment',
      name: 'Damage Assessment',
      description: 'Evaluate damage and plan restoration',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 8,
      material_requirements: [
        { material_id: 'tactical_knife', quantity: 1, consumed_at_start: true, required_tags: [ItemTag.SALVAGED], max_quality: 35 }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 2: Blade Repair (Mill or Hand Tools)
    {
      id: 'knife_blade_repair',
      name: 'Blade Repair',
      description: 'Repair chips and damage',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10,
        optimal: 15
      },
      baseDurationMinutes: 18,
      material_requirements: [
        { material_id: 'machined_parts', quantity: 0.5, consumed_at_start: true }
      ],
      can_fail: true,
      failure_chance: 0.06,
      failure_result: 'downgrade',
      labor_skill: 'skilled_technician'
    },
    
    // Operation 3: Re-sharpening (Hand Tools)
    {
      id: 'knife_resharpening',
      name: 'Re-sharpening',
      description: 'Restore sharp edge',
      requiredTag: {
        category: TagCategory.PRECISION_MANIPULATION,
        minimum: 6
      },
      baseDurationMinutes: 15,
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 4: Handle Refurbishment (Hand Tools)
    {
      id: 'knife_handle_refurb',
      name: 'Handle Refurbishment',
      description: 'Clean and repair handle',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: 10,
      material_requirements: [],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled'
    }
  ],
  
  // Legacy output configuration
  output_state: 'functional',
  output_quality_range: [70, 85],
  labor_cost_multiplier: 0.7,
  complexity_rating: 2,
  profit_margin_modifier: 0.8,
  required_facility_traits: [],
  customer_appeal: ['survival', 'budget', 'practical']
};

// Tactical Knife - Quick Sharpen Method
export const tacticalKnifeSharpenMethod: MachineBasedMethod = {
  id: 'tactical_knife_sharpen',
  name: 'Quick Sharpen',
  description: 'Rapidly sharpen dull knives for resale',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.REFURBISHED],
  qualityRange: [65, 80],
  
  operations: [
    // Operation 1: Edge Assessment (Hand Tools)
    {
      id: 'knife_edge_assessment',
      name: 'Edge Assessment',
      description: 'Check current edge condition',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 5
      },
      baseDurationMinutes: 3,
      material_requirements: [
        { material_id: 'tactical_knife', quantity: 1, consumed_at_start: true, required_tags: [ItemTag.SALVAGED], max_quality: 55 }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled'
    },
    
    // Operation 2: Quick Sharpening (Hand Tools)
    {
      id: 'knife_quick_sharpen',
      name: 'Quick Sharpening',
      description: 'Fast edge restoration',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: 8,
      material_requirements: [],
      can_fail: true,
      failure_chance: 0.08,
      failure_result: 'downgrade',
      labor_skill: 'unskilled'
    }
  ],
  
  // Legacy output configuration
  output_state: 'functional',
  output_quality_range: [60, 75],
  labor_cost_multiplier: 0.4,
  complexity_rating: 1,
  profit_margin_modifier: 0.6,
  required_facility_traits: [],
  customer_appeal: ['budget', 'quick_turnaround']
};

// Export tactical knife methods
export const tacticalKnifeMethods = [
  tacticalKnifeForgeMethod,
  tacticalKnifeRestoreMethod,
  tacticalKnifeSharpenMethod
];