// Enhancement Definitions Database - Manufacturing v2 Phase 2
// Equipment-based enhancement discovery system

import { 
  Enhancement, 
  EnhancementCategory, 
  ItemTag, 
  TagCategory 
} from '../types';

// Core enhancement definitions
export const enhancementDefinitions: Record<string, Enhancement> = {
  // === PERFORMANCE ENHANCEMENTS ===
  
  precision_machining: {
    id: 'precision_machining',
    name: 'Precision Machining',
    description: 'Use precision equipment for tighter tolerances and improved performance',
    category: 'performance',
    requirements: [
      { type: 'equipment', id: 'hand_tools_precision', level: 1 }
    ],
    effects: [
      { property: 'accuracy', modifier: 15, description: '+15% accuracy', isPercentage: true },
      { property: 'durability', modifier: 10, description: '+10% durability', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.3, description: '30% longer production time' }
    ],
    timeModifier: 1.3,
    complexityModifier: 1.1,
    outputTags: [ItemTag.PRECISION],
    qualityModifier: 15,
    qualityCap: 95
  },

  reinforced_construction: {
    id: 'reinforced_construction',
    name: 'Reinforced Construction',
    description: 'Additional material and reinforcement for enhanced durability',
    category: 'performance',
    requirements: [
      { type: 'equipment', id: 'mill_manual', level: 1 }
    ],
    effects: [
      { property: 'durability', modifier: 25, description: '+25% durability', isPercentage: true },
      { property: 'weight', modifier: 10, description: '+10% weight', isPercentage: true }
    ],
    costs: [
      { type: 'material', itemId: 'steel', quantity: 0.05, description: 'Additional steel reinforcement' },
      { type: 'time', quantity: 1.2, description: '20% longer production time' }
    ],
    timeModifier: 1.2,
    complexityModifier: 1.05,
    outputTags: [ItemTag.REINFORCED],
    qualityModifier: 10,
    qualityCap: 90
  },

  lightweight_optimization: {
    id: 'lightweight_optimization',
    name: 'Lightweight Optimization',
    description: 'Careful material removal and optimization for reduced weight',
    category: 'performance',
    requirements: [
      { type: 'equipment', id: 'mill_manual', level: 1 },
      { type: 'equipment', id: 'measuring_tools_basic', level: 1 }
    ],
    effects: [
      { property: 'weight', modifier: -15, description: '-15% weight', isPercentage: true },
      { property: 'handling', modifier: 20, description: '+20% handling speed', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.4, description: '40% longer production time' }
    ],
    timeModifier: 1.4,
    complexityModifier: 1.2,
    outputTags: [ItemTag.LIGHTWEIGHT],
    qualityModifier: 5,
    qualityCap: 85
  },

  // === AESTHETIC ENHANCEMENTS ===

  polished_finish: {
    id: 'polished_finish',
    name: 'Polished Finish',
    description: 'High-quality surface finishing for professional appearance',
    category: 'aesthetic',
    requirements: [
      { type: 'equipment', id: 'hand_tools_precision', level: 1 }
    ],
    effects: [
      { property: 'appearance', modifier: 30, description: '+30% visual appeal', isPercentage: true },
      { property: 'corrosion_resistance', modifier: 10, description: '+10% corrosion resistance', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.15, description: '15% longer production time' }
    ],
    timeModifier: 1.15,
    complexityModifier: 1.0,
    outputTags: [ItemTag.POLISHED],
    qualityModifier: 8,
    qualityCap: 85
  },

  custom_engraving: {
    id: 'custom_engraving',
    name: 'Custom Engraving',
    description: 'Personalized engravings and markings for premium appeal',
    category: 'aesthetic',
    requirements: [
      { type: 'equipment', id: 'hand_tools_precision', level: 1 }
    ],
    effects: [
      { property: 'uniqueness', modifier: 50, description: '+50% uniqueness value', isPercentage: true },
      { property: 'resale_value', modifier: 15, description: '+15% resale value', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.1, description: '10% longer production time' }
    ],
    timeModifier: 1.1,
    complexityModifier: 1.05,
    outputTags: [ItemTag.CUSTOM],
    qualityModifier: 5,
    qualityCap: 80
  },

  // === FUNCTIONAL ENHANCEMENTS ===

  modular_design: {
    id: 'modular_design',
    name: 'Modular Design',
    description: 'Designed for easy maintenance and component replacement',
    category: 'functional',
    requirements: [
      { type: 'equipment', id: 'measuring_tools_basic', level: 1 },
      { type: 'equipment', id: 'hand_tools_precision', level: 1 }
    ],
    effects: [
      { property: 'maintainability', modifier: 40, description: '+40% easier maintenance', isPercentage: true },
      { property: 'upgrade_potential', modifier: 25, description: '+25% upgrade compatibility', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.25, description: '25% longer production time' }
    ],
    timeModifier: 1.25,
    complexityModifier: 1.15,
    outputTags: [ItemTag.MODULAR],
    qualityModifier: 12,
    qualityCap: 90
  },

  quick_maintenance: {
    id: 'quick_maintenance',
    name: 'Quick Maintenance Features',
    description: 'Tool-free disassembly and maintenance-friendly design',
    category: 'functional',
    requirements: [
      { type: 'equipment', id: 'hand_tools_basic', level: 1 }
    ],
    effects: [
      { property: 'maintenance_time', modifier: -30, description: '-30% maintenance time', isPercentage: true },
      { property: 'field_serviceability', modifier: 35, description: '+35% field serviceability', isPercentage: true }
    ],
    costs: [
      { type: 'time', quantity: 1.1, description: '10% longer production time' }
    ],
    timeModifier: 1.1,
    complexityModifier: 1.05,
    outputTags: [ItemTag.FIELD_SERVICEABLE],
    qualityModifier: 3,
    qualityCap: 80
  },

  // === ADVANCED ENHANCEMENTS ===

  competition_grade: {
    id: 'competition_grade',
    name: 'Competition Grade',
    description: 'Tournament-grade precision and performance modifications',
    category: 'performance',
    requirements: [
      { type: 'equipment', id: 'hand_tools_precision', level: 1 },
      { type: 'equipment', id: 'measuring_tools_basic', level: 1 },
      { type: 'equipment', id: 'mill_manual', level: 1 }
    ],
    effects: [
      { property: 'accuracy', modifier: 30, description: '+30% accuracy', isPercentage: true },
      { property: 'consistency', modifier: 40, description: '+40% shot consistency', isPercentage: true },
      { property: 'trigger_response', modifier: 25, description: '+25% trigger response', isPercentage: true }
    ],
    costs: [
      { type: 'material', itemId: 'steel', quantity: 0.1, description: 'Premium steel selection' },
      { type: 'time', quantity: 1.8, description: '80% longer production time' }
    ],
    timeModifier: 1.8,
    complexityModifier: 1.4,
    outputTags: [ItemTag.PRECISION, ItemTag.COMPETITION_GRADE],
    qualityModifier: 25,
    qualityCap: 98
  },

  tactical_configuration: {
    id: 'tactical_configuration',
    name: 'Tactical Configuration',
    description: 'Field-ready modifications for professional tactical use',
    category: 'functional',
    requirements: [
      { type: 'equipment', id: 'mill_manual', level: 1 },
      { type: 'equipment', id: 'hand_tools_basic', level: 1 }
    ],
    effects: [
      { property: 'reliability', modifier: 20, description: '+20% reliability in harsh conditions', isPercentage: true },
      { property: 'quick_deployment', modifier: 30, description: '+30% deployment speed', isPercentage: true },
      { property: 'environmental_resistance', modifier: 25, description: '+25% environmental resistance', isPercentage: true }
    ],
    costs: [
      { type: 'material', itemId: 'steel', quantity: 0.03, description: 'Tactical coating materials' },
      { type: 'time', quantity: 1.3, description: '30% longer production time' }
    ],
    timeModifier: 1.3,
    complexityModifier: 1.2,
    outputTags: [ItemTag.TACTICAL, ItemTag.FIELD_READY],
    qualityModifier: 18,
    qualityCap: 92
  }
};

// Enhancement compatibility matrix - which enhancements work together
export const enhancementCompatibility: Record<string, string[]> = {
  precision_machining: ['polished_finish', 'modular_design', 'competition_grade'],
  reinforced_construction: ['tactical_configuration', 'quick_maintenance'],
  lightweight_optimization: ['competition_grade', 'modular_design'],
  polished_finish: ['precision_machining', 'custom_engraving', 'competition_grade'],
  custom_engraving: ['polished_finish', 'modular_design'],
  modular_design: ['precision_machining', 'lightweight_optimization', 'quick_maintenance'],
  quick_maintenance: ['reinforced_construction', 'modular_design', 'tactical_configuration'],
  competition_grade: ['precision_machining', 'lightweight_optimization', 'polished_finish'],
  tactical_configuration: ['reinforced_construction', 'quick_maintenance']
};

// Enhancement conflicts - which enhancements cannot be combined
export const enhancementConflicts: Record<string, string[]> = {
  lightweight_optimization: ['reinforced_construction'], // Can't be both light and heavily reinforced
  competition_grade: ['tactical_configuration'], // Different design philosophies
  polished_finish: ['tactical_configuration'] // Tactical doesn't prioritize appearance
};

// Get all available enhancements
export function getAllEnhancements(): Enhancement[] {
  return Object.values(enhancementDefinitions);
}

// Get enhancement by ID
export function getEnhancement(enhancementId: string): Enhancement | undefined {
  return enhancementDefinitions[enhancementId];
}

// Check if two enhancements are compatible
export function areEnhancementsCompatible(enhancement1: string, enhancement2: string): boolean {
  // Check for explicit conflicts
  const conflicts1 = enhancementConflicts[enhancement1] || [];
  const conflicts2 = enhancementConflicts[enhancement2] || [];
  
  if (conflicts1.includes(enhancement2) || conflicts2.includes(enhancement1)) {
    return false;
  }
  
  return true;
}

// Get compatible enhancements for a given enhancement
export function getCompatibleEnhancements(enhancementId: string): Enhancement[] {
  const compatible = enhancementCompatibility[enhancementId] || [];
  return compatible.map(id => enhancementDefinitions[id]).filter(Boolean);
}