// Manufacturing Methods with Single-Machine Operations

import { 
  MachineBasedMethod,
  TagCategory,
  ItemTag
} from '../types';

// LEGACY METHODS REMOVED - Only component-based methods remain
// NEW: Component-Based Basic Sidearm Method
export const basicSidearmComponentMethod: MachineBasedMethod = {
  id: 'basic_sidearm_component',
  name: 'Forge New (Component-Based)',
  description: 'Manufacture a new sidearm from raw materials using component transformation',
  
  // Output configuration for new inventory system
  outputTags: [ItemTag.FORGED, ItemTag.LOW_TECH],
  qualityRange: [80, 95],
  
  operations: [
    // Operation 1: Material Preparation
    {
      id: 'component_material_prep',
      name: 'Material Preparation',
      description: 'Prepare and measure raw materials',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 10,
      // NEW: No material consumption or production - just preparation
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'unskilled'
    },
    
    // Operation 2: Rough Milling - Steel → Rough Components
    {
      id: 'component_rough_milling', 
      name: 'Rough Milling',
      description: 'Mill frame and major components',
      requiredTag: {
        category: TagCategory.MILLING,
        minimum: 10,
        optimal: 30
      },
      baseDurationMinutes: 40,
      // NEW: Material transformation system
      materialConsumption: [
        { itemId: 'steel', count: 1.0 }
      ],
      materialProduction: [
        { 
          itemId: 'mechanical-component', 
          count: 10, 
          tags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
          quality: 70
        }
      ],
      can_fail: true,
      failure_chance: 0.05,
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 3: Precision Turning - Rough → Precision Components
    {
      id: 'component_precision_turning',
      name: 'Precision Turning', 
      description: 'Turn barrel and precision components',
      requiredTag: {
        category: TagCategory.TURNING,
        minimum: 8,
        optimal: 20
      },
      baseDurationMinutes: 35,
      materialConsumption: [
        { itemId: 'mechanical-component', count: 5, tags: [ItemTag.ROUGH] }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-component',
          count: 5,
          tags: [ItemTag.PRECISION, ItemTag.LOW_TECH],
          quality: 85
        }
      ],
      can_fail: true,
      failure_chance: 0.08,
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 4: Component Assembly - Components → Assembly
    {
      id: 'component_assembly',
      name: 'Component Assembly',
      description: 'Assemble all components',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10
      },
      baseDurationMinutes: 25,
      materialConsumption: [
        { itemId: 'mechanical-component', count: 5, tags: [ItemTag.ROUGH] },
        { itemId: 'mechanical-component', count: 5, tags: [ItemTag.PRECISION] }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-assembly',
          count: 1,
          tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH],
          quality: 85
        }
      ],
      can_fail: true,
      failure_chance: 0.03,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 5: Shape Casing - Plastic → Casing
    {
      id: 'component_shape_casing',
      name: 'Shape Casing',
      description: 'Shape the outer casing',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 28,
      materialConsumption: [
        { itemId: 'plastic', count: 0.3 }
      ],
      materialProduction: [
        {
          itemId: 'plastic-casing',
          count: 1,
          tags: [ItemTag.CASING, ItemTag.LOW_TECH],
          quality: 75
        }
      ],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 6: Final Assembly - Assembly + Casing → Sidearm
    {
      id: 'component_final_assembly',
      name: 'Final Assembly',
      description: 'Fine adjustments and fitting',
      requiredTag: {
        category: TagCategory.PRECISION_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: 15,
      materialConsumption: [
        { itemId: 'mechanical-assembly', count: 1, tags: [ItemTag.ASSEMBLY] },
        { itemId: 'plastic-casing', count: 1, tags: [ItemTag.CASING] }
      ],
      materialProduction: [
        {
          itemId: 'basic_sidearm',
          count: 1,
          tags: [ItemTag.FORGED, ItemTag.LOW_TECH],
          inheritQuality: true // Final quality depends on component quality
        }
      ],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 7: Quality Control - Final inspection
    {
      id: 'component_quality_control',
      name: 'Quality Control',
      description: 'Test and verify specifications',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10,
      // QC just verifies - no material transformation
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Method properties
  output_state: 'pristine',
  output_quality_range: [80, 95],
  labor_cost_multiplier: 1.2, // Slightly higher due to component complexity
  complexity_rating: 8,
  profit_margin_modifier: 1.1,
  customer_appeal: ['quality_conscious', 'precision_seekers', 'component_enthusiasts']
};

// NEW: Component-Based Restore Damaged Method
export const basicSidearmRestoreComponentMethod: MachineBasedMethod = {
  id: 'basic_sidearm_restore_component',
  name: 'Restore Damaged (Component-Based)',
  description: 'Restore a damaged weapon to functional condition using component breakdown',
  
  // Output configuration
  outputTags: [ItemTag.RESTORED, ItemTag.LOW_TECH],
  qualityRange: [60, 80],
  
  operations: [
    // Operation 1: Uncasing - Remove the outer casing
    {
      id: 'restore_comp_uncasing',
      name: 'Uncasing',
      description: 'Carefully disassemble damaged weapon',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 15,
      materialConsumption: [
        { itemId: 'basic_sidearm', count: 1, tags: [ItemTag.DAMAGED], maxQuality: 25 }
      ],
      materialProduction: [
        { 
          itemId: 'mechanical-assembly', 
          count: 1, 
          tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH, ItemTag.DAMAGED],
          quality: 20
        },
        {
          itemId: 'plastic-scrap',
          count: 1,
          tags: [ItemTag.SALVAGED],
          quality: 15
        }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 2: Disassembly - Break down the assembly into components
    {
      id: 'restore_comp_disassembly',
      name: 'Disassembly',
      description: 'Carefully disassemble mechanical assembly',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10
      },
      baseDurationMinutes: 15,
      materialConsumption: [
        { itemId: 'mechanical-assembly', count: 1, tags: [ItemTag.ASSEMBLY, ItemTag.DAMAGED] }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-component',
          count: 4,
          tags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
          quality: 25
        },
        {
          itemId: 'mechanical-component',
          count: 3,
          tags: [ItemTag.PRECISION, ItemTag.LOW_TECH],
          quality: 30
        },
        {
          itemId: 'steel-scrap',
          count: 1,
          tags: [ItemTag.SALVAGED],
          quality: 20
        }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 3: Rough Milling - Create new rough components
    {
      id: 'restore_comp_rough_milling',
      name: 'Rough Milling',
      description: 'Mill new frame and major components',
      requiredTag: {
        category: TagCategory.MILLING,
        minimum: 10,
        optimal: 30
      },
      baseDurationMinutes: 40,
      materialConsumption: [
        { itemId: 'steel', count: 0.3 }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-component',
          count: 3,
          tags: [ItemTag.ROUGH, ItemTag.LOW_TECH],
          quality: 70
        }
      ],
      can_fail: true,
      failure_chance: 0.05,
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 4: Precision Turning - Upgrade some rough to precision
    {
      id: 'restore_comp_precision_turning',
      name: 'Precision Turning',
      description: 'Turn barrel and precision components',
      requiredTag: {
        category: TagCategory.TURNING,
        minimum: 8,
        optimal: 20
      },
      baseDurationMinutes: 35,
      materialConsumption: [
        { itemId: 'mechanical-component', count: 2, tags: [ItemTag.ROUGH] }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-component',
          count: 2,
          tags: [ItemTag.PRECISION, ItemTag.LOW_TECH],
          quality: 85
        }
      ],
      can_fail: true,
      failure_chance: 0.08,
      labor_skill: 'skilled_machinist'
    },
    
    // Operation 5: Component Assembly - Combine all components
    {
      id: 'restore_comp_assembly',
      name: 'Component Assembly',
      description: 'Assemble all components',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10
      },
      baseDurationMinutes: 25,
      materialConsumption: [
        { itemId: 'mechanical-component', count: 5, tags: [ItemTag.ROUGH] },
        { itemId: 'mechanical-component', count: 5, tags: [ItemTag.PRECISION] }
      ],
      materialProduction: [
        {
          itemId: 'mechanical-assembly',
          count: 1,
          tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH],
          quality: 75
        }
      ],
      can_fail: true,
      failure_chance: 0.03,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 6: Shape Casing - Create new casing
    {
      id: 'restore_comp_shape_casing',
      name: 'Shape Casing',
      description: 'Shape a new outer casing',
      requiredTag: {
        category: TagCategory.SURFACE,
        minimum: 2
      },
      baseDurationMinutes: 28,
      materialConsumption: [
        { itemId: 'plastic', count: 0.5 }
      ],
      materialProduction: [
        {
          itemId: 'plastic-casing',
          count: 1,
          tags: [ItemTag.CASING, ItemTag.LOW_TECH],
          quality: 75
        }
      ],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 7: Final Assembly - Combine assembly and casing
    {
      id: 'restore_comp_final_assembly',
      name: 'Final Assembly',
      description: 'Fine adjustments and fitting',
      requiredTag: {
        category: TagCategory.PRECISION_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: 15,
      materialConsumption: [
        { itemId: 'mechanical-assembly', count: 1, tags: [ItemTag.ASSEMBLY] },
        { itemId: 'plastic-casing', count: 1, tags: [ItemTag.CASING] }
      ],
      materialProduction: [
        {
          itemId: 'basic_sidearm',
          count: 1,
          tags: [ItemTag.RESTORED, ItemTag.LOW_TECH],
          inheritQuality: true
        }
      ],
      can_fail: true,
      failure_chance: 0.02,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 8: Quality Control - Final inspection
    {
      id: 'restore_comp_quality_control',
      name: 'Quality Control',
      description: 'Test and verify specifications',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10,
      // QC just verifies - no material transformation
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Method properties
  output_state: 'functional',
  output_quality_range: [60, 80],
  labor_cost_multiplier: 0.9,
  complexity_rating: 7,
  profit_margin_modifier: 0.8,
  customer_appeal: ['budget_conscious', 'restoration_specialists', 'component_enthusiasts']
};

// NEW: Disassembly Methods for Basic Sidearm

// Disassemble Pristine/Good Quality Sidearm 
export const basicSidearmDisassemblePristineMethod: MachineBasedMethod = {
  id: 'basic_sidearm_disassemble_pristine_component',
  name: 'Disassemble (Good Condition)',
  description: 'Carefully disassemble a functional sidearm to recover high-quality components',
  
  // Output configuration
  outputTags: [ItemTag.SALVAGED],
  qualityRange: [60, 85],
  
  operations: [
    // Operation 1: Safety Check
    {
      id: 'disassemble_pristine_safety',
      name: 'Safety Check',
      description: 'Ensure weapon is unloaded and safe to disassemble',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 5,
      // No material transformation - just verification
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 2: Remove Casing - Sidearm → Casing + Assembly
    {
      id: 'disassemble_pristine_uncasing',
      name: 'Remove Casing',
      description: 'Carefully remove the outer plastic casing',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 10
      },
      baseDurationMinutes: 15,
      materialConsumption: [
        { itemId: 'basic_sidearm', count: 1 }
      ],
      materialProduction: [
        {
          itemId: 'plastic-casing',
          count: 1,
          tags: [ItemTag.CASING, ItemTag.LOW_TECH],
          inheritQuality: true
        },
        {
          itemId: 'mechanical-assembly',
          count: 1,
          tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH],
          inheritQuality: true
        }
      ],
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 3: Component Inspection
    {
      id: 'disassemble_pristine_inspection',
      name: 'Component Inspection',
      description: 'Inspect and catalog recovered components',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10,
      // No material transformation - just verification
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Method properties
  output_state: 'functional',
  output_quality_range: [60, 85],
  labor_cost_multiplier: 0.5,
  complexity_rating: 2,
  profit_margin_modifier: 0.6,
  customer_appeal: ['salvage_operations', 'component_dealers', 'recyclers']
};

// Disassemble Damaged Sidearm
export const basicSidearmDisassembleDamagedMethod: MachineBasedMethod = {
  id: 'basic_sidearm_disassemble_damaged_component',
  name: 'Disassemble (Damaged)',
  description: 'Salvage what components you can from a damaged sidearm',
  
  // Output configuration
  outputTags: [ItemTag.DAMAGED, ItemTag.SALVAGED],
  qualityRange: [15, 35],
  
  operations: [
    // Operation 1: Safety Check
    {
      id: 'disassemble_damaged_safety',
      name: 'Safety Check', 
      description: 'Check damaged weapon for safety hazards',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 5,
      // No material transformation - just verification
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'skilled_technician'
    },
    
    // Operation 2: Force Disassembly - Damaged Sidearm → Scrap + Damaged Assembly
    {
      id: 'disassemble_damaged_breakdown',
      name: 'Force Disassembly',
      description: 'Forcefully remove damaged casing and internals',
      requiredTag: {
        category: TagCategory.BASIC_MANIPULATION,
        minimum: 8
      },
      baseDurationMinutes: 20,
      materialConsumption: [
        { itemId: 'basic_sidearm', count: 1, tags: [ItemTag.DAMAGED] }
      ],
      materialProduction: [
        {
          itemId: 'plastic-scrap',
          count: 1,
          tags: [ItemTag.SALVAGED],
          quality: 15
        },
        {
          itemId: 'mechanical-assembly',
          count: 1,
          tags: [ItemTag.ASSEMBLY, ItemTag.LOW_TECH, ItemTag.DAMAGED],
          quality: 20
        }
      ],
      can_fail: true,
      failure_chance: 0.1, // 10% chance to destroy everything
      labor_skill: 'skilled_technician'
    },
    
    // Operation 3: Salvage Assessment
    {
      id: 'disassemble_damaged_assessment',
      name: 'Salvage Assessment',
      description: 'Assess value of recovered materials',
      requiredTag: {
        category: TagCategory.MEASURING,
        minimum: true
      },
      baseDurationMinutes: 10,
      // No material transformation - just assessment
      can_fail: false,
      failure_chance: 0,
      labor_skill: 'quality_inspector'
    }
  ],
  
  // Method properties
  output_state: 'junk',
  output_quality_range: [15, 35],
  labor_cost_multiplier: 0.4,
  complexity_rating: 2,
  profit_margin_modifier: 0.4,
  customer_appeal: ['scrap_dealers', 'budget_operations', 'salvagers']
};

export const basicSidearmMethods = [
  basicSidearmComponentMethod,        // Primary component-based forge method
  basicSidearmRestoreComponentMethod,  // Component-based restore method
  basicSidearmDisassemblePristineMethod, // NEW: Disassemble good condition
  basicSidearmDisassembleDamagedMethod,  // NEW: Disassemble damaged condition
];

// ===== TACTICAL KNIFE METHODS REMOVED =====
// Tactical knife methods have been removed as requested.
// They will be re-implemented in Manufacturing v2 with full component system.

// Empty export for compatibility
export const tacticalKnifeMethods: MachineBasedMethod[] = [];