// Item Tags Database
// Tag definitions and their effects on quality and value

import { ItemTag, TagEffect } from '../types';

export const tagEffects: Record<ItemTag, TagEffect> = {
  // Condition Tags
  [ItemTag.DAMAGED]: {
    tag: ItemTag.DAMAGED,
    qualityMultiplier: 0.15,  // 85% quality penalty
    qualityCap: 25,           // Cannot exceed 25% quality
    valueMultiplier: 0.12,    // 88% value penalty
    description: 'Severely damaged condition, non-functional without repair'
  },
  
  [ItemTag.JUNK]: {
    tag: ItemTag.JUNK,
    qualityMultiplier: 0.8,   // 20% quality penalty
    qualityCap: 45,           // Cannot exceed 45% quality
    valueMultiplier: 0.35,    // 65% value penalty
    description: 'Cobbled together from scrap materials, limited quality potential'
  },
  
  [ItemTag.RESTORED]: {
    tag: ItemTag.RESTORED,
    qualityMultiplier: 0.9,   // 10% quality penalty
    qualityCap: 75,           // Cannot exceed 75% quality
    valueMultiplier: 0.7,     // 30% value penalty
    description: 'Repaired from damaged condition, functional but not pristine'
  },
  
  [ItemTag.FORGED]: {
    tag: ItemTag.FORGED,
    qualityMultiplier: 1.0,   // No quality penalty
    valueMultiplier: 1.0,     // Standard value
    description: 'Manufactured from raw materials using standard processes'
  },
  
  [ItemTag.HAND_FORGED]: {
    tag: ItemTag.HAND_FORGED,
    qualityMultiplier: 1.15,  // 15% quality bonus
    valueMultiplier: 1.4,     // 40% value bonus
    description: 'Artisan-crafted with superior workmanship and attention to detail'
  },
  
  [ItemTag.MILITARY_GRADE]: {
    tag: ItemTag.MILITARY_GRADE,
    qualityMultiplier: 1.1,   // 10% quality bonus
    valueMultiplier: 1.6,     // 60% value bonus
    description: 'Meets military specifications for durability and performance'
  },
  
  // Material Tags
  [ItemTag.TITANIUM]: {
    tag: ItemTag.TITANIUM,
    qualityMultiplier: 1.2,   // 20% quality bonus
    valueMultiplier: 2.1,     // 110% value bonus
    description: 'Lightweight titanium construction, premium performance'
  },
  
  [ItemTag.STEEL]: {
    tag: ItemTag.STEEL,
    qualityMultiplier: 1.0,   // Standard quality
    valueMultiplier: 1.0,     // Standard value
    description: 'Standard steel construction, reliable and cost-effective'
  },
  
  [ItemTag.COMPOSITE]: {
    tag: ItemTag.COMPOSITE,
    qualityMultiplier: 1.15,  // 15% quality bonus
    valueMultiplier: 1.7,     // 70% value bonus
    description: 'Advanced composite materials for specialized applications'
  },
  
  [ItemTag.SALVAGED]: {
    tag: ItemTag.SALVAGED,
    qualityMultiplier: 0.85,  // 15% quality penalty
    qualityCap: 70,           // Cannot exceed 70% quality
    valueMultiplier: 0.6,     // 40% value penalty
    description: 'Recycled materials with potential quality variations'
  },
  
  [ItemTag.STANDARD]: {
    tag: ItemTag.STANDARD,
    qualityMultiplier: 1.0,   // Standard quality
    valueMultiplier: 1.0,     // Standard value
    description: 'Standard grade materials meeting basic specifications'
  },
  
  [ItemTag.PREMIUM]: {
    tag: ItemTag.PREMIUM,
    qualityMultiplier: 1.1,   // 10% quality bonus
    valueMultiplier: 1.3,     // 30% value bonus
    description: 'High grade materials with superior properties'
  },
  
  // Special Tags
  [ItemTag.PROTOTYPE]: {
    tag: ItemTag.PROTOTYPE,
    qualityMultiplier: 1.25,  // 25% quality bonus
    valueMultiplier: 2.5,     // 150% value bonus
    description: 'Experimental technology with unique performance characteristics'
  },
  
  [ItemTag.CUSTOM]: {
    tag: ItemTag.CUSTOM,
    qualityMultiplier: 1.1,   // 10% quality bonus
    valueMultiplier: 1.5,     // 50% value bonus
    description: 'Player-customized with personalized modifications'
  },
  
  [ItemTag.REFURBISHED]: {
    tag: ItemTag.REFURBISHED,
    qualityMultiplier: 0.95,  // 5% quality penalty
    valueMultiplier: 0.8,     // 20% value penalty
    description: 'Professionally restored to like-new condition'
  },
  
  [ItemTag.ANTIQUE]: {
    tag: ItemTag.ANTIQUE,
    qualityMultiplier: 0.8,   // 20% quality penalty
    valueMultiplier: 3.0,     // 200% value bonus (collector value)
    description: 'Historical items with significant collector and cultural value'
  },
  
  // NEW: Component Manufacturing Tags
  [ItemTag.ROUGH]: {
    tag: ItemTag.ROUGH,
    qualityMultiplier: 0.7,   // 30% quality penalty - unfinished state
    valueMultiplier: 0.4,     // 60% value penalty - intermediate product
    description: 'Unfinished mechanical component requiring additional processing'
  },
  
  [ItemTag.PRECISION]: {
    tag: ItemTag.PRECISION,
    qualityMultiplier: 1.1,   // 10% quality bonus - refined state
    valueMultiplier: 1.2,     // 20% value bonus - precision manufacturing
    description: 'Precision-machined component meeting tight tolerances'
  },
  
  [ItemTag.ASSEMBLY]: {
    tag: ItemTag.ASSEMBLY,
    qualityMultiplier: 1.0,   // Neutral quality - depends on component quality
    valueMultiplier: 1.5,     // 50% value bonus - combined complexity
    description: 'Assembled mechanical unit combining multiple components'
  },
  
  [ItemTag.CASING]: {
    tag: ItemTag.CASING,
    qualityMultiplier: 1.0,   // Neutral quality - functional protection
    valueMultiplier: 0.8,     // 20% value penalty - simple molded part
    description: 'Protective housing for mechanical assemblies'
  },
  
  [ItemTag.LOW_TECH]: {
    tag: ItemTag.LOW_TECH,
    qualityMultiplier: 0.9,   // 10% quality penalty - basic technology
    valueMultiplier: 0.7,     // 30% value penalty - simple technology
    description: 'Basic technology level using conventional manufacturing methods'
  },
  
  // Enhancement Tags (Manufacturing v2 Phase 2)
  [ItemTag.REINFORCED]: {
    tag: ItemTag.REINFORCED,
    qualityMultiplier: 1.15,  // 15% quality bonus
    valueMultiplier: 1.3,     // 30% value bonus
    description: 'Reinforced construction for enhanced durability'
  },
  
  [ItemTag.LIGHTWEIGHT]: {
    tag: ItemTag.LIGHTWEIGHT,
    qualityMultiplier: 1.05,  // 5% quality bonus
    valueMultiplier: 1.25,    // 25% value bonus
    description: 'Weight-optimized design without compromising strength'
  },
  
  [ItemTag.POLISHED]: {
    tag: ItemTag.POLISHED,
    qualityMultiplier: 1.08,  // 8% quality bonus
    valueMultiplier: 1.2,     // 20% value bonus
    description: 'High-quality surface finish and appearance'
  },
  
  [ItemTag.MODULAR]: {
    tag: ItemTag.MODULAR,
    qualityMultiplier: 1.0,   // Neutral quality
    valueMultiplier: 1.4,     // 40% value bonus - utility value
    description: 'Modular design for easy maintenance and upgrades'
  },
  
  [ItemTag.FIELD_SERVICEABLE]: {
    tag: ItemTag.FIELD_SERVICEABLE,
    qualityMultiplier: 1.0,   // Neutral quality
    valueMultiplier: 1.35,    // 35% value bonus - practical value
    description: 'Designed for tool-free field maintenance'
  },
  
  [ItemTag.COMPETITION_GRADE]: {
    tag: ItemTag.COMPETITION_GRADE,
    qualityMultiplier: 1.2,   // 20% quality bonus
    valueMultiplier: 1.8,     // 80% value bonus
    description: 'Tournament-grade precision and performance'
  },
  
  [ItemTag.TACTICAL]: {
    tag: ItemTag.TACTICAL,
    qualityMultiplier: 1.12,  // 12% quality bonus
    valueMultiplier: 1.5,     // 50% value bonus
    description: 'Military/tactical configuration for operational use'
  },
  
  [ItemTag.FIELD_READY]: {
    tag: ItemTag.FIELD_READY,
    qualityMultiplier: 1.08,  // 8% quality bonus
    valueMultiplier: 1.3,     // 30% value bonus
    description: 'Ready for immediate field deployment'
  },

  // Environmental Condition Tags (Manufacturing v2 Phase 3)
  [ItemTag.DRENCHED]: {
    tag: ItemTag.DRENCHED,
    qualityMultiplier: 0.7,   // 30% quality penalty - water damage
    valueMultiplier: 0.4,     // 60% value penalty - needs treatment
    description: 'Water damage affecting performance, needs drying treatment'
  },

  [ItemTag.CORRODED]: {
    tag: ItemTag.CORRODED,
    qualityMultiplier: 0.6,   // 40% quality penalty - corrosion damage
    valueMultiplier: 0.3,     // 70% value penalty - severe deterioration
    description: 'Corrosion damage affecting structural integrity'
  },

  [ItemTag.HEAT_DAMAGED]: {
    tag: ItemTag.HEAT_DAMAGED,
    qualityMultiplier: 0.65,  // 35% quality penalty - heat damage
    valueMultiplier: 0.35,    // 65% value penalty - structural compromise
    description: 'Heat damage compromising material properties'
  },

  [ItemTag.CONTAMINATED]: {
    tag: ItemTag.CONTAMINATED,
    qualityMultiplier: 0.8,   // 20% quality penalty - contamination
    valueMultiplier: 0.25,    // 75% value penalty - safety hazard
    description: 'Chemical contamination requiring specialized treatment'
  },

  [ItemTag.FROZEN]: {
    tag: ItemTag.FROZEN,
    qualityMultiplier: 0.75,  // 25% quality penalty - cold damage
    valueMultiplier: 0.6,     // 40% value penalty - brittleness
    description: 'Cold damage causing material brittleness'
  },

  [ItemTag.RADIATION_EXPOSED]: {
    tag: ItemTag.RADIATION_EXPOSED,
    qualityMultiplier: 0.5,   // 50% quality penalty - radiation damage
    valueMultiplier: 0.1,     // 90% value penalty - major safety hazard
    description: 'Radioactive contamination posing serious health risks'
  },

  [ItemTag.IMPACT_DAMAGED]: {
    tag: ItemTag.IMPACT_DAMAGED,
    qualityMultiplier: 0.55,  // 45% quality penalty - structural damage
    valueMultiplier: 0.3,     // 70% value penalty - potential failure
    description: 'Physical trauma affecting structural integrity'
  },

  [ItemTag.WORN]: {
    tag: ItemTag.WORN,
    qualityMultiplier: 0.85,  // 15% quality penalty - general wear
    valueMultiplier: 0.7,     // 30% value penalty - reduced performance
    description: 'General wear and tear from extended use'
  }
};

// Helper functions for working with tags
export function getTagEffect(tag: ItemTag): TagEffect | undefined {
  return tagEffects[tag];
}

export function calculateTaggedQuality(baseQuality: number, tags: ItemTag[]): number {
  let quality = baseQuality;
  let qualityCap: number | undefined;
  
  // Apply all tag effects
  for (const tag of tags) {
    const effect = tagEffects[tag];
    if (effect) {
      quality *= effect.qualityMultiplier;
      
      // Track the most restrictive quality cap
      if (effect.qualityCap !== undefined) {
        qualityCap = qualityCap === undefined 
          ? effect.qualityCap 
          : Math.min(qualityCap, effect.qualityCap);
      }
    }
  }
  
  // Apply quality cap if any tag has one
  if (qualityCap !== undefined) {
    quality = Math.min(quality, qualityCap);
  }
  
  // Ensure quality stays within valid range
  return Math.max(0, Math.min(100, quality));
}

export function calculateTaggedValue(baseValue: number, quality: number, tags: ItemTag[]): number {
  let valueMultiplier = 1.0;
  
  // Apply tag value multipliers
  for (const tag of tags) {
    const effect = tagEffects[tag];
    if (effect) {
      valueMultiplier *= effect.valueMultiplier;
    }
  }
  
  // Quality affects value (quality 0-100 maps to 0.1x-1.0x value)
  const qualityMultiplier = 0.1 + (quality / 100) * 0.9;
  
  return Math.round(baseValue * valueMultiplier * qualityMultiplier);
}

// Tag categorization helpers
export function getConditionTags(): ItemTag[] {
  return [
    ItemTag.DAMAGED,
    ItemTag.JUNK,
    ItemTag.RESTORED,
    ItemTag.FORGED,
    ItemTag.HAND_FORGED,
    ItemTag.MILITARY_GRADE,
    // Environmental conditions
    ItemTag.DRENCHED,
    ItemTag.CORRODED,
    ItemTag.HEAT_DAMAGED,
    ItemTag.CONTAMINATED,
    ItemTag.FROZEN,
    ItemTag.RADIATION_EXPOSED,
    ItemTag.IMPACT_DAMAGED,
    ItemTag.WORN
  ];
}

export function getMaterialTags(): ItemTag[] {
  return [
    ItemTag.TITANIUM,
    ItemTag.STEEL,
    ItemTag.COMPOSITE,
    ItemTag.SALVAGED,
    ItemTag.STANDARD,
    ItemTag.PREMIUM
  ];
}

export function getSpecialTags(): ItemTag[] {
  return [
    ItemTag.PROTOTYPE,
    ItemTag.CUSTOM,
    ItemTag.REFURBISHED,
    ItemTag.ANTIQUE
  ];
}

// Validation helpers
export function isValidTag(tag: string): tag is ItemTag {
  return Object.values(ItemTag).includes(tag as ItemTag);
}

export function getCompatibleTags(itemCategory: string): ItemTag[] {
  // All items can have condition tags
  const compatibleTags = [...getConditionTags()];
  
  // Materials can have material grade tags
  if (itemCategory === 'material') {
    compatibleTags.push(...getMaterialTags());
  }
  
  // Products and components can have special tags
  if (itemCategory === 'product' || itemCategory === 'component') {
    compatibleTags.push(...getSpecialTags());
  }
  
  return compatibleTags;
}