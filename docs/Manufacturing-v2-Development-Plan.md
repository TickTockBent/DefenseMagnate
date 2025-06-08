# Manufacturing v2 Development Plan
## Dynamic Manufacturing Intelligence Implementation

This document outlines the phased implementation plan for Manufacturing v2, transforming the current component-based system into a dynamic, intelligent manufacturing system.

## 🎯 Implementation Status: Phase 1 Complete

**✅ Phase 1: Core Dynamic Workflow Engine** - COMPLETE  
**⏳ Phase 2: Enhancement Modifier System** - Pending  
**⏳ Phase 3: Condition-Aware Processing** - Pending  
**⏳ Phase 4: UI Enhancement** - Pending  
**⏳ Phase 5: Advanced Integration** - Pending  

### What's Working Now:
- **Smart Manufacturing** method available in Basic Sidearm production
- Dynamic workflow generation based on available inputs and inventory
- Three-tier hierarchy preventing illogical disassembly operations
- Component gap analysis and intelligent material planning
- Condition analysis for damaged/junk items with recovery predictions
- Full integration with existing machine workspace system

### How to Test Phase 1:
1. **Start a Basic Sidearm job** - Select "Smart Manufacturing (basic_sidearm)" method
2. **Try with different inputs** - Use with damaged sidearms, raw materials, or empty inventory
3. **Observe dynamic behavior** - The system will generate different workflows based on what's available
4. **Check hierarchy compliance** - No steel can be "disassembled" back to scrap steel
5. **Material preparation** - Steel will be properly prepared into billets before component creation

## Overview

Manufacturing v2 will replace static recipe-based manufacturing with an intelligent system that:
- Analyzes item conditions and generates optimal workflows
- Provides enhancement options based on available technology
- Handles special status conditions automatically
- Integrates with markets and contracts for enhanced products
- **Implements clear manufacturing hierarchy with logical assembly/disassembly boundaries**

## Current State Analysis

**✅ Phase 1 Complete: Core Dynamic Workflow Engine**:
- ✅ Three-tier manufacturing hierarchy with clear boundaries implemented
- ✅ Manufacturing rules validation system preventing logical inconsistencies
- ✅ Condition analysis engine for input item assessment
- ✅ Gap analysis system calculating component requirements vs availability
- ✅ Dynamic workflow generator creating custom operation sequences
- ✅ Integration layer bridging v2 with existing machine workspace system
- ✅ Updated BaseItem definitions with manufacturing type classifications
- ✅ Smart Manufacturing method available in UI for testing

**Systems in Place (v1 Complete)**:
- Component-based manufacturing methods with material transformation
- Job sub-inventory system for isolated material handling
- Machine workspace with real-time job flow
- Tag-based item system with quality and condition tracking
- Unified job management UI with cancellation and recovery

**✅ Legacy Systems Updated**:
- ✅ Static MachineBasedMethod definitions → Dynamic workflow generation (Phase 1)
- ✅ Fixed material consumption/production → Intelligent gap analysis (Phase 1)
- ⏳ Hardcoded enhancement options → Dynamic enhancement discovery (Phase 2)
- ✅ Artificial component hierarchy → Clear material shaping and assembly boundaries (Phase 1)

## Manufacturing Hierarchy Framework

### Core Design Principle: Clear Assembly/Disassembly Boundaries

Manufacturing v2 implements a logical three-tier hierarchy that eliminates conceptual inconsistencies:

#### **Tier 1: Raw Materials (Atomic)**
- **Cannot be disassembled** - These are pure, unprocessed materials
- Examples: `steel`, `aluminum`, `plastic`, `titanium`
- Obtained through: Mining, purchasing, recycling

#### **Tier 2: Shaped Materials (Processed from Raw Materials)**
- **Cannot be disassembled** - These ARE the raw material, just shaped/processed
- **Can be further shaped** - Can undergo additional processing steps
- Examples: `steel-billet`, `steel-sheet`, `plastic-rod`, `aluminum-stock`
- Manufacturing stages: `mechanical-component-rough`, `mechanical-component-precision`, `blade-blank`, `blade-finished`

#### **Tier 3: Assemblies (Combinations of Components)**
- **CAN be disassembled** - These are multiple parts joined together
- Examples: `mechanical-assembly`, `knife-handle`, `basic-sidearm`, `tactical-knife`
- Disassemble into: Their constituent shaped materials and sub-assemblies

### Manufacturing Operation Types

```typescript
enum OperationType {
  SHAPING = 'shaping',        // Raw → Shaped OR Shaped → Better Shaped
  ASSEMBLY = 'assembly',      // Components → Assembly  
  DISASSEMBLY = 'disassembly' // Assembly → Components (reverse of assembly only)
}

enum ItemManufacturingType {
  RAW_MATERIAL = 'raw_material',      // Steel, aluminum, plastic
  SHAPED_MATERIAL = 'shaped_material', // Steel billet, precision component
  ASSEMBLY = 'assembly'               // Mechanical assembly, sidearm
}
```

### Manufacturing Flow Examples

#### **Valid Manufacturing Paths**:
```
steel → steel-billet (preparation/shaping)
steel-billet → mechanical-component-rough (rough machining)
steel-billet → mechanical-component-precision (precision machining)
mechanical-component-rough + mechanical-component-precision → mechanical-assembly (assembly)
mechanical-assembly + plastic-casing → basic-sidearm (assembly)
```

#### **Valid Disassembly Paths**:
```
basic-sidearm → mechanical-assembly + plastic-casing (disassembly)
mechanical-assembly → mechanical-components (various types) (disassembly)
STOP - Components cannot be disassembled (they ARE steel, just shaped)
```

#### **Enhanced Realism Through Preparation**:
- Steel must be prepared into appropriate billets for specific products
- Different products require different billet preparations
- Billet preparation is a necessary manufacturing step that enhances verisimilitude
- Players understand they're shaping materials, not arbitrarily creating/destroying matter

## ✅ Phase 1: Core Dynamic Workflow Engine - COMPLETE

### ✅ 1.1 Manufacturing Hierarchy Implementation
**Goal**: Implement the three-tier manufacturing system with clear boundaries
**Status**: COMPLETE

**New Types**:
```typescript
interface BaseItem {
  id: string;
  name: string;
  category: ItemCategory;
  manufacturingType: ItemManufacturingType;  // NEW - Defines tier
  baseValue: number;
  // ... existing properties
}

interface ManufacturingRule {
  canDisassemble: boolean;
  canShape: boolean;
  canAssemble: boolean;
  reason: 'raw_material' | 'shaped_material' | 'assembly';
}
```

**✅ Implemented Systems**:
- ✅ `systems/manufacturingRules.ts` - Validates operations based on hierarchy
- ✅ Updated `data/baseItems.ts` - All items classified with manufacturing types
- ✅ Manufacturing hierarchy validation system

### ✅ 1.2 Condition Analysis System
**Goal**: Analyze input items and predict component recovery within hierarchy rules
**Status**: COMPLETE

**New Types**:
```typescript
// types/manufacturing.ts
interface ConditionAnalysis {
  itemId: string;
  condition: ItemCondition;
  estimatedRecovery: ComponentRecovery[];
  treatmentRequirements: TreatmentOperation[];
  risks: RecoveryRisk[];
}

interface ComponentRecovery {
  componentType: string;
  estimatedQuantity: number;
  expectedQuality: number;
  confidenceLevel: number;
}

interface TreatmentOperation {
  id: string;
  name: string;
  required: boolean;
  estimatedTime: number;
  materialRequirements: MaterialRequirement[];
  successProbability: number;
}
```

**✅ Implemented Systems**:
- ✅ `systems/conditionAnalyzer.ts` - Analyzes item condition and predicts recoverable components
- ✅ `systems/workflowGenerator.ts` - Generates dynamic operation sequences
- ✅ Component recovery rate calculations based on condition and quality

### ✅ 1.3 Gap Analysis Engine
**Goal**: Calculate what components need to be manufactured vs what can be recovered
**Status**: COMPLETE

**New Types**:
```typescript
interface ComponentGap {
  componentType: string;
  required: number;
  available: number;
  recoverable: number;
  needToManufacture: number;
}

interface ManufacturingPlan {
  inputAnalysis: ConditionAnalysis[];
  componentGaps: ComponentGap[];
  requiredOperations: DynamicOperation[];
  estimatedDuration: number;
  materialRequirements: MaterialRequirement[];
}
```

**✅ Implemented Systems**:
- ✅ `systems/gapAnalyzer.ts` - Calculates component gaps
- ✅ Integrated gap analysis with workflow generation

### ✅ 1.4 Dynamic Job Creation
**Goal**: Replace static methods with dynamic workflow generation
**Status**: COMPLETE

**✅ Integration Completed**:
- ✅ `systems/manufacturingV2Integration.ts` - Bridges v2 with existing machine workspace
- ✅ `data/manufacturingMethods.ts` - Added Smart Manufacturing method using v2
- ✅ Dynamic workflow generation converts to existing MachineBasedMethod format

**✅ Implementation Completed**:
1. ✅ Create condition analyzer that examines input items
2. ✅ Build gap analyzer that calculates missing components
3. ✅ Implement workflow generator that creates operation sequences
4. ✅ Bridge system to work with existing job infrastructure
5. ✅ Add Smart Manufacturing method to UI for testing

### ✅ 1.5 Direct Integration Strategy
**✅ Clean Integration Completed**:
- ✅ Manufacturing v2 directly replaces static methods
- ✅ All Basic Sidearm methods now use dynamic workflow generation
- ✅ Legacy static methods completely removed
- ✅ Simplified codebase with no backwards compatibility overhead

**Clean Manufacturing Methods**:
```typescript
// Manufacturing v2 - All methods use dynamic workflow generation
export const basicSidearmForgeMethod: MachineBasedMethod = 
  ManufacturingV2Integration.generateDynamicMethod('basic_sidearm', 1, [], []);

export const basicSidearmRestoreMethod: MachineBasedMethod = 
  ManufacturingV2Integration.generateDynamicMethod('basic_sidearm', 1, [], []);

export const basicSidearmDisassembleMethod: MachineBasedMethod = 
  ManufacturingV2Integration.createSmartMethod('basic_sidearm_disassembly');
```

## Phase 2: Enhancement Modifier System

### 2.1 Enhancement Discovery
**Goal**: Detect available enhancements based on equipment and knowledge

**New Types**:
```typescript
interface Enhancement {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'aesthetic' | 'functional';
  requirements: EnhancementRequirement[];
  effects: EnhancementEffect[];
  costs: EnhancementCost[];
}

interface EnhancementRequirement {
  type: 'equipment' | 'skill' | 'research' | 'material';
  id: string;
  level?: number;
}

interface EnhancementEffect {
  property: string;
  modifier: number;
  description: string;
}
```

**New Systems**:
- `data/enhancements.ts` - Enhancement definitions database
- `systems/enhancementManager.ts` - Discovers available enhancements
- `systems/enhancementCalculator.ts` - Calculates costs and benefits

### 2.2 Enhancement Integration
**Goal**: Integrate enhancements into dynamic workflows

**Modified Systems**:
- `systems/workflowGenerator.ts` - Insert enhancement operations
- `systems/operationPlanner.ts` - Handle enhancement dependencies
- Job system - Track enhancement selections

### 2.3 Market Value Integration
**Goal**: Calculate enhanced product values

**New Systems**:
- `systems/productPricer.ts` - Calculate market value based on enhancements
- Market integration for enhanced product sales
- Contract system support for enhancement requirements

## Phase 3: Condition-Aware Processing

### 3.1 Special Status Tag Handling
**Goal**: Handle [drenched], [corroded], [heat-damaged], etc. automatically

**New Types**:
```typescript
interface StatusTagHandler {
  tag: ItemTag;
  requiredTreatments: TreatmentOperation[];
  equipmentRequirements: string[];
  riskFactors: RiskFactor[];
}

interface RiskFactor {
  description: string;
  probability: number;
  impact: 'component_loss' | 'quality_reduction' | 'time_increase';
}
```

**New Systems**:
- `systems/statusTagProcessor.ts` - Handles special condition tags
- `data/treatmentOperations.ts` - Treatment operation definitions
- Equipment requirement validation for treatments

### 3.2 Treatment Operation Integration
**Goal**: Seamlessly integrate treatment operations into workflows

**Implementation**:
- Extend workflow generator to insert treatment operations
- Add treatment progress tracking to job system
- Create specialized UI for treatment operation monitoring

### 3.3 Equipment Substitution
**Goal**: Handle missing equipment with alternative methods

**New Systems**:
- `systems/equipmentSubstitution.ts` - Find alternative approaches
- `data/equipmentAlternatives.ts` - Substitution matrix
- Penalty calculation for suboptimal equipment

## Phase 4: User Interface Enhancement

### 4.1 Dynamic Job Planning Interface
**Goal**: Replace product dropdown with intelligent job planner

**New Components**:
- `components/JobPlannerInterface.tsx` - Main planning interface
- `components/ConditionAnalysisDisplay.tsx` - Show input analysis
- `components/EnhancementSelector.tsx` - Enhancement selection UI
- `components/WorkflowPreview.tsx` - Operation sequence preview

### 4.2 Real-Time Workflow Visualization
**Goal**: Show live workflow adaptation during job execution

**Features**:
- Live component recovery vs predictions
- Dynamic workflow adjustments
- Real-time cost-benefit updates
- Quality prediction updates

### 4.3 Enhanced Job Management
**Goal**: Improve job list to show dynamic information

**Enhancements**:
- Show selected enhancements in job display
- Display condition treatment progress
- Real-time profitability tracking
- Component recovery tracking

## Phase 5: Advanced Integration

### 5.1 Market Integration
**Goal**: Full market support for enhanced products

**Features**:
- Enhanced product pricing in markets
- Premium market segments for enhanced goods
- Contract enhancement requirements
- Component trading for premium parts

### 5.2 Research & Development Framework
**Goal**: Prepare for future R&D integration

**Framework**:
- Research unlock system for enhancements
- Technology prerequisites for advanced operations
- Skill-based enhancement availability
- Equipment upgrade paths

### 5.3 Performance Optimization
**Goal**: Ensure system scales efficiently

**Optimizations**:
- Caching for condition analysis
- Efficient workflow generation
- Minimal memory overhead for dynamic jobs
- Save/load compatibility

## Implementation Strategy

### Barrel Architecture Compliance
All new systems will follow existing patterns:
```typescript
// types/index.ts - Add new manufacturing types
export * from './manufacturing';
export * from './enhancement';
export * from './conditions';

// Import usage throughout codebase
import { Enhancement, ConditionAnalysis, ManufacturingPlan } from '../types';
```

### Legacy System Handling
Mark all replaced systems clearly:
```typescript
// TODO: LEGACY - Superseded by dynamic workflow system in Manufacturing v2
// Remove after migration complete
export const basicSidearmMethods = [
  // ... existing methods
];
```

### Testing Strategy
1. **Unit Tests**: Test condition analysis and gap calculation logic
2. **Integration Tests**: Verify dynamic workflow generation
3. **Regression Tests**: Ensure existing functionality continues working
4. **User Tests**: Validate UI improvements and workflow

### Implementation Approach
1. **Direct Replacement**: Manufacturing v2 directly replaces static methods
2. **Clean Codebase**: Remove legacy systems immediately 
3. **Dynamic Generation**: All manufacturing methods generated dynamically
4. **No Migration Overhead**: Simplified implementation without compatibility layers

## Success Criteria

### ✅ Phase 1 Complete When:
- ✅ Dynamic workflows can be generated for basic products
- ✅ Condition analysis produces reasonable component recovery estimates
- ✅ Gap analysis correctly identifies manufacturing requirements
- ✅ Legacy static methods continue working unchanged
- ✅ Three-tier manufacturing hierarchy prevents logical inconsistencies
- ✅ Smart Manufacturing method available in UI for testing

### Phase 2 Complete When:
- Enhancement options appear based on available equipment
- Enhancement costs and benefits calculate correctly
- Enhanced products show appropriate market values
- Job system handles enhancement selections

### Phase 3 Complete When:
- Special status tags trigger appropriate treatments
- Treatment operations integrate smoothly into workflows
- Equipment substitution provides viable alternatives
- Risk factors are properly communicated to players

### Phase 4 Complete When:
- Job planning interface is intuitive and responsive
- Workflow visualization provides clear understanding
- Real-time updates work smoothly during job execution
- Enhanced job management improves player experience

### Phase 5 Complete When:
- Market integration supports enhanced products fully
- Framework supports future R&D expansion
- Performance meets all targets
- System is ready for production release

## Technical Notes

### State Management
- Extend existing Zustand store with new manufacturing state
- Maintain existing patterns for consistency
- Add new actions for dynamic job management

### Data Persistence
- Ensure dynamic jobs save/load correctly
- Migrate existing static jobs gracefully
- Maintain backward compatibility with existing saves

### Performance Considerations
- Cache condition analysis results
- Optimize workflow generation algorithms
- Minimize UI re-renders during real-time updates
- Profile memory usage for large job queues

This phased approach ensures steady progress while maintaining system stability and user experience throughout the transition to Manufacturing v2.