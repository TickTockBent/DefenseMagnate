// Contract Generator System
// Generates customer contracts for product sales

import { CustomerContract, Customer, ContractRequirement } from '../types';

// Customer organization names and types
const customerPrefixes = [
  'Free', 'United', 'Rebel', 'Corporate', 'Military', 'Colonial', 'Independent', 
  'Frontier', 'Outer', 'Inner', 'Northern', 'Southern', 'Eastern', 'Western'
];

const customerSuffixes = [
  'Coalition', 'Alliance', 'Federation', 'Consortium', 'Guild', 'Syndicate',
  'Corporation', 'Industries', 'Security', 'Defense Force', 'Militia', 'Guard',
  'Collective', 'Union', 'Assembly', 'Council', 'Command', 'Division'
];

const customerTypes = {
  military: {
    qualityStandards: 'high' as const,
    paymentReliability: [80, 100],
    preferredProducts: ['basic_sidearm', 'tactical_knife'],
    quantityRange: [20, 100],
    paymentMultiplier: 1.4,
    deadlineRange: [168, 504] // 1-3 weeks
  },
  corporate: {
    qualityStandards: 'standard' as const,
    paymentReliability: [70, 95],
    preferredProducts: ['basic_sidearm'],
    quantityRange: [50, 200],
    paymentMultiplier: 1.2,
    deadlineRange: [336, 840] // 2-5 weeks
  },
  rebel: {
    qualityStandards: 'low' as const,
    paymentReliability: [40, 80],
    preferredProducts: ['basic_sidearm', 'tactical_knife'],
    quantityRange: [10, 80],
    paymentMultiplier: 0.9,
    deadlineRange: [168, 672] // 1-4 weeks
  },
  civilian: {
    qualityStandards: 'standard' as const,
    paymentReliability: [60, 85],
    preferredProducts: ['tactical_knife'],
    quantityRange: [5, 30],
    paymentMultiplier: 1.0,
    deadlineRange: [504, 1344] // 3-8 weeks
  },
  government: {
    qualityStandards: 'high' as const,
    paymentReliability: [90, 100],
    preferredProducts: ['basic_sidearm'],
    quantityRange: [100, 500],
    paymentMultiplier: 1.3,
    deadlineRange: [672, 1680] // 4-10 weeks
  }
};

// Base pricing for products (credits per unit)
const productPricing = {
  basic_sidearm: {
    basePrice: 150,
    qualityMultiplier: { junk: 0.3, functional: 0.7, standard: 1.0, pristine: 1.4 }
  },
  tactical_knife: {
    basePrice: 65,
    qualityMultiplier: { junk: 0.3, functional: 0.7, standard: 1.0, pristine: 1.4 }
  }
};

export class ContractGenerator {
  private customers: Map<string, Customer> = new Map();
  private customerIdCounter = 0;
  private contractIdCounter = 0;

  constructor() {
    // Pre-generate some customers
    this.generateCustomers(15);
  }

  // Generate procedural customers
  private generateCustomers(count: number): void {
    const types = Object.keys(customerTypes) as Array<keyof typeof customerTypes>;
    
    for (let i = 0; i < count; i++) {
      const customer = this.createRandomCustomer(types);
      this.customers.set(customer.id, customer);
    }
  }

  private createRandomCustomer(types: Array<keyof typeof customerTypes>): Customer {
    const type = types[Math.floor(Math.random() * types.length)];
    const typeData = customerTypes[type];
    
    const prefix = customerPrefixes[Math.floor(Math.random() * customerPrefixes.length)];
    const suffix = customerSuffixes[Math.floor(Math.random() * customerSuffixes.length)];
    
    const [minReliability, maxReliability] = typeData.paymentReliability;
    const paymentReliability = Math.floor(Math.random() * (maxReliability - minReliability + 1)) + minReliability;
    
    return {
      id: `customer-${++this.customerIdCounter}`,
      name: `${prefix} ${suffix}`,
      type,
      reputation: Math.floor(Math.random() * 41) + 60, // 60-100
      paymentReliability,
      qualityStandards: typeData.qualityStandards,
      preferredProducts: typeData.preferredProducts
    };
  }

  // Generate customer contracts
  generateCustomerContracts(count: number, currentGameTime: number): CustomerContract[] {
    const contracts: CustomerContract[] = [];
    
    for (let i = 0; i < count; i++) {
      const customer = this.selectRandomCustomer();
      if (!customer) continue;
      
      const contract = this.createCustomerContract(customer, currentGameTime);
      contracts.push(contract);
    }
    
    return contracts.sort((a, b) => b.totalPayment - a.totalPayment); // Sort by payment descending
  }

  private selectRandomCustomer(): Customer | undefined {
    const customers = Array.from(this.customers.values());
    if (customers.length === 0) return undefined;
    
    return customers[Math.floor(Math.random() * customers.length)];
  }

  private createCustomerContract(customer: Customer, currentGameTime: number): CustomerContract {
    const typeData = customerTypes[customer.type];
    const productId = typeData.preferredProducts[Math.floor(Math.random() * typeData.preferredProducts.length)];
    
    // Generate quantity
    const [minQty, maxQty] = typeData.quantityRange;
    const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
    
    // Calculate quality requirements
    const minimumQuality = this.getMinimumQualityForStandard(typeData.qualityStandards);
    
    // Calculate payment
    const baseProductPrice = productPricing[productId as keyof typeof productPricing]?.basePrice || 100;
    const typeMultiplier = typeData.paymentMultiplier;
    const customerModifier = 1 + (customer.reputation - 75) / 100; // ±0.25 based on reputation
    const randomVariance = 0.9 + Math.random() * 0.2; // ±10%
    
    const pricePerUnit = Math.round(baseProductPrice * typeMultiplier * customerModifier * randomVariance);
    const totalPayment = pricePerUnit * quantity;
    
    // Calculate deadline
    const [minDeadline, maxDeadline] = typeData.deadlineRange;
    const deadlineHours = Math.floor(Math.random() * (maxDeadline - minDeadline + 1)) + minDeadline;
    
    // Determine contract features
    const rushOrder = Math.random() < 0.15; // 15% chance
    const allowPartialFulfillment = customer.type !== 'military' && customer.type !== 'government';
    const minimumFulfillmentPercent = allowPartialFulfillment ? 
      Math.floor(Math.random() * 21) + 60 : 100; // 60-80% if partial allowed
    
    // Create requirements
    const requirement: ContractRequirement = {
      productId,
      quantity,
      minimumQuality,
      maxAcceptableDefects: Math.floor(quantity * 0.05) // 5% defect tolerance
    };
    
    return {
      id: `contract-${++this.contractIdCounter}`,
      customerId: customer.id,
      title: this.generateContractTitle(customer, productId, quantity),
      description: this.generateContractDescription(customer, requirement),
      requirements: [requirement],
      totalPayment: rushOrder ? Math.floor(totalPayment * 1.3) : totalPayment,
      deadlineHours: rushOrder ? Math.floor(deadlineHours * 0.7) : deadlineHours,
      rushOrder,
      allowPartialFulfillment,
      minimumFulfillmentPercent,
      penaltyRate: 0.05, // 5% per day late
      bonusRate: rushOrder ? 0.1 : 0.02, // 10% for rush orders, 2% for normal
      status: 'available'
    };
  }

  private getMinimumQualityForStandard(standard: string): number {
    switch (standard) {
      case 'low': return 30; // Accepts junk and above
      case 'standard': return 60; // Accepts functional and above  
      case 'high': return 80; // Accepts standard and above
      case 'military': return 90; // Only pristine quality
      default: return 50;
    }
  }

  private generateContractTitle(customer: Customer, productId: string, quantity: number): string {
    const productName = productId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const titles = [
      `${customer.name} ${productName} Order`,
      `${quantity}x ${productName} Contract`,
      `${customer.name} Procurement Request`,
      `${productName} Supply Agreement`,
      `Emergency ${productName} Order`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateContractDescription(customer: Customer, requirement: ContractRequirement): string {
    const productName = requirement.productId.replace('_', ' ');
    const urgencyTexts = {
      military: 'Urgent military procurement for active operations.',
      corporate: 'Standard corporate security equipment order.',
      rebel: 'Resistance forces require reliable equipment.',
      civilian: 'Civilian protection and utility contract.',
      government: 'Official government procurement contract.'
    };
    
    const qualityTexts = {
      low: 'Any functional condition acceptable.',
      standard: 'Standard quality requirements apply.',
      high: 'High quality standards required.',
      military: 'Military specification quality mandatory.'
    };
    
    return `${urgencyTexts[customer.type]} ${qualityTexts[customer.qualityStandards]} Payment guaranteed upon delivery verification.`;
  }

  // Get customer information
  getCustomer(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  // Get all customers (for debugging or future features)
  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  // Clean up expired contracts
  removeExpiredContracts(contracts: CustomerContract[], currentGameTime: number): CustomerContract[] {
    return contracts.filter(contract => {
      if (contract.status !== 'available') return true;
      
      // Contracts expire after being available for a while
      const contractAge = currentGameTime - (contract.acceptedAt || currentGameTime - 168); // Default 1 week availability
      return contractAge < 504; // Remove after 3 weeks if not accepted
    });
  }
}