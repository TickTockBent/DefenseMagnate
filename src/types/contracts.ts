// Contracts System Types  
// Defines customer contracts for product sales and material supply agreements

export interface Customer {
  id: string;
  name: string;
  type: 'military' | 'corporate' | 'rebel' | 'civilian' | 'government';
  reputation: number; // 0-100 scale
  paymentReliability: number; // 0-100 scale
  qualityStandards: 'low' | 'standard' | 'high' | 'military';
  preferredProducts: string[]; // Product IDs they typically order
}

export interface ContractRequirement {
  productId: string; // References product from products.ts
  quantity: number;
  minimumQuality: number; // 0-100 scale
  maxAcceptableDefects: number; // How many failed quality items allowed
}

export interface CustomerContract {
  id: string;
  customerId: string;
  title: string; // e.g., "Rebel Coalition Weapon Order"
  description: string;
  requirements: ContractRequirement[];
  totalPayment: number;
  deadlineHours: number; // Game hours from acceptance
  rushOrder: boolean; // Higher payment but shorter deadline
  allowPartialFulfillment: boolean;
  minimumFulfillmentPercent: number; // If partial allowed, minimum %
  penaltyRate: number; // Payment reduction per day late
  bonusRate: number; // Payment increase for early delivery
  status: 'available' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'expired';
  acceptedAt?: number; // Game time when accepted
  completedAt?: number; // Game time when completed
}

export interface MaterialSupplyContract {
  id: string;
  supplierId: string;
  materialId: string;
  quantityPerDelivery: number;
  pricePerUnit: number;
  deliveryIntervalHours: number; // How often deliveries occur
  contractDurationWeeks: number; // How long contract lasts
  qualityGuarantee: 'salvage' | 'standard' | 'premium';
  status: 'available' | 'active' | 'completed' | 'cancelled';
  acceptedAt?: number; // Game time when accepted
  nextDeliveryAt?: number; // Game time of next delivery
  deliveriesRemaining: number;
}

export interface ContractFulfillment {
  id: string;
  contractId: string;
  items: ContractFulfillmentItem[];
  packedAt: number; // Game time when packed
  shippedAt?: number; // Game time when shipped
  deliveredAt?: number; // Game time when delivered
  verifiedAt?: number; // Game time when customer verified
  status: 'packing' | 'packed' | 'shipped' | 'delivered' | 'verified' | 'disputed';
  totalValue: number;
  shippingCost: number;
  qualityScore: number; // Average quality of all items
}

export interface ContractFulfillmentItem {
  productId: string;
  quantity: number;
  quality: number; // 0-100 scale
  meetsRequirements: boolean;
  sourceStorageId?: string; // Which storage location item came from
}

export interface ContractProgress {
  contractId: string;
  requirementProgress: {
    productId: string;
    required: number;
    packed: number;
    shipped: number;
    delivered: number;
    verified: number;
  }[];
  fulfillments: ContractFulfillment[];
  estimatedCompletion: number; // Game time estimate
  onSchedule: boolean;
  daysUntilDeadline: number;
}

export interface ContractState {
  availableCustomerContracts: CustomerContract[];
  availableSupplyContracts: MaterialSupplyContract[];
  activeCustomerContracts: CustomerContract[];
  activeSupplyContracts: MaterialSupplyContract[];
  contractProgress: Map<string, ContractProgress>; // contractId -> progress
  completedContracts: CustomerContract[];
  contractHistory: CustomerContract[];
  lastContractRefresh: number; // Game time of last contract generation
  nextRefreshAt: number; // Game time for next refresh
}