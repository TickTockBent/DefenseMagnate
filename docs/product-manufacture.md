# Manufacturing System Design

## Core Concept: Multi-Method Manufacturing

Products can be manufactured through different **Manufacturing Methods**, each with distinct requirements, costs, quality outputs, and multi-stage processes.

## Product States

### State Classification
- `pristine`: Brand new, full quality rating
- `functional`: Normal working condition
- `damaged`: Broken but repairable
- `junk`: Low quality but operational
- `scrap`: Non-functional, only good for raw materials

### State Transitions
Products can move between states through manufacturing processes or operational use:
- `pristine` → `functional` (normal wear)
- `functional` → `damaged` (heavy use, combat)
- `damaged` → `functional` (restoration)
- `damaged` → `scrap` (failed repair)
- `scrap` → various raw materials (salvage)

## Manufacturing Methods Structure

### Method Definition
Each product can have multiple manufacturing methods:

```
Manufacturing Method: {
  id: "method_restore_basic_sidearm"
  name: "Restore Basic Sidearm"
  input_state: "damaged"
  output_state: "functional"
  output_quality_range: [60-80]
  required_facility_traits: ["basic_tools"]
  steps: [...]
}
```

### Multi-Stage Process
Each method consists of sequential steps:

```
Step: {
  name: "Cleaning"
  duration_percentage: 30
  material_requirements: [
    {material: "damaged_basic_sidearm", quantity: 1, consumed_at_start: true}
  ]
  labor_requirements: "unskilled"
  can_fail: false
}
```

## Example: Basic Sidearm Manufacturing Methods

### Method 1: Restoration
**Purpose**: Repair damaged weapons
**Requirements**: Basic tools, damaged sidearm
**Steps**:
1. **Cleaning** (30% duration)
   - Materials: 1x Damaged Basic Sidearm (consumed at start)
   - Labor: Unskilled
   - Failure risk: None
2. **Repairing** (60% duration)
   - Materials: 2x Low Tech Spares (consumed at start)
   - Labor: Skilled technician
   - Failure risk: 5% (results in scrap if failed)
3. **Testing & Polishing** (10% duration)
   - Materials: None
   - Labor: Unskilled
   - Failure risk: None

**Output**: Functional Basic Sidearm (Quality: 60-80)

### Method 2: Forged Manufacturing
**Purpose**: Build new high-quality weapons
**Requirements**: Precision machining tools, raw materials
**Steps**:
1. **Material Preparation** (15% duration)
   - Materials: 1x Steel, 0.3x Plastic (consumed at start)
   - Labor: Unskilled
   - Failure risk: None
2. **Precision Machining** (50% duration)
   - Materials: 1x Machined Parts (consumed at start)
   - Labor: Skilled machinist
   - Failure risk: 10% (wasted materials if failed)
3. **Assembly** (25% duration)
   - Materials: None (all consumed in previous steps)
   - Labor: Skilled technician
   - Failure risk: 5%
4. **Quality Control** (10% duration)
   - Materials: None
   - Labor: Quality inspector
   - Failure risk: None (but may downgrade quality rating)

**Output**: Pristine Basic Sidearm (Quality: 85-95)

### Method 3: Cobbled Assembly
**Purpose**: Make cheap weapons from scrap
**Requirements**: Basic tools, lots of spare parts
**Steps**:
1. **Sorting Components** (20% duration)
   - Materials: 5x Low Tech Spares (consumed at start)
   - Labor: Unskilled
   - Failure risk: None
2. **Improvised Assembly** (60% duration)
   - Materials: 2x Low Tech Spares (consumed during step)
   - Labor: Unskilled
   - Failure risk: 15% (results in pure scrap)
3. **Basic Testing** (20% duration)
   - Materials: None
   - Labor: Unskilled
   - Failure risk: 10% (downgrades to damaged state)

**Output**: Junk Basic Sidearm (Quality: 25-45)

## Strategic Implications

### Economic Trade-offs
- **Restoration**: Cheap but requires damaged inputs and skilled labor
- **Forged**: Expensive materials but highest quality and profit margins
- **Cobbled**: Very cheap but low quality limits customer base

### Market Segmentation
- **Military contracts**: Demand forged/pristine quality
- **Rebel groups**: Accept junk quality for lower prices
- **Salvage operations**: Provide damaged goods for restoration

### Production Line Optimization
- **Specialization**: Dedicated lines for each method type
- **Flexibility**: Retool lines based on available materials/contracts
- **Supply chain**: Different methods need different supplier relationships

## UI/UX Considerations

### Visual Progression
- Progress bar divided into step segments
- Current step highlighted with material requirements
- Visual indication of material consumption timing
- Failure risk indicators per step

### Player Decision Points
- Choose manufacturing method based on:
  - Available materials
  - Required quality level
  - Profit margins
  - Time constraints
  - Labor availability

### Information Display
```
Production Line 1: Basic Sidearm (Restoration Method)
├─ Step 1: Cleaning [████████████████████████████████] 100% ✓
├─ Step 2: Repairing [████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒] 40%
│  └─ Needs: 2x Low Tech Spares (Loaded ✓)
│  └─ Labor: Technician (Assigned ✓)
│  └─ Risk: 5% failure chance
└─ Step 3: Testing [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒] Pending
```

## Implementation Benefits

1. **Emergent Strategy**: Players develop manufacturing "builds" based on supply chains
2. **Market Dynamics**: Different methods serve different customer segments  
3. **Risk Management**: Players balance failure rates vs profit margins
4. **Resource Planning**: Multi-step processes require careful material timing
5. **Skill Progression**: Workers gain experience with specific methods/steps