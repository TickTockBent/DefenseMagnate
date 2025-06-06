// Production Line type definitions

export interface ProductionLine {
  id: string;
  facilityId?: string; // Optional for facility-embedded lines
  productId: string | null;
  quantity?: number;
  status?: 'idle' | 'active' | 'paused' | 'blocked' | 'completed';
  blockReason?: string; // e.g., "Missing material: steel"
  
  // Game-time production tracking
  startGameTime: number; // game hours when production started
  durationHours: number; // how many game hours this takes
  
  // Legacy fields for compatibility with facility system
  materials_loaded?: boolean;
  labor_assigned?: number;
  
  // Computed properties (calculated from startTime + duration)
  // progress: calculated in real-time
  // timeRemaining: calculated in real-time
}