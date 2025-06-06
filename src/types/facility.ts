// Facility type definitions

import type { ProductionLine } from './productionLine';

// Inline shared types to avoid import issues
export type FacilityTrait = 
  | 'clean_room'
  | 'heavy_lifting'
  | 'precision_machining'
  | 'hazmat_certified'
  | 'automated_assembly'
  | 'quality_control'

export type ItemSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge'

export type FacilityType = 
  | 'garage_workshop'
  | 'machine_shop'
  | 'electronics_lab'
  | 'assembly_plant'
  | 'orbital_foundry'

export type FacilityCondition = 
  | 'operational' 
  | 'maintenance_needed' 
  | 'damaged' 
  | 'offline'


export interface UpgradeEffect {
  production_line_bonus?: number
  storage_bonus?: number
  traits_granted?: FacilityTrait[]
  size_limit_increase?: number
  speed_multiplier?: number
  quality_bonus?: number
  labor_cost_modifier?: number
}

export interface FacilityUpgrade {
  id: string
  name: string
  effects: UpgradeEffect
  space_used: number
  purchase_cost: number
  install_date: number // Turn number when installed
}


export interface Facility {
  // Identity & Classification
  id: string
  name: string
  type: FacilityType
  description: string
  
  // Physical Constraints
  production_lines: number
  max_item_size: ItemSize
  storage_capacity: number
  floor_space: number
  
  // Economic Data
  purchase_cost: number
  operating_cost_per_day: number
  current_value: number
  
  // Capability System
  traits: FacilityTrait[]
  can_refurbish: string[] // Material types
  manufacturing_bonus: Record<string, number> // Category -> multiplier
  
  // Upgrade System
  upgrades: FacilityUpgrade[]
  
  // Operational State
  active_production: ProductionLine[]
  current_storage: Record<string, number> // Material/component -> amount
  pending_upgrades: FacilityUpgrade[]
  
  // Condition & Status
  condition: FacilityCondition
  utilization_rate: number
  last_maintenance: number // Turn number
}

// Factory function to create a basic garage
export function createGarage(name: string): Facility {
  console.log('createGarage called with name:', name)
  
  const garage: Facility = {
    id: `facility-${Date.now()}`,
    name,
    type: 'garage_workshop',
    description: 'A small garage workshop, suitable for basic manufacturing',
    
    production_lines: 1,
    max_item_size: 'small',
    storage_capacity: 100,
    floor_space: 50,
    
    purchase_cost: 0, // Player starts with this
    operating_cost_per_day: 10,
    current_value: 500,
    
    traits: [],
    can_refurbish: ['scrap_metal'],
    manufacturing_bonus: {
      'hand_weapons': 1.0,
      'basic_components': 0.8,
    },
    
    upgrades: [],
    
    active_production: [{
      id: 'line-1',
      productId: null,
      startGameTime: 0,
      durationHours: 0,
      materials_loaded: false,
      labor_assigned: 0,
    }],
    current_storage: {},
    pending_upgrades: [],
    
    condition: 'operational',
    utilization_rate: 0,
    last_maintenance: 0,
  }
  
  console.log('createGarage returning:', garage)
  return garage
}