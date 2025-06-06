// Shared type definitions to avoid circular dependencies

export type FacilityTrait = 
  | 'clean_room'
  | 'heavy_lifting'
  | 'precision_machining'
  | 'hazmat_certified'
  | 'automated_assembly'
  | 'quality_control'

export type ItemSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge'