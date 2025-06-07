// All game enums consolidated in one place

// Equipment and Tag System Enums
export enum TagCategory {
  // Physical Manipulation
  BASIC_MANIPULATION = 'basic_manipulation',
  PRECISION_MANIPULATION = 'precision_manipulation',
  HEAVY_MANIPULATION = 'heavy_manipulation',
  
  // Machining Operations
  TURNING = 'turning',
  MILLING = 'milling',
  DRILLING = 'drilling',
  GRINDING = 'grinding',
  CUTTING = 'cutting',
  WELDING = 'welding',
  FORMING = 'forming',
  
  // Surface and Space
  SURFACE = 'surface',
  STORAGE = 'storage',
  
  // Supporting Operations
  HOLDING = 'holding',
  MEASURING = 'measuring',
  COOLING = 'cooling',
  HEATING = 'heating',
  
  // Power and Control
  POWERED = 'powered',
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  COMPUTER_CONTROLLED = 'computer_controlled',
  
  // Environmental
  CLEAN_ROOM = 'clean_room',
  HAZMAT = 'hazmat',
  TEMPERATURE_CONTROLLED = 'temperature_controlled',
  VACUUM_CAPABLE = 'vacuum_capable',
  
  // Material Handling
  HEAVY_LIFTING = 'heavy_lifting',
  PRECISION_PLACEMENT = 'precision_placement',
  MATERIAL_FEED = 'material_feed',
  
  // Quality and Testing
  QUALITY_CONTROL = 'quality_control',
  DIMENSIONAL_INSPECTION = 'dimensional_inspection',
  MATERIAL_TESTING = 'material_testing',
  CALIBRATION = 'calibration',
  
  // Electronics and Advanced
  ELECTRONICS_ASSEMBLY = 'electronics_assembly',
  SOLDERING = 'soldering',
  CIRCUIT_TESTING = 'circuit_testing',
  FIRMWARE_PROGRAMMING = 'firmware_programming',
  
  // Specialized Manufacturing
  INJECTION_MOLDING = 'injection_molding',
  CASTING = 'casting',
  EXTRUSION = 'extrusion',
  STAMPING = 'stamping',
  FORGING = 'forging',
  
  // Advanced Materials
  COMPOSITE_LAYUP = 'composite_layup',
  CHEMICAL_PROCESSING = 'chemical_processing',
  CRYSTALLINE_GROWTH = 'crystalline_growth',
  NANO_FABRICATION = 'nano_fabrication',
  
  // Specialized Handling
  OPTICS_HANDLING = 'optics_handling',
  VIBRATION_ISOLATION = 'vibration_isolation'
}

// Production Job States
export enum JobState {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepState {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  FAILED = 'failed'
}

export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  RUSH = 3,
  CRITICAL = 4
}

// Manufacturing System Enums
export type ProductState = 
  | 'pristine'
  | 'functional'
  | 'damaged'
  | 'junk'
  | 'scrap'

export type LaborSkill = 
  | 'unskilled'
  | 'skilled_technician'
  | 'skilled_machinist'
  | 'quality_inspector'
  | 'engineer'
  | 'specialist'

// Material Categories
export enum MaterialCategory {
  RAW_MATERIALS = 'raw_materials',
  MANUFACTURED_COMPONENTS = 'manufactured_components',
  FINISHED_PRODUCTS = 'finished_products',
  CONSUMABLES = 'consumables'
}

// Contract System Enums
export enum ContractStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum ContractType {
  STANDARD = 'standard',
  RUSH = 'rush',
  BULK = 'bulk',
  EXCLUSIVE = 'exclusive'
}

// Research System Enums
export enum ResearchCategory {
  MATERIALS = 'materials',
  MANUFACTURING = 'manufacturing',
  QUALITY = 'quality',
  AUTOMATION = 'automation',
  DESIGN = 'design'
}

export enum ResearchStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum TechCategory {
  BASIC_MANUFACTURING = 'basic_manufacturing',
  ADVANCED_MANUFACTURING = 'advanced_manufacturing',
  MATERIALS_SCIENCE = 'materials_science',
  ELECTRONICS = 'electronics',
  AUTOMATION = 'automation',
  QUALITY_CONTROL = 'quality_control',
  LOGISTICS = 'logistics',
  WEAPONS_DESIGN = 'weapons_design'
}

export enum ResearchMethod {
  STUDY_SAMPLES = 'study_samples',
  REVERSE_ENGINEER = 'reverse_engineer',
  THEORETICAL_RESEARCH = 'theoretical_research',
  PRACTICAL_EXPERIMENTATION = 'practical_experimentation'
}

// Worker/Labor System Enums (v2 future)
export enum SkillType {
  MANUFACTURING = 'manufacturing',
  QUALITY_CONTROL = 'quality_control',
  RESEARCH = 'research',
  MANAGEMENT = 'management',
  SALES = 'sales',
  LOGISTICS = 'logistics'
}

export enum SkillLevel {
  UNTRAINED = 0,
  APPRENTICE = 1,
  SKILLED = 2,
  EXPERT = 3,
  MASTER = 4,
  LEGENDARY = 5
}

// Materials & Supply Chain Enums
export enum MaterialTag {
  LIGHTWEIGHT = 'lightweight',
  DURABLE = 'durable',
  CONDUCTIVE = 'conductive',
  INSULATING = 'insulating',
  CORROSION_RESISTANT = 'corrosion_resistant',
  HIGH_TEMPERATURE = 'high_temperature',
  RARE = 'rare',
  COMMON = 'common',
  SYNTHETIC = 'synthetic',
  ORGANIC = 'organic'
}

export enum MaterialGrade {
  SCRAP = 'scrap',
  LOW_GRADE = 'low_grade',
  STANDARD = 'standard',
  HIGH_GRADE = 'high_grade',
  MILITARY_SPEC = 'military_spec',
  PROTOTYPE = 'prototype'
}

// Quality & Reputation Enums
export enum QualityGrade {
  DEFECTIVE = 'defective',
  POOR = 'poor',
  ACCEPTABLE = 'acceptable',
  GOOD = 'good',
  EXCELLENT = 'excellent',
  PERFECT = 'perfect'
}

export enum ReputationType {
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  DELIVERY_RELIABILITY = 'delivery_reliability',
  PRODUCT_QUALITY = 'product_quality',
  INNOVATION = 'innovation',
  COST_EFFECTIVENESS = 'cost_effectiveness'
}

// Discovery & Salvage Enums
export enum SalvageType {
  DERELICT_SHIP = 'derelict_ship',
  WRECKAGE_FIELD = 'wreckage_field',
  ABANDONED_FACILITY = 'abandoned_facility',
  CARGO_CONTAINERS = 'cargo_containers',
  PROTOTYPE_CACHE = 'prototype_cache'
}

export enum ExaminationResult {
  NOTHING_USEFUL = 'nothing_useful',
  BASIC_MATERIALS = 'basic_materials',
  USEFUL_COMPONENTS = 'useful_components',
  RARE_MATERIALS = 'rare_materials',
  UNKNOWN_TECHNOLOGY = 'unknown_technology',
  BLUEPRINT_FRAGMENT = 'blueprint_fragment'
}

// Events & Incidents Enums
export enum EventType {
  SUPPLY_DISRUPTION = 'supply_disruption',
  MARKET_OPPORTUNITY = 'market_opportunity',
  TECHNOLOGY_BREAKTHROUGH = 'technology_breakthrough',
  POLITICAL_CHANGE = 'political_change',
  NATURAL_DISASTER = 'natural_disaster',
  PIRATE_ACTIVITY = 'pirate_activity',
  TRADE_EMBARGO = 'trade_embargo'
}

export enum EventSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
  CATASTROPHIC = 'catastrophic'
}

// Customer/Faction System Enums
export enum CustomerFaction {
  CIVILIAN_MARKET = 'civilian_market',
  CORPORATE_SECURITY = 'corporate_security',
  PLANETARY_MILITIA = 'planetary_militia',
  MERCENARY_GROUPS = 'mercenary_groups',
  REBEL_FORCES = 'rebel_forces',
  IMPERIAL_NAVY = 'imperial_navy',
  BLACK_MARKET = 'black_market',
  RESEARCH_INSTITUTES = 'research_institutes'
}