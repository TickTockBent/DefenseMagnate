console.log('A. gameStore.ts starting to load')

import { create } from 'zustand';
import type { Facility } from '../types/facility';
import { createGarage } from '../types/facility';
import type { ProductionLine } from '../types/productionLine';
import { getProductData, canAffordMaterials } from '../data/productHelpers';
import { isProductionComplete } from '../utils/timeSystem';
import { createGameTime, updateGameTime, type GameTime } from '../utils/gameClock';

console.log('B. gameStore imports completed')

interface Factory {
  id: string;
  name: string;
  efficiency: number;
  status: 'online' | 'offline' | 'retooling';
  currentProduction: string | null;
  queue: Array<{
    itemId: string;
    progress: number;
    eta: number;
  }>;
}

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
  gameTime: GameTime;
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
  
  // Facilities (new system)
  facilities: Facility[];
  
  // Production
  productionLines: ProductionLine[];
  completedProducts: Record<string, number>; // Product inventory
  
  // Factories (legacy - will be converted to facilities)
  factories: Factory[];
  
  // Contracts
  contracts: Contract[];
  
  // UI State
  activeTab: 'research' | 'manufacturing' | 'contracts' | 'supply';
  
  // Actions
  setActiveTab: (tab: GameState['activeTab']) => void;
  updateGameTime: (deltaMs: number) => void;
  togglePause: () => void;
  setGameSpeed: (speed: number) => void;
  startResearch: (researchId: string) => void;
  acceptContract: (contractId: string) => void;
  updateResource: (resource: string, amount: number) => void;
  updateMaterial: (material: string, amount: number) => void;
  updateFacility: (facilityId: string, updates: Partial<Facility>) => void;
  startProduction: (facilityId: string, productId: string, quantity: number) => void;
  updateProductionLine: (lineId: string, updates: Partial<ProductionLine>) => void;
  processCompletedProduction: () => void;
}

console.log('C. Creating store...')

export const useGameStore = create<GameState>()((set) => {
  console.log('D. Store initializer called')
  
  try {
    console.log('E. Creating garage...')
    const garage = createGarage('garage_01')
    console.log('F. Garage created:', garage)
  } catch (error) {
    console.error('ERROR creating garage:', error)
  }
  
  return {
  // Initial state
  gameTime: createGameTime(),
  credits: 500, // Starting with very little money
  
  resources: {
    'Labor Hours': 40, // One week of solo work
  },
  
  // Starting materials
  materials: {
    'steel': 20,
    'plastic': 10,
    'basic_electronics': 5,
  },
  
  // Player starts with a single garage
  facilities: (() => {
    try {
      console.log('G. Creating facilities array...')
      const garage = createGarage('garage_01')
      console.log('H. Garage for facilities:', garage)
      return [garage]
    } catch (error) {
      console.error('ERROR in facilities creation:', error)
      return []
    }
  })(),
  
  // Production state
  productionLines: [],
  completedProducts: {},
  
  research: {
    current: null,
    completed: [],
    available: [
      { id: 'improved-metallurgy', name: 'Improved Metallurgy', progress: 0, cost: 100, prerequisites: [] },
      { id: 'basic-electronics', name: 'Basic Electronics', progress: 0, cost: 150, prerequisites: [] },
      { id: 'efficient-tooling', name: 'Efficient Tooling', progress: 0, cost: 200, prerequisites: ['improved-metallurgy'] },
    ],
  },
  
  factories: [
    {
      id: 'factory-1',
      name: 'Orbital Line',
      efficiency: 0.87,
      status: 'online',
      currentProduction: null,
      queue: [],
    },
  ],
  
  contracts: [
    {
      id: 'contract-1',
      faction: 'Local Militia',
      requirements: ['Basic Sidearms x10'],
      payment: 250,
      deadline: 5,
      status: 'available',
      risk: 'low',
    },
    {
      id: 'contract-2',
      faction: 'Scrap Traders',
      requirements: ['Refurbished Parts x20'],
      payment: 150,
      deadline: 4,
      status: 'available',
      risk: 'low',
    },
  ],
  
  activeTab: 'research',
  
  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  updateGameTime: (deltaMs) => set((state) => ({
    gameTime: updateGameTime(state.gameTime, deltaMs),
  })),
  
  togglePause: () => set((state) => ({
    gameTime: { ...state.gameTime, isPaused: !state.gameTime.isPaused },
  })),
  
  setGameSpeed: (speed) => set((state) => ({
    gameTime: { ...state.gameTime, gameSpeed: speed },
  })),
  
  startResearch: (researchId) => set((state) => ({
    research: {
      ...state.research,
      current: researchId,
    },
  })),
  
  acceptContract: (contractId) => set((state) => ({
    contracts: state.contracts.map((contract) =>
      contract.id === contractId
        ? { ...contract, status: 'active' }
        : contract
    ),
  })),
  
  updateResource: (resource, amount) => set((state) => ({
    resources: {
      ...state.resources,
      [resource]: (state.resources[resource] || 0) + amount,
    },
  })),
  
  updateFacility: (facilityId, updates) => set((state) => ({
    facilities: state.facilities.map((facility) =>
      facility.id === facilityId
        ? { ...facility, ...updates }
        : facility
    ),
  })),
  
  updateMaterial: (material, amount) => set((state) => ({
    materials: {
      ...state.materials,
      [material]: (state.materials[material] || 0) + amount,
    },
  })),
  
  startProduction: (facilityId, productId, quantity) => set((state) => {
    const product = getProductData(productId);
    if (!product) {
      console.warn('Unknown product:', productId);
      return state;
    }
    
    // Check if we have enough materials
    if (!canAffordMaterials(productId, quantity, state.materials)) {
      console.warn('Not enough materials for production');
      return state;
    }
    
    // Create game-time production line
    const lineId = `prod_${Date.now()}`;
    const newLine: ProductionLine = {
      id: lineId,
      facilityId,
      productId,
      quantity,
      status: 'active',
      startGameTime: state.gameTime.totalGameHours,
      durationHours: product.base_labor_hours, // Use labor hours as production time
    };
    
    // Deduct materials
    const updatedMaterials = { ...state.materials };
    product.materials_required.forEach(req => {
      updatedMaterials[req.material_id] = 
        (updatedMaterials[req.material_id] || 0) - (req.quantity_per_unit * quantity);
    });
    
    return {
      ...state,
      productionLines: [...state.productionLines, newLine],
      materials: updatedMaterials,
    };
  }),
  
  updateProductionLine: (lineId, updates) => set((state) => ({
    productionLines: state.productionLines.map((line) =>
      line.id === lineId
        ? { ...line, ...updates }
        : line
    ),
  })),
  
  // Check for completed production and move to inventory
  processCompletedProduction: () => set((state) => {
    const completedLines: ProductionLine[] = [];
    const activeLines: ProductionLine[] = [];
    
    // Separate completed from active production using game time
    state.productionLines.forEach(line => {
      if (isProductionComplete(line.startGameTime, line.durationHours, state.gameTime.totalGameHours)) {
        completedLines.push(line);
      } else {
        activeLines.push(line);
      }
    });
    
    // Add completed products to inventory
    const updatedProducts = { ...state.completedProducts };
    completedLines.forEach(line => {
      if (!line.productId) return;
      const productName = getProductData(line.productId)?.name || line.productId;
      updatedProducts[productName] = (updatedProducts[productName] || 0) + (line.quantity || 1);
    });
    
    return {
      ...state,
      productionLines: activeLines,
      completedProducts: updatedProducts,
    };
  }),
}});

console.log('I. Store created successfully')