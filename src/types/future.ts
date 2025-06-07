// Future system type definitions for upcoming game passes
// These types provide structure for planned features

import { 
  SkillType, 
  SkillLevel, 
  MaterialTag, 
  MaterialGrade,
  TechCategory,
  ResearchMethod,
  QualityGrade,
  ReputationType,
  SalvageType,
  ExaminationResult,
  EventType,
  EventSeverity,
  CustomerFaction,
  ContractType
} from '../constants/enums';

// =====================================
// Worker/Labor System (Manufacturing v2)
// =====================================

export interface Worker {
  id: string;
  name: string;
  skills: Record<SkillType, SkillLevel>;
  currentAssignment?: string; // facilityId or jobId
  experience: Record<SkillType, number>;
  traits: string[];
  salary: number;
  efficiency: number; // 0.5 to 2.0 multiplier
  fatigue: number; // 0-100, affects performance
  morale: number; // 0-100, affects efficiency and retention
}

export interface Skill {
  type: SkillType;
  level: SkillLevel;
  experience: number;
  specializations: string[];
}

export interface LaborRequirement {
  skillType: SkillType;
  minimumLevel: SkillLevel;
  workerCount: number;
  duration: number; // hours
  canSplit: boolean; // Can multiple workers share this requirement
}

// =====================================
// Materials & Supply Chain
// =====================================

export interface EnhancedMaterial {
  id: string;
  name: string;
  category: string;
  properties: MaterialProperty[];
  tags: MaterialTag[];
  grade: MaterialGrade;
  basePrice: number;
  availability: number; // 0-1 scale
  suppliers: string[]; // Supplier IDs
  qualityVariance: number; // How much quality can vary
  shelfLife?: number; // Game hours before degradation
}

export interface MaterialProperty {
  name: string;
  value: number;
  unit: string;
  affects: string[]; // What this property influences
}

export interface Supplier {
  id: string;
  name: string;
  faction: CustomerFaction;
  reliability: number; // 0-1 scale
  priceModifier: number; // Multiplier for base material prices
  leadTime: number; // Delivery time in game hours
  minimumOrder: Record<string, number>; // materialId -> minimum quantity
  availableMaterials: string[]; // Material IDs they supply
  reputation: number; // Player's standing with this supplier
}

// =====================================
// Contracts & Market System
// =====================================

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  customer: CustomerInfo;
  requirements: CustomerRequirement[];
  paymentTerms: PaymentTerms;
  deadline: number; // Game time
  priority: number;
  reputation: number; // Reputation reward/penalty
  unlocks?: string[]; // Future contracts or technologies
  penalties: ContractPenalty[];
}

export interface CustomerInfo {
  name: string;
  faction: CustomerFaction;
  reliability: number;
  paymentHistory: number;
  preferredQuality: QualityGrade;
  priceFlexibility: number; // How much they'll pay above market
}

export interface CustomerRequirement {
  productId: string;
  quantity: number;
  minimumQuality: QualityGrade;
  maxPrice: number;
  specialRequirements?: string[]; // Custom specifications
  flexibility: number; // How much variation is acceptable
}

export interface PaymentTerms {
  advance: number; // Percentage paid upfront
  onDelivery: number; // Percentage paid on delivery
  retention: number; // Percentage held for quality guarantee
  currency: string;
  bonuses?: PaymentBonus[];
}

export interface PaymentBonus {
  condition: string;
  amount: number;
  description: string;
}

export interface ContractPenalty {
  condition: string;
  penalty: number; // Fixed amount or percentage
  description: string;
}

// =====================================
// Research & Technology System
// =====================================

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  description: string;
  prerequisites: string[]; // Technology IDs
  cost: number; // Research points
  unlocks: TechUnlock[];
  hidden: boolean; // Only revealed through discovery
  difficulty: number; // Affects research time
}

export interface TechUnlock {
  type: 'manufacturing_method' | 'equipment' | 'material' | 'upgrade';
  targetId: string;
  improvement?: number; // Percentage improvement if upgrade
}

export interface ResearchProject {
  id: string;
  technologyId: string;
  method: ResearchMethod;
  progress: number; // 0-100
  researcherAssignments: string[]; // Worker IDs
  requiredSamples?: string[]; // Material/product IDs needed for research
  estimatedCompletion: number; // Game time
  obstacles: ResearchObstacle[];
}

export interface ResearchObstacle {
  type: string;
  description: string;
  solutions: string[]; // Possible ways to overcome
  severity: number; // How much it slows research
}

export interface Blueprint {
  id: string;
  name: string;
  productId: string;
  manufacturingMethods: string[]; // Method IDs this blueprint enables
  qualityBonus: number;
  efficiency: number; // Cost/time reduction
  completeness: number; // 0-100, partial blueprints need research
  source: string; // Where this blueprint came from
}

// =====================================
// Quality & Reputation System
// =====================================

export interface QualityMetrics {
  productId: string;
  averageGrade: QualityGrade;
  consistency: number; // How much quality varies
  defectRate: number; // Percentage of defective products
  customerSatisfaction: number; // Customer feedback score
  returnRate: number; // Percentage of returns
  trends: QualityTrend[];
}

export interface QualityTrend {
  metric: string;
  change: number;
  period: number; // Time period for this trend
  causes: string[]; // What's driving this trend
}

export interface Reputation {
  overall: number; // Global reputation score
  byFaction: Record<CustomerFaction, number>;
  byType: Record<ReputationType, number>;
  history: ReputationEvent[];
  milestones: ReputationMilestone[];
}

export interface ReputationEvent {
  timestamp: number;
  type: ReputationType;
  change: number;
  reason: string;
  affectedFactions: CustomerFaction[];
}

export interface ReputationMilestone {
  name: string;
  threshold: number;
  unlocks: string[]; // What this milestone provides access to
  achieved: boolean;
  achievedAt?: number;
}

export interface CustomerRelation {
  customerId: string;
  trust: number; // 0-100
  satisfaction: number; // 0-100
  contractHistory: ContractHistoryEntry[];
  preferences: CustomerPreference[];
  exclusiveAccess: boolean; // Do they offer exclusive contracts
}

export interface ContractHistoryEntry {
  contractId: string;
  completed: boolean;
  onTime: boolean;
  qualityMet: boolean;
  payment: number;
  issues: string[];
}

export interface CustomerPreference {
  aspect: string; // 'price', 'quality', 'speed', etc.
  weight: number; // How important this is to them
  tolerance: number; // How much variation they accept
}

// =====================================
// Discovery & Salvage System
// =====================================

export interface SalvageLot {
  id: string;
  name: string;
  type: SalvageType;
  location: string;
  discoveredBy: string; // How player found this
  examined: boolean;
  cost: number; // Purchase/access cost
  estimatedValue: number; // Player's estimate before examination
  actualContents?: SalvageContent[];
  risks: SalvageRisk[];
  timeLimit?: number; // How long this opportunity lasts
}

export interface SalvageContent {
  type: ExaminationResult;
  items: SalvageItem[];
  hidden: boolean; // Requires deep examination to find
  condition: number; // 0-100, affects item quality
}

export interface SalvageItem {
  type: 'material' | 'component' | 'blueprint' | 'technology';
  id: string;
  quantity: number;
  condition: number;
  rarity: number; // How rare this find is
  origin?: string; // Where this item came from originally
}

export interface SalvageRisk {
  type: string;
  probability: number;
  consequence: string;
  mitigation?: string; // How player can reduce this risk
}

export interface ComponentDiscovery {
  componentId: string;
  discoveredAt: number; // Game time
  discoveryMethod: string;
  knowledgeGained: string[];
  researchOpportunities: string[]; // Research projects this unlocks
  marketValue: number;
}

export interface PlayerKnowledge {
  knownTechnologies: Set<string>;
  componentAnalysis: Record<string, ComponentAnalysis>;
  marketIntelligence: Record<string, MarketIntel>;
  supplierRelationships: Record<string, SupplierRelationship>;
}

export interface ComponentAnalysis {
  componentId: string;
  analysisLevel: number; // How thoroughly player has studied this
  properties: Record<string, number>;
  possibleUses: string[];
  reverseEngineeringProgress: number;
}

export interface MarketIntel {
  productId: string;
  demandLevel: number;
  priceRange: [number, number];
  competitors: string[];
  trends: string[];
  lastUpdated: number;
}

export interface SupplierRelationship {
  supplierId: string;
  trustLevel: number;
  negotiatedPrices: Record<string, number>; // materialId -> price
  creditTerms: number; // Days of credit they'll extend
  exclusiveDeals: string[]; // Exclusive access to certain materials
}

// =====================================
// Events & Incidents System
// =====================================

export interface GalaxyEvent {
  id: string;
  name: string;
  type: EventType;
  severity: EventSeverity;
  startTime: number;
  duration: number;
  affectedRegions: string[];
  effects: EventEffect[];
  playerChoices?: EventChoice[];
  resolved: boolean;
}

export interface EventEffect {
  target: 'materials' | 'contracts' | 'reputation' | 'technology';
  targetId?: string; // Specific ID if not global
  effect: string; // Description of the effect
  magnitude: number; // Strength of effect
  duration: number; // How long effect lasts
}

export interface EventChoice {
  id: string;
  description: string;
  requirements?: string[]; // What player needs to choose this
  consequences: EventConsequence[];
  cost?: number;
}

export interface EventConsequence {
  immediate: EventEffect[];
  delayed?: DelayedConsequence[];
  reputation?: Record<CustomerFaction, number>;
}

export interface DelayedConsequence {
  delay: number; // Game hours until this triggers
  effect: EventEffect;
  probability: number; // Chance this actually happens
}

export interface SupplyDisruption {
  materialId: string;
  severity: number; // 0-1 scale
  duration: number; // Game hours
  priceIncrease: number; // Multiplier
  availabilityReduction: number; // Percentage reduction
  alternativeSources?: string[]; // Supplier IDs that might still have it
}

export interface Opportunity {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  rewards: OpportunityReward[];
  timeLimit: number;
  difficulty: number;
  hidden: boolean; // Only visible if player meets certain conditions
}

export interface OpportunityReward {
  type: 'cash' | 'reputation' | 'technology' | 'contract' | 'material';
  amount: number;
  targetId?: string;
  description: string;
}