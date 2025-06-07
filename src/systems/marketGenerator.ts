// Market Lot Generator System
// Generates random material lots from procedural suppliers

import { MaterialLot, MarketSupplier, MarketTransaction } from '../types';

// Procedural supplier names and types
const supplierPrefixes = [
  'Titan', 'Proxima', 'Vega', 'Helios', 'Quantum', 'Stellar', 'Nova', 'Orion',
  'Centauri', 'Nebula', 'Cosmic', 'Galactic', 'Solar', 'Lunar', 'Asteroid'
];

const supplierSuffixes = [
  'Mining Corp', 'Steel Works', 'Salvage Co', 'Industrial', 'Precision Parts',
  'Systems Ltd', 'Manufacturing', 'Supply Chain', 'Materials Inc', 'Dynamics',
  'Industries', 'Technologies', 'Solutions', 'Enterprises', 'Group'
];

const supplierTypes = [
  { type: 'mining', specialties: ['steel', 'aluminum', 'titanium'], reputation: [60, 90] },
  { type: 'salvage', specialties: ['electronics', 'components', 'damaged_weapons'], reputation: [30, 70] },
  { type: 'precision', specialties: ['machined_components', 'aluminum', 'electronics'], reputation: [70, 95] },
  { type: 'industrial', specialties: ['steel', 'plastic', 'rubber'], reputation: [50, 80] },
  { type: 'military', specialties: ['titanium', 'electronics', 'components'], reputation: [80, 100] }
];

// Material availability and pricing data
const materialData = {
  steel: { 
    basePrice: 4.5, 
    variance: 0.8, 
    quantityRange: [50, 500], 
    deliveryHours: [12, 48],
    commonGrades: ['standard', 'premium']
  },
  aluminum: { 
    basePrice: 6.2, 
    variance: 1.0, 
    quantityRange: [25, 200], 
    deliveryHours: [18, 72],
    commonGrades: ['standard', 'premium']
  },
  plastic: { 
    basePrice: 2.1, 
    variance: 0.5, 
    quantityRange: [100, 800], 
    deliveryHours: [6, 24],
    commonGrades: ['salvage', 'standard']
  },
  electronics: { 
    basePrice: 15.0, 
    variance: 3.0, 
    quantityRange: [10, 100], 
    deliveryHours: [24, 120],
    commonGrades: ['salvage', 'standard', 'military']
  },
  machined_components: { 
    basePrice: 45.0, 
    variance: 8.0, 
    quantityRange: [5, 50], 
    deliveryHours: [48, 168],
    commonGrades: ['standard', 'premium', 'military']
  },
  titanium: { 
    basePrice: 25.0, 
    variance: 5.0, 
    quantityRange: [10, 100], 
    deliveryHours: [72, 240],
    commonGrades: ['premium', 'military']
  },
  damaged_weapons: { 
    basePrice: 12.0, 
    variance: 4.0, 
    quantityRange: [1, 20], 
    deliveryHours: [12, 48],
    commonGrades: ['salvage']
  }
};

export class MarketGenerator {
  private suppliers: Map<string, MarketSupplier> = new Map();
  private supplierIdCounter = 0;

  constructor() {
    // Pre-generate some suppliers
    this.generateSuppliers(20);
  }

  // Generate procedural suppliers
  private generateSuppliers(count: number): void {
    for (let i = 0; i < count; i++) {
      const supplier = this.createRandomSupplier();
      this.suppliers.set(supplier.id, supplier);
    }
  }

  private createRandomSupplier(): MarketSupplier {
    const prefix = supplierPrefixes[Math.floor(Math.random() * supplierPrefixes.length)];
    const suffix = supplierSuffixes[Math.floor(Math.random() * supplierSuffixes.length)];
    const supplierType = supplierTypes[Math.floor(Math.random() * supplierTypes.length)];
    
    const [minRep, maxRep] = supplierType.reputation;
    const reputation = Math.floor(Math.random() * (maxRep - minRep + 1)) + minRep;
    
    return {
      id: `supplier-${++this.supplierIdCounter}`,
      name: `${prefix} ${suffix}`,
      reputation,
      reliability: Math.max(30, reputation + Math.floor(Math.random() * 21) - 10), // ±10 from reputation
      specialties: supplierType.specialties
    };
  }

  // Generate random material lots
  generateMarketLots(count: number, currentGameTime: number): MaterialLot[] {
    const lots: MaterialLot[] = [];
    const availableMaterials = Object.keys(materialData);
    
    for (let i = 0; i < count; i++) {
      const materialId = availableMaterials[Math.floor(Math.random() * availableMaterials.length)];
      const material = materialData[materialId as keyof typeof materialData];
      
      // Find suitable suppliers for this material
      const suitableSuppliers = Array.from(this.suppliers.values())
        .filter(s => s.specialties.includes(materialId));
      
      if (suitableSuppliers.length === 0) continue;
      
      const supplier = suitableSuppliers[Math.floor(Math.random() * suitableSuppliers.length)];
      const lot = this.createMaterialLot(supplier, materialId, material, currentGameTime);
      
      lots.push(lot);
    }
    
    return lots.sort((a, b) => a.totalPrice - b.totalPrice); // Sort by price
  }

  private createMaterialLot(
    supplier: MarketSupplier, 
    materialId: string, 
    material: any, 
    currentGameTime: number
  ): MaterialLot {
    // Calculate quantity based on material and supplier reputation
    const [minQty, maxQty] = material.quantityRange;
    const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
    
    // Calculate price with supplier reputation affecting variance
    const reputationModifier = (supplier.reputation - 50) / 100; // -0.5 to +0.5
    const priceVariance = material.variance * (1 - Math.abs(reputationModifier) * 0.3);
    const priceMultiplier = 1 + (Math.random() * 2 - 1) * priceVariance;
    const basePrice = material.basePrice * priceMultiplier;
    
    // Higher reputation suppliers charge more but offer better reliability
    const reputationPriceAdjust = 1 + (reputationModifier * 0.2);
    const pricePerUnit = Math.round(basePrice * reputationPriceAdjust * 100) / 100;
    
    // Calculate delivery time
    const [minDelivery, maxDelivery] = material.deliveryHours;
    const baseDeliveryTime = Math.floor(Math.random() * (maxDelivery - minDelivery + 1)) + minDelivery;
    // Better suppliers tend to deliver faster
    const deliveryModifier = 1 - (supplier.reliability / 100) * 0.3;
    const deliveryTimeHours = Math.ceil(baseDeliveryTime * deliveryModifier);
    
    // Select quality grade based on supplier type and material
    const availableGrades = material.commonGrades;
    let qualityGrade: string;
    
    if (supplier.reputation >= 80) {
      // High rep suppliers favor premium grades
      qualityGrade = availableGrades[Math.floor(Math.random() * Math.min(2, availableGrades.length)) + Math.max(0, availableGrades.length - 2)];
    } else if (supplier.reputation <= 40) {
      // Low rep suppliers favor salvage/standard
      qualityGrade = availableGrades[Math.floor(Math.random() * Math.min(2, availableGrades.length))];
    } else {
      // Mid-range suppliers use any grade
      qualityGrade = availableGrades[Math.floor(Math.random() * availableGrades.length)];
    }
    
    // Lot expires in 24-72 hours
    const expirationHours = Math.floor(Math.random() * 49) + 24;
    
    return {
      id: `lot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      supplierId: supplier.id,
      materialId,
      quantity,
      pricePerUnit,
      totalPrice: Math.round(pricePerUnit * quantity),
      qualityGrade: qualityGrade as any,
      deliveryTimeHours,
      expiresAt: currentGameTime + expirationHours,
      description: this.generateLotDescription(supplier, materialId, qualityGrade, quantity)
    };
  }

  private generateLotDescription(supplier: MarketSupplier, materialId: string, qualityGrade: string, quantity: number): string {
    const flavorTexts = [
      `Fresh stock from ${supplier.name}`,
      `Limited time offer - ${quantity} units available`,
      `Direct from supplier warehouse`,
      `Bulk pricing available`,
      `Quality ${qualityGrade} grade materials`,
      `Fast shipping from ${supplier.name}`,
      `Surplus inventory clearance`,
      `Premium supplier quality guaranteed`
    ];
    
    return flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
  }

  // Get supplier information
  getSupplier(supplierId: string): MarketSupplier | undefined {
    return this.suppliers.get(supplierId);
  }

  // Get all suppliers (for debugging or future features)
  getAllSuppliers(): MarketSupplier[] {
    return Array.from(this.suppliers.values());
  }

  // Market dynamics simulation
  simulateMarketForces(lots: MaterialLot[], currentTime: number): MaterialLot[] {
    return lots.map(lot => {
      // Apply time-based price fluctuations (market volatility)
      const timeVariation = Math.sin(currentTime / 24) * 0.1; // Daily price cycles
      const randomFluctuation = (Math.random() - 0.5) * 0.05; // ±2.5% random variation
      
      // Apply supply/demand pressure based on material type
      const demandMultiplier = this.getMaterialDemandMultiplier(lot.materialId, currentTime);
      
      const priceMultiplier = 1 + timeVariation + randomFluctuation + demandMultiplier;
      const newPricePerUnit = Math.max(0.1, lot.pricePerUnit * priceMultiplier);
      
      return {
        ...lot,
        pricePerUnit: Math.round(newPricePerUnit * 100) / 100,
        totalPrice: Math.round(newPricePerUnit * lot.quantity)
      };
    });
  }
  
  // Get demand multiplier for specific materials
  private getMaterialDemandMultiplier(materialId: string, currentTime: number): number {
    const demandCycles = {
      steel: Math.sin(currentTime / 72) * 0.15, // 3-day cycles, ±15%
      aluminum: Math.sin(currentTime / 48) * 0.12, // 2-day cycles, ±12%
      electronics: Math.sin(currentTime / 96) * 0.2, // 4-day cycles, ±20%
      titanium: Math.sin(currentTime / 168) * 0.25, // Weekly cycles, ±25%
      plastic: Math.sin(currentTime / 36) * 0.08, // 1.5-day cycles, ±8%
      machined_components: Math.sin(currentTime / 120) * 0.18 // 5-day cycles, ±18%
    };
    
    return demandCycles[materialId as keyof typeof demandCycles] || 0;
  }

  // Clean up expired lots
  removeExpiredLots(lots: MaterialLot[], currentGameTime: number): MaterialLot[] {
    return lots.filter(lot => lot.expiresAt > currentGameTime);
  }
}