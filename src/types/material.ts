// Material type definitions

export interface Material {
  id: string;
  name: string;
  description: string;
  unit: string; // kg, units, liters, etc.
  base_cost: number; // per unit
  availability: 'common' | 'uncommon' | 'rare' | 'exotic';
  storage_requirements?: string[];
}