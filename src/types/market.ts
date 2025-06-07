// Market System Types
// Defines the open market for material purchasing and product sales

export interface MarketSupplier {
  id: string;
  name: string;
  reputation: number; // 0-100 scale
  reliability: number; // 0-100 scale for delivery consistency
  specialties: string[]; // Material types they focus on
}

export interface MaterialLot {
  id: string;
  supplierId: string;
  materialId: string; // References material from materials.ts
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  qualityGrade: 'salvage' | 'standard' | 'premium' | 'military';
  deliveryTimeHours: number; // Game hours until delivery
  expiresAt: number; // Game time when lot expires
  description?: string; // Optional flavor text
}

export interface PurchaseOrder {
  id: string;
  lotId: string;
  supplierId: string;
  materialId: string;
  quantity: number;
  totalPaid: number;
  orderedAt: number; // Game time when ordered
  deliveryAt: number; // Game time when delivered
  status: 'ordered' | 'in_transit' | 'delivered';
  facilityId: string; // Where to deliver
}

export interface PlayerListing {
  id: string;
  productId: string; // References product from products.ts
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  qualityGrade: 'junk' | 'functional' | 'standard' | 'pristine';
  listedAt: number; // Game time when listed
  expiresAt: number; // Game time when listing expires
  soldQuantity: number; // How many have sold
  status: 'active' | 'partially_sold' | 'sold' | 'expired';
}

export interface MarketTransaction {
  id: string;
  type: 'purchase' | 'sale';
  itemId: string; // Material or product ID
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  timestamp: number; // Game time
  counterparty: string; // Supplier or customer name
}

export interface MarketState {
  availableLots: MaterialLot[];
  activePurchaseOrders: PurchaseOrder[];
  playerListings: PlayerListing[];
  transactionHistory: MarketTransaction[];
  lastLotRefresh: number; // Game time of last lot generation
  nextRefreshAt: number; // Game time for next refresh
}