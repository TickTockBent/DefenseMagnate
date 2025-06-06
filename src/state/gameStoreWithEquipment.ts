// Updated game store with equipment and production scheduling systems

import { create } from 'zustand';
import { 
  Facility, 
  ProductionLine,
  Equipment, 
  EquipmentInstance,
  ProductionJob, 
  ProductionQueue,
  JobPriority,
  ManufacturingMethod,
  createGarage,
  aggregateEquipmentTags
} from '../types';
import { ProductionScheduler } from '../systems/productionScheduler';
import { equipmentDatabase, starterEquipmentSets } from '../data/equipment';
import { getProductData } from '../data/productHelpers';
import { createGameTime, updateGameTime, type GameTime } from '../utils/gameClock';

// Add elapsed property to GameTime for compatibility
interface ExtendedGameTime extends GameTime {
  elapsed: number;
  deltaTime: number;
}

// Existing interfaces remain the same
interface Contract {
  id: string;
  faction: string;
  requirements: string[];
  payment: number;
  deadline: number;
  status: 'available' | 'active' | 'completed' | 'failed';
  risk: 'low' | 'medium' | 'high';
}

interface Research {
  id: string;
  name: string;
  progress: number;
  cost: number;
  prerequisites: string[];
}

interface GameState {
  // Core game state
  gameTime: ExtendedGameTime;
  credits: number;
  
  // Resources & Materials
  resources: Record<string, number>;
  materials: Record<string, number>; // Material inventory
  
  // Research
  research: {
    current: string | null;
    completed: string[];
    available: Research[];
  };
  
  // Facilities with equipment
  facilities: Facility[];
  
  // Equipment database
  equipmentDatabase: Map<string, Equipment>;
  
  // Production scheduling
  productionScheduler: ProductionScheduler;
  
  // Legacy production (to be migrated)
  productionLines: ProductionLine[];
  completedProducts: Record<string, number>; // Product inventory
  
  // Contracts
  contracts: Contract[];
  
  // UI State
  activeTab: 'research' | 'manufacturing' | 'equipment' | 'contracts' | 'supply';
  selectedFacilityId: string | null;
  
  // Actions
  setActiveTab: (tab: GameState['activeTab']) => void;
  setSelectedFacility: (facilityId: string | null) => void;
  updateGameTime: (deltaMs: number) => void;
  togglePause: () => void;
  setGameSpeed: (speed: number) => void;
  
  // Research actions
  startResearch: (researchId: string) => void;
  
  // Contract actions
  acceptContract: (contractId: string) => void;
  
  // Resource actions
  updateResource: (resource: string, amount: number) => void;
  updateMaterial: (material: string, amount: number) => void;
  
  // Facility actions
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  
  // Equipment actions
  purchaseEquipment: (facilityId: string, equipmentId: string) => void;
  sellEquipment: (facilityId: string, equipmentInstanceId: string) => void;
  maintainEquipment: (facilityId: string, equipmentInstanceId: string) => void;
  
  // Production actions (new system)
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
  
  // System update
  updateProduction: () => void;
}

// Helper to create initial equipment instances
function createEquipmentInstance(equipmentId: string, facilityId: string): EquipmentInstance {
  return {
    id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    equipmentId,
    facilityId,
    condition: 100,
    lastMaintenance: 0,
    totalOperatingHours: 0,
    utilizationHistory: []
  };
}

// Create the store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameTime: { ...createGameTime(), elapsed: 0, deltaTime: 0 },
  credits: 10000,
  resources: {},
  materials: {
    steel: 20,
    plastic: 15,
    scrap_metal: 50,
    spare_parts: 10
  },
  
  research: {
    current: null,
    completed: [],
    available: []
  },
  
  facilities: [],
  equipmentDatabase: equipmentDatabase,
  productionScheduler: new ProductionScheduler(equipmentDatabase),
  
  productionLines: [],
  completedProducts: {},
  contracts: [],
  
  activeTab: 'manufacturing',
  selectedFacilityId: null,
  
  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedFacility: (facilityId) => set({ selectedFacilityId: facilityId }),
  
  updateGameTime: (deltaMs) => set(state => ({
    gameTime: { 
      ...updateGameTime(state.gameTime, deltaMs), 
      elapsed: state.gameTime.elapsed + deltaMs,
      deltaTime: deltaMs
    }
  })),
  
  togglePause: () => set(state => ({
    gameTime: { ...state.gameTime, isPaused: !state.gameTime.isPaused }
  })),
  
  setGameSpeed: (speed) => set(state => ({
    gameTime: { ...state.gameTime, speed }
  })),
  
  startResearch: (researchId) => {
    // Implementation here
  },
  
  acceptContract: (contractId) => {
    // Implementation here
  },
  
  updateResource: (resource, amount) => set(state => ({
    resources: { ...state.resources, [resource]: (state.resources[resource] || 0) + amount }
  })),
  
  updateMaterial: (material, amount) => set(state => ({
    materials: { ...state.materials, [material]: (state.materials[material] || 0) + amount }
  })),
  
  updateFacility: (facilityId, updates) => set(state => ({
    facilities: state.facilities.map(f => 
      f.id === facilityId ? { ...f, ...updates } : f
    )
  })),
  
  // Equipment management
  purchaseEquipment: (facilityId, equipmentId) => {
    const state = get();
    const equipment = state.equipmentDatabase.get(equipmentId);
    const facility = state.facilities.find(f => f.id === facilityId);
    
    if (!equipment || !facility) return;
    
    // Check if we can afford it
    if (state.credits < equipment.purchaseCost + equipment.installationCost) return;
    
    // Check if we have space
    if (facility.used_floor_space + equipment.footprint > facility.floor_space) return;
    
    set(state => {
      const newInstance = createEquipmentInstance(equipmentId, facilityId);
      const updatedFacilities = state.facilities.map(f => {
        if (f.id === facilityId) {
          const updatedEquipment = [...f.equipment, newInstance];
          const updatedCapacity = aggregateEquipmentTags(updatedEquipment, state.equipmentDatabase);
          
          return {
            ...f,
            equipment: updatedEquipment,
            equipment_capacity: updatedCapacity,
            used_floor_space: f.used_floor_space + equipment.footprint,
            operating_cost_per_day: f.operating_cost_per_day + equipment.dailyOperatingCost
          };
        }
        return f;
      });
      
      return {
        facilities: updatedFacilities,
        credits: state.credits - equipment.purchaseCost - equipment.installationCost
      };
    });
  },
  
  sellEquipment: (facilityId, equipmentInstanceId) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) return;
    
    const instance = facility.equipment.find(e => e.id === equipmentInstanceId);
    if (!instance) return;
    
    const equipment = state.equipmentDatabase.get(instance.equipmentId);
    if (!equipment) return;
    
    // Calculate sale value based on condition
    const saleValue = equipment.purchaseCost * 0.5 * (instance.condition / 100);
    
    set(state => {
      const updatedFacilities = state.facilities.map(f => {
        if (f.id === facilityId) {
          const updatedEquipment = f.equipment.filter(e => e.id !== equipmentInstanceId);
          const updatedCapacity = aggregateEquipmentTags(updatedEquipment, state.equipmentDatabase);
          
          return {
            ...f,
            equipment: updatedEquipment,
            equipment_capacity: updatedCapacity,
            used_floor_space: f.used_floor_space - equipment.footprint,
            operating_cost_per_day: f.operating_cost_per_day - equipment.dailyOperatingCost
          };
        }
        return f;
      });
      
      return {
        facilities: updatedFacilities,
        credits: state.credits + saleValue
      };
    });
  },
  
  maintainEquipment: (facilityId, equipmentInstanceId) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) return;
    
    const instance = facility.equipment.find(e => e.id === equipmentInstanceId);
    if (!instance) return;
    
    const equipment = state.equipmentDatabase.get(instance.equipmentId);
    if (!equipment) return;
    
    // Check if we can afford maintenance
    if (state.credits < equipment.condition.maintenanceCost) return;
    
    set(state => ({
      facilities: state.facilities.map(f => {
        if (f.id === facilityId) {
          return {
            ...f,
            equipment: f.equipment.map(e => {
              if (e.id === equipmentInstanceId) {
                return {
                  ...e,
                  condition: 100,
                  lastMaintenance: state.gameTime.elapsed
                };
              }
              return e;
            })
          };
        }
        return f;
      }),
      credits: state.credits - equipment.condition.maintenanceCost
    }));
  },
  
  // Production management (new system)
  addProductionJob: (facilityId, productId, methodId, quantity, priority = JobPriority.NORMAL, contractId) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) return;
    
    // Initialize production queue if needed
    if (!facility.production_queue) {
      facility.production_queue = state.productionScheduler.initializeQueue(facility);
    }
    
    // Get product and method data
    const productData = getProductData(productId);
    if (!productData) return;
    
    const method = productData.manufacturing_methods?.find(m => m.id === methodId);
    if (!method) return;
    
    // Create the job
    const job = state.productionScheduler.addJob(facility.production_queue, {
      facilityId,
      productId,
      method,
      quantity,
      priority,
      createdAt: state.gameTime.elapsed,
      currentStepIndex: 0,
      steps: method.steps,
      contractId
    });
    
    // Update facility
    set(state => ({
      facilities: state.facilities.map(f => 
        f.id === facilityId ? { ...f, production_queue: facility.production_queue } : f
      )
    }));
  },
  
  cancelProductionJob: (facilityId, jobId) => {
    // Implementation here
  },
  
  updateProductionPriority: (facilityId, jobId, priority) => {
    // Implementation here
  },
  
  // Main production update loop
  updateProduction: () => {
    const state = get();
    const deltaTime = state.gameTime.deltaTime;
    
    if (state.gameTime.isPaused) return;
    
    set(state => {
      const updatedFacilities = state.facilities.map(facility => {
        if (!facility.production_queue) return facility;
        
        // Update equipment condition
        const updatedEquipment = facility.equipment.map(eq => {
          const equipment = state.equipmentDatabase.get(eq.equipmentId);
          if (!equipment) return eq;
          
          // Check if equipment is in use
          const isInUse = facility.production_queue!.equipmentAllocations.has(eq.id);
          if (isInUse) {
            const degradation = equipment.condition.degradationRate * (deltaTime / 3600000); // Convert to hours
            return {
              ...eq,
              condition: Math.max(0, eq.condition - degradation),
              totalOperatingHours: eq.totalOperatingHours + (deltaTime / 3600000)
            };
          }
          return eq;
        });
        
        // Update production queue
        state.productionScheduler.updateProductionQueue(
          facility.production_queue,
          { ...facility, equipment: updatedEquipment },
          state.gameTime.elapsed,
          deltaTime
        );
        
        return {
          ...facility,
          equipment: updatedEquipment,
          equipment_capacity: aggregateEquipmentTags(updatedEquipment, state.equipmentDatabase)
        };
      });
      
      return { facilities: updatedFacilities };
    });
  }
}));

// Initialize first facility with starter equipment
const initialFacility = createGarage('Starting Garage');
initialFacility.equipment = starterEquipmentSets.garage.map(eqId => 
  createEquipmentInstance(eqId, initialFacility.id)
);
initialFacility.equipment_capacity = aggregateEquipmentTags(
  initialFacility.equipment, 
  equipmentDatabase
);
initialFacility.used_floor_space = initialFacility.equipment.reduce((sum, eq) => {
  const def = equipmentDatabase.get(eq.equipmentId);
  return sum + (def?.footprint || 0);
}, 0);

useGameStore.setState({ 
  facilities: [initialFacility],
  selectedFacilityId: initialFacility.id
});