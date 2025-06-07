// Updated game store with equipment and production scheduling systems

import { create } from 'zustand';
import { 
  Facility, 
  ProductionLine,
  Equipment, 
  EquipmentInstance,
  EquipmentStatus,
  ProductionJob, 
  ProductionQueue,
  JobPriority,
  ManufacturingMethod,
  MachineWorkspace,
  MachineBasedMethod,
  createGarage,
  aggregateEquipmentTags
} from '../types';
import { ProductionScheduler } from '../systems/productionScheduler';
import { MachineWorkspaceManager } from '../systems/machineWorkspace';
import { equipmentDatabase, starterEquipmentSets } from '../data/equipment';
import { productsWithMethods } from '../data/productsWithTags';
import { basicSidearmMethods, tacticalKnifeMethods } from '../data/manufacturingMethods';
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

interface JobCompletionNotification {
  id: string;
  jobId: string;
  productId: string;
  methodName: string;
  quantity: number;
  timestamp: number;
}

interface GameState {
  // Core game state
  gameTime: ExtendedGameTime;
  credits: number;
  
  // Resources (global game resources like credits, reputation, etc.)
  resources: Record<string, number>;
  
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
  
  // Production scheduling (legacy - to be removed)
  productionScheduler: ProductionScheduler;
  
  // New machine workspace system
  machineWorkspaceManager: MachineWorkspaceManager;
  machineWorkspace?: MachineWorkspace;
  
  // Legacy production (to be migrated)
  productionLines: ProductionLine[];
  completedProducts: Record<string, number>; // Product inventory
  
  // Contracts
  contracts: Contract[];
  
  // UI State
  activeTab: 'research' | 'manufacturing' | 'equipment' | 'contracts' | 'supply';
  selectedFacilityId: string | null;
  
  // Notifications
  jobCompletionNotifications: JobCompletionNotification[];
  
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
  
  // Machine workspace actions
  startMachineJob: (
    facilityId: string,
    productId: string,
    methodId: string,
    quantity: number,
    rushOrder?: boolean
  ) => void;
  
  // System update
  updateProduction: () => void;
  
  // Notification actions
  addJobCompletionNotification: (notification: Omit<JobCompletionNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
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
    status: EquipmentStatus.AVAILABLE,
    utilizationHistory: []
  };
}

// Create the store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameTime: { ...createGameTime(), elapsed: 0, deltaTime: 0 },
  credits: 10000,
  resources: {},
  
  research: {
    current: null,
    completed: [],
    available: []
  },
  
  facilities: [],
  equipmentDatabase: equipmentDatabase,
  productionScheduler: new ProductionScheduler(equipmentDatabase),
  machineWorkspaceManager: new MachineWorkspaceManager(equipmentDatabase),
  
  productionLines: [],
  completedProducts: {},
  contracts: [],
  
  activeTab: 'manufacturing',
  selectedFacilityId: null,
  jobCompletionNotifications: [],
  
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
      
      // Reinitialize machine workspace for the updated facility if it's currently selected
      let updatedWorkspace = state.machineWorkspace;
      if (state.selectedFacilityId === facilityId && state.machineWorkspace) {
        const updatedFacility = updatedFacilities.find(f => f.id === facilityId);
        if (updatedFacility) {
          state.machineWorkspaceManager.setFacility(updatedFacility);
          updatedWorkspace = state.machineWorkspaceManager.initializeWorkspace(updatedFacility);
        }
      }
      
      return {
        facilities: updatedFacilities,
        credits: state.credits - equipment.purchaseCost - equipment.installationCost,
        machineWorkspace: updatedWorkspace
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
      
      // Reinitialize machine workspace for the updated facility if it's currently selected
      let updatedWorkspace = state.machineWorkspace;
      if (state.selectedFacilityId === facilityId && state.machineWorkspace) {
        const updatedFacility = updatedFacilities.find(f => f.id === facilityId);
        if (updatedFacility) {
          state.machineWorkspaceManager.setFacility(updatedFacility);
          updatedWorkspace = state.machineWorkspaceManager.initializeWorkspace(updatedFacility);
        }
      }
      
      return {
        facilities: updatedFacilities,
        credits: state.credits + saleValue,
        machineWorkspace: updatedWorkspace
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
    const productData = productsWithMethods[productId as keyof typeof productsWithMethods];
    if (!productData) return;
    
    const method = productData.manufacturing_methods?.find(m => m.id === methodId);
    if (!method) return;
    
    // Create multiple single jobs for multi-quantity orders
    for (let i = 0; i < quantity; i++) {
      const job = state.productionScheduler.addJob(facility.production_queue, {
        facilityId,
        productId,
        method,
        quantity: 1, // Each job is for a single unit
        priority,
        createdAt: state.gameTime.elapsed,
        currentStepIndex: 0,
        steps: method.steps,
        contractId
      });
    }
    
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
  
  // New machine workspace system
  startMachineJob: (facilityId, productId, methodId, quantity = 1, rushOrder = false) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) return;
    
    // Initialize workspace if needed
    if (!state.machineWorkspace || state.machineWorkspace.facilityId !== facilityId) {
      state.machineWorkspaceManager.setFacility(facility);
      state.machineWorkspaceManager.setGameTime(state.gameTime);
      const workspace = state.machineWorkspaceManager.initializeWorkspace(facility);
      set({ machineWorkspace: workspace });
    }
    
    // Get the method from available products
    let method = basicSidearmMethods.find(m => m.id === methodId);
    if (!method) {
      method = tacticalKnifeMethods.find(m => m.id === methodId);
    }
    if (!method) return;
    
    // Set current game time before adding job
    state.machineWorkspaceManager.setGameTime(state.gameTime);
    
    // Add the job
    const priority = rushOrder ? JobPriority.RUSH : JobPriority.NORMAL;
    state.machineWorkspaceManager.addJob(
      facilityId,
      productId,
      method,
      quantity,
      priority,
      rushOrder
    );
    
    // Update the workspace in state
    set({ machineWorkspace: state.machineWorkspaceManager.getWorkspace(facilityId) });
  },
  
  // Main production update loop
  updateProduction: () => {
    const state = get();
    const deltaTime = state.gameTime.deltaTime;
    
    if (state.gameTime.isPaused) return;
    
    // Update machine workspace system
    if (state.machineWorkspace && state.selectedFacilityId) {
      const facility = state.facilities.find(f => f.id === state.selectedFacilityId);
      if (facility) {
        state.machineWorkspaceManager.setFacility(facility);
        state.machineWorkspaceManager.setGameTime(state.gameTime);
        state.machineWorkspaceManager.updateAllWorkspaces(deltaTime);
        set({ machineWorkspace: state.machineWorkspaceManager.getWorkspace(state.selectedFacilityId) });
      }
    }
    
    // Legacy production system (to be removed)
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
  },
  
  // Notification management
  addJobCompletionNotification: (notification) => set(state => ({
    jobCompletionNotifications: [...state.jobCompletionNotifications, {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }]
  })),
  
  dismissNotification: (id) => set(state => ({
    jobCompletionNotifications: state.jobCompletionNotifications.filter(n => n.id !== id)
  }))
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

// Get the initial materials from the store definition
const initialMaterials = {
  // For Forge method (steel + plastic) - 3 jobs worth
  steel: 20,
  plastic: 15,
  
  // For Restore method (damaged weapons + spares) - 3 jobs worth  
  damaged_basic_sidearm: 3,
  low_tech_spares: 20,
  
  // For tactical knife methods
  damaged_tactical_knife: 2,
  dull_tactical_knife: 4,
  
  // Additional useful materials
  aluminum: 2,
  basic_electronics: 3,
  machined_parts: 5
};

// Sync facility storage with game store materials
initialFacility.current_storage = { ...initialMaterials };

// Initialize the machine workspace for the facility
const machineManager = new MachineWorkspaceManager(equipmentDatabase);
machineManager.setFacility(initialFacility);
const initialWorkspace = machineManager.initializeWorkspace(initialFacility);

// Set up job completion callback
machineManager.setJobCompleteCallback((job) => {
  const store = useGameStore.getState();
  store.addJobCompletionNotification({
    jobId: job.id,
    productId: job.productId,
    methodName: job.method.name,
    quantity: job.quantity
  });
});

useGameStore.setState({ 
  facilities: [initialFacility],
  selectedFacilityId: initialFacility.id,
  machineWorkspaceManager: machineManager,
  machineWorkspace: initialWorkspace
});