import { create } from 'zustand';

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

// Simplified GameState for testing
interface GameState {
  // Core game state
  turn: number;
  credits: number;
  
  // Resources
  resources: Record<string, number>;
  
  // Research
  research: {
    current: string | null;
    completed: string[];
    available: Research[];
  };
  
  // Factories (simplified)
  factories: Factory[];
  
  // Contracts
  contracts: Contract[];
  
  // UI State
  activeTab: 'research' | 'manufacturing' | 'contracts' | 'supply';
  
  // Actions
  setActiveTab: (tab: GameState['activeTab']) => void;
  advanceTurn: () => void;
  startResearch: (researchId: string) => void;
  acceptContract: (contractId: string) => void;
  updateResource: (resource: string, amount: number) => void;
}

export const useGameStore = create<GameState>()((set) => ({
    // Initial state
    turn: 1,
    credits: 500,
    
    resources: {
      'Labor Hours': 40,
    },
    
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
    ],
    
    activeTab: 'research',
    
    // Actions
    setActiveTab: (tab) => set({ activeTab: tab }),
    
    advanceTurn: () => set((state) => ({
      turn: state.turn + 1,
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
}));