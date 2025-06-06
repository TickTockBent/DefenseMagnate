// Production Line type definitions

export interface ProductionLine {
  id: string;
  facilityId?: string; // Optional for facility-embedded lines
  productId: string | null;
  quantity?: number;
  progress: number; // 0-100
  status?: 'idle' | 'active' | 'paused' | 'blocked';
  blockReason?: string; // e.g., "Missing material: steel"
  
  // Legacy fields for compatibility with facility system
  materials_loaded?: boolean;
  labor_assigned?: number;
  
  // TODO: Add more fields as we develop the production system
  // - material allocation
  // - worker assignment
  // - quality tracking
  // - defect rate
  // - completion time estimates
}