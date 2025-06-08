// Unified Item System Types
// Replaces fragmented item variants with base items + tags + quality

import { ItemManufacturingType } from './manufacturing';

export enum ItemCategory {
  MATERIAL = 'material',
  PRODUCT = 'product', 
  COMPONENT = 'component'
}

export enum ItemTag {
  // Condition Tags
  DAMAGED = 'damaged',           // Severe quality penalty, very low value
  JUNK = 'junk',                // Quality cap at 45%, made from scrap materials
  RESTORED = 'restored',         // Repaired from damaged condition, moderate quality
  FORGED = 'forged',            // Manufactured from raw materials, high quality
  HAND_FORGED = 'hand_forged',   // Artisan quality bonus, premium market value
  MILITARY_GRADE = 'military_grade', // Meets military specifications
  
  // Material Tags
  TITANIUM = 'titanium',         // Lightweight, corrosion-resistant, premium pricing
  STEEL = 'steel',              // Standard materials, balanced cost/performance
  COMPOSITE = 'composite',       // Advanced materials, specialized applications
  SALVAGED = 'salvaged',        // Recycled materials, cost savings
  STANDARD = 'standard',        // Standard grade materials
  PREMIUM = 'premium',          // High grade materials
  
  // NEW: Component Manufacturing Tags
  ROUGH = 'rough',              // Unfinished manufacturing state
  PRECISION = 'precision',       // Refined manufacturing state
  ASSEMBLY = 'assembly',         // Combined components
  CASING = 'casing',            // External housing/protection
  LOW_TECH = 'low-tech',        // Basic technology level
  
  // Enhancement Tags (Manufacturing v2 Phase 2)
  REINFORCED = 'reinforced',     // Additional material reinforcement
  LIGHTWEIGHT = 'lightweight',   // Weight-optimized design
  POLISHED = 'polished',        // High-quality surface finish
  MODULAR = 'modular',          // Designed for easy maintenance/upgrades
  FIELD_SERVICEABLE = 'field_serviceable', // Tool-free maintenance
  COMPETITION_GRADE = 'competition_grade', // Tournament-grade precision
  TACTICAL = 'tactical',        // Military/tactical configuration
  FIELD_READY = 'field_ready',  // Ready for field deployment
  
  // Special Tags
  PROTOTYPE = 'prototype',       // Experimental items with unique properties
  CUSTOM = 'custom',            // Player-customized items
  REFURBISHED = 'refurbished',  // Professionally restored items
  ANTIQUE = 'antique'           // Historical items with collector value
}

export interface BaseItem {
  id: string;                   // Unique identifier: 'basic_sidearm', 'steel', 'aluminum'
  name: string;                 // Display name: 'Basic Sidearm', 'Steel', 'Aluminum'
  category: ItemCategory;       // Material, Product, or Component
  baseValue: number;            // Base market value in credits
  description: string;          // Item description
  stackable: boolean;           // Can multiple instances be combined
  defaultTags: ItemTag[];       // Tags that are always present
  manufacturingType: ItemManufacturingType; // Manufacturing v2: hierarchy classification
  materialSource?: string;      // For shaped materials: which raw material they come from
  assemblyComponents?: ComponentRequirement[]; // For assemblies: what parts they need
}

// Component requirement for assemblies
export interface ComponentRequirement {
  componentId: string;
  quantity: number;
  requiredTags?: ItemTag[];
  maxQuality?: number;
}

export interface TagEffect {
  tag: ItemTag;
  qualityMultiplier: number;    // Multiplier applied to quality (0.5 = 50% penalty)
  qualityCap?: number;          // Maximum quality achievable (45 for junk)
  valueMultiplier: number;      // Multiplier applied to market value
  description: string;          // Human-readable effect description
}

export interface ItemInstance {
  id: string;                   // Unique instance identifier
  baseItemId: string;           // Reference to BaseItem
  tags: ItemTag[];              // Applied condition and material tags
  quality: number;              // 0-100 quality percentage
  quantity: number;             // Number of units (for stackable items)
  acquiredAt: number;           // Game time when acquired
  lastModified: number;         // Game time when last modified
  metadata?: Record<string, any>; // Additional data (crafting history, etc.)
}

export interface ItemStack {
  baseItemId: string;           // What type of item this stack contains
  instances: ItemInstance[];    // Individual item instances in this stack
  totalQuantity: number;        // Total quantity across all instances
  averageQuality: number;       // Weighted average quality
  uniqueTags: ItemTag[];        // All unique tags present in stack
}

// Helper type for creating new items
export interface CreateItemParams {
  baseItemId: string;
  tags?: ItemTag[];
  quality?: number;
  quantity?: number;
  metadata?: Record<string, any>;
}

// Helper type for item filtering and sorting
export interface ItemFilter {
  categories?: ItemCategory[];
  tags?: ItemTag[];
  minQuality?: number;
  maxQuality?: number;
  searchText?: string;
}

export interface ItemSort {
  field: 'name' | 'quality' | 'value' | 'quantity' | 'acquiredAt';
  direction: 'asc' | 'desc';
}

// Legacy compatibility - maps old storage keys to new system
export interface LegacyItemMapping {
  oldKey: string;               // Old storage key like 'basic_sidearm_pristine'
  baseItemId: string;           // New base item ID like 'basic_sidearm'
  tags: ItemTag[];              // Tags to apply like [ItemTag.FORGED]
  qualityRange: [number, number]; // Quality range like [85, 95]
}