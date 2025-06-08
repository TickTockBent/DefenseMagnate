// LEGACY: Product helper functions for old manufacturing system
// SUPERSEDED BY: Component-based manufacturing in manufacturingMethods.ts
// This file is maintained for potential future use but not currently active

import { ManufacturingMethod, ProductState, TagCategory, TagRequirement } from '../types';
import { upgradeManufacturingMethod } from '../utils/upgradeManufacturingSteps';

// Helper to create basic tag requirements for simple operations
function createBasicTags(manipulation: number = 5, surface: number = 1): TagRequirement[] {
  return [
    {
      category: TagCategory.BASIC_MANIPULATION,
      minimum: manipulation,
      optimal: manipulation * 2,
      consumes: manipulation
    },
    {
      category: TagCategory.SURFACE,
      minimum: surface,
      optimal: surface * 2,
      consumes: surface
    }
  ];
}

function createMachiningTags(machining: TagCategory, value: number = 10, surface: number = 2): TagRequirement[] {
  return [
    {
      category: machining,
      minimum: value,
      optimal: value * 2,
      consumes: value
    },
    {
      category: TagCategory.SURFACE,
      minimum: surface,
      optimal: surface * 2,
      consumes: surface
    },
    {
      category: TagCategory.BASIC_MANIPULATION,
      minimum: 5,
      optimal: 10,
      consumes: 5
    }
  ];
}

// Define a minimal product interface for runtime use
export interface ProductData {
  id: string;
  name: string;
  materials_required: Array<{
    material_id: string;
    quantity_per_unit: number;
  }>;
  base_labor_hours: number;
  complexity_rating: number;
  // New manufacturing-specific fields
  manufacturing_methods?: ManufacturingMethod[];
  default_method_id?: string;
  state_variants?: Record<ProductState, {
    name_suffix: string;
    quality_modifier: number;
    price_modifier: number;
    description_override?: string;
  }>;
}

// Runtime product definitions (without importing the full Product interface)
export const productData: Record<string, ProductData> = {
  basic_sidearm: {
    id: 'basic_sidearm',
    name: 'Basic Sidearm',
    materials_required: [
      {
        material_id: 'steel',
        quantity_per_unit: 1.0,
      },
      {
        material_id: 'plastic',
        quantity_per_unit: 0.3,
      }
    ],
    base_labor_hours: 2,
    complexity_rating: 2,
    
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
        required_facility_traits: ['basic_tools'],
        required_tools: ['hand_tools'],
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
  }
};

// Helper functions that can be safely imported by gameStore
export function getProductData(productId: string): ProductData | undefined {
  const product = productData[productId];
  if (!product) return undefined;
  
  // Upgrade manufacturing methods to include required_tags if missing
  if (product.manufacturing_methods) {
    return {
      ...product,
      manufacturing_methods: product.manufacturing_methods.map(upgradeManufacturingMethod)
    };
  }
  
  return product;
}

export function getAllProductIds(): string[] {
  return Object.keys(productData);
}

export function canAffordMaterials(
  productId: string, 
  quantity: number, 
  availableMaterials: Record<string, number>
): boolean {
  const product = getProductData(productId);
  if (!product) return false;
  
  return product.materials_required.every(req => 
    (availableMaterials[req.material_id] || 0) >= req.quantity_per_unit * quantity
  );
}