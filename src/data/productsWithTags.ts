// Updated product definitions with tag-based manufacturing system

import { 
  TagCategory,
  ManufacturingMethod, 
  ManufacturingStep, 
  ProductState,
  Product,
  ProductCategory, 
  MilitaryClassification, 
  ToolType, 
  DefectType,
  CustomerType
} from '../types';

// Helper to create manufacturing steps
function createStep(
  id: string,
  name: string,
  durationPercentage: number,
  requiredTags: Array<{ category: TagCategory; minimum: number | boolean; optimal?: number }>,
  options: Partial<ManufacturingStep> = {}
): ManufacturingStep {
  return {
    id,
    name,
    duration_percentage: durationPercentage,
    required_tags: requiredTags.map(tag => ({
      category: tag.category,
      minimum: tag.minimum,
      optimal: tag.optimal
    })),
    material_requirements: [],
    labor_skill: 'unskilled',
    can_fail: false,
    failure_chance: 0,
    ...options
  };
}

// Basic Sidearm Manufacturing Methods
const basicSidearmMethods: ManufacturingMethod[] = [
  {
    id: 'basic_sidearm_forge',
    name: 'Forge New',
    description: 'Manufacture a new sidearm from raw materials',
    output_state: 'pristine',
    output_quality_range: [80, 95],
    required_facility_traits: [],
    required_tools: ['lathe', 'mill', 'hand_tools'],
    steps: [
      createStep(
        'material_prep',
        'Material Preparation',
        15,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.HOLDING, minimum: true },
          { category: TagCategory.STORAGE, minimum: 1.3 }
        ],
        {
          material_requirements: [
            { material_id: 'steel', quantity: 1.0, consumed_at_start: true },
            { material_id: 'plastic', quantity: 0.3, consumed_at_start: true }
          ],
          labor_skill: 'unskilled',
          failure_chance: 0.02
        }
      ),
      createStep(
        'machining',
        'Precision Machining',
        50,
        [
          { category: TagCategory.TURNING, minimum: 8, optimal: 35 },
          { category: TagCategory.MILLING, minimum: 10, optimal: 30 },
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.HOLDING, minimum: true }
        ],
        {
          material_requirements: [
            { material_id: 'machined_parts', quantity: 1, consumed_at_start: false }
          ],
          labor_skill: 'skilled_machinist',
          failure_chance: 0.1,
          failure_result: 'scrap'
        }
      ),
      createStep(
        'assembly',
        'Component Assembly',
        25,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.HOLDING, minimum: true },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 10, optimal: 20 }
        ],
        {
          labor_skill: 'skilled_technician',
          failure_chance: 0.05,
          failure_result: 'downgrade'
        }
      ),
      createStep(
        'quality_control',
        'Quality Control & Testing',
        10,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.MEASURING, minimum: true },
          { category: TagCategory.QUALITY_CONTROL, minimum: true }
        ],
        {
          labor_skill: 'quality_inspector',
          requires_quality_check: true
        }
      )
    ],
    total_duration_hours: 2,
    labor_cost_multiplier: 1.5,
    complexity_rating: 5,
    customer_appeal: ['military', 'government', 'corporate'],
    profit_margin_modifier: 1.3
  },
  {
    id: 'basic_sidearm_restore',
    name: 'Restore Damaged',
    description: 'Restore a damaged weapon to functional condition',
    input_state: 'damaged',
    output_state: 'functional',
    output_quality_range: [60, 80],
    required_facility_traits: [],
    required_tools: ['hand_tools', 'workbench'],
    steps: [
      createStep(
        'disassembly',
        'Disassembly & Inspection',
        20,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 8, optimal: 15 }
        ],
        {
          labor_skill: 'skilled_technician',
          material_requirements: [
            { material_id: 'damaged_basic_sidearm', quantity: 1, consumed_at_start: true }
          ]
        }
      ),
      createStep(
        'repair',
        'Component Repair',
        60,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 10, optimal: 20 },
          { category: TagCategory.PRECISION_MANIPULATION, minimum: 5, optimal: 10 }
        ],
        {
          material_requirements: [
            { material_id: 'low_tech_spares', quantity: 0.2, consumed_at_start: true }
          ],
          labor_skill: 'skilled_technician',
          failure_chance: 0.08,
          failure_result: 'downgrade'
        }
      ),
      createStep(
        'reassembly',
        'Reassembly & Testing',
        20,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 8 }
        ],
        {
          labor_skill: 'skilled_technician'
        }
      )
    ],
    total_duration_hours: 1,
    labor_cost_multiplier: 0.8,
    complexity_rating: 3,
    customer_appeal: ['rebel', 'mercenary', 'civilian'],
    profit_margin_modifier: 0.9
  },
  {
    id: 'basic_sidearm_cobble',
    name: 'Cobble Together',
    description: 'Create a crude but functional weapon from scrap',
    output_state: 'junk',
    output_quality_range: [30, 50],
    required_facility_traits: [],
    required_tools: ['hand_tools'],
    steps: [
      createStep(
        'scavenge',
        'Scavenge & Sort Parts',
        30,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.STORAGE, minimum: 3 }
        ],
        {
          material_requirements: [
            { material_id: 'steel', quantity: 0.5, consumed_at_start: true },
            { material_id: 'basic_electronics', quantity: 1, consumed_at_start: true }
          ],
          labor_skill: 'unskilled'
        }
      ),
      createStep(
        'improvise',
        'Improvised Assembly',
        70,
        [
          { category: TagCategory.SURFACE, minimum: 2 },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 5, optimal: 15 }
        ],
        {
          labor_skill: 'unskilled',
          failure_chance: 0.2,
          failure_result: 'scrap',
          batchable: true
        }
      )
    ],
    total_duration_hours: 0.5,
    labor_cost_multiplier: 0.5,
    complexity_rating: 2,
    customer_appeal: ['rebel', 'pirate', 'desperate'],
    profit_margin_modifier: 0.6
  }
];

// Enhanced Basic Sidearm Product
export const basicSidearmWithMethods: Product & { manufacturing_methods: ManufacturingMethod[] } = {
  // All existing properties
  id: 'basic_sidearm',
  name: 'Basic Sidearm',
  category: ProductCategory.HANDHELD_WEAPON,
  description: 'A simple, reliable pistol suitable for personal defense. No frills, just functional.',
  military_classification: MilitaryClassification.CIVILIAN,
  
  size_class: 'tiny',
  weight: 1.2,
  floor_space_required: 0.5,
  complexity_rating: 2,
  
  base_material_cost: 50,
  base_labor_hours: 2,
  market_price: 150,
  development_cost: 500,
  
  required_tools: [ToolType.HAND_TOOLS, ToolType.POWER_TOOLS],
  required_traits: [],
  materials_required: [
    {
      material_id: 'steel',
      quantity_per_unit: 1.0,
      substitutable: false,
      critical_path: true
    },
    {
      material_id: 'plastic',
      quantity_per_unit: 0.3,
      substitutable: true,
      critical_path: false
    }
  ],
  
  tool_efficiency_bonus: {
    [ToolType.HAND_TOOLS]: 1.0,
    [ToolType.POWER_TOOLS]: 1.2,
    [ToolType.PRECISION_MACHINERY]: 1.5
  },
  complexity_penalties: {
    error_rate_base: 0.05,
    learning_curve: 0.95,
    quality_sensitivity: 0.3
  },
  optimal_batch_size: 10,
  setup_time: 1,
  economies_of_scale: 1.2,
  
  quality_rating: 70,
  reliability_factor: 0.9,
  defect_types: [DefectType.COSMETIC, DefectType.PERFORMANCE],
  quality_factors: {
    worker_skill_level: 0.7,
    tool_precision: 0.8,
    material_grade: 0.7,
    production_speed: 0.8,
    facility_condition: 0.7
  },
  
  demand_volatility: 0.2,
  target_customers: [CustomerType.CIVILIAN, CustomerType.CORPORATE],
  competing_products: [],
  
  contract_categories: ['personal_defense', 'security_equipment'],
  warranty_period: 365,
  
  prerequisite_tech: [],
  unlocks_tech: ['improved_sidearms', 'basic_rifles'],
  research_complexity: 1,
  innovation_potential: 0.3,
  
  variant_products: ['military_sidearm', 'compact_sidearm'],
  modular_components: ['laser_sight', 'extended_magazine'],
  scaling_options: ['compact_sidearm', 'heavy_pistol'],
  
  // New manufacturing methods
  manufacturing_methods: basicSidearmMethods
};

// Combat Rifle Manufacturing Methods
const combatRifleMethods: ManufacturingMethod[] = [
  {
    id: 'combat_rifle_forge',
    name: 'Forge New',
    description: 'Manufacture a military-grade assault rifle',
    output_state: 'pristine',
    output_quality_range: [85, 98],
    required_facility_traits: ['precision_machining'],
    required_tools: ['cnc_mill', 'lathe', 'testing_range'],
    steps: [
      createStep(
        'receiver_machining',
        'Receiver Machining',
        30,
        [
          { category: TagCategory.MILLING, minimum: 50, optimal: 80 },
          { category: TagCategory.DRILLING, minimum: 40, optimal: 70 },
          { category: TagCategory.SURFACE, minimum: 3 },
          { category: TagCategory.HOLDING, minimum: true },
          { category: TagCategory.POWERED, minimum: true },
          { category: TagCategory.COMPUTER_CONTROLLED, minimum: true }
        ],
        {
          material_requirements: [
            { material_id: 'aircraft_aluminum', quantity: 2, consumed_at_start: true }
          ],
          labor_skill: 'skilled_machinist',
          failure_chance: 0.05,
          failure_result: 'scrap',
          requires_continuous_operation: true
        }
      ),
      createStep(
        'barrel_production',
        'Barrel Production',
        25,
        [
          { category: TagCategory.TURNING, minimum: 60, optimal: 85 },
          { category: TagCategory.DRILLING, minimum: 70, optimal: 90 },
          { category: TagCategory.GRINDING, minimum: 30, optimal: 50 },
          { category: TagCategory.POWERED, minimum: true }
        ],
        {
          material_requirements: [
            { material_id: 'high_carbon_steel', quantity: 1.5, consumed_at_start: true }
          ],
          labor_skill: 'skilled_machinist',
          failure_chance: 0.08,
          failure_result: 'scrap'
        }
      ),
      createStep(
        'component_assembly',
        'Component Assembly',
        30,
        [
          { category: TagCategory.SURFACE, minimum: 4 },
          { category: TagCategory.PRECISION_MANIPULATION, minimum: 30, optimal: 50 },
          { category: TagCategory.BASIC_MANIPULATION, minimum: 20 }
        ],
        {
          material_requirements: [
            { material_id: 'weapon_components', quantity: 1, consumed_at_start: true },
            { material_id: 'composite_materials', quantity: 0.5, consumed_at_start: true }
          ],
          labor_skill: 'skilled_technician',
          failure_chance: 0.03,
          failure_result: 'downgrade'
        }
      ),
      createStep(
        'calibration_testing',
        'Calibration & Testing',
        15,
        [
          { category: TagCategory.QUALITY_CONTROL, minimum: true },
          { category: TagCategory.DIMENSIONAL_INSPECTION, minimum: true },
          { category: TagCategory.MEASURING, minimum: true }
        ],
        {
          labor_skill: 'quality_inspector',
          requires_quality_check: true
        }
      )
    ],
    total_duration_hours: 8,
    labor_cost_multiplier: 2.5,
    complexity_rating: 8,
    customer_appeal: ['military', 'government', 'pmc'],
    profit_margin_modifier: 1.8
  }
];

// Example of a complex electronic product
const targetingSystemMethods: ManufacturingMethod[] = [
  {
    id: 'targeting_system_manufacture',
    name: 'Manufacture Advanced Targeting System',
    description: 'Produce military-grade electronic targeting system',
    output_state: 'pristine',
    output_quality_range: [90, 99],
    required_facility_traits: ['clean_room', 'precision_machining'],
    required_tools: ['electronics_assembly', 'cnc_mill', 'testing_equipment'],
    steps: [
      createStep(
        'pcb_production',
        'PCB Production',
        20,
        [
          { category: TagCategory.CLEAN_ROOM, minimum: true },
          { category: TagCategory.ELECTRONICS_ASSEMBLY, minimum: 40, optimal: 70 },
          { category: TagCategory.PRECISION_MANIPULATION, minimum: 60, optimal: 85 },
          { category: TagCategory.TEMPERATURE_CONTROLLED, minimum: true }
        ],
        {
          material_requirements: [
            { material_id: 'pcb_substrate', quantity: 2, consumed_at_start: true },
            { material_id: 'electronic_components', quantity: 5, consumed_at_start: true }
          ],
          labor_skill: 'specialist',
          failure_chance: 0.1,
          failure_result: 'scrap',
          requires_continuous_operation: true
        }
      ),
      createStep(
        'optics_assembly',
        'Optics Assembly',
        25,
        [
          { category: TagCategory.CLEAN_ROOM, minimum: true },
          { category: TagCategory.OPTICS_HANDLING, minimum: 50, optimal: 80 },
          { category: TagCategory.PRECISION_MANIPULATION, minimum: 70, optimal: 90 },
          { category: TagCategory.VIBRATION_ISOLATION, minimum: true }
        ],
        {
          material_requirements: [
            { material_id: 'optical_lenses', quantity: 3, consumed_at_start: true },
            { material_id: 'laser_diode', quantity: 1, consumed_at_start: true }
          ],
          labor_skill: 'specialist',
          failure_chance: 0.15,
          failure_result: 'scrap'
        }
      )
    ],
    total_duration_hours: 12,
    labor_cost_multiplier: 4.0,
    complexity_rating: 10,
    customer_appeal: ['military', 'government'],
    profit_margin_modifier: 2.5
  }
];

// Export example products with methods
export const productsWithMethods = {
  basic_sidearm: basicSidearmWithMethods,
  // Additional products would be defined here
};