// Material definitions
import type { Material } from '../types/material';

export const materials: Record<string, Material> = {
  // Basic materials
  steel: {
    id: 'steel',
    name: 'Steel',
    description: 'Common alloy used in basic manufacturing',
    unit: 'kg',
    base_cost: 10,
    availability: 'common'
  },
  plastic: {
    id: 'plastic',
    name: 'Plastic',
    description: 'Polymer material for grips and non-critical components',
    unit: 'kg',
    base_cost: 5,
    availability: 'common'
  },
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum',
    description: 'Lightweight metal for frames and housings',
    unit: 'kg',
    base_cost: 15,
    availability: 'common'
  },
  
  // Advanced materials
  titanium: {
    id: 'titanium',
    name: 'Titanium',
    description: 'High-strength, lightweight metal for military applications',
    unit: 'kg',
    base_cost: 100,
    availability: 'uncommon'
  },
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Carbon Fiber',
    description: 'Advanced composite material for high-performance parts',
    unit: 'kg',
    base_cost: 150,
    availability: 'uncommon'
  },
  
  // Electronic components
  basic_electronics: {
    id: 'basic_electronics',
    name: 'Basic Electronics',
    description: 'Standard electronic components and circuits',
    unit: 'units',
    base_cost: 20,
    availability: 'common'
  },
  advanced_electronics: {
    id: 'advanced_electronics',
    name: 'Advanced Electronics',
    description: 'High-grade processors and control systems',
    unit: 'units',
    base_cost: 500,
    availability: 'uncommon'
  },
  
  // Specialized components
  plasma_core: {
    id: 'plasma_core',
    name: 'Plasma Core',
    description: 'Energy containment unit for plasma weapons',
    unit: 'units',
    base_cost: 2000,
    availability: 'rare',
    storage_requirements: ['hazmat_certified', 'temperature_controlled']
  },
  power_cell: {
    id: 'power_cell',
    name: 'Power Cell',
    description: 'High-capacity energy storage',
    unit: 'units',
    base_cost: 100,
    availability: 'common'
  }
};

// Helper to get material by ID
export function getMaterial(materialId: string): Material | undefined {
  return materials[materialId];
}

// Helper to calculate total material cost
export function calculateMaterialCost(materialId: string, quantity: number): number {
  const material = getMaterial(materialId);
  return material ? material.base_cost * quantity : 0;
}