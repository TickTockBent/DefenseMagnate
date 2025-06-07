console.log('A. gameStore.ts starting to load')

import { create } from 'zustand';
import { 
  Facility,
  createGarage,
  ProductionLine,
  ManufacturingMethod 
  // LEGACY: ProductionStepInstance no longer exists in new machine workspace system
} from '../types';
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
  startMultiStepProduction: (facilityId: string, productId: string, methodId: string, quantity: number) => void;
  updateProductionLine: (lineId: string, updates: Partial<ProductionLine>) => void;
  processCompletedProduction: () => void;
  processMultiStepProduction: () => void;
}

console.log('C. Creating store...')

// Helper function to check if we can afford materials for a manufacturing method
function canAffordMethodMaterials(method: ManufacturingMethod, quantity: number, materials: Record<string, number>): boolean {
  for (const step of method.steps) {
    for (const matReq of step.material_requirements) {
      const needed = matReq.quantity * quantity;
      const available = materials[matReq.material_id] || 0;
      if (available < needed) {
        return false;
      }
    }
  }
  return true;
}

// Helper function to create step instances for a production line
// LEGACY FUNCTION - Commented out during v1 migration
// function createStepInstances(method: ManufacturingMethod): ProductionStepInstance[] {
//   return method.steps.map(step => ({
//     step_id: step.id,
//     status: 'pending',
//     materials_consumed: false,
//     labor_assigned: false,
//     failure_rolled: false
//   }));
// }

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
    'low_tech_spares': 15,
    'damaged_basic_sidearm': 3,
    'machined_parts': 2,
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
  
  startMultiStepProduction: (facilityId, productId, methodId, quantity) => set((state) => {
    const product = getProductData(productId);
    if (!product || !product.manufacturing_methods) {
      console.warn('Product not found or has no manufacturing methods:', productId);
      return state;
    }
    
    const method = product.manufacturing_methods.find(m => m.id === methodId);
    if (!method) {
      console.warn('Manufacturing method not found:', methodId);
      return state;
    }
    
    // Check if we have enough materials for all steps
    if (!canAffordMethodMaterials(method, quantity, state.materials)) {
      console.warn('Not enough materials for multi-step production');
      return state;
    }
    
    // Create multi-step production line
    const lineId = `multistep_${Date.now()}`;
    const newLine: ProductionLine = {
      id: lineId,
      facilityId,
      productId,
      quantity,
      status: 'active',
      startGameTime: state.gameTime.totalGameHours,
      durationHours: method.total_duration_hours,
      
      // Multi-step specific fields
      manufacturing_method: method,
      current_step_index: 0,
      step_instances: [], // LEGACY: createStepInstances(method) - disabled during migration
      input_product_state: method.input_state,
      expected_output_state: method.output_state,
      expected_quality_range: method.output_quality_range,
      input_materials_loaded: {},
    };
    
    // Consume materials for first step (only those marked as consumed_at_start)
    const updatedMaterials = { ...state.materials };
    const firstStep = method.steps[0];
    firstStep.material_requirements.forEach(req => {
      if (req.consumed_at_start) {
        updatedMaterials[req.material_id] = 
          (updatedMaterials[req.material_id] || 0) - (req.quantity * quantity);
      }
    });
    
    // Mark first step as active and materials consumed
    if (newLine.step_instances) {
      newLine.step_instances[0].status = 'active';
      newLine.step_instances[0].start_game_time = state.gameTime.totalGameHours;
      newLine.step_instances[0].materials_consumed = firstStep.material_requirements.some(r => r.consumed_at_start);
      newLine.step_instances[0].labor_assigned = true; // Simplified for now
    }
    
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
  
  // Process multi-step production lines with individual step progression
  processMultiStepProduction: () => set((state) => {
    const updatedLines: ProductionLine[] = [];
    const completedLines: ProductionLine[] = [];
    let updatedMaterials = { ...state.materials };
    
    state.productionLines.forEach(line => {
      // Skip if not a multi-step production line
      if (!line.manufacturing_method || !line.step_instances) {
        updatedLines.push(line);
        return;
      }
      
      const method = line.manufacturing_method;
      const currentStepIndex = line.current_step_index || 0;
      const currentStep = method.steps[currentStepIndex];
      const stepInstance = line.step_instances[currentStepIndex];
      
      if (!currentStep || !stepInstance) {
        updatedLines.push(line);
        return;
      }
      
      // Calculate step duration and check if current step is complete
      const stepDurationHours = method.total_duration_hours * (currentStep.duration_percentage / 100);
      const stepStartTime = stepInstance.start_game_time || line.startGameTime;
      const isStepComplete = state.gameTime.totalGameHours >= stepStartTime + stepDurationHours;
      
      if (isStepComplete && stepInstance.status === 'active') {
        // Handle step completion
        let newLine = { ...line };
        
        // Handle failure check if step can fail and hasn't been rolled yet
        if (currentStep.can_fail && !stepInstance.failure_rolled) {
          const failureRoll = Math.random();
          if (failureRoll < currentStep.failure_chance) {
            // Step failed
            stepInstance.status = 'failed';
            stepInstance.failure_rolled = true;
            newLine.status = 'failed';
            updatedLines.push(newLine);
            return;
          }
        }
        
        // Mark current step as completed
        stepInstance.status = 'completed';
        stepInstance.failure_rolled = true;
        
        // Consume materials for this step if not consumed at start
        currentStep.material_requirements.forEach(req => {
          if (!req.consumed_at_start) {
            updatedMaterials[req.material_id] = 
              (updatedMaterials[req.material_id] || 0) - (req.quantity * (line.quantity || 1));
          }
        });
        
        // Move to next step or complete production
        if (currentStepIndex + 1 < method.steps.length) {
          // Move to next step
          newLine.current_step_index = currentStepIndex + 1;
          const nextStep = method.steps[currentStepIndex + 1];
          const nextStepInstance = newLine.step_instances![currentStepIndex + 1];
          
          // Start next step
          nextStepInstance.status = 'active';
          nextStepInstance.start_game_time = state.gameTime.totalGameHours;
          nextStepInstance.labor_assigned = true; // Simplified
          
          // Consume materials for next step if marked as consumed_at_start
          nextStep.material_requirements.forEach(req => {
            if (req.consumed_at_start) {
              updatedMaterials[req.material_id] = 
                (updatedMaterials[req.material_id] || 0) - (req.quantity * (line.quantity || 1));
              nextStepInstance.materials_consumed = true;
            }
          });
          
          updatedLines.push(newLine);
        } else {
          // All steps completed - production is done
          newLine.status = 'completed';
          
          // Calculate final quality (simplified - just use middle of range)
          const qualityRange = method.output_quality_range;
          newLine.actual_output_quality = Math.floor((qualityRange[0] + qualityRange[1]) / 2);
          
          completedLines.push(newLine);
        }
      } else {
        // Step still in progress
        updatedLines.push(line);
      }
    });
    
    // Add completed products to inventory
    const updatedProducts = { ...state.completedProducts };
    completedLines.forEach(line => {
      if (!line.productId) return;
      
      const product = getProductData(line.productId);
      if (!product) return;
      
      // Create product name with state suffix
      let productName = product.name;
      if (line.expected_output_state && product.state_variants) {
        const stateVariant = product.state_variants[line.expected_output_state];
        if (stateVariant) {
          productName += stateVariant.name_suffix;
        }
      }
      
      updatedProducts[productName] = (updatedProducts[productName] || 0) + (line.quantity || 1);
    });
    
    return {
      ...state,
      productionLines: updatedLines,
      materials: updatedMaterials,
      completedProducts: updatedProducts,
    };
  }),
}});

console.log('I. Store created successfully')