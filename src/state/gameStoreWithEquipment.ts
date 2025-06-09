// Updated game store with equipment and production scheduling systems

import { create } from 'zustand';
import { 
  Facility, 
  // LEGACY: ProductionLine, ProductionJob, ProductionQueue, ManufacturingMethod (superseded by machine workspace)
  Equipment, 
  EquipmentInstance,
  EquipmentStatus,
  JobPriority,
  MachineWorkspace,
  MachineBasedMethod,
  MarketState,
  ContractState,
  createGarage,
  aggregateEquipmentTags,
  FacilityInventory,
  ItemInstance,
  ItemTag
} from '../types';
// LEGACY: ProductionScheduler superseded by MachineWorkspaceManager
// import { ProductionScheduler } from '../systems/productionScheduler';
import { MachineWorkspaceManager } from '../systems/machineWorkspace';
import { MarketGenerator } from '../systems/marketGenerator';
import { ContractGenerator } from '../systems/contractGenerator';
import { equipmentDatabase, starterEquipmentSets } from '../data/equipment';
// LEGACY: import { productsWithMethods } from '../data/productsWithTags';
import { basicSidearmMethods, tacticalKnifeMethods } from '../data/manufacturingMethods';
import { createGameTime, updateGameTime, type GameTime } from '../utils/gameClock';
import { facilityMigrationManager } from '../utils/facilityMigration';
import { inventoryManager } from '../utils/inventoryManager';
import { createItemInstance } from '../utils/itemSystem';

// Add elapsed property to GameTime for compatibility
interface ExtendedGameTime extends GameTime {
  elapsed: number;
  deltaTime: number;
}

// LEGACY: Contract interface (superseded by contract system in types/contracts.ts)
/*
interface Contract {
  id: string;
  faction: string;
  requirements: string[];
  payment: number;
  deadline: number;
  status: 'available' | 'active' | 'completed' | 'failed';
  risk: 'low' | 'medium' | 'high';
}
*/

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
  
  // LEGACY: Production scheduling (superseded by MachineWorkspaceManager)
  // productionScheduler: ProductionScheduler;
  
  // New machine workspace system
  machineWorkspaceManager: MachineWorkspaceManager;
  machineWorkspace?: MachineWorkspace;
  
  // Market and contract generators
  marketGenerator: MarketGenerator;
  contractGenerator: ContractGenerator;
  
  // LEGACY: Production (superseded by machine workspace and inventory systems)
  // productionLines: ProductionLine[];
  // completedProducts: Record<string, number>; // Product inventory
  
  // LEGACY: Contracts (old system - being replaced by contractState)
  // contracts: Contract[]; // TODO: Remove after migration complete
  
  // Market and Contracts System
  marketState: MarketState;
  contractState: ContractState;
  
  // UI State
  activeTab: 'research' | 'manufacturing' | 'catalog' | 'equipment' | 'market' | 'contracts';
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
  
  // LEGACY: Contract actions (old system - being replaced)
  acceptContract: (contractId: string) => void; // TODO: Remove after migration
  
  // Resource actions
  updateResource: (resource: string, amount: number) => void;
  
  // Facility actions
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  
  // Equipment actions
  purchaseEquipment: (facilityId: string, equipmentId: string) => void;
  sellEquipment: (facilityId: string, equipmentInstanceId: string) => void;
  maintainEquipment: (facilityId: string, equipmentInstanceId: string) => void;
  
  // LEGACY: Production actions (superseded by machine workspace system)
  /*
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
  */
  
  // Machine workspace actions
  startMachineJob: (
    facilityId: string,
    productId: string,
    methodId: string,
    quantity: number,
    enhancementSelection?: import('../types').EnhancementSelection,
    rushOrder?: boolean,
    dynamicMethod?: MachineBasedMethod
  ) => void;
  cancelMachineJob: (facilityId: string, jobId: string) => boolean;
  
  // System update
  updateProduction: () => void;
  
  // Notification actions
  addJobCompletionNotification: (notification: Omit<JobCompletionNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  
  // Market actions
  purchaseMarketLot: (lotId: string, facilityId: string) => void;
  listProductForSale: (facilityId: string, productId: string, quantity: number, pricePerUnit: number) => void;
  removePlayerListing: (listingId: string) => void;
  refreshMarketLots: () => void;
  
  // Contract actions
  acceptCustomerContract: (contractId: string) => void;
  acceptSupplyContract: (contractId: string) => void;
  fulfillContract: (contractId: string, facilityId: string) => void;
  refreshContracts: () => void;
  
  // Inventory management actions
  migrateFacilityInventory: (facilityId: string) => void;
  addItemToInventory: (facilityId: string, item: ItemInstance) => boolean;
  removeItemFromInventory: (facilityId: string, itemInstanceId: string, quantity?: number) => boolean;
  getAvailableItems: (facilityId: string, baseItemId: string) => number;
  findBestQualityItems: (facilityId: string, baseItemId: string, quantity: number) => ItemInstance[];
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
  // LEGACY: productionScheduler: new ProductionScheduler(equipmentDatabase),
  machineWorkspaceManager: new MachineWorkspaceManager(equipmentDatabase),
  marketGenerator: new MarketGenerator(),
  contractGenerator: new ContractGenerator(),
  
  // LEGACY: productionLines: [],
  // LEGACY: completedProducts: {},
  // LEGACY: contracts: [],
  
  // Market and contracts system initialization
  marketState: {
    availableLots: [],
    activePurchaseOrders: [],
    playerListings: [],
    transactionHistory: [],
    lastLotRefresh: 0,
    nextRefreshAt: 0
  },
  contractState: {
    availableCustomerContracts: [],
    availableSupplyContracts: [],
    activeCustomerContracts: [],
    activeSupplyContracts: [],
    contractProgress: new Map(),
    completedContracts: [],
    contractHistory: [],
    lastContractRefresh: 0,
    nextRefreshAt: 0
  },
  
  activeTab: 'manufacturing',
  selectedFacilityId: null,
  jobCompletionNotifications: [],
  
  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedFacility: (facilityId) => set({ selectedFacilityId: facilityId }),
  
  updateGameTime: (deltaMs) => set(state => {
    const newGameTime = { 
      ...updateGameTime(state.gameTime, deltaMs), 
      elapsed: state.gameTime.elapsed + deltaMs,
      deltaTime: deltaMs
    };
    
    // Process purchase order deliveries
    const updatedPurchaseOrders = state.marketState.activePurchaseOrders.map(order => {
      if (order.status === 'ordered' && newGameTime.totalGameHours >= order.deliveryAt) {
        // Deliver materials to facility
        const facility = state.facilities.find(f => f.id === order.facilityId);
        if (facility) {
          // LEGACY: Update old storage system
          const currentAmount = facility.current_storage[order.materialId] || 0;
          facility.current_storage[order.materialId] = currentAmount + order.quantity;
          
          // NEW: Update inventory system if present
          if (facility.inventory) {
            try {
              // Create item instance for delivered material
              const deliveredItem = createItemInstance({
                baseItemId: order.materialId,
                tags: [ItemTag.STANDARD], // Default to standard quality for market purchases
                quality: 80 + Math.random() * 15, // 80-95% quality for market materials
                quantity: order.quantity,
                metadata: { 
                  source: 'market_delivery',
                  supplierId: order.supplierId,
                  deliveredAt: newGameTime.totalGameHours
                }
              });
              
              inventoryManager.addItem(facility.inventory, deliveredItem);
            } catch (error) {
              console.warn('Failed to add delivered item to new inventory system:', error);
              // Fall back to legacy system only
            }
          }
        }
        
        return { ...order, status: 'delivered' as const };
      }
      return order;
    });
    
    // Remove old delivered orders (keep last 5 for display)
    const deliveredOrders = updatedPurchaseOrders.filter(o => o.status === 'delivered');
    const activeOrders = updatedPurchaseOrders.filter(o => o.status !== 'delivered');
    const recentDelivered = deliveredOrders.slice(-5);
    
    // Process player product sales
    const updatedPlayerListings = state.marketState.playerListings.map(listing => {
      if (listing.status !== 'active' || listing.soldQuantity >= listing.quantity) {
        return listing;
      }
      
      // Simple sales simulation - chance to sell 1 unit per hour
      const salesChance = 0.1; // 10% chance per hour
      const remainingQuantity = listing.quantity - listing.soldQuantity;
      
      if (Math.random() < salesChance && remainingQuantity > 0) {
        const soldQuantity = listing.soldQuantity + 1;
        const revenue = listing.pricePerUnit;
        
        // Add revenue to credits
        state.credits += revenue;
        
        // Update listing
        const updatedListing = {
          ...listing,
          soldQuantity,
          status: soldQuantity >= listing.quantity ? 'sold' as const : 'partially_sold' as const
        };
        
        return updatedListing;
      }
      
      return listing;
    });
    
    // Remove expired or fully sold listings (keep last 3 for display)
    const activeSales = updatedPlayerListings.filter(l => 
      l.status === 'active' || l.status === 'partially_sold'
    );
    const completedSales = updatedPlayerListings.filter(l => 
      l.status === 'sold' || l.status === 'expired'
    ).slice(-3);
    
    // Apply gradual market dynamics every 6 hours
    let marketLots = state.marketState.availableLots;
    const previousHour = state.gameTime.totalGameHours;
    if (Math.floor(newGameTime.totalGameHours / 6) > Math.floor(previousHour / 6)) {
      marketLots = state.marketGenerator.simulateMarketForces(
        state.marketState.availableLots,
        newGameTime.totalGameHours
      );
    }
    
    return {
      ...state,
      gameTime: newGameTime,
      marketState: {
        ...state.marketState,
        availableLots: marketLots,
        activePurchaseOrders: [...activeOrders, ...recentDelivered],
        playerListings: [...activeSales, ...completedSales]
      }
    };
  }),
  
  togglePause: () => set(state => ({
    gameTime: { ...state.gameTime, isPaused: !state.gameTime.isPaused }
  })),
  
  setGameSpeed: (speed) => set(state => ({
    gameTime: { ...state.gameTime, gameSpeed: speed }
  })),
  
  startResearch: (researchId) => {
    // Implementation here
  },
  
  // LEGACY: acceptContract implementation (old system - being replaced)
  acceptContract: (contractId) => {
    // TODO: Remove after migration to new contract system
    console.log('Legacy contract system - use acceptCustomerContract instead');
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
      
      // Add new equipment to existing workspace (preserves jobs and progress)
      let updatedWorkspace = state.machineWorkspace;
      if (state.selectedFacilityId === facilityId && state.machineWorkspace) {
        const updatedFacility = updatedFacilities.find(f => f.id === facilityId);
        if (updatedFacility) {
          state.machineWorkspaceManager.setFacility(updatedFacility);
          // Instead of reinitializing, just add the new equipment
          state.machineWorkspaceManager.addEquipmentToWorkspace(updatedFacility, newInstance);
          updatedWorkspace = state.machineWorkspaceManager.getWorkspace(facilityId);
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
      
      // Remove equipment from existing workspace (preserves other jobs and progress)
      let updatedWorkspace = state.machineWorkspace;
      if (state.selectedFacilityId === facilityId && state.machineWorkspace) {
        const updatedFacility = updatedFacilities.find(f => f.id === facilityId);
        if (updatedFacility) {
          state.machineWorkspaceManager.setFacility(updatedFacility);
          // Instead of reinitializing, just remove the specific equipment
          state.machineWorkspaceManager.removeEquipmentFromWorkspace(facilityId, equipmentInstanceId);
          updatedWorkspace = state.machineWorkspaceManager.getWorkspace(facilityId);
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
  
  // LEGACY: Production management (superseded by machine workspace system)
  /*
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
  */
  
  // LEGACY: More production management functions (superseded by machine workspace)
  /*
  cancelProductionJob: (facilityId, jobId) => {
    // Implementation here
  },
  
  updateProductionPriority: (facilityId, jobId, priority) => {
    // Implementation here
  },
  */
  
  // New machine workspace system
  startMachineJob: (facilityId, productId, methodId, quantity = 1, enhancementSelection, rushOrder = false, dynamicMethod) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) {
      console.error(`Cannot start job: facility ${facilityId} not found`);
      return;
    }
    
    // Get the method - check dynamic method first, then predefined methods
    let method = dynamicMethod;
    if (!method) {
      method = basicSidearmMethods.find(m => m.id === methodId);
      if (!method) {
        method = tacticalKnifeMethods.find(m => m.id === methodId);
      }
    }
    
    if (!method) {
      console.error(`Cannot start job: method ${methodId} not found`);
      return;
    }
    
    // Ensure workspace is ready - but don't wait for state update
    let workspace = state.machineWorkspace;
    if (!workspace || workspace.facilityId !== facilityId) {
      state.machineWorkspaceManager.setFacility(facility);
      state.machineWorkspaceManager.setGameTime(state.gameTime);
      workspace = state.machineWorkspaceManager.initializeWorkspace(facility);
    } else {
      // Just update game time for existing workspace
      state.machineWorkspaceManager.setGameTime(state.gameTime);
    }
    
    // Add the job immediately
    const priority = rushOrder ? JobPriority.RUSH : JobPriority.NORMAL;
    state.machineWorkspaceManager.addJob(
      facilityId,
      productId,
      method,
      quantity,
      priority,
      rushOrder,
      enhancementSelection
    );
    
    // Single state update with the current workspace
    set({ machineWorkspace: state.machineWorkspaceManager.getWorkspace(facilityId) });
  },
  
  // Cancel a machine job and recover materials
  cancelMachineJob: (facilityId: string, jobId: string) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    if (!facility) {
      console.error(`Cannot cancel job ${jobId}: facility ${facilityId} not found`);
      return false;
    }
    
    // Use the machine workspace manager to cancel the job
    const success = state.machineWorkspaceManager.cancelJob(facilityId, jobId);
    
    if (success) {
      // Update the workspace state after cancellation
      set({ machineWorkspace: state.machineWorkspaceManager.getWorkspace(facilityId) });
      console.log(`Job ${jobId} cancelled successfully`);
    }
    
    return success;
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
    
    // LEGACY: Production system (superseded by machine workspace system)
    /*
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
    */
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
  })),
  
  // Market action implementations
  purchaseMarketLot: (lotId, facilityId) => {
    set(state => {
      const lot = state.marketState.availableLots.find(l => l.id === lotId);
      const facility = state.facilities.find(f => f.id === facilityId);
      
      if (!lot || !facility) {
        console.error('Lot or facility not found:', { lotId, facilityId });
        return state;
      }
      
      // Check if player can afford it
      if (state.credits < lot.totalPrice) {
        console.warn('Insufficient credits for purchase:', { required: lot.totalPrice, available: state.credits });
        return state;
      }
      
      // Create purchase order
      const purchaseOrder = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lotId: lot.id,
        supplierId: lot.supplierId,
        materialId: lot.materialId,
        quantity: lot.quantity,
        totalPaid: lot.totalPrice,
        orderedAt: state.gameTime.totalGameHours,
        deliveryAt: state.gameTime.totalGameHours + lot.deliveryTimeHours,
        status: 'ordered' as const,
        facilityId: facility.id
      };
      
      // Deduct credits and add purchase order
      return {
        ...state,
        credits: state.credits - lot.totalPrice,
        marketState: {
          ...state.marketState,
          availableLots: state.marketState.availableLots.filter(l => l.id !== lotId),
          activePurchaseOrders: [...state.marketState.activePurchaseOrders, purchaseOrder]
        }
      };
    });
  },
  
  listProductForSale: (facilityId, productId, quantity, pricePerUnit) => {
    set(state => {
      const facility = state.facilities.find(f => f.id === facilityId);
      if (!facility) {
        console.error('Facility not found:', facilityId);
        return state;
      }
      
      let availableQuantity = 0;
      let qualityGrade: 'junk' | 'functional' | 'standard' | 'pristine' = 'standard';
      let itemsToRemove: ItemInstance[] = [];
      
      if (facility.inventory) {
        // Use new inventory system - get best quality items
        const totalAvailable = inventoryManager.getAvailableQuantity(facility.inventory, productId);
        if (totalAvailable < quantity) {
          console.warn('Insufficient products to list for sale:', {
            requested: quantity,
            available: totalAvailable,
            product: productId
          });
          return state;
        }
        
        // Get the best quality items for this product
        itemsToRemove = inventoryManager.getBestQualityItems(facility.inventory, productId, quantity);
        availableQuantity = itemsToRemove.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate average quality and determine grade
        const totalQualityPoints = itemsToRemove.reduce((sum, item) => sum + (item.quality * item.quantity), 0);
        const avgQuality = totalQualityPoints / availableQuantity;
        qualityGrade = avgQuality >= 90 ? 'pristine' : 
                      avgQuality >= 75 ? 'functional' : 
                      avgQuality >= 50 ? 'standard' : 'junk';
      } else {
        // Fall back to legacy storage system
        const qualityLevels: ('pristine' | 'functional' | 'standard' | 'junk')[] = ['pristine', 'functional', 'standard', 'junk'];
        let sourceStorageKey = '';
        
        for (const quality of qualityLevels) {
          const storageKey = `${productId}_${quality}`;
          const qty = facility.current_storage[storageKey] || 0;
          if (qty >= quantity) {
            availableQuantity = qty;
            sourceStorageKey = storageKey;
            qualityGrade = quality;
            break;
          }
        }
        
        if (availableQuantity < quantity) {
          console.warn('Insufficient products to list for sale:', {
            requested: quantity,
            available: availableQuantity,
            product: productId
          });
          return state;
        }
        
        // Remove from legacy storage
        facility.current_storage[sourceStorageKey] = availableQuantity - quantity;
      }
      
      // Create player listing
      const listing = {
        id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        quantity,
        pricePerUnit,
        totalPrice: pricePerUnit * quantity,
        qualityGrade,
        listedAt: state.gameTime.totalGameHours,
        expiresAt: state.gameTime.totalGameHours + 168, // Expires in 1 week
        soldQuantity: 0,
        status: 'active' as const
      };
      
      // Remove products from inventory (new system only)
      if (facility.inventory && itemsToRemove.length > 0) {
        for (const item of itemsToRemove) {
          inventoryManager.removeItem(facility.inventory, item.id, item.quantity);
        }
      }
      
      return {
        ...state,
        marketState: {
          ...state.marketState,
          playerListings: [...state.marketState.playerListings, listing]
        }
      };
    });
  },
  
  removePlayerListing: (listingId) => {
    set(state => {
      const listing = state.marketState.playerListings.find(l => l.id === listingId);
      if (!listing) {
        console.error('Listing not found:', listingId);
        return state;
      }
      
      // Return unsold products to facility storage (simplified: return to first facility)
      const facility = state.facilities[0]; // TODO: Track which facility the listing came from
      if (facility && listing.status === 'active' && listing.soldQuantity < listing.quantity) {
        const remainingQuantity = listing.quantity - listing.soldQuantity;
        
        if (facility.inventory) {
          // Use new inventory system - create item instance to return
          const qualityValue = listing.qualityGrade === 'pristine' ? 95 : 
                               listing.qualityGrade === 'functional' ? 80 : 
                               listing.qualityGrade === 'standard' ? 65 : 45;
          
          const returnedItem = createItemInstance({
            baseItemId: listing.productId,
            tags: [ItemTag.REFURBISHED], // Mark returned items as refurbished
            quality: qualityValue,
            quantity: remainingQuantity,
            metadata: {
              source: 'market_return',
              originalListingId: listingId,
              returnedAt: state.gameTime.totalGameHours
            }
          });
          
          inventoryManager.addItem(facility.inventory, returnedItem);
        } else {
          // Fall back to legacy storage
          const storageKey = `${listing.productId}_${listing.qualityGrade}`;
          facility.current_storage[storageKey] = (facility.current_storage[storageKey] || 0) + remainingQuantity;
        }
      }
      
      return {
        ...state,
        marketState: {
          ...state.marketState,
          playerListings: state.marketState.playerListings.filter(l => l.id !== listingId)
        }
      };
    });
  },
  
  refreshMarketLots: () => {
    set(state => {
      // Generate new market lots
      const newLots = state.marketGenerator.generateMarketLots(6, state.gameTime.totalGameHours);
      
      // Clean up expired lots and add new ones
      const cleanedLots = state.marketGenerator.removeExpiredLots(
        state.marketState.availableLots, 
        state.gameTime.totalGameHours
      );
      
      // Apply market dynamics to existing lots
      const dynamicLots = state.marketGenerator.simulateMarketForces(
        [...cleanedLots, ...newLots],
        state.gameTime.totalGameHours
      );
      
      return {
        ...state,
        marketState: {
          ...state.marketState,
          availableLots: dynamicLots,
          lastLotRefresh: state.gameTime.totalGameHours,
          nextRefreshAt: state.gameTime.totalGameHours + 24 // Next refresh in 24 hours
        }
      };
    });
  },
  
  // Contract action implementations
  acceptCustomerContract: (contractId) => {
    set(state => {
      const contract = state.contractState.availableCustomerContracts.find(c => c.id === contractId);
      
      if (!contract) {
        console.error('Contract not found:', contractId);
        return state;
      }
      
      // Move contract from available to active
      const updatedContract = {
        ...contract,
        status: 'accepted' as const,
        acceptedAt: state.gameTime.totalGameHours
      };
      
      return {
        ...state,
        contractState: {
          ...state.contractState,
          availableCustomerContracts: state.contractState.availableCustomerContracts.filter(c => c.id !== contractId),
          activeCustomerContracts: [...state.contractState.activeCustomerContracts, updatedContract]
        }
      };
    });
  },
  
  acceptSupplyContract: (contractId) => {
    // TODO: Implement supply contract acceptance
    console.log('Supply contract acceptance not yet implemented:', contractId);
  },
  
  fulfillContract: (contractId, facilityId) => {
    set(state => {
      const contract = state.contractState.activeCustomerContracts.find(c => c.id === contractId);
      const facility = state.facilities.find(f => f.id === facilityId);
      
      if (!contract || !facility) {
        console.error('Contract or facility not found:', { contractId, facilityId });
        return state;
      }
      
      // Check if we can fulfill the contract
      const requirement = contract.requirements[0]; // Simplified: assume single requirement
      if (!requirement) {
        console.error('Contract has no requirements');
        return state;
      }
      
      // Look for products in facility storage that meet the requirements
      const productStorageKey = `${requirement.productId}_pristine`; // Start with highest quality
      const availableQuantity = facility.current_storage[productStorageKey] || 0;
      
      if (availableQuantity < requirement.quantity) {
        console.warn('Insufficient products to fulfill contract:', {
          required: requirement.quantity,
          available: availableQuantity,
          product: requirement.productId
        });
        return state; // Don't fulfill if we don't have enough
      }
      
      // Calculate payment (simplified - full payment for now)
      const payment = contract.totalPayment;
      
      // Check if early delivery bonus applies
      const currentTime = state.gameTime.totalGameHours;
      const deadline = (contract.acceptedAt || 0) + contract.deadlineHours;
      const timeRemaining = deadline - currentTime;
      const isEarlyDelivery = timeRemaining > 0;
      const finalPayment = isEarlyDelivery 
        ? Math.floor(payment * (1 + contract.bonusRate))
        : payment;
      
      // Remove products from storage
      facility.current_storage[productStorageKey] = availableQuantity - requirement.quantity;
      
      // Complete the contract
      const completedContract = {
        ...contract,
        status: 'completed' as const,
        completedAt: currentTime
      };
      
      return {
        ...state,
        credits: state.credits + finalPayment,
        contractState: {
          ...state.contractState,
          activeCustomerContracts: state.contractState.activeCustomerContracts.filter(c => c.id !== contractId),
          completedContracts: [...state.contractState.completedContracts, completedContract]
        }
      };
    });
  },
  
  refreshContracts: () => {
    set(state => {
      // Generate new customer contracts
      const newContracts = state.contractGenerator.generateCustomerContracts(4, state.gameTime.totalGameHours);
      
      // Clean up expired contracts and add new ones
      const cleanedContracts = state.contractGenerator.removeExpiredContracts(
        state.contractState.availableCustomerContracts,
        state.gameTime.totalGameHours
      );
      
      return {
        ...state,
        contractState: {
          ...state.contractState,
          availableCustomerContracts: [...cleanedContracts, ...newContracts],
          lastContractRefresh: state.gameTime.totalGameHours,
          nextRefreshAt: state.gameTime.totalGameHours + 48 // Next refresh in 48 hours
        }
      };
    });
  },
  
  // Inventory management action implementations
  migrateFacilityInventory: (facilityId) => {
    set(state => {
      const facility = state.facilities.find(f => f.id === facilityId);
      if (!facility) {
        console.error(`Facility not found: ${facilityId}`);
        return state;
      }
      
      if (facilityMigrationManager.needsMigration(facility)) {
        const migratedFacility = facilityMigrationManager.migrateFacility(facility);
        
        return {
          ...state,
          facilities: state.facilities.map(f => 
            f.id === facilityId ? migratedFacility : f
          )
        };
      }
      
      return state;
    });
  },
  
  addItemToInventory: (facilityId, item) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    
    if (!facility || !facility.inventory) {
      console.error(`Facility or inventory not found: ${facilityId}`);
      return false;
    }
    
    const success = inventoryManager.addItem(facility.inventory, item);
    
    if (success) {
      set(state => ({
        facilities: state.facilities.map(f => 
          f.id === facilityId ? { ...f, inventory: facility.inventory } : f
        )
      }));
    }
    
    return success;
  },
  
  removeItemFromInventory: (facilityId, itemInstanceId, quantity) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    
    if (!facility || !facility.inventory) {
      console.error(`Facility or inventory not found: ${facilityId}`);
      return false;
    }
    
    const success = inventoryManager.removeItem(facility.inventory, itemInstanceId, quantity);
    
    if (success) {
      set(state => ({
        facilities: state.facilities.map(f => 
          f.id === facilityId ? { ...f, inventory: facility.inventory } : f
        )
      }));
    }
    
    return success;
  },
  
  getAvailableItems: (facilityId, baseItemId) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    
    if (!facility || !facility.inventory) {
      // Fall back to legacy storage
      return facility?.current_storage[baseItemId] || 0;
    }
    
    return inventoryManager.getAvailableQuantity(facility.inventory, baseItemId);
  },
  
  findBestQualityItems: (facilityId, baseItemId, quantity) => {
    const state = get();
    const facility = state.facilities.find(f => f.id === facilityId);
    
    if (!facility || !facility.inventory) {
      console.warn(`Facility or inventory not found: ${facilityId}`);
      return [];
    }
    
    return inventoryManager.getBestQualityItems(facility.inventory, baseItemId, quantity);
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
  machined_parts: 5,
  
  // Environmental condition test items for treatment system testing
  drenched_tactical_knife: 2,
  corroded_mechanical_assembly: 3,
  heat_damaged_sidearm: 2,
  contaminated_electronics: 4,
  radiation_exposed_rifle: 1,
  impact_damaged_components: 5,
  
  // Treatment materials for environmental condition handling
  absorbent_materials: 10,
  rust_remover: 8,
  decontamination_solution: 6,
  neutralizing_agent: 5,
  thermal_protection: 4,
  tempering_compounds: 3,
  protective_coating: 6,
  lubricants: 8,
  replacement_parts: 12,
  cleaning_supplies: 15
};

// Sync facility storage with game store materials
initialFacility.current_storage = { ...initialMaterials };

// Initialize new inventory system with migration from legacy storage
initialFacility.inventory = facilityMigrationManager.migrateFacility({
  ...initialFacility,
  current_storage: initialMaterials
}).inventory;

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

// Initialize market with starting lots
const marketGenerator = new MarketGenerator();
const initialMarketLots = marketGenerator.generateMarketLots(8, 0); // Generate 8 lots at game start

// Initialize contracts with starting offers
const contractGenerator = new ContractGenerator();
const initialContracts = contractGenerator.generateCustomerContracts(3, 0); // Generate 3 contracts at game start

useGameStore.setState({ 
  facilities: [initialFacility],
  selectedFacilityId: initialFacility.id,
  machineWorkspaceManager: machineManager,
  machineWorkspace: initialWorkspace,
  marketState: {
    availableLots: initialMarketLots,
    activePurchaseOrders: [],
    playerListings: [],
    transactionHistory: [],
    lastLotRefresh: 0,
    nextRefreshAt: 24 // Next refresh in 24 hours
  },
  contractState: {
    availableCustomerContracts: initialContracts,
    availableSupplyContracts: [],
    activeCustomerContracts: [],
    activeSupplyContracts: [],
    contractProgress: new Map(),
    completedContracts: [],
    contractHistory: [],
    lastContractRefresh: 0,
    nextRefreshAt: 48 // Next refresh in 48 hours
  }
});

// Set up job completion callback on the store's machine workspace manager
useGameStore.getState().machineWorkspaceManager.setJobCompleteCallback((job) => {
  const store = useGameStore.getState();
  store.addJobCompletionNotification({
    jobId: job.id,
    productId: job.productId,
    methodName: job.method.name,
    quantity: job.quantity
  });
  
  // Force a complete state update to refresh the UI with completed items
  // This ensures the facility inventory changes are reflected in the UI
  if (store.selectedFacilityId) {
    const updatedFacility = store.facilities.find(f => f.id === store.selectedFacilityId);
    if (updatedFacility) {
      // Update the machine workspace manager with the current facility state
      store.machineWorkspaceManager.setFacility(updatedFacility);
      
      // Update the workspace in the UI state
      useGameStore.setState({ 
        machineWorkspace: store.machineWorkspaceManager.getWorkspace(store.selectedFacilityId),
        // Trigger a re-render by updating the facilities array reference
        facilities: [...store.facilities]
      });
    }
  }
});