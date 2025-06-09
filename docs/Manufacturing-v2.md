# Manufacturing V2 Arc - Dynamic Manufacturing Intelligence

## Overview

Manufacturing V2 transforms Defense Magnate from recipe-based production to an intelligent manufacturing system that adapts workflows based on item condition, available components, and player capabilities. Building on the component-driven foundation from the Disassembly v1 arc, this system introduces dynamic job planning, optional enhancement modifiers, and condition-aware manufacturing.

## Core Evolution

### From Static Recipes to Dynamic Intelligence
**Current System**: Predefined manufacturing methods with fixed inputs and outputs
**V2 System**: Intelligent analysis of inputs with dynamic workflow generation within a logical manufacturing hierarchy

**Example**: Instead of separate "restore damaged sidearm" and "forge new sidearm" methods, the system analyzes the available inputs and automatically generates the optimal manufacturing workflow, respecting clear boundaries between material shaping and assembly operations.

### Manufacturing Hierarchy with Logical Boundaries

Manufacturing v2 implements a three-tier system that eliminates conceptual inconsistencies:

#### **Tier 1: Raw Materials (Atomic)**
- **Cannot be disassembled** - Pure, unprocessed materials
- Examples: `steel`, `aluminum`, `plastic`, `titanium`
- Source: Mining, purchasing, basic recycling

#### **Tier 2: Shaped Materials (Processed Materials)**
- **Cannot be disassembled** - These ARE the raw material, just shaped/processed
- **Can be further shaped** - Additional processing steps possible
- Examples: `steel-billet`, `steel-sheet`, `blade-blank`, `mechanical-component-rough`
- Process: Raw materials shaped through machining, forming, preparation

#### **Tier 3: Assemblies (Combined Components)**
- **CAN be disassembled** - Multiple separate parts joined together
- Examples: `mechanical-assembly`, `basic-sidearm`, `tactical-knife`
- Process: Shaped materials combined into functional products

### Enhanced Realism Through Material Preparation
- Steel must be prepared into appropriate billets before component machining
- Different products require specific material preparations
- Material preparation becomes a necessary and realistic manufacturing step
- Players understand they're shaping matter, not creating/destroying it arbitrarily

### Intelligent Manufacturing Decisions
The system will:
- **Analyze item condition** and determine salvageable components
- **Calculate material gaps** between available and required components
- **Generate optimal workflows** to bridge those gaps
- **Apply condition-specific treatments** when needed
- **Offer enhancement options** based on available technology and skills

## Dynamic Workflow Generation

### Condition Assessment System
When a manufacturing job is initiated, the system performs intelligent analysis:

**Input Analysis**:
- Scan all selected items for condition, quality, and special status tags
- Determine which components can be salvaged vs need replacement
- Identify any special treatment requirements ([drenched], [corroded], etc.)

**Gap Analysis**:
- Calculate component requirements for final product
- Compare against available salvageable components
- Determine minimum manufacturing needed to fill gaps

**Workflow Generation**:
- Create custom operation sequence based on actual needs
- Insert treatment operations for special conditions
- Optimize operation order for efficiency

### Example: Dynamic Restoration with Material Hierarchy
**Player Action**: Start "Basic Sidearm" job with 1x Basic Sidearm [damaged] [drenched] as input

**System Analysis**:
1. **Condition Assessment**: Item is water-damaged, requires drying and rust treatment
2. **Disassembly Prediction**: Assembly → mechanical-assembly + plastic-casing (damaged), mechanical-assembly → 3 salvageable rough components, 1 precision component
3. **Gap Calculation**: Need 4 more rough, 4 more precision, 1 new casing
4. **Material Requirements**: Steel must be prepared into billets before component machining
5. **Treatment Requirements**: Drying and rust removal for salvaged components

**Generated Workflow**:
1. **Drainage & Assessment** (20min) - Remove water, assess corrosion damage
2. **Disassembly** (15min) - Basic Sidearm → mechanical-assembly + damaged casing
3. **Component Disassembly** (10min) - Mechanical-assembly → salvageable components  
4. **Rust Treatment** (45min) - Chemical treatment for recovered shaped components
5. **Steel Preparation** (30min) - Steel → steel-billet for new components
6. **Rough Machining** (53min) - Steel-billet → 4 additional rough components
7. **Precision Machining** (47min) - Steel-billet → 4 additional precision components
8. **Casing Formation** (28min) - Plastic → plastic-casing (new)
9. **Component Assembly** (25min) - All components → new mechanical-assembly
10. **Final Assembly** (15min) - Mechanical-assembly + casing → basic-sidearm
11. **Quality Control** (10min) - Test restored weapon

**Total Time**: ~298 minutes (includes material preparation)
**Materials**: 0.8 steel (including prep waste), 0.5 plastic, rust removal chemicals

**Key Differences from V1**:
- Clear distinction between disassembly (assemblies) and material preparation (shaping)
- Steel must be prepared into billets before component creation
- No artificial "component upgrades" - components are shaped from billets
- Realistic material flow: Raw → Shaped → Assembled

## Manufacturing Operation Boundaries

### What CAN Be Disassembled
```typescript
// Tier 3: Assemblies - Multiple parts joined together
basic_sidearm → mechanical_assembly + plastic_casing
mechanical_assembly → 5x mechanical_component_rough + 5x mechanical_component_precision
tactical_knife → blade_finished + knife_handle
knife_handle → grip_material + hardware_components
```

### What CANNOT Be Disassembled
```typescript
// Tier 1: Raw Materials - Atomic materials
steel ❌ // Cannot break down further
aluminum ❌ // Pure material
plastic ❌ // Base polymer

// Tier 2: Shaped Materials - Processed but still fundamentally one material
steel_billet ❌ // IS steel, just prepared
mechanical_component_rough ❌ // IS steel, just machined to shape
mechanical_component_precision ❌ // IS steel, just machined differently
blade_finished ❌ // IS steel, just shaped into blade form
plastic_casing ❌ // IS plastic, just molded
```

### Valid Manufacturing Flows
```typescript
// Shaping Operations (Raw → Shaped OR Shaped → Better Shaped)
steel → steel_billet (preparation)
steel_billet → mechanical_component_rough (rough machining)
steel_billet → mechanical_component_precision (precision machining)
plastic → plastic_casing (molding)
steel_billet → blade_blank (blade shaping)
blade_blank → blade_finished (sharpening/finishing)

// Assembly Operations (Shaped → Assembly)
mechanical_component_rough + mechanical_component_precision → mechanical_assembly
mechanical_assembly + plastic_casing → basic_sidearm
blade_finished + knife_handle → tactical_knife

// Disassembly Operations (Assembly → Shaped, reverse of assembly only)
basic_sidearm → mechanical_assembly + plastic_casing
mechanical_assembly → mechanical_components (various)
tactical_knife → blade_finished + knife_handle
```

### Manufacturing Logic Rules
1. **Raw materials** are atomic - cannot be broken down
2. **Shaped materials** are still fundamentally the original material - cannot be "disassembled" back to raw form
3. **Assemblies** combine multiple discrete parts - can be disassembled back to those parts
4. **Material preparation** (raw → billet) is necessary before component shaping
5. **No artificial hierarchies** - precision components come from billets, not rough components

## Enhancement Modifier System

### Technology-Gated Enhancements
Manufacturing jobs will offer optional enhancement modifiers that appear based on:

**Available Equipment**:
- Heat treatment furnace → enables hardening options
- Precision measurement tools → enables balance tuning
- Chemical processing → enables corrosion resistance treatments

**Unlocked Knowledge** (future R&D integration):
- Metallurgy research → advanced alloy treatments
- Ergonomics study → custom grip configurations
- Quality techniques → precision finishing methods

**Worker Skills** (future worker system):
- Master craftsman → hand-forged enhancements
- Chemist → specialized coatings
- Quality inspector → precision tolerances

### Enhancement Categories

#### **Performance Enhancements**
- **Edge Hardening** [+45min, +chemicals]: Superior sharpness and durability
- **Balance Optimization** [+30min, precision tools]: Improved handling characteristics
- **Corrosion Resistance** [+25min, coating materials]: Extended operational life

#### **Aesthetic Enhancements**
- **Custom Grip Wrapping** [+20min, +leather]: Ergonomic comfort and appearance
- **Surface Finishing** [+35min, polishing compounds]: Premium appearance
- **Decorative Inlay** [+60min, +precious materials]: Luxury market appeal

#### **Functional Modifications**
- **Modular Mounting** [+40min, +precision hardware]: Attachment points for accessories
- **Extended Magazine** [+30min, +spring steel]: Increased capacity
- **Sound Suppression** [+50min, +specialized materials]: Reduced operational noise

### Dynamic Cost Calculation
Selecting enhancements automatically updates:

**Time Requirements**: Base job time + enhancement time + potential operation reordering
**Material Additions**: Additional materials required for enhancements
**Equipment Dependencies**: May require tools not needed for base manufacturing
**Skill Requirements**: Some enhancements need specialized worker skills
**Quality Impact**: Enhancements affect final product quality and market value

## Condition-Aware Manufacturing

### Special Status Tag Handling
The system will automatically insert appropriate treatment operations:

#### **[drenched] Items**
- **Mandatory Operations**: Drainage, component assessment, rust treatment
- **Equipment Requirements**: Drying chamber, chemical bath station
- **Time Impact**: +60-90 minutes for proper treatment
- **Component Risk**: Some precision components may be unsalvageable

#### **[heat-damaged] Items**
- **Treatment Operations**: Stress analysis, annealing, dimensional verification
- **Specialized Equipment**: Heat treatment furnace, precision measurement
- **Quality Effects**: May require stress relief before components are usable
- **Recovery Variation**: Metal components may be improved by proper heat treatment

#### **[corroded] Items**
- **Chemical Processing**: Acid treatment, neutralization, surface restoration
- **Facility Requirements**: Chemical handling certification, proper ventilation
- **Component Grading**: Surface corrosion vs structural damage assessment
- **Material Recovery**: Heavily corroded items may only yield scrap metal

#### **[contaminated] Items**
- **Decontamination Protocol**: Specialized cleaning, safety procedures
- **Equipment Needs**: Isolated work area, protective equipment
- **Disposal Requirements**: Contaminated materials may require special handling
- **Worker Safety**: May require trained personnel with hazmat certification

### Adaptive Equipment Requirements
Manufacturing workflows will dynamically adjust based on available equipment:

**Optimal Path**: All required equipment available, standard operation times
**Substitute Methods**: Alternative approaches when ideal equipment missing
**Penalty Calculations**: Time and quality penalties for suboptimal equipment
**Equipment Recommendations**: Suggest equipment purchases to improve efficiency

## Market Integration

### Enhanced Product Differentiation
Products created with enhancements command premium prices and access exclusive markets:

**Basic Products**: Standard pricing, general market availability
**Enhanced Products**: Premium pricing based on specific enhancements
**Master Crafted**: Multiple enhancements, luxury market exclusivity
**Condition-Restored**: Unique market segment for expertly restored items

### Contract Compatibility
Customer contracts will specify enhancement requirements:

**Military Contracts**: May require corrosion resistance and durability enhancements
**Corporate Security**: Focus on reliability and aesthetic enhancements
**Luxury Market**: Demand decorative and custom enhancement options
**Specialty Applications**: Unique enhancement combinations for specific uses

### Component Trading
Enhanced components become valuable trade goods:

**Premium Components**: Components created with enhancement processes
**Specialized Parts**: Components requiring specific equipment or skills
**Rare Materials**: Components made from exotic or expensive materials
**Master Crafted Elements**: Hand-finished components with superior quality

## User Interface Design

### Dynamic Job Planning Interface
Manufacturing job selection becomes a sophisticated planning tool:

1. **Item Selection**: Choose inputs (raw materials, damaged items, existing components)
2. **Condition Analysis**: System displays assessment of inputs and required treatments
3. **Gap Analysis**: Visual representation of needed vs available components
4. **Enhancement Selection**: Dropdown menus for available enhancement options
5. **Workflow Preview**: Complete operation sequence with time and material estimates
6. **Cost-Benefit Analysis**: Compare enhancement costs vs market value improvements

### Visual Workflow Representation
```
INPUT ANALYSIS
├─ Basic Sidearm [damaged] [drenched]
│   ├─ Estimated Recovery: 3 rough, 1 precision (after treatment)
│   ├─ Required Treatment: Drainage, Rust Removal
│   └─ Casing: Unusable - replacement needed

MANUFACTURING PLAN
├─ Treatment Operations: 80 minutes
├─ Component Manufacturing: 100 minutes  
├─ Assembly Operations: 50 minutes
└─ Total Estimated Time: 230 minutes

ENHANCEMENT OPTIONS
├─ ☐ Corrosion Resistance [+25min, +coating] → +45 credits value
├─ ☐ Custom Grip [+20min, +leather] → +30 credits value
└─ ☐ Premium Finish [+35min, +compounds] → +25 credits value

FINAL ESTIMATE
├─ Base Product Value: 250 credits
├─ Enhanced Product Value: 350 credits (if all selected)
├─ Material Cost: 85 credits
└─ Estimated Profit: 265 credits (178% margin)
```

### Real-Time Workflow Adaptation
As jobs progress, the interface shows:

**Live Component Assessment**: Actual recovery rates vs predictions
**Workflow Adjustments**: Operations added or removed based on discoveries
**Time Recalculations**: Updated estimates as actual conditions become known
**Quality Predictions**: Expected final product quality based on actual inputs

## Implementation Architecture

### Core Systems Integration

#### **Workflow Generator**
- Analyzes input items and generates custom operation sequences
- Integrates with existing job reservation and material consumption systems
- Handles condition-specific operation insertion
- Manages enhancement modifier application

#### **Condition Analysis Engine**
- Evaluates item status tags and predicts component recovery
- Calculates treatment requirements and success probabilities
- Determines equipment and skill requirements for special conditions
- Estimates time and material costs for treatment operations

#### **Enhancement Manager**
- Tracks available enhancement options based on equipment and knowledge
- Calculates enhancement costs and benefits
- Manages enhancement dependencies and prerequisites
- Integrates enhancement operations into manufacturing workflows

#### **Dynamic Pricing Calculator**
- Evaluates market value of enhanced products
- Calculates cost-benefit ratios for enhancement decisions
- Tracks component value changes through processing
- Provides profitability analysis for manufacturing decisions

### Data Structure Extensions

#### **Enhanced Manufacturing Methods**
Methods become templates that generate specific workflows:
- Base operation sequences for each product type organized by manufacturing tier
- Material preparation workflows (Raw → Shaped)
- Assembly/disassembly workflows (Shaped ↔ Assembly)  
- Condition-specific operation libraries
- Enhancement operation catalogs
- Equipment substitution matrices

#### **Manufacturing Type Classification**
```typescript
interface BaseItem {
  id: string;
  name: string;
  category: ItemCategory;
  manufacturingType: ItemManufacturingType;  // NEW
  baseValue: number;
  materialSource?: string;  // For shaped materials: which raw material
  assemblyComponents?: ComponentRequirement[];  // For assemblies: what parts
}

enum ItemManufacturingType {
  RAW_MATERIAL = 'raw_material',      // steel, aluminum, plastic
  SHAPED_MATERIAL = 'shaped_material', // steel_billet, mechanical_component_rough
  ASSEMBLY = 'assembly'               // mechanical_assembly, basic_sidearm
}
```

#### **Item Condition Metadata**
Items carry detailed condition information:
- Multiple status tags with severity levels
- Component-level damage assessment
- Treatment history and remaining durability
- Enhancement compatibility flags

#### **Dynamic Job State**
Jobs track more sophisticated state information:
- Predicted vs actual component recovery
- Applied treatments and their effectiveness
- Selected enhancements and their progress
- Real-time profitability calculations

## Future Expansion Pathways

### Research & Development Integration
- Technology unlocks new enhancement options
- Research projects improve condition treatment effectiveness
- Advanced manufacturing techniques reduce enhancement costs
- Experimental processes create unique product variants

### Worker Skill Specialization
- Master craftsmen enable exclusive hand-forged enhancements
- Specialized technicians required for complex treatments
- Worker experience improves enhancement quality and speed
- Training programs unlock new manufacturing capabilities

### Advanced Materials Science
- Exotic materials enable unique enhancement options
- Material incompatibilities create manufacturing constraints
- Advanced alloys require specialized processing equipment
- Material quality affects enhancement effectiveness

### Quality Management Systems
- Statistical process control for enhancement consistency
- Quality assurance protocols for critical applications
- Defect tracking and continuous improvement
- Customer feedback integration for enhancement optimization

## Success Metrics

### Player Experience Goals
- **Manufacturing Feels Intelligent**: System responses feel logical and adaptive
- **Meaningful Choices**: Enhancement decisions have clear trade-offs and benefits
- **Authentic Complexity**: Matches real-world manufacturing decision processes
- **Scalable Learning**: Easy to start, sophisticated to master

### Technical Performance Targets
- **Workflow Generation**: <200ms for complex condition analysis
- **UI Responsiveness**: Real-time updates during job planning
- **Memory Efficiency**: Minimal overhead for dynamic job state
- **Save Compatibility**: Seamless migration from component-based system

### Economic Balance Objectives
- **Enhancement Viability**: All enhancements have profitable market applications
- **Condition Treatment**: Treatment costs balanced against recovery benefits
- **Market Differentiation**: Enhanced products create meaningful price premiums
- **Strategic Depth**: Multiple viable approaches to manufacturing challenges

## Implementation Timeline

### Phase 1: Manufacturing Hierarchy & Dynamic Workflow Engine
- Three-tier manufacturing hierarchy implementation (Raw → Shaped → Assembly)
- Manufacturing operation boundary validation system
- Material preparation workflow system (raw materials → billets)
- Condition analysis and gap calculation systems respecting hierarchy
- Basic workflow generation for standard restoration scenarios
- Integration with existing component manufacturing system

### Phase 2: Enhancement Modifier System
- Enhancement option framework and UI integration
- Basic enhancement operations and cost calculations
- Market value integration for enhanced products

### Phase 3: Condition-Aware Processing
- Special status tag handling and treatment operations
- Equipment requirement validation and substitution
- Advanced condition assessment and recovery prediction

### Phase 4: UI Polish & Integration
- Complete job planning interface
- Real-time workflow visualization
- Performance optimization and testing

### Phase 5: Market & Contract Integration
- Enhanced product market dynamics
- Contract enhancement requirements
- Component trading system integration