// Product definitions

import { 
  Product,
  ProductCategory, 
  MilitaryClassification, 
  ToolType, 
  DefectType,
  CustomerType
} from '../types';

export const products: Record<string, Product> = {
  basic_sidearm: {
    // Identity & Classification
    id: 'basic_sidearm',
    name: 'Basic Sidearm',
    category: ProductCategory.HANDHELD_WEAPON,
    description: 'A simple, reliable pistol suitable for personal defense. No frills, just functional.',
    military_classification: MilitaryClassification.CIVILIAN,

    // Physical Requirements
    size_class: 'tiny',
    weight: 1.2, // kg
    floor_space_required: 0.5, // square meters per unit
    complexity_rating: 2, // Simple design

    // Economic Data
    base_material_cost: 50,
    base_labor_hours: 2,
    market_price: 150,
    development_cost: 500,

    // Production Requirements
    required_tools: [ToolType.HAND_TOOLS, ToolType.POWER_TOOLS],
    required_traits: [], // Basic facility can produce this
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

    // Production Efficiency Modifiers
    tool_efficiency_bonus: {
      [ToolType.HAND_TOOLS]: 1.0,
      [ToolType.POWER_TOOLS]: 1.2,
      [ToolType.PRECISION_MACHINERY]: 1.5
    },
    complexity_penalties: {
      error_rate_base: 0.05, // 5% base defect rate
      learning_curve: 0.95, // 5% improvement per batch
      quality_sensitivity: 0.3 // Low sensitivity to tool quality
    },
    optimal_batch_size: 10,
    setup_time: 1, // hours
    economies_of_scale: 1.2,

    // Quality Control
    quality_rating: 70, // Decent quality
    reliability_factor: 0.9,
    defect_types: [DefectType.COSMETIC, DefectType.PERFORMANCE],
    quality_factors: {
      worker_skill_level: 0.7,
      tool_precision: 0.8,
      material_grade: 0.7,
      production_speed: 0.8,
      facility_condition: 0.7
    },

    // Market & Contract Data
    demand_volatility: 0.2, // Stable demand
    target_customers: [CustomerType.CIVILIAN, CustomerType.CORPORATE],
    competing_products: [],

    // Contract Compatibility
    contract_categories: ['personal_defense', 'security_equipment'],
    warranty_period: 365, // 1 year

    // Research & Development
    prerequisite_tech: [], // No prerequisites - starting product
    unlocks_tech: ['improved_sidearms', 'basic_rifles'],
    research_complexity: 1,
    innovation_potential: 0.3,

    // Upgrade Paths
    variant_products: ['military_sidearm', 'compact_sidearm'],
    modular_components: ['laser_sight', 'extended_magazine'],
    scaling_options: ['compact_sidearm', 'heavy_pistol'],

    // Manufacturing Methods (new multi-step system)
    manufacturing_methods: [
      // Method 1: Restoration - repair damaged weapons
      {
        id: 'restore_basic_sidearm',
        name: 'Restore Basic Sidearm',
        description: 'Repair damaged weapons back to working condition',
        input_state: 'damaged',
        output_state: 'functional',
        output_quality_range: [60, 80],
        required_facility_traits: ['basic_tools'],
        required_tools: ['hand_tools'],
        total_duration_hours: 3,
        labor_cost_multiplier: 0.8,
        complexity_rating: 3,
        customer_appeal: ['civilian', 'corporate'],
        profit_margin_modifier: 1.2,
        steps: [
          {
            id: 'cleaning',
            name: 'Cleaning',
            duration_percentage: 30,
            material_requirements: [
              {
                material_id: 'damaged_basic_sidearm',
                quantity: 1,
                consumed_at_start: true
              }
            ],
            labor_skill: 'unskilled',
            can_fail: false,
            failure_chance: 0,
            description: 'Clean and disassemble the damaged weapon'
          },
          {
            id: 'repairing',
            name: 'Repairing',
            duration_percentage: 60,
            material_requirements: [
              {
                material_id: 'low_tech_spares',
                quantity: 2,
                consumed_at_start: true
              }
            ],
            labor_skill: 'skilled_technician',
            can_fail: true,
            failure_chance: 0.05,
            failure_result: 'scrap',
            description: 'Replace broken components and repair mechanisms'
          },
          {
            id: 'testing_polishing',
            name: 'Testing & Polishing',
            duration_percentage: 10,
            material_requirements: [],
            labor_skill: 'unskilled',
            can_fail: false,
            failure_chance: 0,
            description: 'Test functionality and apply final polish'
          }
        ]
      },
      
      // Method 2: Forged Manufacturing - build from raw materials
      {
        id: 'forge_basic_sidearm',
        name: 'Forge Basic Sidearm',
        description: 'Manufacture new high-quality weapons from raw materials',
        output_state: 'pristine',
        output_quality_range: [85, 95],
        required_facility_traits: ['precision_machining'],
        required_tools: ['precision_machinery'],
        total_duration_hours: 5,
        labor_cost_multiplier: 1.5,
        complexity_rating: 6,
        customer_appeal: ['military', 'government'],
        profit_margin_modifier: 1.8,
        steps: [
          {
            id: 'material_prep',
            name: 'Material Preparation',
            duration_percentage: 15,
            material_requirements: [
              {
                material_id: 'steel',
                quantity: 1,
                consumed_at_start: true
              },
              {
                material_id: 'plastic',
                quantity: 0.3,
                consumed_at_start: true
              }
            ],
            labor_skill: 'unskilled',
            can_fail: false,
            failure_chance: 0,
            description: 'Cut and prepare raw materials for machining'
          },
          {
            id: 'precision_machining',
            name: 'Precision Machining',
            duration_percentage: 50,
            material_requirements: [
              {
                material_id: 'machined_parts',
                quantity: 1,
                consumed_at_start: true
              }
            ],
            labor_skill: 'skilled_machinist',
            can_fail: true,
            failure_chance: 0.10,
            failure_result: 'wasted_materials',
            description: 'Machine precision components and parts'
          },
          {
            id: 'assembly',
            name: 'Assembly',
            duration_percentage: 25,
            material_requirements: [],
            labor_skill: 'skilled_technician',
            can_fail: true,
            failure_chance: 0.05,
            failure_result: 'downgrade',
            description: 'Assemble all components into final product'
          },
          {
            id: 'quality_control',
            name: 'Quality Control',
            duration_percentage: 10,
            material_requirements: [],
            labor_skill: 'quality_inspector',
            can_fail: false,
            failure_chance: 0,
            description: 'Final inspection and quality testing'
          }
        ]
      },
      
      // Method 3: Cobbled Assembly - make cheap weapons from scrap
      {
        id: 'cobble_basic_sidearm',
        name: 'Cobble Basic Sidearm',
        description: 'Assemble cheap weapons from spare parts and scrap',
        output_state: 'junk',
        output_quality_range: [25, 45],
        required_facility_traits: ['basic_tools'],
        required_tools: ['hand_tools'],
        total_duration_hours: 4,
        labor_cost_multiplier: 0.6,
        complexity_rating: 2,
        customer_appeal: ['civilian'],
        profit_margin_modifier: 0.8,
        steps: [
          {
            id: 'sorting_components',
            name: 'Sorting Components',
            duration_percentage: 20,
            material_requirements: [
              {
                material_id: 'low_tech_spares',
                quantity: 5,
                consumed_at_start: true
              }
            ],
            labor_skill: 'unskilled',
            can_fail: false,
            failure_chance: 0,
            description: 'Sort through spare parts to find usable components'
          },
          {
            id: 'improvised_assembly',
            name: 'Improvised Assembly',
            duration_percentage: 60,
            material_requirements: [
              {
                material_id: 'low_tech_spares',
                quantity: 2,
                consumed_at_start: false
              }
            ],
            labor_skill: 'unskilled',
            can_fail: true,
            failure_chance: 0.15,
            failure_result: 'scrap',
            description: 'Cobble together parts using improvised techniques'
          },
          {
            id: 'basic_testing',
            name: 'Basic Testing',
            duration_percentage: 20,
            material_requirements: [],
            labor_skill: 'unskilled',
            can_fail: true,
            failure_chance: 0.10,
            failure_result: 'downgrade',
            description: 'Basic functionality test'
          }
        ]
      }
    ],
    default_method_id: 'forge_basic_sidearm',
    
    // Product state variants
    state_variants: {
      pristine: {
        name_suffix: '',
        quality_modifier: 1.0,
        price_modifier: 1.0
      },
      functional: {
        name_suffix: '',
        quality_modifier: 0.9,
        price_modifier: 0.85
      },
      damaged: {
        name_suffix: ' (Damaged)',
        quality_modifier: 0.3,
        price_modifier: 0.2
      },
      junk: {
        name_suffix: ' (Junk Quality)',
        quality_modifier: 0.5,
        price_modifier: 0.6
      },
      scrap: {
        name_suffix: ' (Scrap)',
        quality_modifier: 0.1,
        price_modifier: 0.05,
        description_override: 'Non-functional weapon parts suitable only for salvage'
      }
    }
  },

  // Example of a more complex product for reference
  plasma_rifle: {
    // Identity & Classification
    id: 'plasma_rifle',
    name: 'M-47 Plasma Rifle',
    category: ProductCategory.HANDHELD_WEAPON,
    description: 'Advanced energy weapon utilizing superheated plasma bolts. Military-grade firepower.',
    military_classification: MilitaryClassification.MILITARY,

    // Physical Requirements
    size_class: 'small',
    weight: 4.5, // kg
    floor_space_required: 2.0,
    complexity_rating: 8, // Complex design

    // Economic Data
    base_material_cost: 2500,
    base_labor_hours: 20,
    market_price: 8000,
    development_cost: 50000,

    // Production Requirements
    required_tools: [
      ToolType.PRECISION_MACHINERY,
      ToolType.AUTOMATED_SYSTEMS,
      ToolType.SPECIALIZED_EQUIPMENT
    ],
    required_traits: [
      'clean_room',
      'precision_machining',
      'quality_control'
    ],
    materials_required: [
      {
        material_id: 'titanium',
        quantity_per_unit: 2.0,
        substitutable: false,
        critical_path: true
      },
      {
        material_id: 'plasma_core',
        quantity_per_unit: 1.0,
        substitutable: false,
        critical_path: true
      },
      {
        material_id: 'advanced_electronics',
        quantity_per_unit: 3.0,
        substitutable: false,
        critical_path: true
      }
    ],

    // Production Efficiency Modifiers
    tool_efficiency_bonus: {
      [ToolType.PRECISION_MACHINERY]: 1.0,
      [ToolType.AUTOMATED_SYSTEMS]: 1.5,
      [ToolType.SPECIALIZED_EQUIPMENT]: 1.3
    },
    complexity_penalties: {
      error_rate_base: 0.25, // 25% base defect rate - very complex
      learning_curve: 0.90, // 10% improvement per batch
      quality_sensitivity: 0.8 // High sensitivity to tool quality
    },
    optimal_batch_size: 5,
    setup_time: 8, // hours
    economies_of_scale: 1.5,

    // Quality Control
    quality_rating: 90,
    reliability_factor: 0.95,
    defect_types: [DefectType.PERFORMANCE, DefectType.CRITICAL],
    quality_factors: {
      worker_skill_level: 0.9,
      tool_precision: 0.95,
      material_grade: 0.9,
      production_speed: 0.7,
      facility_condition: 0.9
    },

    // Market & Contract Data
    demand_volatility: 0.4, // Moderate volatility
    target_customers: [CustomerType.MILITARY, CustomerType.GOVERNMENT],
    competing_products: ['laser_rifle', 'rail_rifle'],

    // Contract Compatibility
    contract_categories: ['military_weapons', 'special_forces', 'energy_weapons'],
    warranty_period: 730, // 2 years

    // Research & Development
    prerequisite_tech: ['plasma_technology', 'advanced_materials', 'energy_weapons'],
    unlocks_tech: ['plasma_cannon', 'miniaturized_plasma'],
    research_complexity: 8,
    innovation_potential: 0.7,

    // Upgrade Paths
    variant_products: ['plasma_rifle_mk2', 'plasma_sniper'],
    modular_components: ['overcharge_module', 'cooling_system', 'scope_attachment'],
    scaling_options: ['plasma_pistol', 'plasma_cannon']
  }
};

// Helper to get product by ID
export function getProduct(productId: string): Product | undefined {
  return products[productId];
}

// Helper to get all products in a category
export function getProductsByCategory(category: ProductCategory): Product[] {
  return Object.values(products).filter(p => p.category === category);
}

// Helper to get products that can be produced with current tech
export function getAvailableProducts(completedTech: string[]): Product[] {
  return Object.values(products).filter(product => 
    product.prerequisite_tech.every(tech => completedTech.includes(tech))
  );
}