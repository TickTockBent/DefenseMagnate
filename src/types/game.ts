// High-level game state composition - single integration point

import { TagCategory, JobState, StepState, JobPriority, ProductState, LaborSkill } from '../constants/enums';
import { Facility } from './facility';
import { Material } from './material';
import { Product } from './product';
import { ProductionJob, ProductionQueue } from './productionJob';
import { Equipment, EquipmentInstance } from './equipment';
import { ManufacturingMethod } from './manufacturing';

// Main game state interface that composes everything
export interface GameState {
  // Core game metadata
  gameId: string;
  version: string;
  lastSaved: number;
  
  // Time system
  gameTime: {
    currentTime: number;
    deltaTime: number;
    speed: number;
    isPaused: boolean;
    totalPlayTime: number;
  };
  
  // Player company
  company: {
    name: string;
    cash: number;
    reputation: number;
    level: number;
    headquarters: string;
  };
  
  // Core game entities
  facilities: Facility[];
  materials: Record<string, number>; // material_id -> quantity
  products: Record<string, number>; // product_id -> quantity
  
  // Equipment and manufacturing
  equipmentDatabase: Map<string, Equipment>;
  globalEquipmentMarket: Equipment[];
  
  // Research and development
  research: {
    availableProjects: string[];
    activeProjects: string[];
    completedProjects: string[];
    researchPoints: number;
  };
  
  // Contracts and orders
  contracts: {
    available: any[]; // Contract interface would be defined later
    active: any[];
    completed: any[];
    failed: any[];
  };
  
  // Player preferences and UI state
  ui: {
    selectedFacilityId?: string;
    selectedTab: string;
    notifications: any[];
    tutorialProgress: Record<string, boolean>;
  };
  
  // Game settings
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    notifications: boolean;
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

// Actions interface for game state management
export interface GameActions {
  // Time management
  updateGameTime: (deltaMs: number) => void;
  togglePause: () => void;
  setGameSpeed: (speed: number) => void;
  
  // Facility management
  addFacility: (facility: Facility) => void;
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  selectFacility: (facilityId: string) => void;
  
  // Production management
  addProductionJob: (
    facilityId: string,
    productId: string,
    methodId: string,
    quantity: number,
    priority?: JobPriority,
    contractId?: string
  ) => void;
  cancelProductionJob: (facilityId: string, jobId: string) => void;
  updateProductionPriority: (facilityId: string, jobId: string, priority: JobPriority) => void;
  updateProduction: () => void;
  
  // Equipment management
  purchaseEquipment: (facilityId: string, equipmentId: string) => void;
  sellEquipment: (facilityId: string, instanceId: string) => void;
  maintainEquipment: (facilityId: string, instanceId: string) => void;
  
  // Resource management
  addMaterial: (materialId: string, quantity: number) => void;
  consumeMaterial: (materialId: string, quantity: number) => boolean;
  addProduct: (productId: string, quantity: number) => void;
  
  // Company management
  updateCompany: (updates: Partial<GameState['company']>) => void;
  
  // UI state management
  setSelectedTab: (tab: string) => void;
  addNotification: (notification: any) => void;
  dismissNotification: (notificationId: string) => void;
  updateTutorialProgress: (step: string, completed: boolean) => void;
  
  // Save/load
  saveGame: () => string; // Returns save code
  loadGame: (saveCode: string) => void;
  exportSave: () => string;
  importSave: (saveCode: string) => void;
}

// Combined interface for the complete game store
export interface GameStore extends GameState, GameActions {}

// Type helpers for common operations
export type FacilityWithQueue = Facility & Required<Pick<Facility, 'production_queue'>>;
export type ActiveJob = ProductionJob & { state: JobState.IN_PROGRESS };
export type CompletedJob = ProductionJob & { state: JobState.COMPLETED };

// Utility type for partial updates
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types for game state changes
export interface GameEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface ProductionEvent extends GameEvent {
  type: 'production_started' | 'production_completed' | 'production_failed';
  data: {
    facilityId: string;
    jobId: string;
    productId: string;
    quantity: number;
  };
}

export interface EquipmentEvent extends GameEvent {
  type: 'equipment_purchased' | 'equipment_sold' | 'equipment_broken';
  data: {
    facilityId: string;
    equipmentId: string;
    instanceId?: string;
  };
}