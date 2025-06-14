// Facility type definitions

import { TagCategory } from '../constants/enums';
import type { ProductionLine } from './productionLine';
import type { EquipmentInstance } from './equipment';
import type { ProductionQueue } from './productionJob';
import type { FacilityTrait, ItemSize } from './shared';
import type { FacilityInventory } from './inventory';

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
  production_lines: number // Legacy - will be deprecated
  max_item_size: ItemSize
  storage_capacity: number
  floor_space: number
  used_floor_space: number // Space occupied by equipment
  
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
  
  // Equipment System
  equipment: EquipmentInstance[]
  equipment_capacity: Map<TagCategory, number> // Aggregated equipment capabilities
  
  // Production Management
  production_queue?: ProductionQueue
  active_production: ProductionLine[] // Legacy - to be migrated
  
  // Storage (legacy and new systems)
  current_storage: Record<string, number> // LEGACY: Material/component -> amount
  inventory?: FacilityInventory // NEW: Unified inventory system
  pending_upgrades: FacilityUpgrade[]
  
  // Condition & Status
  condition: FacilityCondition
  utilization_rate: number
  last_maintenance: number // Turn number
  
  // Workers (future feature)
  assigned_workers?: number
  max_workers?: number
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
    storage_capacity: 1000,
    floor_space: 50,
    used_floor_space: 0,
    
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
    equipment: [], // Will be populated by game store
    equipment_capacity: new Map<TagCategory, number>(), // Will be calculated from equipment
    
    active_production: [{
      id: 'line-1',
      productId: null,
      startGameTime: 0,
      durationHours: 0,
      materials_loaded: false,
      labor_assigned: 0,
    }],
    current_storage: {
      // Starter materials for testing - enough for 2-3 jobs each
      
      // Raw materials for manufacturing
      steel: 20,
      plastic: 15,
      aluminum: 2,
      
      // Components for assembly/repair (based on baseItem definitions)
      'mechanical-component': 30, // For creating mechanical-assembly (10x needed per assembly)
      'small-tube': 5, // Direct component for basic_sidearm  
      'small-casing': 5, // Direct component for basic_sidearm
      'mechanical-assembly': 3, // Pre-made assemblies for repairs
      
      // Repair and restoration materials
      damaged_basic_sidearm: 3,
      low_tech_spares: 20, // Fallback repair materials
      
      // Additional useful materials  
      basic_electronics: 3,
      machined_parts: 5,
      cleaning_supplies: 10 // For treatment workflows
    },
    pending_upgrades: [],
    
    condition: 'operational',
    utilization_rate: 0,
    last_maintenance: 0,
  }
  
  console.log('createGarage returning:', garage)
  return garage
}