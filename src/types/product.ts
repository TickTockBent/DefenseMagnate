// Product type definitions

import type { ManufacturingMethod, ProductState } from './manufacturing';

// Temporarily inline shared types to eliminate import issues
type FacilityTrait = 
  | 'clean_room'
  | 'heavy_lifting'
  | 'precision_machining'
  | 'hazmat_certified'
  | 'automated_assembly'
  | 'quality_control'
  | 'basic_tools'

type ItemSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge'

export enum ProductCategory {
  HANDHELD_WEAPON = 'handheld_weapon',
  VEHICLE_WEAPON = 'vehicle_weapon',
  ELECTRONICS = 'electronics',
  VEHICLE = 'vehicle',
  SHIP_COMPONENT = 'ship_component',
  AMMUNITION = 'ammunition',
  ARMOR = 'armor',
  SUPPORT_EQUIPMENT = 'support_equipment'
}

export enum MilitaryClassification {
  CIVILIAN = 'civilian',
  RESTRICTED = 'restricted',
  MILITARY = 'military',
  CLASSIFIED = 'classified'
}


export enum ToolType {
  HAND_TOOLS = 'hand_tools',
  POWER_TOOLS = 'power_tools',
  PRECISION_MACHINERY = 'precision_machinery',
  AUTOMATED_SYSTEMS = 'automated_systems',
  SPECIALIZED_EQUIPMENT = 'specialized_equipment'
}


export enum DefectType {
  COSMETIC = 'cosmetic',
  PERFORMANCE = 'performance',
  CRITICAL = 'critical'
}

export enum CustomerType {
  MILITARY = 'military',
  CORPORATE = 'corporate',
  CIVILIAN = 'civilian',
  GOVERNMENT = 'government'
}

export interface MaterialRequirement {
  material_id: string;
  quantity_per_unit: number;
  substitutable: boolean;
  critical_path: boolean;
}

export interface ToolEfficiencyBonus {
  [key: string]: number; // Tool type to efficiency multiplier
}

export interface ComplexityPenalties {
  error_rate_base: number;
  learning_curve: number; // Time reduction factor per unit produced
  quality_sensitivity: number; // How much tool/facility quality affects output
}

export interface QualityFactors {
  worker_skill_level: number;
  tool_precision: number;
  material_grade: number;
  production_speed: number;
  facility_condition: number;
}

export interface Product {
  // Identity & Classification
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  military_classification: MilitaryClassification;

  // Physical Requirements
  size_class: ItemSize;
  weight: number; // kg
  floor_space_required: number; // square meters per unit
  complexity_rating: number; // 1-10 scale

  // Economic Data
  base_material_cost: number;
  base_labor_hours: number;
  market_price: number;
  development_cost: number;
  profit_margin?: number; // Calculated field

  // Production Requirements
  required_tools: ToolType[];
  required_traits: FacilityTrait[];
  materials_required: MaterialRequirement[];

  // Production Efficiency Modifiers
  tool_efficiency_bonus: ToolEfficiencyBonus;
  complexity_penalties: ComplexityPenalties;
  optimal_batch_size: number;
  setup_time: number; // hours
  economies_of_scale: number; // Efficiency multiplier for large batches

  // Quality Control
  quality_rating: number; // 1-100
  reliability_factor: number; // Expected operational lifespan multiplier
  defect_types: DefectType[];
  quality_factors: QualityFactors;

  // Market & Contract Data
  demand_volatility: number; // 0-1, how much price fluctuates
  seasonal_demand?: number[]; // Optional array of monthly demand multipliers
  competing_products: string[]; // Product IDs
  target_customers: CustomerType[];

  // Contract Compatibility
  contract_categories: string[];
  customization_options?: string[];
  delivery_constraints?: string[];
  warranty_period: number; // days

  // Research & Development
  prerequisite_tech: string[]; // Tech IDs
  unlocks_tech: string[]; // Tech IDs
  research_complexity: number; // 1-10
  innovation_potential: number; // 0-1, chance of breakthroughs

  // Upgrade Paths
  variant_products?: string[]; // Product IDs
  modular_components?: string[];
  scaling_options?: string[]; // Product IDs for different sizes

  // Manufacturing Methods (new multi-step system)
  manufacturing_methods?: ManufacturingMethod[]; // Multiple ways to make this product
  default_method_id?: string; // Which method to use by default
  
  // Product state variants
  state_variants?: Record<ProductState, {
    name_suffix: string; // e.g., "Damaged" for damaged state
    quality_modifier: number; // Multiplier for base quality
    price_modifier: number; // Multiplier for base price
    description_override?: string;
  }>;
}

// Helper function to calculate profit margin
export function calculateProfitMargin(product: Product): number {
  const totalCost = product.base_material_cost + (product.base_labor_hours * 10); // Assuming $10/hour labor
  return product.market_price - totalCost;
}

// Helper function to check if a facility can produce a product
export function canFacilityProduce(product: Product, facilityTraits: string[], availableTools: string[]): boolean {
  // Check if all required traits are present
  const hasAllTraits = product.required_traits.every(trait => 
    facilityTraits.includes(trait)
  );

  // Check if all required tools are available
  const hasAllTools = product.required_tools.every(tool => 
    availableTools.includes(tool)
  );

  return hasAllTraits && hasAllTools;
}

// Helper function to calculate production efficiency
export function calculateProductionEfficiency(
  product: Product, 
  availableTools: string[],
  batchSize: number
): number {
  let efficiency = 1.0;

  // Apply tool efficiency bonuses
  product.required_tools.forEach(requiredTool => {
    if (availableTools.includes(requiredTool)) {
      efficiency *= product.tool_efficiency_bonus[requiredTool] || 1.0;
    } else {
      efficiency *= 0.3; // Penalty for missing required tools
    }
  });

  // Apply batch size efficiency
  if (batchSize >= product.optimal_batch_size) {
    efficiency *= product.economies_of_scale;
  }

  return efficiency;
}

// Helper function to calculate defect rate
export function calculateDefectRate(
  product: Product,
  qualityFactors: Partial<QualityFactors>
): number {
  const baseRate = product.complexity_penalties.error_rate_base;
  
  // Apply quality factor modifiers
  const avgQualityFactor = Object.values(qualityFactors).reduce((sum, val) => sum + (val || 0), 0) / 
    Object.keys(qualityFactors).length;
  
  // Higher quality factors reduce defect rate
  const adjustedRate = baseRate * (2 - avgQualityFactor);
  
  return Math.max(0, Math.min(1, adjustedRate)); // Clamp between 0-1
}